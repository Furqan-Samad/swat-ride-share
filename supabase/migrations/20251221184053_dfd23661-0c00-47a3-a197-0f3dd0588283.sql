-- Fix security: Remove public access to profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow viewing driver profiles for active rides (needed for ride cards)
CREATE POLICY "Anyone can view driver name for active rides" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE rides.driver_id = profiles.id 
    AND rides.status = 'active'
  )
);