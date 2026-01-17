-- ============================================
-- Patient Login & Registration Fix Migration
-- Date: 2026-01-17
-- ============================================
--
-- This migration fixes two issues:
-- 1. Patient login redirect (406 errors) - existing patients not linked to auth users
-- 2. New registration fails - NOT NULL constraints on columns populated in later steps
--
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ============================================

-- ============================================
-- FIX 1: Remove ALL NOT NULL constraints for multi-step registration
-- These columns are populated in Steps 2-5, not Step 1
-- ============================================

-- Step 2 fields (Personal info)
ALTER TABLE doc_patients ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE doc_patients ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE doc_patients ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE doc_patients ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE doc_patients ALTER COLUMN last_name DROP NOT NULL;

-- Step 5 fields (Medical info) - these may not have NOT NULL, but ensure they don't
DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN blood_group DROP NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN height_cm DROP NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN weight_kg DROP NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN profile_photo_url DROP NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- ============================================
-- FIX 2: Add registration tracking columns if they don't exist
-- ============================================
ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1;

ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- FIX 3: Link existing patients to auth users by email
-- Fixes 406 errors for existing patients like anas@gmail.com
-- ============================================
UPDATE doc_patients p
SET user_id = au.id
FROM auth.users au
WHERE LOWER(p.email) = LOWER(au.email)
AND (p.user_id IS NULL OR p.user_id != au.id);

-- ============================================
-- FIX 4: Mark linked patients as registration completed
-- ============================================
UPDATE doc_patients
SET registration_completed = TRUE,
    registration_step = 5
WHERE user_id IS NOT NULL
AND (registration_completed IS NULL OR registration_completed = FALSE);

-- ============================================
-- VERIFY: Check constraints were removed
-- ============================================
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'doc_patients'
AND column_name IN ('gender', 'date_of_birth', 'phone_number', 'first_name', 'last_name', 'blood_group', 'height_cm', 'weight_kg')
ORDER BY column_name;

-- ============================================
-- VERIFY: Check patient-user linking
-- ============================================
SELECT
    p.id as patient_id,
    p.email as patient_email,
    p.user_id,
    p.registration_completed,
    p.registration_step,
    au.email as auth_email
FROM doc_patients p
LEFT JOIN auth.users au ON p.user_id = au.id
ORDER BY p.created_at DESC
LIMIT 20;
