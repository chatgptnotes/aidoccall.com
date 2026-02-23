-- ============================================
-- Patient Registration Fix V2
-- Date: 2026-02-23
-- ============================================
-- Fixes:
-- 1. Column name mismatch: auth_user_id vs user_id
-- 2. Missing columns: registration_completed, registration_step
-- 3. RLS policies referencing wrong column name
-- 4. NOT NULL constraints blocking multi-step registration
--
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ============================================

-- ============================================
-- STEP 1: Add user_id column if it doesn't exist
-- The code uses user_id, original schema had auth_user_id
-- ============================================
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doc_patients' AND column_name = 'user_id'
    ) THEN
        -- Check if auth_user_id exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'doc_patients' AND column_name = 'auth_user_id'
        ) THEN
            ALTER TABLE doc_patients RENAME COLUMN auth_user_id TO user_id;
            RAISE NOTICE 'Renamed auth_user_id to user_id';
        ELSE
            ALTER TABLE doc_patients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id column';
        END IF;
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Add missing registration tracking columns
-- ============================================
ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1;

ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 3: Add first_name, last_name if missing (code uses split name)
-- ============================================
ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);

ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

ALTER TABLE doc_patients
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- ============================================
-- STEP 4: Remove NOT NULL constraints for multi-step registration
-- ============================================
DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN full_name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN gender DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN date_of_birth DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN phone_number DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN phone DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN first_name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN last_name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN blood_group DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN height_cm DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN weight_kg DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE doc_patients ALTER COLUMN profile_photo_url DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================
-- STEP 5: Fix RLS policies to use user_id
-- ============================================

-- Drop old policies that reference auth_user_id
DROP POLICY IF EXISTS "Patients can view own profile" ON doc_patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON doc_patients;
DROP POLICY IF EXISTS "Patients can insert own profile" ON doc_patients;
DROP POLICY IF EXISTS "Users can check profile existence" ON doc_patients;
DROP POLICY IF EXISTS "Service role full access to patients" ON doc_patients;

-- Recreate policies with user_id
CREATE POLICY "Patients can view own profile" ON doc_patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own profile" ON doc_patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own profile" ON doc_patients
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Allow any authenticated user to check if profile exists (for registration)
CREATE POLICY "Users can check profile existence" ON doc_patients
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role full access
CREATE POLICY "Service role full access to patients" ON doc_patients
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- STEP 6: Fix child table RLS policies
-- ============================================

-- Fix address policies
DROP POLICY IF EXISTS "Patients can manage own addresses" ON doc_patient_addresses;
CREATE POLICY "Patients can manage own addresses" ON doc_patient_addresses
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix emergency contact policies
DROP POLICY IF EXISTS "Patients can manage own emergency contacts" ON doc_patient_emergency_contacts;
CREATE POLICY "Patients can manage own emergency contacts" ON doc_patient_emergency_contacts
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix medical history policies
DROP POLICY IF EXISTS "Patients can manage own medical history" ON doc_patient_medical_history;
CREATE POLICY "Patients can manage own medical history" ON doc_patient_medical_history
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix allergy policies
DROP POLICY IF EXISTS "Patients can manage own allergies" ON doc_patient_allergies;
CREATE POLICY "Patients can manage own allergies" ON doc_patient_allergies
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix medication policies
DROP POLICY IF EXISTS "Patients can manage own medications" ON doc_patient_medications;
CREATE POLICY "Patients can manage own medications" ON doc_patient_medications
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix insurance policies
DROP POLICY IF EXISTS "Patients can manage own insurance" ON doc_patient_insurance;
CREATE POLICY "Patients can manage own insurance" ON doc_patient_insurance
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- Fix doctor selection policies
DROP POLICY IF EXISTS "Patients can manage own doctor selections" ON doc_patient_doctor_selections;
CREATE POLICY "Patients can manage own doctor selections" ON doc_patient_doctor_selections
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid()));

