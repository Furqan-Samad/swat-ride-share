import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Real-time subscription for rides and bookings tables
 * Ensures seat availability is always up-to-date across all users
 */
export const useRealtimeRides = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to rides table changes
    const ridesChannel = supabase
      .channel("rides-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          console.log("Ride change detected:", payload.eventType);
          
          // Invalidate all ride queries
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          queryClient.invalidateQueries({ queryKey: ["myRides"] });
          
          // Also update the specific ride if it's being viewed
          const rideId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (rideId) {
            queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideWithDriver", rideId] });
          }
        }
      )
      .subscribe();

    // Subscribe to bookings table changes for real-time seat updates
    const bookingsChannel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("Booking change detected:", payload.eventType);
          
          // Invalidate booking-related queries
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
          queryClient.invalidateQueries({ queryKey: ["rideBookingsCounts"] });
          
          // Update specific ride if affected
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
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [queryClient]);
};
