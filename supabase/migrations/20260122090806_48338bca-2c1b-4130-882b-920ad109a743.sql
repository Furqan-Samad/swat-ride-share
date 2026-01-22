-- Enable realtime for rides table to track seat availability changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;