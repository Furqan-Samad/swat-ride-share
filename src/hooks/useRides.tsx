import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Ride {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  description: string | null;
  status: string;
  created_at: string;
  profiles?: {
    id: string;
    phone_number: string | null;
  };
}

export const useRides = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ["rides", from, to],
    queryFn: async () => {
      let query = supabase
        .from("rides")
        .select(`
          *,
          profiles:driver_id (
            id,
            phone_number
          )
        `)
        .eq("status", "active")
        .order("departure_date", { ascending: true });

      if (from) {
        query = query.ilike("origin", `%${from}%`);
      }
      if (to) {
        query = query.ilike("destination", `%${to}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Ride[];
    },
  });
};

export const useRide = (id: string) => {
  return useQuery({
    queryKey: ["ride", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select(`
          *,
          profiles:driver_id (
            id,
            phone_number
          )
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Ride | null;
    },
    enabled: !!id,
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
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to post a ride");
      }

      const { data, error } = await supabase
        .from("rides")
        .insert({
          ...ride,
          driver_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      toast({
        title: "Ride Posted!",
        description: "Your ride has been published successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ rideId, seats }: { rideId: string; seats: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to book a ride");
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          seats_booked: seats,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Booking Requested!",
        description: "The driver will be notified of your booking request",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
