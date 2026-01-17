-- ============================================
-- SQL MIGRATION: Fix Patient Login & Registration Issues
-- Run this in Supabase SQL Editor
-- Date: 2026-01-17
-- ============================================

-- ============================================
-- FIX 1: Remove NOT NULL constraint from date_of_birth
-- Required for multi-step registration flow where DOB
-- is collected at Step 2, but profile is created at Step 1
-- ============================================
ALTER TABLE doc_patients
ALTER COLUMN date_of_birth DROP NOT NULL;

-- ============================================
-- FIX 2: Add missing columns if they don't exist
-- registration_step - tracks current step in registration
-- registration_completed - marks if registration is finished
-- ============================================
ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- FIX 3: Link existing patients to auth users by email
-- This fixes the 406 error for existing patients like anas@gmail.com
-- who have NULL user_id values (not linked to auth.users)
-- ============================================
UPDATE doc_patients p
SET user_id = au.id
FROM auth.users au
WHERE LOWER(p.email) = LOWER(au.email)
AND (p.user_id IS NULL OR p.user_id != au.id);

-- ============================================
-- FIX 4: Mark existing patients as registration completed
-- Any patient with a valid user_id should be marked as
-- having completed registration to prevent redirect loops
-- ============================================
UPDATE doc_patients
SET registration_completed = TRUE,
    registration_step = 5
WHERE user_id IS NOT NULL
AND (registration_completed IS NULL OR registration_completed = FALSE);

-- ============================================
-- VERIFICATION QUERIES (Optional - to confirm fixes)
-- ============================================

-- Check if date_of_birth is now nullable:
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'doc_patients' AND column_name = 'date_of_birth';

-- Check for patients now linked to auth users:
-- SELECT p.email, p.user_id, p.registration_completed
-- FROM doc_patients p
-- WHERE p.user_id IS NOT NULL
-- ORDER BY p.created_at DESC;

-- Check for any remaining unlinked patients:
-- SELECT p.email, p.user_id
-- FROM doc_patients p
-- WHERE p.user_id IS NULL;
