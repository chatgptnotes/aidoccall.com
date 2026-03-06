-- Add separate fee columns for international patients (in USD)
-- Doctors can set different fees for Indian (INR) and International (USD) patients

ALTER TABLE doc_doctors 
ADD COLUMN IF NOT EXISTS international_consultation_fee DECIMAL(10,2) DEFAULT NULL;

ALTER TABLE doc_doctors 
ADD COLUMN IF NOT EXISTS international_online_fee DECIMAL(10,2) DEFAULT NULL;

-- Comments
COMMENT ON COLUMN doc_doctors.consultation_fee IS 'Consultation fee for Indian patients (in INR)';
COMMENT ON COLUMN doc_doctors.online_fee IS 'Online consultation fee for Indian patients (in INR)';
COMMENT ON COLUMN doc_doctors.international_consultation_fee IS 'Consultation fee for International patients (in USD)';
COMMENT ON COLUMN doc_doctors.international_online_fee IS 'Online consultation fee for International patients (in USD)';
