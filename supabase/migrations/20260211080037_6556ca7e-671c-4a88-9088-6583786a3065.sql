
-- 1. Create a view for driver info visible to passengers (no phone/emergency fields)
CREATE OR REPLACE VIEW public.driver_public_profile
WITH (security_invoker=on) AS
SELECT id, full_name, avatar_url, is_driver, created_at
FROM public.profiles;

-- 2. Recreate vehicles_public view WITHOUT license_plate
DROP VIEW IF EXISTS public.vehicles_public;
CREATE VIEW public.vehicles_public
WITH (security_invoker=on) AS
SELECT id, driver_id, vehicle_year, seats_available, vehicle_model, vehicle_color, vehicle_type, vehicle_make, created_at
FROM public.vehicles;
