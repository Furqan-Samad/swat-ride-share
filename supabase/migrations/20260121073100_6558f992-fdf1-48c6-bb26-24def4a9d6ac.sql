-- Add seat type and pricing columns to support front/back seat selection
ALTER TABLE public.rides 
ADD COLUMN front_seat_price integer,
ADD COLUMN back_seat_price integer,
ADD COLUMN front_seats_available integer DEFAULT 1,
ADD COLUMN back_seats_available integer DEFAULT 3;

-- Add seat type to bookings
ALTER TABLE public.bookings 
ADD COLUMN seat_type text DEFAULT 'back' CHECK (seat_type IN ('front', 'back'));

-- Update existing rides to use current price_per_seat as back_seat_price
UPDATE public.rides 
SET back_seat_price = price_per_seat,
    front_seat_price = ROUND(price_per_seat * 1.5)
WHERE back_seat_price IS NULL;