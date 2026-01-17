-- ============================================
-- FIX: RLS Recursion Error for doc_patients
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Patients can view own profile" ON doc_patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON doc_patients;
DROP POLICY IF EXISTS "Patients can insert own profile" ON doc_patients;
DROP POLICY IF EXISTS "Users can check profile existence" ON doc_patients;
DROP POLICY IF EXISTS "Service role full access to patients" ON doc_patients;

-- Recreate policies without recursion issues

-- SELECT: Users can view their own profile
CREATE POLICY "Patients can view own profile" ON doc_patients
    FOR SELECT USING (auth.uid() = auth_user_id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Patients can update own profile" ON doc_patients
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- INSERT: Any authenticated user can create a profile (with their own auth_user_id)
CREATE POLICY "Patients can insert own profile" ON doc_patients
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth_user_id = auth.uid()
    );

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access to patients" ON doc_patients
    FOR ALL USING (
        (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'RLS policies fixed for doc_patients!';
END $$;
