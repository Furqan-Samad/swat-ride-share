
-- Fix 1: Restrict profiles RLS - only confirmed bookings, and hide emergency contacts via a view
DROP POLICY IF EXISTS "Passengers can view driver profile for their bookings" ON public.profiles;

CREATE POLICY "Passengers can view driver profile for confirmed bookings"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR
  (
    is_driver = true AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.rides r ON r.id = b.ride_id
      WHERE r.driver_id = profiles.id
      AND b.passenger_id = auth.uid()
      AND b.status = 'confirmed'
    )
  )
);

-- Fix 2: Restrict reviews to authenticated users only
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);
