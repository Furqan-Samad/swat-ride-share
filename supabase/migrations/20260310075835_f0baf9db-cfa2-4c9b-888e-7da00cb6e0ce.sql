
-- Create a SECURITY DEFINER function for sending notifications to other users
-- This allows drivers to notify passengers about payment updates
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _related_booking_id UUID DEFAULT NULL,
  _related_ride_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate that the caller has a relationship to the booking/ride
  IF _related_booking_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON r.id = b.ride_id
      WHERE b.id = _related_booking_id
        AND (b.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'Not authorized to send this notification';
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, related_booking_id, related_ride_id)
  VALUES (_user_id, _type, _title, _message, _related_booking_id, _related_ride_id);
END;
$$;
