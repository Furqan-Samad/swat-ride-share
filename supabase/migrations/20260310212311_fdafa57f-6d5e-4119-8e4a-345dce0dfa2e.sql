
-- Fix 1: Create secure function for passenger booking cancellation
CREATE OR REPLACE FUNCTION public.cancel_booking(
  _booking_id uuid,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE bookings
  SET status = 'cancelled',
      cancellation_reason = _reason,
      cancelled_at = now()
  WHERE id = _booking_id
    AND passenger_id = auth.uid()
    AND status IN ('pending', 'confirmed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be cancelled';
  END IF;
END;
$$;

-- Fix 2: Create secure function for passenger payment update (only screenshot/ref)
CREATE OR REPLACE FUNCTION public.update_payment_proof(
  _payment_id uuid,
  _transaction_reference text DEFAULT NULL,
  _screenshot_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE payments
  SET transaction_reference = COALESCE(_transaction_reference, transaction_reference),
      screenshot_url = COALESCE(_screenshot_url, screenshot_url)
  WHERE id = _payment_id
    AND passenger_id = auth.uid()
    AND payment_status = 'pending_verification';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or cannot be updated';
  END IF;
END;
$$;

-- Fix 3: Create secure function for driver payment verification
CREATE OR REPLACE FUNCTION public.verify_payment(
  _payment_id uuid,
  _action text,
  _rejection_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _passenger_id uuid;
  _amount integer;
  _booking_id uuid;
  _ride_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _action NOT IN ('approve', 'reject', 'cash_collected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  -- Verify driver owns this payment
  SELECT passenger_id, amount, booking_id, ride_id
  INTO _passenger_id, _amount, _booking_id, _ride_id
  FROM payments
  WHERE id = _payment_id AND driver_id = auth.uid();

  IF _passenger_id IS NULL THEN
    RAISE EXCEPTION 'Payment not found or not authorized';
  END IF;

  UPDATE payments
  SET payment_status = CASE
        WHEN _action = 'approve' THEN 'paid'
        WHEN _action = 'cash_collected' THEN 'cash_collected'
        ELSE 'failed'
      END,
      verified_at = now(),
      verified_by = auth.uid(),
      rejection_reason = CASE WHEN _action = 'reject' THEN _rejection_reason ELSE NULL END
  WHERE id = _payment_id;

  RETURN _payment_id;
END;
$$;

-- Fix 4: Restrict passenger booking update to cancellation only
DROP POLICY IF EXISTS "Passengers can update own bookings" ON public.bookings;
CREATE POLICY "Passengers can update own bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = passenger_id AND status IN ('pending', 'confirmed'))
WITH CHECK (auth.uid() = passenger_id AND status = 'cancelled');

-- Fix 5: Remove passenger direct payment update (use RPC instead)
DROP POLICY IF EXISTS "Passengers can update own pending payments" ON public.payments;

-- Fix 6: Add WITH CHECK to driver payment verification policy
DROP POLICY IF EXISTS "Drivers can verify payments for their rides" ON public.payments;
CREATE POLICY "Drivers can verify payments for their rides" ON public.payments
FOR UPDATE TO public
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- Fix 7: Restrict profile view for passengers - use a view instead
-- The driver_public_profile and vehicles_public views are intentional public views
-- with only non-sensitive fields (no emergency contacts), so they're safe as-is
