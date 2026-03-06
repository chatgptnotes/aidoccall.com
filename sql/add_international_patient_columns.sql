-- Add columns for international patient consent flow
-- Run this migration on your Supabase database

-- International patient fields on doc_patients
ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS current_country VARCHAR(100) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS intl_emergency_contact_name VARCHAR(255) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS intl_emergency_contact_phone VARCHAR(50) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS intl_emergency_contact_relation VARCHAR(50) DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS international_consent_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS international_consent_date TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS international_consent_signature VARCHAR(255) DEFAULT NULL;

-- Create table for storing full consent records (legal compliance)
CREATE TABLE IF NOT EXISTS doc_international_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
  
  -- Personal info at time of consent
  full_name VARCHAR(255) NOT NULL,
  passport_number VARCHAR(50) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  current_country VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  
  -- Emergency contact
  emergency_contact_name VARCHAR(255) NOT NULL,
  emergency_contact_phone VARCHAR(50) NOT NULL,
  emergency_contact_relation VARCHAR(50) NOT NULL,
  
  -- Consent flags
  understands_telemedicine BOOLEAN DEFAULT FALSE,
  accepts_limitations BOOLEAN DEFAULT FALSE,
  consents_treatment BOOLEAN DEFAULT FALSE,
  accepts_payment_terms BOOLEAN DEFAULT FALSE,
  accepts_data_processing BOOLEAN DEFAULT FALSE,
  accepts_jurisdiction BOOLEAN DEFAULT FALSE,
  
  -- Signature
  digital_signature VARCHAR(255) NOT NULL,
  signature_date DATE NOT NULL,
  
  -- Audit fields
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for faster lookups
  CONSTRAINT unique_patient_consent UNIQUE (patient_id, signature_date)
);

-- Enable RLS
ALTER TABLE doc_international_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doc_international_consents
CREATE POLICY "Users can view own consent records" ON doc_international_consents
  FOR SELECT USING (
    patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own consent records" ON doc_international_consents
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM doc_patients WHERE user_id = auth.uid())
  );

-- Admins can view all
CREATE POLICY "Admins can view all consent records" ON doc_international_consents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM doc_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Comments
COMMENT ON TABLE doc_international_consents IS 'Stores consent records for international patients for legal compliance';
COMMENT ON COLUMN doc_patients.international_consent_completed IS 'Whether international patient has completed the consent form';
