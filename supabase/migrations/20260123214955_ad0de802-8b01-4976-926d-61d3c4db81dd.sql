-- Fix security issue: Vehicle license plates should only be visible to confirmed passengers
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view vehicle for active rides" ON public.vehicles;

-- Create a more restrictive policy: Only confirmed passengers can see vehicle details (including license plate)
CREATE POLICY "Confirmed passengers can view vehicle details" 
ON public.vehicles 
FOR SELECT 
USING (
  -- Driver can always see their own vehicle
  auth.uid() = driver_id
  OR
  -- Only confirmed passengers can see vehicle details
  EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.rides r ON r.id = b.ride_id
    WHERE r.driver_id = vehicles.driver_id 
    AND b.passenger_id = auth.uid()
    AND b.status = 'confirmed'
  )
);

-- Create a separate view for basic vehicle info (type, make, model, color - NO license plate)
-- This can be used for ride browsing without exposing sensitive data
CREATE OR REPLACE VIEW public.vehicles_public 
WITH (security_invoker=on) AS
SELECT 
  id,
  driver_id,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_color,
  vehicle_year,
  seats_available,
  created_at
  -- Explicitly excluding license_plate
FROM public.vehicles;