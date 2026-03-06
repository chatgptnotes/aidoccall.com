-- Add new columns for patient intake form flow
-- Run this migration on your Supabase database

-- Add is_indian_resident column (asked at signup)
ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS is_indian_resident BOOLEAN DEFAULT NULL;

-- Add intake_form_completed column (tracks if patient has completed the intake form after payment)
ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS intake_form_completed BOOLEAN DEFAULT FALSE;

-- Comment for clarity
COMMENT ON COLUMN doc_patients.is_indian_resident IS 'Whether the patient is a resident of India (asked at signup)';
COMMENT ON COLUMN doc_patients.intake_form_completed IS 'Whether the patient has completed the intake form (Personal, Address, Emergency, Medical info) after their first payment';

-- Update existing patients: if registration_completed is true, mark intake_form_completed as true too
-- (for backward compatibility with existing completed registrations)
UPDATE doc_patients 
SET intake_form_completed = TRUE 
WHERE registration_completed = TRUE AND intake_form_completed IS NOT TRUE;
