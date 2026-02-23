-- ============================================
-- Fix Document Visibility for Doctors
-- Date: 2026-02-23
-- ============================================
-- Problem: Patient uploads set patient_id but NOT doc_patient_id.
--          Doctor portal queries by doc_patient_id, so it finds nothing.
-- Fix: Backfill doc_patient_id from patient_id for existing records,
--      and update RLS policies to check both columns.
-- ============================================

-- STEP 1: Backfill doc_patient_id from patient_id where missing
UPDATE doc_patient_reports
SET doc_patient_id = patient_id
WHERE doc_patient_id IS NULL AND patient_id IS NOT NULL;

-- STEP 2: Backfill patient_id from doc_patient_id where missing
UPDATE doc_patient_reports
SET patient_id = doc_patient_id
WHERE patient_id IS NULL AND doc_patient_id IS NOT NULL;

-- STEP 3: Update doctor SELECT RLS policy to check both columns
DROP POLICY IF EXISTS "Doctors can view patient reports" ON doc_patient_reports;
CREATE POLICY "Doctors can view patient reports" ON doc_patient_reports
    FOR SELECT USING (
        -- Doctor is directly assigned on the report
        doctor_id IN (
            SELECT id FROM doc_doctors WHERE user_id = auth.uid()
        )
        OR
        -- Patient linked via doc_patient_id
        doc_patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
        OR
        -- Patient linked via patient_id
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- STEP 4: Update doctor INSERT RLS policy to check both columns
DROP POLICY IF EXISTS "Doctors can insert patient reports" ON doc_patient_reports;
CREATE POLICY "Doctors can insert patient reports" ON doc_patient_reports
    FOR INSERT WITH CHECK (
        uploaded_by = 'doctor' AND (
            doc_patient_id IN (
                SELECT patient_id FROM doc_patient_doctor_selections
                WHERE doctor_id IN (
                    SELECT id FROM doc_doctors WHERE user_id = auth.uid()
                )
            )
            OR
            patient_id IN (
                SELECT patient_id FROM doc_patient_doctor_selections
                WHERE doctor_id IN (
                    SELECT id FROM doc_doctors WHERE user_id = auth.uid()
                )
            )
        )
    );

-- STEP 5: Create a trigger to keep both columns in sync going forward
CREATE OR REPLACE FUNCTION sync_patient_id_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If doc_patient_id is set but patient_id is not, copy it
    IF NEW.doc_patient_id IS NOT NULL AND NEW.patient_id IS NULL THEN
        NEW.patient_id := NEW.doc_patient_id;
    END IF;
    -- If patient_id is set but doc_patient_id is not, copy it
    IF NEW.patient_id IS NOT NULL AND NEW.doc_patient_id IS NULL THEN
        NEW.doc_patient_id := NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_patient_id_columns ON doc_patient_reports;
CREATE TRIGGER trg_sync_patient_id_columns
    BEFORE INSERT OR UPDATE ON doc_patient_reports
    FOR EACH ROW
    EXECUTE FUNCTION sync_patient_id_columns();

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Document Visibility Fix Applied!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  - Backfilled doc_patient_id from patient_id';
    RAISE NOTICE '  - Backfilled patient_id from doc_patient_id';
    RAISE NOTICE '  - Updated RLS policies to check both columns';
    RAISE NOTICE '  - Added trigger to keep columns in sync';
    RAISE NOTICE '==========================================';
END $$;
