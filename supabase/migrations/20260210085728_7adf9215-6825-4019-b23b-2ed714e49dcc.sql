
-- Add length constraints to profiles table (drop first if they exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'phone_number_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT phone_number_length CHECK (length(phone_number) <= 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'full_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT full_name_length CHECK (length(full_name) <= 100);
  END IF;
END $$;
