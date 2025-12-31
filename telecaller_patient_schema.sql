-- Database Schema for Telecaller & Patient Application
-- This updates the existing users table and adds new tables for telecaller/patient functionality

-- Update users table to support telecaller and patient roles
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(15),
  ADD COLUMN IF NOT EXISTS medical_history TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT,
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shift_timing VARCHAR(100),
  ADD COLUMN IF NOT EXISTS specialization_focus VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.users(id);

-- Create telecaller-specific performance tracking table
CREATE TABLE IF NOT EXISTS public.telecaller_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id),
  date DATE NOT NULL,
  consultations_handled INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0, -- in seconds
  patient_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
  calls_completed INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create doctors table for reference (separate from doctor app)
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  specialization VARCHAR(100),
  license_number VARCHAR(100),
  hospital_affiliation VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0.00,
  consultation_fee DECIMAL(8,2) DEFAULT 0.00,
  is_verified_green_flag BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, busy, offline
  availability_schedule JSONB, -- Store weekly schedule
  current_patient_load INTEGER DEFAULT 0,
  max_patient_load INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create consultations table for booking and assignment management
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id VARCHAR(50) UNIQUE NOT NULL, -- EMG-timestamp format
  patient_id UUID NOT NULL REFERENCES public.users(id),
  doctor_id UUID REFERENCES public.doctors(id),
  telecaller_id UUID REFERENCES public.users(id),
  appointment_time TIMESTAMP,
  scheduled_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled
  priority_level VARCHAR(20) DEFAULT 'routine', -- emergency, routine, follow_up
  consultation_type VARCHAR(50) DEFAULT 'video_call', -- video_call, phone_call, chat
  video_room_id VARCHAR(255),
  video_room_url VARCHAR(500),
  patient_symptoms TEXT,
  doctor_notes TEXT,
  prescription_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  total_amount DECIMAL(8,2) DEFAULT 0.00,
  commission_amount DECIMAL(8,2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  is_external_doctor BOOLEAN DEFAULT false, -- true for non-green flag doctors
  external_doctor_name VARCHAR(255),
  external_doctor_contact VARCHAR(255),
  patient_feedback TEXT,
  patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create medical documents table
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.users(id),
  consultation_id UUID REFERENCES public.consultations(id),
  document_type VARCHAR(100), -- prescription, lab_report, x_ray, mri, etc.
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(50),
  is_shared_with_doctor BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_date TIMESTAMP DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.consultations(id),
  patient_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(8,2) NOT NULL,
  commission_amount DECIMAL(8,2) DEFAULT 0.00,
  payment_method VARCHAR(50), -- upi, card, wallet, cash
  transaction_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_date TIMESTAMP DEFAULT NOW(),
  refund_amount DECIMAL(8,2) DEFAULT 0.00,
  refund_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create call logs table for telecaller quality control
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id),
  consultation_id UUID REFERENCES public.consultations(id),
  call_type VARCHAR(50), -- patient_call, doctor_call, external_doctor_call
  call_start_time TIMESTAMP NOT NULL,
  call_end_time TIMESTAMP,
  call_duration INTEGER, -- in seconds
  recording_file_path VARCHAR(500),
  call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create doctor availability table for real-time status tracking
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  date DATE NOT NULL,
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  consultation_id UUID REFERENCES public.consultations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, date, time_slot_start)
);

-- Create notification system table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  type VARCHAR(50) NOT NULL, -- consultation_assigned, payment_received, appointment_reminder
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_priority ON public.consultations(priority_level);
CREATE INDEX IF NOT EXISTS idx_consultations_telecaller ON public.consultations(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations(appointment_time);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON public.doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON public.doctors(is_verified_green_flag);
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_telecaller ON public.call_logs(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_date ON public.doctor_availability(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Telecallers can view patient data" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'telecaller'
    )
  );

-- Create RLS policies for consultations
CREATE POLICY "Patients can view their consultations" ON public.consultations
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Telecallers can view all consultations" ON public.consultations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'telecaller'
    )
  );

-- Create RLS policies for medical documents
CREATE POLICY "Patients can manage their documents" ON public.medical_documents
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Telecallers can view patient documents" ON public.medical_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'telecaller'
    )
  );

-- Create RLS policies for payments
CREATE POLICY "Patients can view their payments" ON public.payments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Telecallers can view all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'telecaller'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.telecaller_performance IS 'Performance metrics for telecaller productivity tracking';
COMMENT ON TABLE public.doctors IS 'Doctor profiles for consultation assignment (managed by external doctor app)';
COMMENT ON TABLE public.consultations IS 'All consultation requests and assignments managed by telecallers';
COMMENT ON TABLE public.medical_documents IS 'Patient medical documents and reports storage';
COMMENT ON TABLE public.payments IS 'Payment transactions and commission tracking';
COMMENT ON TABLE public.call_logs IS 'Call recording and quality control for telecallers';
COMMENT ON TABLE public.doctor_availability IS 'Real-time doctor availability tracking';
COMMENT ON TABLE public.notifications IS 'System notifications for all users';

COMMENT ON COLUMN public.users.role IS 'User role: patient, telecaller, admin';
COMMENT ON COLUMN public.consultations.priority_level IS 'Consultation priority: emergency, routine, follow_up';
COMMENT ON COLUMN public.consultations.is_external_doctor IS 'Whether doctor is outside platform (non-green flag)';
COMMENT ON COLUMN public.doctors.is_verified_green_flag IS 'Whether doctor is verified platform member';
COMMENT ON COLUMN public.doctors.availability_schedule IS 'JSON object containing weekly availability schedule';