
-- Fix 1: Restrict notification INSERT to own user_id only
DROP POLICY IF EXISTS "Authenticated users can receive notifications" ON public.notifications;
CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Remove emergency contact exposure from passenger view
-- Replace the broad profile SELECT with a restricted one
DROP POLICY IF EXISTS "Passengers can view driver profile for confirmed bookings" ON public.profiles;
CREATE POLICY "Passengers can view driver profile for confirmed bookings"
ON public.profiles
FOR SELECT
TO public
USING (
  (auth.uid() = id)
  OR (
    (is_driver = true)
    AND EXISTS (
      SELECT 1
      FROM bookings b
      JOIN rides r ON r.id = b.ride_id
      WHERE r.driver_id = profiles.id
        AND b.passenger_id = auth.uid()
        AND b.status = 'confirmed'
    )
  )
);
