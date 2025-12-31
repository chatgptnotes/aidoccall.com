-- Add doctor-related columns to users table for medical platform
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_license_number ON public.users USING btree (license_number);
CREATE INDEX IF NOT EXISTS idx_users_specialization ON public.users USING btree (specialization);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users USING btree (status);

-- Add comments for documentation
COMMENT ON COLUMN public.users.license_number IS 'Medical license number for doctors';
COMMENT ON COLUMN public.users.specialization IS 'Medical specialization (Cardiology, Neurology, etc.)';
COMMENT ON COLUMN public.users.hospital_affiliation IS 'Hospital or clinic affiliation';
COMMENT ON COLUMN public.users.years_experience IS 'Years of medical experience';
COMMENT ON COLUMN public.users.qualification IS 'Medical qualifications (MBBS, MD, etc.)';
COMMENT ON COLUMN public.users.address IS 'Professional address';
COMMENT ON COLUMN public.users.status IS 'Doctor approval status (pending, approved, rejected)';

-- Update table comment
COMMENT ON TABLE public.users IS 'User accounts including doctors, admins, and patients';