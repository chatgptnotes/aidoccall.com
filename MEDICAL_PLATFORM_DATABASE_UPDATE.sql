-- ================================================
-- MEDICAL PLATFORM DATABASE UPDATE
-- Project: AidocCall.com (Medical Consultation Platform)
-- ================================================

-- This script updates the existing bookings table to support
-- medical consultation features instead of ambulance services

-- ================================================
-- ADD MISSING HOSPITAL COLUMNS TO BOOKINGS TABLE
-- ================================================

-- Add hospital-related columns for medical consultation platform
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

-- ================================================
-- UPDATE TABLE COMMENTS
-- ================================================

-- Update table comment to reflect medical consultation purpose
COMMENT ON TABLE bookings IS 'Medical consultation booking records';

-- ================================================
-- MANUAL EXECUTION INSTRUCTIONS
-- ================================================

/*
To apply this update:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste this entire script
4. Click "Run" to execute

This will add the missing columns:
- nearest_hospital (TEXT)
- hospital_phone (TEXT) 
- hospital_website (TEXT)

After running this script, your application will work without the 
"Could not find the 'hospital_phone' column" error.
*/