
CREATE OR REPLACE FUNCTION public.get_my_ride_passenger_profiles(_passenger_ids uuid[])
RETURNS TABLE(id uuid, full_name text, phone_number text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone_number, p.avatar_url
  FROM profiles p
  WHERE p.id = ANY(_passenger_ids)
    AND EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON r.id = b.ride_id
      WHERE r.driver_id = auth.uid()
        AND b.passenger_id = p.id
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_ride_passenger_profiles(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_ride_passenger_profiles(uuid[]) TO authenticated;
