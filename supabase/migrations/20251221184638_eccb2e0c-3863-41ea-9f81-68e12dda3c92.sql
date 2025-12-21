-- Drop the problematic policy that exposes phone numbers
DROP POLICY IF EXISTS "Anyone can view driver name for active rides" ON public.profiles;

-- Create a more secure policy: only passengers with bookings can see driver contact info
CREATE POLICY "Passengers can view driver profile for their bookings" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.rides r ON r.id = b.ride_id
    WHERE r.driver_id = profiles.id 
    AND b.passenger_id = auth.uid()
    AND b.status IN ('confirmed', 'pending')
  )
);

-- Add full_name column to profiles for display purposes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS is_driver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create vehicles table for driver vehicle details
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vehicle_type text NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer,
  vehicle_color text NOT NULL,
  license_plate text NOT NULL,
  seats_available integer DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicles policies
CREATE POLICY "Drivers can manage own vehicle" 
ON public.vehicles FOR ALL 
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- Anyone can view vehicle info for active rides (no sensitive data here)
CREATE POLICY "Anyone can view vehicle for active rides" 
ON public.vehicles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE rides.driver_id = vehicles.driver_id 
    AND rides.status = 'active'
  )
);

-- Trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update handle_new_user to include full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;