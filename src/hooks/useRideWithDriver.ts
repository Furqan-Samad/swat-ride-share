import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeSearchInput } from "@/lib/sanitize";

export interface RideWithDriver {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  front_seat_price: number | null;
  back_seat_price: number | null;
  front_seats_available: number | null;
  back_seats_available: number | null;
  description: string | null;
  status: string;
  created_at: string;
  driver?: {
    full_name: string | null;
    avatar_url: string | null;
    phone_number?: string | null;
  } | null;
}

export const useRidesWithDriver = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ["ridesWithDriver", from, to],
    queryFn: async () => {
      let query = supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .order("departure_date", { ascending: true });

      if (from) {
        const sanitizedFrom = sanitizeSearchInput(from);
        query = query.ilike("origin", `%${sanitizedFrom}%`);
      }
      if (to) {
        const sanitizedTo = sanitizeSearchInput(to);
        query = query.ilike("destination", `%${sanitizedTo}%`);
      }

      const { data: rides, error } = await query;
      if (error) throw error;

      // Fetch driver profiles for all rides
      const driverIds = [...new Set((rides || []).map(r => r.driver_id))];
      
      if (driverIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", driverIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return (rides || []).map(ride => ({
        ...ride,
        driver: profileMap.get(ride.driver_id) || null
      })) as RideWithDriver[];
    },
  });
};

export const useRideWithDriver = (id: string) => {
  return useQuery({
    queryKey: ["rideWithDriver", id],
    queryFn: async () => {
      const { data: ride, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      if (!ride) return null;

      // Fetch driver profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone_number")
        .eq("id", ride.driver_id)
        .maybeSingle();

      return {
        ...ride,
        driver: profile || null
      } as RideWithDriver;
    },
    enabled: !!id,
  });
};
