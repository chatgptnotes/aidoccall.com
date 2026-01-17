-- Patient Portal Tables Migration
-- Created: 2025-01-10
-- Purpose: Create all tables required for the Patient Portal feature

-- ============================================
-- 1. DOC_PATIENTS - Core patient profile
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    profile_photo_url TEXT,
    registration_completed BOOLEAN DEFAULT false,
    registration_step INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doc_patients_auth_user ON doc_patients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_patients_email ON doc_patients(email);

-- ============================================
-- 2. DOC_PATIENT_ADDRESSES - Home/work addresses
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    street_address TEXT NOT NULL,
    apartment_unit VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_primary BOOLEAN DEFAULT false,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_addresses_patient ON doc_patient_addresses(patient_id);

-- ============================================
-- 3. DOC_PATIENT_EMERGENCY_CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_emergency_patient ON doc_patient_emergency_contacts(patient_id);

-- ============================================
-- 4. DOC_PATIENT_MEDICAL_HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL,
    condition_type VARCHAR(50) CHECK (condition_type IN ('current', 'past', 'family_history')),
    diagnosed_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_medical_patient ON doc_patient_medical_history(patient_id);

-- ============================================
-- 5. DOC_PATIENT_ALLERGIES
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    allergy_name VARCHAR(255) NOT NULL,
    allergy_type VARCHAR(50) CHECK (allergy_type IN ('drug', 'food', 'environmental', 'other')),
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
    reaction_description TEXT,
    diagnosed_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_allergies_patient ON doc_patient_allergies(patient_id);

-- ============================================
-- 6. DOC_PATIENT_MEDICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    prescribed_by VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_medications_patient ON doc_patient_medications(patient_id);

-- ============================================
-- 7. DOC_PATIENT_INSURANCE
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    provider_name VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    member_id VARCHAR(100),
    coverage_type VARCHAR(50) CHECK (coverage_type IN ('individual', 'family', 'corporate')),
    valid_from DATE,
    valid_until DATE,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_insurance_patient ON doc_patient_insurance(patient_id);

-- ============================================
-- 8. DOC_PATIENT_DOCTOR_SELECTIONS
-- Links patients to doctors from Doctor Portal's doc_doctors table
-- ============================================
CREATE TABLE IF NOT EXISTS doc_patient_doctor_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES doc_patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doc_doctors(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    last_consulted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_patient_doctors_patient ON doc_patient_doctor_selections(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_patient_doctors_doctor ON doc_patient_doctor_selections(doctor_id);

-- ============================================
-- NOTE: doc_appointments table already exists in Doctor Portal
-- We only add the doc_patient_id column to link to patient portal patients
-- Run the add_doctor_patient_access.sql migration to add this column
-- ============================================

-- ============================================
-- NOTE: For document storage, we use doc_patient_reports from Doctor Portal
-- This allows both patients and doctors to share documents
-- Run the add_doctor_patient_access.sql migration to set up storage
-- ============================================

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all patient portal tables
ALTER TABLE doc_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_patient_doctor_selections ENABLE ROW LEVEL SECURITY;

-- Policies for doc_patients
CREATE POLICY "Patients can view own profile" ON doc_patients
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Patients can update own profile" ON doc_patients
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- INSERT policy: Allow any authenticated user to create their own profile
-- The auth_user_id must match the current user's ID
CREATE POLICY "Patients can insert own profile" ON doc_patients
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth_user_id = auth.uid()
    );

-- Allow authenticated users to check if their profile exists (for registration flow)
CREATE POLICY "Users can check profile existence" ON doc_patients
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for doc_patient_addresses
CREATE POLICY "Patients can manage own addresses" ON doc_patient_addresses
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_emergency_contacts
CREATE POLICY "Patients can manage own emergency contacts" ON doc_patient_emergency_contacts
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_medical_history
CREATE POLICY "Patients can manage own medical history" ON doc_patient_medical_history
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_allergies
CREATE POLICY "Patients can manage own allergies" ON doc_patient_allergies
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_medications
CREATE POLICY "Patients can manage own medications" ON doc_patient_medications
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_insurance
CREATE POLICY "Patients can manage own insurance" ON doc_patient_insurance
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- Policies for doc_patient_doctor_selections
CREATE POLICY "Patients can manage own doctor selections" ON doc_patient_doctor_selections
    FOR ALL USING (patient_id IN (SELECT id FROM doc_patients WHERE auth_user_id = auth.uid()));

-- NOTE: doc_appointments and doc_patient_reports RLS policies are defined
-- in add_doctor_patient_access.sql migration

-- ============================================
-- Service Role Policies (for admin/telecaller access)
-- ============================================

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role full access to patients" ON doc_patients
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all patient portal tables
CREATE TRIGGER update_doc_patients_updated_at BEFORE UPDATE ON doc_patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_addresses_updated_at BEFORE UPDATE ON doc_patient_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_emergency_updated_at BEFORE UPDATE ON doc_patient_emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_medical_updated_at BEFORE UPDATE ON doc_patient_medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_allergies_updated_at BEFORE UPDATE ON doc_patient_allergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_medications_updated_at BEFORE UPDATE ON doc_patient_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_insurance_updated_at BEFORE UPDATE ON doc_patient_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_patient_doctors_updated_at BEFORE UPDATE ON doc_patient_doctor_selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Patient Portal tables created successfully!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - doc_patients (patient profiles)';
    RAISE NOTICE '  - doc_patient_addresses';
    RAISE NOTICE '  - doc_patient_emergency_contacts';
    RAISE NOTICE '  - doc_patient_medical_history';
    RAISE NOTICE '  - doc_patient_allergies';
    RAISE NOTICE '  - doc_patient_medications';
    RAISE NOTICE '  - doc_patient_insurance';
    RAISE NOTICE '  - doc_patient_doctor_selections';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTE: This migration references doc_doctors from Doctor Portal.';
    RAISE NOTICE 'NOTE: Run add_doctor_patient_access.sql for appointment & document integration.';
    RAISE NOTICE '==========================================';
END $$;
