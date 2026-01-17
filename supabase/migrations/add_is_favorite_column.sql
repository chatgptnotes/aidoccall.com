-- Fix missing columns in patient portal tables
-- These columns were in the original schema but missing from the database

-- ============================================
-- 1. Add auth_user_id column to doc_patients table
-- ============================================
ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_doc_patients_auth_user ON doc_patients(auth_user_id);

-- ============================================
-- 2. Add is_favorite column to doc_patient_doctor_selections table
-- ============================================
ALTER TABLE doc_patient_doctor_selections
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster favorite doctor queries
CREATE INDEX IF NOT EXISTS idx_doc_patient_doctor_selections_favorite
ON doc_patient_doctor_selections(patient_id, is_favorite);

-- ============================================
-- 3. Link existing patients to auth users (by email match)
-- ============================================
UPDATE doc_patients p
SET auth_user_id = u.id
FROM auth.users u
WHERE p.email = u.email AND p.auth_user_id IS NULL;

-- ============================================
-- 4. Reload PostgREST schema cache
-- This ensures the API recognizes all new columns
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERIES (run to confirm success)
-- ============================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'doc_patients' AND column_name = 'auth_user_id';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'doc_patient_doctor_selections' AND column_name = 'is_favorite';
