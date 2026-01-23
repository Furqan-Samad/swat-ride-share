import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UpdateRideData {
  id: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  departure_time?: string;
  price_per_seat?: number;
  front_seat_price?: number;
  back_seat_price?: number;
  front_seats_available?: number;
  back_seats_available?: number;
  available_seats?: number;
  description?: string;
  status?: string;
}

export interface RideBooking {
  id: string;
  seats_booked: number;
  seat_type: string;
  status: string;
  created_at: string;
  passenger_id: string;
  passenger?: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
  } | null;
}

export const useUpdateRide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateRideData) => {
      const { id, ...updateData } = data;
      
      const { data: ride, error } = await supabase
        .from("rides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return ride;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
      toast({ title: "Ride Updated", description: "Your ride has been updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteRide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ rideId, forceDelete = false }: { rideId: string; forceDelete?: boolean }) => {
      // Check for active bookings
      const { data: activeBookings, error: checkError } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("ride_id", rideId)
        .in("status", ["pending", "confirmed"]);

      if (checkError) throw checkError;

      if (activeBookings && activeBookings.length > 0 && !forceDelete) {
        throw new Error(`This ride has ${activeBookings.length} active booking(s). Cancel all bookings first or use force delete.`);
      }

      // If force delete, cancel all bookings first
      if (forceDelete && activeBookings && activeBookings.length > 0) {
        const { error: cancelError } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("ride_id", rideId)
          .in("status", ["pending", "confirmed"]);

        if (cancelError) throw cancelError;
      }

      // Delete the ride
      const { error } = await supabase
        .from("rides")
        .delete()
        .eq("id", rideId);

      if (error) throw error;
      return { rideId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
      queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
      toast({ title: "Ride Deleted", description: "Your ride has been deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Cannot Delete Ride", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteBookingFromRide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, rideId }: { bookingId: string; rideId: string }) => {
      // Get the booking details first to restore seats
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("seats_booked, seat_type, status")
        .eq("id", bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Only restore seats if the booking was confirmed or pending
      if (booking.status === "confirmed" || booking.status === "pending") {
        // Get current ride data
        const { data: ride, error: rideError } = await supabase
          .from("rides")
          .select("front_seats_available, back_seats_available, available_seats")
          .eq("id", rideId)
          .single();

        if (rideError) throw rideError;

        // Calculate new seat counts
        const seatType = booking.seat_type || "back";
        const seatsToRestore = booking.seats_booked || 1;
        
        const newFrontSeats = seatType === "front" 
          ? (ride.front_seats_available ?? 0) + seatsToRestore 
          : (ride.front_seats_available ?? 0);
        const newBackSeats = seatType === "back" 
          ? (ride.back_seats_available ?? 0) + seatsToRestore 
          : (ride.back_seats_available ?? 0);
        const newTotalSeats = (ride.available_seats ?? 0) + seatsToRestore;

        // Update the ride seats
        const { error: updateError } = await supabase
          .from("rides")
          .update({
            front_seats_available: newFrontSeats,
            back_seats_available: newBackSeats,
            available_seats: newTotalSeats,
          })
          .eq("id", rideId);

        if (updateError) throw updateError;
      }

      // Update booking status to cancelled (we can't delete due to foreign key constraints)
      const { error: cancelError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (cancelError) throw cancelError;

      return { bookingId, rideId, seatsRestored: booking.seats_booked };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ride", data.rideId] });
      queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
      queryClient.invalidateQueries({ queryKey: ["rideWithDriver", data.rideId] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
      toast({ 
        title: "Booking Removed", 
        description: `${data.seatsRestored} seat(s) restored to availability` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useRideBookings = (rideId: string) => {
  return useQuery<RideBooking[]>({
    queryKey: ["rideBookings", rideId],
    queryFn: async (): Promise<RideBooking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          seats_booked,
          seat_type,
          status,
          created_at,
          passenger_id
        `)
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch passenger profiles
      const passengerIds = [...new Set(data?.map(b => b.passenger_id) || [])];
      if (passengerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number, avatar_url")
          .in("id", passengerIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        return data?.map(booking => ({
          ...booking,
          passenger: profileMap.get(booking.passenger_id) || null,
        })) as RideBooking[] || [];
      }

      return (data || []).map(booking => ({
        ...booking,
        passenger: null,
      })) as RideBooking[];
    },
    enabled: !!rideId,
  });
};
