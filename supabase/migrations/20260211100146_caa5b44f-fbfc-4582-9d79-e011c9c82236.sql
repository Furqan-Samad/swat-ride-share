
-- Create payments table for manual payment verification
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES public.rides(id),
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('easypaisa', 'jazzcash', 'sadapay', 'nayapay', 'raast', 'bank_transfer', 'cash')),
  wallet_name TEXT,
  transaction_reference TEXT,
  screenshot_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'paid', 'failed', 'refunded', 'cash_pending', 'cash_collected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Passengers can create payments for their bookings
CREATE POLICY "Passengers can create own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = passenger_id);

-- Passengers can view their own payments
CREATE POLICY "Passengers can view own payments"
ON public.payments FOR SELECT
USING (auth.uid() = passenger_id);

-- Drivers can view payments for their rides
CREATE POLICY "Drivers can view payments for their rides"
ON public.payments FOR SELECT
USING (auth.uid() = driver_id);

-- Passengers can update their own pending payments (re-upload proof)
CREATE POLICY "Passengers can update own pending payments"
ON public.payments FOR UPDATE
USING (auth.uid() = passenger_id AND payment_status = 'pending_verification');

-- Drivers can verify payments for their rides
CREATE POLICY "Drivers can verify payments for their rides"
ON public.payments FOR UPDATE
USING (auth.uid() = driver_id);

-- Enable realtime for payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage RLS: passengers can upload their own payment proofs
CREATE POLICY "Passengers can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Passengers and drivers can view payment proofs
CREATE POLICY "Users can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.screenshot_url LIKE '%' || storage.filename(name) || '%'
    AND p.driver_id = auth.uid()
  )
));
