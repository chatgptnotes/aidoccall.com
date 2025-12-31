-- Complete Medical Platform Database Schema for AidocCall
-- This SQL file creates all necessary tables and configurations for the medical coordination platform

-- First, ensure we're working with the public schema
SET search_path TO public;

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
DROP TABLE IF EXISTS public.call_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.medical_documents CASCADE;
DROP TABLE IF EXISTS public.consultations CASCADE;
DROP TABLE IF EXISTS public.telecaller_performance CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;

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
CREATE TABLE public.telecaller_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  consultations_handled INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0, -- in seconds
  patient_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
  calls_completed INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telecaller_id, date)
);

-- Create doctors table for reference (separate from doctor app)
CREATE TABLE public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  specialization VARCHAR(100),
  license_number VARCHAR(100),
  hospital_affiliation VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  consultation_fee DECIMAL(8,2) DEFAULT 0.00,
  is_verified_green_flag BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy', 'offline')),
  availability_schedule JSONB, -- Store weekly schedule
  current_patient_load INTEGER DEFAULT 0,
  max_patient_load INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultations table for booking and assignment management
CREATE TABLE public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id VARCHAR(50) UNIQUE NOT NULL, -- EMG-timestamp format
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id),
  telecaller_id UUID REFERENCES public.users(id),
  appointment_time TIMESTAMP WITH TIME ZONE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority_level VARCHAR(20) DEFAULT 'routine' CHECK (priority_level IN ('emergency', 'routine', 'follow_up')),
  consultation_type VARCHAR(50) DEFAULT 'video_call' CHECK (consultation_type IN ('video_call', 'phone_call', 'chat')),
  video_room_id VARCHAR(255),
  video_room_url VARCHAR(500),
  patient_symptoms TEXT,
  doctor_notes TEXT,
  prescription_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  total_amount DECIMAL(8,2) DEFAULT 0.00,
  commission_amount DECIMAL(8,2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  is_external_doctor BOOLEAN DEFAULT false,
  external_doctor_name VARCHAR(255),
  external_doctor_contact VARCHAR(255),
  patient_feedback TEXT,
  patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical documents table
CREATE TABLE public.medical_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id),
  document_type VARCHAR(100), -- prescription, lab_report, x_ray, mri, etc.
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(50),
  is_shared_with_doctor BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  commission_amount DECIMAL(8,2) DEFAULT 0.00,
  payment_method VARCHAR(50), -- upi, card, wallet, cash
  transaction_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refund_amount DECIMAL(8,2) DEFAULT 0.00,
  refund_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call logs table for telecaller quality control
CREATE TABLE public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id),
  call_type VARCHAR(50) CHECK (call_type IN ('patient_call', 'doctor_call', 'external_doctor_call')),
  call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  call_end_time TIMESTAMP WITH TIME ZONE,
  call_duration INTEGER, -- in seconds
  recording_file_path VARCHAR(500),
  call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctor availability table for real-time status tracking
CREATE TABLE public.doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  consultation_id UUID REFERENCES public.consultations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, date, time_slot_start)
);

-- Create notification system table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- consultation_assigned, payment_received, appointment_reminder
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_consultations_status ON public.consultations(status);
CREATE INDEX idx_consultations_priority ON public.consultations(priority_level);
CREATE INDEX idx_consultations_telecaller ON public.consultations(telecaller_id);
CREATE INDEX idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX idx_consultations_date ON public.consultations(appointment_time);
CREATE INDEX idx_consultations_created_at ON public.consultations(created_at);
CREATE INDEX idx_doctors_specialization ON public.doctors(specialization);
CREATE INDEX idx_doctors_status ON public.doctors(status);
CREATE INDEX idx_doctors_verified ON public.doctors(is_verified_green_flag);
CREATE INDEX idx_medical_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_call_logs_telecaller ON public.call_logs(telecaller_id);
CREATE INDEX idx_doctor_availability_date ON public.doctor_availability(date);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_telecaller_performance_date ON public.telecaller_performance(date);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Patients can create consultations" ON public.consultations
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Telecallers can view all consultations" ON public.consultations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('telecaller', 'admin')
    )
  );

-- Create RLS policies for medical documents
CREATE POLICY "Patients can manage their documents" ON public.medical_documents
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Telecallers can view patient documents" ON public.medical_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('telecaller', 'admin')
    )
  );

-- Create RLS policies for payments
CREATE POLICY "Patients can view their payments" ON public.payments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Telecallers can view all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('telecaller', 'admin')
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Insert some sample data for testing

-- Sample doctors
INSERT INTO public.doctors (full_name, email, phone, specialization, license_number, hospital_affiliation, consultation_fee, is_verified_green_flag, status, max_patient_load) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@hospital.com', '+91-9876543210', 'Cardiology', 'MH-12345', 'Apollo Hospital', 500.00, true, 'active', 15),
('Dr. Priya Sharma', 'priya.sharma@clinic.com', '+91-9876543211', 'Dermatology', 'MH-12346', 'Fortis Hospital', 400.00, true, 'active', 12),
('Dr. Amit Patel', 'amit.patel@medical.com', '+91-9876543212', 'Pediatrics', 'MH-12347', 'Max Hospital', 350.00, true, 'active', 20),
('Dr. Sunita Gupta', 'sunita.gupta@healthcare.com', '+91-9876543213', 'Gynecology', 'MH-12348', 'AIIMS', 600.00, true, 'active', 10),
('Dr. Vikram Singh', 'vikram.singh@hospital.com', '+91-9876543214', 'Orthopedics', 'MH-12349', 'Manipal Hospital', 550.00, true, 'active', 8),
('Dr. Neha Verma', 'neha.verma@external.com', '+91-9876543215', 'General Medicine', 'EXT-001', 'Independent Practice', 300.00, false, 'active', 25);

-- Update functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_telecaller_performance_updated_at BEFORE UPDATE ON public.telecaller_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_availability_updated_at BEFORE UPDATE ON public.doctor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate consultation ID
CREATE OR REPLACE FUNCTION generate_consultation_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.consultation_id = 'CON-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_consultation_id BEFORE INSERT ON public.consultations FOR EACH ROW EXECUTE FUNCTION generate_consultation_id();

-- Add table comments for documentation
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

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Final verification query
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'telecaller_performance', 'doctors', 'consultations', 
    'medical_documents', 'payments', 'call_logs', 'doctor_availability', 'notifications'
)
ORDER BY tablename;

-- Show table counts after setup
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM public.users WHERE role IN ('telecaller', 'patient')
UNION ALL
SELECT 'doctors', COUNT(*) FROM public.doctors
UNION ALL  
SELECT 'consultations', COUNT(*) FROM public.consultations
UNION ALL
SELECT 'telecaller_performance', COUNT(*) FROM public.telecaller_performance;

COMMIT;