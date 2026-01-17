import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BookingRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  created_at: string;
  passenger?: {
    full_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
  };
  ride?: {
    origin: string;
    destination: string;
    departure_date: string;
    departure_time: string;
  };
}

export const useDriverBookingRequests = () => {
  return useQuery({
    queryKey: ["driverBookingRequests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all rides by this driver
      const { data: rides, error: ridesError } = await supabase
        .from("rides")
        .select("id, origin, destination, departure_date, departure_time")
        .eq("driver_id", user.id);

      if (ridesError) throw ridesError;
      if (!rides || rides.length === 0) return [];

      const rideIds = rides.map(r => r.id);
      const rideMap = new Map(rides.map(r => [r.id, r]));

      // Get all bookings for these rides
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) return [];

      // Get passenger profiles
      const passengerIds = [...new Set(bookings.map(b => b.passenger_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number, avatar_url")
        .in("id", passengerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return bookings.map(booking => ({
        ...booking,
        passenger: profileMap.get(booking.passenger_id) || null,
        ride: rideMap.get(booking.ride_id) || null
      })) as BookingRequest[];
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: "confirmed" | "cancelled" }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast({ 
        title: variables.status === "confirmed" ? "Booking Confirmed!" : "Booking Cancelled",
        description: variables.status === "confirmed" 
          ? "The passenger has been notified" 
          : "The booking has been cancelled"
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast({ title: "Booking Cancelled", description: "Your booking has been cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
