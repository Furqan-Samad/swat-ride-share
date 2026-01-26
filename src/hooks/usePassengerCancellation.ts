import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CancelBookingParams {
  bookingId: string;
  rideId: string;
  seatsBooked: number;
  seatType: 'front' | 'back';
  reason: string;
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, rideId, seatsBooked, seatType, reason }: CancelBookingParams) => {
      // 1. Update booking status to cancelled with reason
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      // 2. Restore seats to the ride
      const { data: ride, error: rideError } = await supabase
        .from("rides")
        .select("front_seats_available, back_seats_available, available_seats")
        .eq("id", rideId)
        .single();

      if (rideError) throw rideError;

      const updateField = seatType === 'front' ? 'front_seats_available' : 'back_seats_available';
      const currentAvailable = seatType === 'front' 
        ? (ride.front_seats_available ?? 0) 
        : (ride.back_seats_available ?? 0);

      const { error: updateError } = await supabase
        .from("rides")
        .update({
          [updateField]: currentAvailable + seatsBooked,
          available_seats: (ride.available_seats ?? 0) + seatsBooked,
        })
        .eq("id", rideId);

      if (updateError) throw updateError;

      // 3. Send WhatsApp notification for cancellation
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'bpoynxqqumbsstfgrjqg';
        await fetch(`https://${projectId}.supabase.co/functions/v1/send-whatsapp-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            bookingId, 
            notificationType: 'cancellation',
            cancellationReason: reason 
          }),
        });
      } catch (notifError) {
        console.error('Failed to send cancellation notification:', notifError);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled and the driver has been notified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
