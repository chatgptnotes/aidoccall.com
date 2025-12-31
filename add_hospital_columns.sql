-- Add hospital-related columns for medical consultation platform to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS nearest_hospital TEXT,
  ADD COLUMN IF NOT EXISTS hospital_phone TEXT,
  ADD COLUMN IF NOT EXISTS hospital_website TEXT;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_bookings_nearest_hospital ON public.bookings USING btree (nearest_hospital);

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.nearest_hospital IS 'Name of nearest hospital found for medical consultation';
COMMENT ON COLUMN public.bookings.hospital_phone IS 'Phone number of the nearest hospital';
COMMENT ON COLUMN public.bookings.hospital_website IS 'Website or Google Maps URL of the nearest hospital';
