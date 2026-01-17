-- SQL Setup for 15-minute Appointment Reminders
-- Run this in Supabase SQL Editor

-- Step 1: Add reminder_sent column to doc_appointments if not exists
ALTER TABLE doc_appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Step 2: Add meeting_link column to doc_doctors table if not exists
ALTER TABLE doc_doctors
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Step 3: Create index for faster reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
ON doc_appointments (appointment_date, appointment_time, status, visit_type, reminder_sent);

-- Step 4: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 5: Schedule the Edge Function to run every minute
-- This calls the Edge Function that sends WhatsApp reminders
-- Note: Replace YOUR_PROJECT_REF with your actual Supabase project reference

-- First, create the cron job
SELECT cron.schedule(
  'send-appointment-reminders',  -- job name
  '* * * * *',                   -- every minute
  $$
  SELECT net.http_post(
    url := 'https://uakqdjxuceckjssjdyui.supabase.co/functions/v1/send-appointment-reminders',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha3Fkanh1Y2Vja2pzc2pkeXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3MDM1MywiZXhwIjoyMDgyNjQ2MzUzfQ.Kc3pV1OSDrKxPwXZeOtR3HFrO7Kpia3mAmfI8XWOpJA", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('send-appointment-reminders');

-- Step 6: Grant permissions for the cron job to make HTTP requests
GRANT USAGE ON SCHEMA net TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres;


-- ============================================
-- ALTERNATIVE: If pg_cron is not available
-- ============================================
-- You can use an external cron service (like cron-job.org) to call:
-- POST https://uakqdjxuceckjssjdyui.supabase.co/functions/v1/send-appointment-reminders
-- Headers:
--   Authorization: Bearer YOUR_ANON_KEY
--   Content-Type: application/json
-- Schedule: Every 1 minute


-- ============================================
-- TEST: Manually trigger the reminder check
-- ============================================
-- You can test by calling the Edge Function directly:
-- curl -X POST https://uakqdjxuceckjssjdyui.supabase.co/functions/v1/send-appointment-reminders \
--   -H "Authorization: Bearer YOUR_ANON_KEY" \
--   -H "Content-Type: application/json"
