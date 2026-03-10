
-- Fix 1: Passengers can self-approve payments - add WITH CHECK
DROP POLICY IF EXISTS "Passengers can update own pending payments" ON public.payments;
CREATE POLICY "Passengers can update own pending payments" ON public.payments
FOR UPDATE TO public
USING (auth.uid() = passenger_id AND payment_status = 'pending_verification')
WITH CHECK (auth.uid() = passenger_id AND payment_status = 'pending_verification');

-- Fix 2: Drivers can reassign rides - add WITH CHECK
DROP POLICY IF EXISTS "Drivers can update own rides" ON public.rides;
CREATE POLICY "Drivers can update own rides" ON public.rides
FOR UPDATE TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- Fix 3: Passengers can manipulate bookings - add WITH CHECK
DROP POLICY IF EXISTS "Passengers can update own bookings" ON public.bookings;
CREATE POLICY "Passengers can update own bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = passenger_id)
WITH CHECK (auth.uid() = passenger_id);

-- Fix 4: Passengers can falsely attribute reviews - add WITH CHECK
DROP POLICY IF EXISTS "Passengers can update own reviews" ON public.reviews;
CREATE POLICY "Passengers can update own reviews" ON public.reviews
FOR UPDATE TO public
USING (auth.uid() = passenger_id)
WITH CHECK (auth.uid() = passenger_id);

-- Fix 5: Make payment-proofs bucket public so drivers can view screenshots
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';

-- Fix 6: Add storage policies for payment-proofs
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;
CREATE POLICY "Anyone can view payment proofs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs');
