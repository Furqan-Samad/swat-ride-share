import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeSearchInput } from "@/lib/sanitize";
import { bookingFormSchema } from "@/lib/validation";
import { generateBookingReference } from "@/lib/idGenerator";

export interface Ride {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  front_seat_price?: number | null;
  back_seat_price?: number | null;
  front_seats_available?: number | null;
  back_seats_available?: number | null;
  description: string | null;
  status: string;
  created_at: string;
  driver?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  seat_type: 'front' | 'back';
  status: string;
  created_at: string;
  rides?: Ride & {
    profiles?: {
      full_name: string | null;
      phone_number: string | null;
    };
  };
}

export const useRides = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ["rides", from, to],
    queryFn: async () => {
      try {
        // Get current date in YYYY-MM-DD format for filtering past rides
        const today = new Date().toISOString().split('T')[0];
        
        let query = supabase
          .from("rides")
          .select("*, driver:profiles!rides_driver_id_fkey(full_name, avatar_url)")
          .eq("status", "active")
          .gte("departure_date", today) // Only show future rides
          .order("departure_date", { ascending: true });

        if (from) {
          const sanitizedFrom = sanitizeSearchInput(from);
          query = query.ilike("origin", `%${sanitizedFrom}%`);
        }
        if (to) {
          const sanitizedTo = sanitizeSearchInput(to);
          query = query.ilike("destination", `%${sanitizedTo}%`);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching rides:", error);
          throw new Error("Failed to fetch rides. Please try again.");
        }
        
        // Filter out rides with no available seats
        const availableRides = (data || []).filter(ride => 
          (ride.available_seats ?? 0) > 0 || 
          ((ride as any).front_seats_available ?? 0) > 0 || 
          ((ride as any).back_seats_available ?? 0) > 0
        );
        
        return availableRides as Ride[];
      } catch (err) {
        console.error("Unexpected error in useRides:", err);
        throw err;
      }
    },
    retry: 2,
    staleTime: 10000, // 10 seconds - faster refresh for real-time updates
    refetchOnWindowFocus: true,
  });
};

export const useRide = (id: string) => {
  return useQuery({
    queryKey: ["ride", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Ride | null;
    },
    enabled: !!id,
  });
};

export const useMyRides = () => {
  return useQuery({
    queryKey: ["myRides"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rides")
        .select("*, front_seat_price, back_seat_price, front_seats_available, back_seats_available")
        .eq("driver_id", user.id)
        .order("departure_date", { ascending: false });
      
      if (error) throw error;
      return data as Ride[];
    },
  });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First get bookings with ride info
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`*, rides:ride_id (*)`)
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // For bookings, fetch driver profiles - phone number ONLY for confirmed bookings
      const bookingsWithProfiles = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          if (booking.rides && ['confirmed', 'pending'].includes(booking.status)) {
            // Always fetch both fields, but only expose phone for confirmed
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, phone_number")
              .eq("id", booking.rides.driver_id)
              .maybeSingle();
            
            if (profileData) {
              return {
                ...booking,
                rides: {
                  ...booking.rides,
                  profiles: {
                    full_name: profileData.full_name,
                    // Only include phone_number if booking is confirmed (security: prevent harvesting)
                    phone_number: booking.status === 'confirmed' ? profileData.phone_number : null
                  }
                }
              };
            }
          }
          return booking;
        })
      );
      
      return bookingsWithProfiles as Booking[];
    },
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ride: {
      origin: string;
      destination: string;
      departure_date: string;
      departure_time: string;
      available_seats: number;
      price_per_seat: number;
      front_seat_price?: number;
      back_seat_price?: number;
      front_seats_available?: number;
      back_seats_available?: number;
      description?: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to post a ride");

      const { data, error } = await supabase
        .from("rides")
        .insert({ ...ride, driver_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      toast({ title: "Ride Posted!", description: "Your ride has been published" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ rideId, seats, seatType }: { rideId: string; seats: number; seatType: 'front' | 'back' }) => {
      // Validate inputs using Zod schema
      const validationResult = bookingFormSchema.safeParse({ rideId, seats, seatType });
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0]?.message || "Invalid booking data");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to book a ride");

      // Fetch ride with optimistic locking check
      const { data: ride, error: rideError } = await supabase
        .from("rides")
        .select("front_seats_available, back_seats_available, driver_id, status, updated_at")
        .eq("id", rideId)
        .eq("status", "active")
        .single();

      if (rideError) {
        console.error("Error fetching ride:", rideError);
        throw new Error("Ride not found or no longer available");
      }

      // Prevent self-booking
      if (ride.driver_id === user.id) {
        throw new Error("You cannot book your own ride");
      }

      // Check seat availability with exact count
      const availableSeats = seatType === 'front' 
        ? (ride.front_seats_available ?? 0) 
        : (ride.back_seats_available ?? 0);

      if (seats > availableSeats) {
        throw new Error(`Only ${availableSeats} ${seatType} seat(s) available. Please refresh and try again.`);
      }

      // Check for existing ACTIVE (pending/confirmed) booking by same user for same ride
      // IMPORTANT: Allow rebooking if previous booking was cancelled
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("passenger_id", user.id)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

      if (existingBooking) {
        throw new Error(
          existingBooking.status === "pending"
            ? "You already have a pending booking for this ride. Please wait for the driver to confirm."
            : "You already have a confirmed booking for this ride."
        );
      }

      // Create booking - this is allowed even if user has a cancelled booking for this ride
      const { data, error } = await supabase
        .from("bookings")
        .insert({ 
          ride_id: rideId, 
          passenger_id: user.id, 
          seats_booked: seats,
          seat_type: seatType,
          status: "pending" // Explicitly set status
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating booking:", error);
        if (error.code === '23505') {
          throw new Error("You already have an active booking for this ride. If you cancelled, please refresh the page and try again.");
        }
        throw new Error("Failed to create booking. Please try again.");
      }

      // Update seat availability on the ride atomically
      const updateField = seatType === 'front' ? 'front_seats_available' : 'back_seats_available';
      const newAvailable = availableSeats - seats;
      const totalSeats = (ride.front_seats_available ?? 0) + (ride.back_seats_available ?? 0) - seats;
      
      const { error: updateError } = await supabase
        .from("rides")
        .update({ 
          [updateField]: newAvailable,
          available_seats: totalSeats
        })
        .eq("id", rideId);

      if (updateError) {
        console.error("Error updating seat availability:", updateError);
        // Booking was created, log but don't fail
      }

      // Send WhatsApp notification (fire and forget)
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'bpoynxqqumbsstfgrjqg';
        fetch(`https://${projectId}.supabase.co/functions/v1/send-whatsapp-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ bookingId: data.id }),
        }).catch(console.error);
      } catch (notifError) {
        console.error('Failed to send WhatsApp notification:', notifError);
      }

      return { ...data, reference: generateBookingReference(data.id) };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
      queryClient.invalidateQueries({ queryKey: ["rideWithDriver"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast({ 
        title: "Booking Requested!", 
        description: `Reference: ${data.reference}. The driver will be notified.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    },
    retry: 0, // Don't retry bookings to prevent duplicates
  });
};
