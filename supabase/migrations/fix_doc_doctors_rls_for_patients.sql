-- ============================================
-- Fix: Allow Patients to View Doctors
-- Purpose: Add RLS policy so patients can search for doctors
-- Created: 2026-01-17
-- ============================================

-- Drop if exists (for idempotent migration)
DROP POLICY IF EXISTS "Anyone can view doctors" ON doc_doctors;
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doc_doctors;

-- Allow all authenticated users to view doctors (for search/booking)
CREATE POLICY "Authenticated users can view doctors" ON doc_doctors
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Doctor visibility policy added!';
    RAISE NOTICE 'Patients can now search and view doctors.';
    RAISE NOTICE '==========================================';
END $$;
