-- Telecaller-Only Platform Database Schema for AidocCall
-- This SQL file creates only telecaller-related tables and configurations

-- First, ensure we're working with the public schema
SET search_path TO public;

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.call_logs CASCADE;
DROP TABLE IF EXISTS public.telecaller_performance CASCADE;

-- Update users table to support telecaller roles only
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shift_timing VARCHAR(100),
  ADD COLUMN IF NOT EXISTS specialization_focus VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Customer Support',
  ADD COLUMN IF NOT EXISTS salary_range VARCHAR(50),
  ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2) DEFAULT 0.00;

-- Create telecaller-specific performance tracking table
CREATE TABLE public.telecaller_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calls_handled INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  average_call_duration INTEGER DEFAULT 0, -- in seconds
  average_response_time INTEGER DEFAULT 0, -- in seconds
  customer_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
  total_talk_time INTEGER DEFAULT 0, -- in seconds
  break_time INTEGER DEFAULT 0, -- in seconds
  login_time TIME,
  logout_time TIME,
  total_working_hours DECIMAL(4,2) DEFAULT 0.00,
  issues_resolved INTEGER DEFAULT 0,
  escalations_made INTEGER DEFAULT 0,
  notes TEXT,
  supervisor_rating INTEGER CHECK (supervisor_rating >= 1 AND supervisor_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telecaller_id, date)
);

-- Create call logs table for telecaller quality control
CREATE TABLE public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_reference_id VARCHAR(100),
  caller_name VARCHAR(255),
  caller_phone VARCHAR(15),
  caller_email VARCHAR(255),
  call_type VARCHAR(50) CHECK (call_type IN ('inbound', 'outbound', 'follow_up')),
  call_category VARCHAR(50) CHECK (call_category IN ('inquiry', 'complaint', 'booking', 'support', 'emergency')),
  call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  call_end_time TIMESTAMP WITH TIME ZONE,
  call_duration INTEGER, -- in seconds
  call_status VARCHAR(30) CHECK (call_status IN ('completed', 'dropped', 'busy', 'no_answer', 'escalated')),
  recording_file_path VARCHAR(500),
  call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
  issue_resolved BOOLEAN DEFAULT false,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  call_notes TEXT,
  escalation_reason TEXT,
  escalated_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telecaller schedules table
CREATE TABLE public.telecaller_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telecaller_id, week_start_date)
);

-- Create telecaller targets table
CREATE TABLE public.telecaller_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_month DATE NOT NULL, -- First day of month
  target_calls_per_day INTEGER DEFAULT 50,
  target_resolution_rate DECIMAL(5,2) DEFAULT 85.00, -- percentage
  target_customer_satisfaction DECIMAL(3,2) DEFAULT 4.00,
  target_call_duration INTEGER DEFAULT 300, -- seconds (5 minutes average)
  actual_calls_handled INTEGER DEFAULT 0,
  actual_resolution_rate DECIMAL(5,2) DEFAULT 0.00,
  actual_customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
  actual_avg_call_duration INTEGER DEFAULT 0,
  target_achieved BOOLEAN DEFAULT false,
  bonus_earned DECIMAL(8,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telecaller_id, target_month)
);

-- Create notification system table for telecallers
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('shift_reminder', 'performance_alert', 'target_update', 'system_announcement', 'training_reminder')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_url VARCHAR(500),
  metadata JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telecaller training records table
CREATE TABLE public.telecaller_training (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telecaller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  training_type VARCHAR(100) NOT NULL,
  training_name VARCHAR(255) NOT NULL,
  training_date DATE NOT NULL,
  trainer_name VARCHAR(255),
  duration_hours DECIMAL(4,2) DEFAULT 0.00,
  completion_status VARCHAR(30) CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'failed')),
  score DECIMAL(5,2), -- percentage
  certificate_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_telecaller_performance_date ON public.telecaller_performance(date);
CREATE INDEX idx_telecaller_performance_telecaller ON public.telecaller_performance(telecaller_id);
CREATE INDEX idx_call_logs_telecaller ON public.call_logs(telecaller_id);
CREATE INDEX idx_call_logs_date ON public.call_logs(call_start_time);
CREATE INDEX idx_call_logs_type ON public.call_logs(call_type);
CREATE INDEX idx_call_logs_status ON public.call_logs(call_status);
CREATE INDEX idx_telecaller_schedules_telecaller ON public.telecaller_schedules(telecaller_id);
CREATE INDEX idx_telecaller_targets_telecaller ON public.telecaller_targets(telecaller_id);
CREATE INDEX idx_telecaller_targets_month ON public.telecaller_targets(target_month);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_telecaller_training_telecaller ON public.telecaller_training(telecaller_id);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecaller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecaller_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecaller_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecaller_training ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Supervisors can view telecaller data" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    ) OR auth.uid() = id
  );

-- Create RLS policies for telecaller performance
CREATE POLICY "Telecallers can view their own performance" ON public.telecaller_performance
  FOR SELECT USING (telecaller_id = auth.uid());

CREATE POLICY "Supervisors can view all performance data" ON public.telecaller_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    ) OR telecaller_id = auth.uid()
  );

-- Create RLS policies for call logs
CREATE POLICY "Telecallers can view their own call logs" ON public.call_logs
  FOR SELECT USING (telecaller_id = auth.uid());

CREATE POLICY "Telecallers can insert their own call logs" ON public.call_logs
  FOR INSERT WITH CHECK (telecaller_id = auth.uid());

CREATE POLICY "Supervisors can view all call logs" ON public.call_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    ) OR telecaller_id = auth.uid()
  );

