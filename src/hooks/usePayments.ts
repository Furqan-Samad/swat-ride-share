import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'sadapay' | 'nayapay' | 'raast' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending_verification' | 'paid' | 'failed' | 'refunded' | 'cash_pending' | 'cash_collected';

export interface Payment {
  id: string;
  booking_id: string;
  ride_id: string;
  passenger_id: string;
  driver_id: string;
  amount: number;
  payment_method: PaymentMethod;
  wallet_name: string | null;
  transaction_reference: string | null;
  screenshot_url: string | null;
  payment_status: PaymentStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'easypaisa', label: 'Easypaisa', icon: '📱' },
  { value: 'jazzcash', label: 'JazzCash', icon: '📲' },
  { value: 'sadapay', label: 'SadaPay', icon: '💳' },
  { value: 'nayapay', label: 'NayaPay', icon: '💰' },
  { value: 'raast', label: 'Raast', icon: '⚡' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' },
];

export const usePaymentForBooking = (bookingId: string) => {
  return useQuery({
    queryKey: ["payment", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data as Payment | null;
    },
    enabled: !!bookingId,
  });
};

export const useDriverPayments = () => {
  return useQuery({
    queryKey: ["driverPayments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Payment[];
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      bookingId: string;
      rideId: string;
      driverId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      walletName?: string;
      transactionReference?: string;
      screenshotFile?: File;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (params.screenshotFile) {
        const fileExt = params.screenshotFile.name.split('.').pop();
        const filePath = `${user.id}/${params.bookingId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, params.screenshotFile, { upsert: true });

        if (uploadError) throw new Error("Failed to upload payment proof");

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);
        
        screenshotUrl = urlData.publicUrl;
      }

      const paymentStatus = params.paymentMethod === 'cash' ? 'cash_pending' : 'pending_verification';

      const { data, error } = await supabase
        .from("payments")
        .insert({
          booking_id: params.bookingId,
          ride_id: params.rideId,
          passenger_id: user.id,
          driver_id: params.driverId,
          amount: params.amount,
          payment_method: params.paymentMethod,
          wallet_name: params.walletName || null,
          transaction_reference: params.transactionReference || null,
          screenshot_url: screenshotUrl,
          payment_status: paymentStatus,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Payment already submitted for this booking");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast({ title: "Payment Submitted!", description: "Your payment proof has been sent for verification." });
    },
    onError: (error: Error) => {
      toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ paymentId, action, rejectionReason }: {
      paymentId: string;
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = {
        payment_status: action === 'approve' ? 'paid' : 'failed',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      };

      if (action === 'reject' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for passenger using secure function
      await supabase.rpc("create_notification", {
        _user_id: data.passenger_id,
        _type: action === 'approve' ? 'payment_confirmed' : 'payment_rejected',
        _title: action === 'approve' ? 'Payment Confirmed' : 'Payment Rejected',
        _message: action === 'approve'
          ? `Your payment of ₨${data.amount} has been verified.`
          : `Your payment was rejected. ${rejectionReason || 'Please resubmit.'}`,
        _related_booking_id: data.booking_id,
        _related_ride_id: data.ride_id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["driverPayments"] });
      queryClient.invalidateQueries({ queryKey: ["driverBookingRequests"] });
      toast({
        title: variables.action === 'approve' ? "Payment Approved" : "Payment Rejected",
        description: variables.action === 'approve'
          ? "The passenger has been notified"
          : "The passenger will be asked to resubmit",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useCollectCash = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payments")
        .update({
          payment_status: 'cash_collected',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: data.passenger_id,
        type: 'payment_confirmed',
        title: 'Cash Payment Collected',
        message: `Your cash payment of ₨${data.amount} has been collected by the driver.`,
        related_booking_id: data.booking_id,
        related_ride_id: data.ride_id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["driverPayments"] });
      toast({ title: "Cash Collected", description: "Payment marked as collected." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
