
-- 1. Tighten profiles RLS: remove broad policy that exposed sensitive columns
DROP POLICY IF EXISTS "Passengers can view driver profile for confirmed bookings" ON public.profiles;

-- 2. Recreate safe public profile view (only non-sensitive columns)
DROP VIEW IF EXISTS public.driver_public_profile;
CREATE VIEW public.driver_public_profile
WITH (security_invoker = off) AS
SELECT id, full_name, avatar_url, is_driver, created_at
FROM public.profiles;

GRANT SELECT ON public.driver_public_profile TO anon, authenticated;

-- 3. Controlled access for driver -> passenger contact (confirmed bookings only)
CREATE OR REPLACE FUNCTION public.get_passenger_profile_for_booking(_passenger_id uuid)
RETURNS TABLE(id uuid, full_name text, phone_number text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN rides r ON r.id = b.ride_id
    WHERE r.driver_id = auth.uid()
      AND b.passenger_id = _passenger_id
      AND b.status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'No confirmed booking with this passenger';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone_number, p.avatar_url
  FROM profiles p
  WHERE p.id = _passenger_id;
END;
$$;

-- 4. Require authentication to browse active rides (hides driver_id from anon)
DROP POLICY IF EXISTS "Anyone can view active rides" ON public.rides;
CREATE POLICY "Authenticated users can view active rides"
ON public.rides
FOR SELECT
TO authenticated
USING (status = 'active');
