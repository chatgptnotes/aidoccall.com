-- ============================================
-- Doctor-Patient Access Policies Migration
-- Purpose: Enable doctors to access their patients' data
-- Aligns with Doctor Portal's doc_doctors table
-- Created: 2025-01-10
-- ============================================

-- ============================================
-- SECTION 1: UPDATE FOREIGN KEY REFERENCES
-- Change from 'doctors' to 'doc_doctors' table
-- ============================================

-- Update doc_patient_doctor_selections to reference doc_doctors
ALTER TABLE doc_patient_doctor_selections
DROP CONSTRAINT IF EXISTS doc_patient_doctor_selections_doctor_id_fkey;

ALTER TABLE doc_patient_doctor_selections
ADD CONSTRAINT doc_patient_doctor_selections_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doc_doctors(id) ON DELETE CASCADE;

-- Update doc_appointments to reference doc_doctors (if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doc_appointments' AND column_name = 'doc_patient_id'
    ) THEN
        ALTER TABLE doc_appointments
        ADD COLUMN doc_patient_id UUID REFERENCES doc_patients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doc_appointments_doc_patient ON doc_appointments(doc_patient_id);

-- ============================================
-- SECTION 2: LINK DOC_PATIENT_REPORTS TO PATIENTS
-- Add patient relationship for document sharing
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doc_patient_reports' AND column_name = 'doc_patient_id'
    ) THEN
        ALTER TABLE doc_patient_reports
        ADD COLUMN doc_patient_id UUID REFERENCES doc_patients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doc_patient_reports_patient ON doc_patient_reports(doc_patient_id);

-- ============================================
-- SECTION 3: RLS POLICIES FOR DOCTOR ACCESS
-- Doctors can view data of patients who selected them
-- Note: doc_doctors uses 'user_id' column for auth link
-- ============================================

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Doctors can view patients who selected them" ON doc_patients;
DROP POLICY IF EXISTS "Doctors can view patient addresses" ON doc_patient_addresses;
DROP POLICY IF EXISTS "Doctors can view patient emergency contacts" ON doc_patient_emergency_contacts;
DROP POLICY IF EXISTS "Doctors can view patient medical history" ON doc_patient_medical_history;
DROP POLICY IF EXISTS "Doctors can view patient allergies" ON doc_patient_allergies;
DROP POLICY IF EXISTS "Doctors can view patient medications" ON doc_patient_medications;
DROP POLICY IF EXISTS "Doctors can view patient insurance" ON doc_patient_insurance;
DROP POLICY IF EXISTS "Doctors can view their patient selections" ON doc_patient_doctor_selections;

-- Doctors can view patients who selected them
CREATE POLICY "Doctors can view patients who selected them" ON doc_patients
    FOR SELECT USING (
        id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view addresses of their patients
CREATE POLICY "Doctors can view patient addresses" ON doc_patient_addresses
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view emergency contacts of their patients
CREATE POLICY "Doctors can view patient emergency contacts" ON doc_patient_emergency_contacts
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view medical history of their patients
CREATE POLICY "Doctors can view patient medical history" ON doc_patient_medical_history
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view allergies of their patients
CREATE POLICY "Doctors can view patient allergies" ON doc_patient_allergies
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view medications of their patients
CREATE POLICY "Doctors can view patient medications" ON doc_patient_medications
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view insurance of their patients
CREATE POLICY "Doctors can view patient insurance" ON doc_patient_insurance
    FOR SELECT USING (
        patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can view their patient selections
CREATE POLICY "Doctors can view their patient selections" ON doc_patient_doctor_selections
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM doc_doctors WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- SECTION 4: RLS POLICIES FOR DOCUMENT ACCESS
-- Doctors can view reports of their patients
-- ============================================

DROP POLICY IF EXISTS "Doctors can view patient reports" ON doc_patient_reports;
DROP POLICY IF EXISTS "Doctors can insert patient reports" ON doc_patient_reports;
DROP POLICY IF EXISTS "Patients can view own reports" ON doc_patient_reports;
DROP POLICY IF EXISTS "Patients can insert own reports" ON doc_patient_reports;

-- Doctors can view reports of their patients
CREATE POLICY "Doctors can view patient reports" ON doc_patient_reports
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM doc_doctors WHERE user_id = auth.uid()
        )
        OR
        doc_patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can upload reports for their patients
CREATE POLICY "Doctors can insert patient reports" ON doc_patient_reports
    FOR INSERT WITH CHECK (
        uploaded_by = 'doctor' AND
        doc_patient_id IN (
            SELECT patient_id FROM doc_patient_doctor_selections
            WHERE doctor_id IN (
                SELECT id FROM doc_doctors WHERE user_id = auth.uid()
            )
        )
    );

-- Patients can view their own reports
CREATE POLICY "Patients can view own reports" ON doc_patient_reports
    FOR SELECT USING (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()
        )
    );

-- Patients can upload their own reports
CREATE POLICY "Patients can insert own reports" ON doc_patient_reports
    FOR INSERT WITH CHECK (
        uploaded_by = 'patient' AND
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================
-- SECTION 5: RLS POLICIES FOR APPOINTMENTS
-- Both doctors and patients can access appointments
-- ============================================

DROP POLICY IF EXISTS "Patients can view own appointments via doc_patient_id" ON doc_appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON doc_appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON doc_appointments;

-- Patients can view their appointments (via doc_patient_id)
CREATE POLICY "Patients can view own appointments via doc_patient_id" ON doc_appointments
    FOR SELECT USING (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()
        )
    );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON doc_appointments
    FOR INSERT WITH CHECK (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()
        )
    );

-- Patients can update their own appointments (cancel)
CREATE POLICY "Patients can update own appointments" ON doc_appointments
    FOR UPDATE USING (
        doc_patient_id IN (
            SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================
-- SECTION 6: CREATE STORAGE BUCKET
-- For patient document uploads
-- ============================================

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'patient-documents',
    'patient-documents',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient-documents bucket
DROP POLICY IF EXISTS "Patients can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view patient documents" ON storage.objects;

CREATE POLICY "Patients can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'patient-documents' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Patients can view own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'patient-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Doctors can view patient documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'patient-documents' AND
        auth.uid() IN (
            SELECT user_id FROM doc_doctors
        )
    );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Doctor-Patient Access Migration Complete!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Doctors can now:';
    RAISE NOTICE '  - View patients who selected them';
    RAISE NOTICE '  - View full medical profile';
    RAISE NOTICE '  - View/upload patient reports';
    RAISE NOTICE '  - View appointments with their patients';
    RAISE NOTICE '';
    RAISE NOTICE 'Patients can now:';
    RAISE NOTICE '  - View their own appointments';
    RAISE NOTICE '  - Upload documents to patient-documents bucket';
    RAISE NOTICE '  - View their own reports';
    RAISE NOTICE '==========================================';
END $$;
