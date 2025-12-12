-- Create rides table
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 1 AND available_seats <= 6),
  price_per_seat INTEGER NOT NULL CHECK (price_per_seat >= 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active rides
CREATE POLICY "Anyone can view active rides" 
ON public.rides 
FOR SELECT 
USING (status = 'active');

-- Authenticated users can create rides
CREATE POLICY "Authenticated users can create rides" 
ON public.rides 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own rides
CREATE POLICY "Drivers can update own rides" 
ON public.rides 
FOR UPDATE 
TO authenticated
USING (auth.uid() = driver_id);

-- Drivers can delete their own rides
CREATE POLICY "Drivers can delete own rides" 
ON public.rides 
FOR DELETE 
TO authenticated
USING (auth.uid() = driver_id);

-- Add trigger for updated_at
CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seats_booked INTEGER NOT NULL DEFAULT 1 CHECK (seats_booked >= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ride_id, passenger_id)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Passengers can view their own bookings
CREATE POLICY "Passengers can view own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = passenger_id);

-- Drivers can view bookings for their rides
CREATE POLICY "Drivers can view bookings for their rides" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.rides 
  WHERE rides.id = bookings.ride_id 
  AND rides.driver_id = auth.uid()
));

-- Authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = passenger_id);

-- Passengers can update their own bookings
CREATE POLICY "Passengers can update own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = passenger_id);

-- Drivers can update bookings for their rides
CREATE POLICY "Drivers can update bookings for their rides" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.rides 
  WHERE rides.id = bookings.ride_id 
  AND rides.driver_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();