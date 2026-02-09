import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Real-time subscription for rides and bookings tables
 * Ensures seat availability is always up-to-date across all users
 */
export const useRealtimeRides = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const subscribed = useRef(false);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (subscribed.current) return;
    subscribed.current = true;

    console.log("Setting up real-time subscriptions...");

    // Subscribe to rides table changes
    const ridesChannel = supabase
      .channel("rides-realtime-v2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          console.log("Ride change detected:", payload.eventType, payload);
          
          // Invalidate all ride queries immediately
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          queryClient.invalidateQueries({ queryKey: ["myRides"] });
          
          // Also update the specific ride if it's being viewed
          const rideId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (rideId) {
            queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideWithDriver", rideId] });
          }

          // Notify user of new rides
          if (payload.eventType === "INSERT") {
            const newRide = payload.new as any;
            toast({
              title: "New Ride Available",
              description: `${newRide.origin} → ${newRide.destination}`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Rides channel status:", status);
      });

    // Subscribe to bookings table changes for real-time seat updates
    const bookingsChannel = supabase
      .channel("bookings-realtime-v2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("Booking change detected:", payload.eventType, payload);
          
          // Invalidate all booking-related queries immediately
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
          queryClient.invalidateQueries({ queryKey: ["rideBookingsCounts"] });
          queryClient.invalidateQueries({ queryKey: ["myRides"] });
          
          // Update specific ride if affected
          const rideId = (payload.new as any)?.ride_id || (payload.old as any)?.ride_id;
          if (rideId) {
            queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideWithDriver", rideId] });
            queryClient.invalidateQueries({ queryKey: ["rideBookings", rideId] });
          }
        }
      )
      .subscribe((status) => {
        console.log("Bookings channel status:", status);
      });

    return () => {
      console.log("Cleaning up real-time subscriptions...");
      subscribed.current = false;
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [queryClient, toast]);
};
