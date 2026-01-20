import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useBookingNotifications = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `passenger_id=eq.${userId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          // Only notify on status changes
          if (newStatus === oldStatus) return;

          // Fetch ride details for the notification
          const { data: ride } = await supabase
            .from('rides')
            .select('origin, destination')
            .eq('id', payload.new.ride_id)
            .single();

          const routeInfo = ride ? `${ride.origin} → ${ride.destination}` : 'your ride';

          if (newStatus === 'confirmed') {
            toast({
              title: "🎉 Booking Confirmed!",
              description: `Your booking for ${routeInfo} has been confirmed by the driver.`,
            });
          } else if (newStatus === 'cancelled') {
            toast({
              title: "❌ Booking Cancelled",
              description: `Your booking for ${routeInfo} has been cancelled.`,
              variant: "destructive",
            });
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast, queryClient]);
};
