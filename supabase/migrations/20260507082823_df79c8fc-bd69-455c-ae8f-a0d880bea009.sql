
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, is_driver boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.is_driver
  FROM profiles p
  WHERE p.id = ANY(_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;
