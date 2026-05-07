
-- Fix view to run with invoker rights
ALTER VIEW public.driver_public_profile SET (security_invoker = on);

-- Revoke anonymous execution on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_payment_proof(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_driver_profile_for_booking(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_passenger_profile_for_booking(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_proof(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_profile_for_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_passenger_profile_for_booking(uuid) TO authenticated;
