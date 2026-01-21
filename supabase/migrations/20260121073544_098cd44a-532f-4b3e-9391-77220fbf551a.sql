-- Create reviews table for driver ratings
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Passengers can create reviews for their completed bookings
CREATE POLICY "Passengers can create reviews for completed bookings"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = passenger_id AND
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND b.passenger_id = auth.uid()
    AND b.status = 'confirmed'
  )
);

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Passengers can update their own reviews
CREATE POLICY "Passengers can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = passenger_id);

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;