-- Create RLS policies for schedules
CREATE POLICY "Telecallers can view their schedules" ON public.telecaller_schedules
  FOR SELECT USING (telecaller_id = auth.uid());

CREATE POLICY "Supervisors can manage all schedules" ON public.telecaller_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    )
  );

-- Create RLS policies for targets
CREATE POLICY "Telecallers can view their targets" ON public.telecaller_targets
  FOR SELECT USING (telecaller_id = auth.uid());

CREATE POLICY "Supervisors can manage all targets" ON public.telecaller_targets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for training
CREATE POLICY "Telecallers can view their training records" ON public.telecaller_training
  FOR SELECT USING (telecaller_id = auth.uid());

CREATE POLICY "Supervisors can manage all training records" ON public.telecaller_training
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    )
  );

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
CREATE TRIGGER update_telecaller_schedules_updated_at BEFORE UPDATE ON public.telecaller_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telecaller_targets_updated_at BEFORE UPDATE ON public.telecaller_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telecaller_training_updated_at BEFORE UPDATE ON public.telecaller_training FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate call reference ID
CREATE OR REPLACE FUNCTION generate_call_reference_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.call_reference_id = 'CALL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 13, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_call_reference_id BEFORE INSERT ON public.call_logs FOR EACH ROW EXECUTE FUNCTION generate_call_reference_id();

-- Insert sample telecaller data for testing
INSERT INTO public.users (email, full_name, role, employee_id, shift_timing, specialization_focus, department, hire_date) VALUES
('tc001@aidoccall.com', 'Rahul Sharma', 'telecaller', 'TC001', 'Morning (9 AM - 5 PM)', 'Customer Support', 'Call Center', CURRENT_DATE - INTERVAL '6 months'),
('tc002@aidoccall.com', 'Priya Singh', 'telecaller', 'TC002', 'Evening (5 PM - 1 AM)', 'Technical Support', 'Call Center', CURRENT_DATE - INTERVAL '4 months'),
('tc003@aidoccall.com', 'Amit Kumar', 'telecaller', 'TC003', 'Night (1 AM - 9 AM)', 'Emergency Support', 'Call Center', CURRENT_DATE - INTERVAL '2 months'),
('supervisor001@aidoccall.com', 'Sunita Gupta', 'supervisor', 'SUP001', 'Day Shift (10 AM - 6 PM)', 'Team Management', 'Management', CURRENT_DATE - INTERVAL '2 years'),
('admin001@aidoccall.com', 'Vikram Patel', 'admin', 'ADM001', 'Regular (9 AM - 6 PM)', 'Platform Administration', 'IT', CURRENT_DATE - INTERVAL '3 years')
ON CONFLICT (email) DO NOTHING;

-- Insert sample performance data
INSERT INTO public.telecaller_performance (telecaller_id, date, calls_handled, calls_completed, customer_satisfaction_score, total_working_hours)
SELECT 
    u.id,
    CURRENT_DATE - INTERVAL '1 day',
    FLOOR(RANDOM() * 50 + 30)::INTEGER,
    FLOOR(RANDOM() * 45 + 25)::INTEGER,
    ROUND((RANDOM() * 1.5 + 3.5)::NUMERIC, 2),
    ROUND((RANDOM() * 2 + 7)::NUMERIC, 2)
FROM public.users u 
WHERE u.role = 'telecaller'
ON CONFLICT (telecaller_id, date) DO NOTHING;

-- Insert sample targets for current month
INSERT INTO public.telecaller_targets (telecaller_id, target_month, target_calls_per_day, target_resolution_rate, target_customer_satisfaction)
SELECT 
    u.id,
    DATE_TRUNC('month', CURRENT_DATE),
    50,
    85.00,
    4.00
FROM public.users u 
WHERE u.role = 'telecaller'
ON CONFLICT (telecaller_id, target_month) DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE public.telecaller_performance IS 'Daily performance metrics for telecaller productivity tracking';
COMMENT ON TABLE public.call_logs IS 'Individual call records for quality control and analytics';
COMMENT ON TABLE public.telecaller_schedules IS 'Weekly work schedules for telecallers';
COMMENT ON TABLE public.telecaller_targets IS 'Monthly performance targets and achievements';
COMMENT ON TABLE public.notifications IS 'System notifications for telecallers and supervisors';
COMMENT ON TABLE public.telecaller_training IS 'Training records and certifications for telecallers';

COMMENT ON COLUMN public.users.role IS 'User role: telecaller, supervisor, admin';
COMMENT ON COLUMN public.users.employee_id IS 'Unique employee identification number';
COMMENT ON COLUMN public.users.shift_timing IS 'Work shift timing for the telecaller';
COMMENT ON COLUMN public.users.specialization_focus IS 'Area of specialization or expertise';

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
    'users', 'telecaller_performance', 'call_logs', 'telecaller_schedules', 
    'telecaller_targets', 'notifications', 'telecaller_training'
)
ORDER BY tablename;

-- Show table counts after setup
SELECT 
    'users (telecallers)' as table_name, COUNT(*) as record_count 
    FROM public.users WHERE role IN ('telecaller', 'supervisor', 'admin')
UNION ALL
SELECT 'telecaller_performance', COUNT(*) FROM public.telecaller_performance
UNION ALL  
SELECT 'call_logs', COUNT(*) FROM public.call_logs
UNION ALL
SELECT 'telecaller_schedules', COUNT(*) FROM public.telecaller_schedules
UNION ALL
SELECT 'telecaller_targets', COUNT(*) FROM public.telecaller_targets
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'telecaller_training', COUNT(*) FROM public.telecaller_training;

COMMIT;