-- ============================================
-- STEP 7: Fix address table column names
-- The code uses address_line_1/address_line_2, schema may have street_address/apartment_unit
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doc_patient_addresses' AND column_name = 'address_line_1'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'doc_patient_addresses' AND column_name = 'street_address'
        ) THEN
            ALTER TABLE doc_patient_addresses RENAME COLUMN street_address TO address_line_1;
            RAISE NOTICE 'Renamed street_address to address_line_1';
        ELSE
            ALTER TABLE doc_patient_addresses ADD COLUMN address_line_1 TEXT;
            RAISE NOTICE 'Added address_line_1 column';
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doc_patient_addresses' AND column_name = 'address_line_2'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'doc_patient_addresses' AND column_name = 'apartment_unit'
        ) THEN
            ALTER TABLE doc_patient_addresses RENAME COLUMN apartment_unit TO address_line_2;
            RAISE NOTICE 'Renamed apartment_unit to address_line_2';
        ELSE
            ALTER TABLE doc_patient_addresses ADD COLUMN address_line_2 VARCHAR(100);
            RAISE NOTICE 'Added address_line_2 column';
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 8: Link existing patients to auth users
-- ============================================
UPDATE doc_patients p
SET user_id = au.id
FROM auth.users au
WHERE LOWER(p.email) = LOWER(au.email)
AND (p.user_id IS NULL);

-- ============================================
-- STEP 9: Create index on user_id if missing
-- ============================================
DROP INDEX IF EXISTS idx_doc_patients_auth_user;
CREATE INDEX IF NOT EXISTS idx_doc_patients_user_id ON doc_patients(user_id);

-- ============================================
-- STEP 10: Delete orphaned test users from doc_patients
-- (users that exist in doc_patients but have no matching auth user)
-- ============================================
-- Skip this - don't want to lose data. Admin can clean up manually.

-- ============================================
-- VERIFY: Check the final state
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'doc_patients'
ORDER BY ordinal_position;

-- ============================================
-- STEP 11: Fix doc_patient_doctor_selections table
-- ============================================
ALTER TABLE doc_patient_doctor_selections
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

ALTER TABLE doc_patient_doctor_selections
ADD COLUMN IF NOT EXISTS last_consulted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE doc_patient_doctor_selections
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- STEP 12: Allow patients to view doctors
-- ============================================
DROP POLICY IF EXISTS "Anyone can view doctors" ON doc_doctors;
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doc_doctors;

CREATE POLICY "Authenticated users can view doctors" ON doc_doctors
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 13: Fix doc_patient_reports RLS policies
-- The old policies reference auth_user_id instead of user_id
-- ============================================
DROP POLICY IF EXISTS "Patients can view own reports" ON doc_patient_reports;
DROP POLICY IF EXISTS "Patients can insert own reports" ON doc_patient_reports;

-- Patients can view their own reports
CREATE POLICY "Patients can view own reports" ON doc_patient_reports
    FOR SELECT USING (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE user_id = auth.uid()
        )
        OR
        patient_id IN (
            SELECT id FROM doc_patients WHERE user_id = auth.uid()
        )
    );

-- Patients can upload their own reports
CREATE POLICY "Patients can insert own reports" ON doc_patient_reports
    FOR INSERT WITH CHECK (
        uploaded_by = 'patient' AND (
            doc_patient_id IN (
                SELECT id FROM doc_patients WHERE user_id = auth.uid()
            )
            OR
            patient_id IN (
                SELECT id FROM doc_patients WHERE user_id = auth.uid()
            )
        )
    );

-- Also allow patients to delete their own reports
DROP POLICY IF EXISTS "Patients can delete own reports" ON doc_patient_reports;
CREATE POLICY "Patients can delete own reports" ON doc_patient_reports
    FOR DELETE USING (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE user_id = auth.uid()
        )
        OR
        patient_id IN (
            SELECT id FROM doc_patients WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- STEP 14: Ensure doc_patient_reports has patient_id column
-- Code uses patient_id, schema might only have doc_patient_id
-- ============================================
ALTER TABLE doc_patient_reports
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE;

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Patient Registration Fix V2 Applied!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  - Column: auth_user_id -> user_id';
    RAISE NOTICE '  - Added: registration_step, registration_completed';
    RAISE NOTICE '  - Added: first_name, last_name, phone_number';
    RAISE NOTICE '  - Removed: NOT NULL constraints for multi-step';
    RAISE NOTICE '  - Fixed: All RLS policies use user_id';
    RAISE NOTICE '  - Fixed: Address column names';
    RAISE NOTICE '  - Linked: Existing patients to auth users';
    RAISE NOTICE '==========================================';
END $$;
