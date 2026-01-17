-- ============================================
-- FIX: Patient Registration RLS Policy
-- Run this in Supabase SQL Editor
-- Created: 2025-01-10
-- Issue: "new row violates row-level security policy for table 'doc_patients'"
-- ============================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Patients can insert own profile" ON doc_patients;

-- Create a more permissive INSERT policy
-- This allows authenticated users to create their profile immediately after signup
-- The auth_user_id must still match the current user's ID
CREATE POLICY "Patients can insert own profile" ON doc_patients
    FOR INSERT WITH CHECK (
        -- User must be authenticated (auth.uid() returns the current user's ID)
        auth.uid() IS NOT NULL
        -- The auth_user_id being inserted must match the authenticated user
        AND auth_user_id = auth.uid()
    );

-- Alternative: Create a security definer function for profile creation
-- This bypasses RLS and can be called immediately after signup
CREATE OR REPLACE FUNCTION create_patient_profile_secure(
    p_auth_user_id UUID,
    p_email VARCHAR(255),
    p_full_name VARCHAR(255),
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_patient_id UUID;
BEGIN
    -- Verify the caller is the same user (security check)
    IF auth.uid() IS NULL OR auth.uid() != p_auth_user_id THEN
        RAISE EXCEPTION 'Unauthorized: user ID mismatch';
    END IF;

    -- Check if profile already exists
    SELECT id INTO v_patient_id FROM doc_patients WHERE auth_user_id = p_auth_user_id;

    IF v_patient_id IS NOT NULL THEN
        RETURN v_patient_id;
    END IF;

    -- Create the profile
    INSERT INTO doc_patients (
        auth_user_id,
        email,
        full_name,
        phone,
        registration_step,
        registration_completed
    ) VALUES (
        p_auth_user_id,
        p_email,
        p_full_name,
        p_phone,
        1,
        false
    )
    RETURNING id INTO v_patient_id;

    RETURN v_patient_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_patient_profile_secure TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Patient Registration RLS Fix Applied!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  - INSERT policy for doc_patients';
    RAISE NOTICE '  - Created secure function for profile creation';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now register as patients successfully.';
    RAISE NOTICE '==========================================';
END $$;
