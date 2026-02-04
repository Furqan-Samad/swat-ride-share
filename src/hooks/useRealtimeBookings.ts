import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Real-time subscription for bookings table changes
 * Updates seat availability instantly when bookings are created/updated/deleted
 */
export const useRealtimeBookings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("Booking change detected:", payload.eventType);
          
          // Invalidate all related queries to ensure UI is in sync
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
          queryClient.invalidateQueries({ queryKey: ["rideBookings"] });
          
          // If we have a ride_id, also invalidate specific ride queries
          const rideId = (payload.new as any)?.ride_id || (payload.old as any)?.ride_id;
          if (rideId) {
            queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideWithDriver", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideBookings", rideId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
