
-- Fix emergency contact exposure: restrict passenger view of driver profile
-- Drop and recreate the policy to only show non-sensitive fields
-- We'll use a security definer function to control what data passengers see
CREATE OR REPLACE FUNCTION public.get_driver_profile_for_booking(_driver_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone_number text,
  avatar_url text,
  is_driver boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller has a confirmed booking with this driver
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN rides r ON r.id = b.ride_id
    WHERE r.driver_id = _driver_id
      AND b.passenger_id = auth.uid()
      AND b.status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'No confirmed booking with this driver';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone_number, p.avatar_url, p.is_driver
  FROM profiles p
  WHERE p.id = _driver_id;
END;
$$;
