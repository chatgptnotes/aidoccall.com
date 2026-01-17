// Supabase Edge Function to send WhatsApp reminders 15 minutes before appointments
// Deploy with: supabase functions deploy send-appointment-reminders
// Schedule with pg_cron to run every minute

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOUBLETICK_API_URL = 'https://public.doubletick.io/whatsapp/message/template';
const DOUBLETICK_API_KEY = Deno.env.get('DOUBLETICK_API_KEY') || 'key_8sc9MP6JpQ';
const DOUBLETICK_FROM_NUMBER = '918856945017';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function sendWhatsAppReminder(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string,
  meetingLink: string
): Promise<{ success: boolean; error?: string }> {
  const formattedTo = phoneNumber.replace(/[\s+]/g, '');

  const requestBody = {
    messages: [
      {
        content: {
          language: 'en',
          templateName: 'video_consultation_15min_reminder',
          templateData: {
            body: {
              placeholders: [
                patientName,      // {{1}}
                doctorName,       // {{2}}
                appointmentDate,  // {{3}}
                appointmentTime,  // {{4}}
                meetingLink       // {{5}}
              ],
            },
          },
        },
        from: DOUBLETICK_FROM_NUMBER,
        to: formattedTo,
        messageId: generateUUID(),
      },
    ],
  };

  try {
    const response = await fetch(DOUBLETICK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': DOUBLETICK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp send error:', data);
      return { success: false, error: JSON.stringify(data) };
    }

    console.log('WhatsApp reminder sent to:', phoneNumber);
    return { success: true };
  } catch (error) {
    console.error('WhatsApp service error:', error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time and time 15 minutes from now
    const now = new Date();
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const sixteenMinsFromNow = new Date(now.getTime() + 16 * 60 * 1000);

    // Format for comparison
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const targetTimeStart = fifteenMinsFromNow.toTimeString().slice(0, 5);
    const targetTimeEnd = sixteenMinsFromNow.toTimeString().slice(0, 5);

    console.log(`Checking for appointments between ${targetTimeStart} and ${targetTimeEnd} on ${today}`);

    // Query appointments that:
    // 1. Are scheduled for today
    // 2. Start in approximately 15 minutes
    // 3. Are confirmed (payment completed)
    // 4. Haven't received a reminder yet
    // 5. Are online/video consultations
    const { data: appointments, error } = await supabase
      .from('doc_appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        patient_name,
        patient_phone,
        visit_type,
        reminder_sent,
        doctor:doc_doctors!doctor_id (
          id,
          name,
          full_name,
          meeting_link
        )
      `)
      .eq('appointment_date', today)
      .gte('appointment_time', targetTimeStart)
      .lte('appointment_time', targetTimeEnd)
      .eq('status', 'confirmed')
      .eq('visit_type', 'online')
      .or('reminder_sent.is.null,reminder_sent.eq.false');

    if (error) {
      console.error('Error fetching appointments:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

    const results = [];

    for (const appointment of appointments || []) {
      const doctor = appointment.doctor;
      const meetingLink = doctor?.meeting_link || 'Link will be shared by doctor';
      const doctorName = doctor?.name || doctor?.full_name || 'Doctor';

      // Format date for message
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Send WhatsApp reminder
      const result = await sendWhatsAppReminder(
        appointment.patient_phone,
        appointment.patient_name,
        doctorName,
        appointmentDate,
        appointment.appointment_time,
        meetingLink
      );

      if (result.success) {
        // Mark appointment as reminder sent
        await supabase
          .from('doc_appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id);
      }

      results.push({
        appointmentId: appointment.id,
        patientName: appointment.patient_name,
        ...result
      });
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
