-- ================================================
-- CREATE STORAGE BUCKET FOR DOCTOR PRESCRIPTIONS
-- ================================================
-- Run this SQL in Supabase SQL Editor
-- This bucket stores prescriptions/documents uploaded by doctors for patients
-- ================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-prescriptions', 'doctor-prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STORAGE POLICIES FOR 'doctor-prescriptions' BUCKET
-- ================================================

-- Drop existing policies if any (for this bucket)
DROP POLICY IF EXISTS "doctor_prescriptions_public_read" ON storage.objects;
DROP POLICY IF EXISTS "doctor_prescriptions_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "doctor_prescriptions_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "doctor_prescriptions_auth_delete" ON storage.objects;

-- Policy 1: Allow public read access to all files (patients can view prescriptions)
CREATE POLICY "doctor_prescriptions_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-prescriptions');

-- Policy 2: Allow authenticated users (doctors) to upload files
CREATE POLICY "doctor_prescriptions_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-prescriptions');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "doctor_prescriptions_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-prescriptions');

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "doctor_prescriptions_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-prescriptions');

-- ================================================
-- SUCCESS!
-- ================================================
-- Bucket 'doctor-prescriptions' has been created with public read access
-- Doctors can upload prescriptions for patients
-- Patients can view/download prescriptions
-- ================================================
