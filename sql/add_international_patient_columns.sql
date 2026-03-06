-- Simple: Just one column to track if international patient agreed to terms
ALTER TABLE doc_patients 
ADD COLUMN IF NOT EXISTS international_consent_completed BOOLEAN DEFAULT FALSE;
