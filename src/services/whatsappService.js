// WhatsApp Service using DoubleTick API
// Sends WhatsApp messages to patients

const DOUBLETICK_API_URL = 'https://public.doubletick.io/whatsapp/message/template';
const API_KEY = import.meta.env.VITE_DOUBLETICK_API_KEY;
const FROM_NUMBER = import.meta.env.VITE_DOUBLETICK_DEVICE_ID;

/**
 * Generate a proper UUID v4 for message ID (required by DoubleTick API)
 */
const generateMessageId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Send a WhatsApp template message
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} templateName - Template name from DoubleTick
 * @param {Array} parameters - Template parameters
 */
export const sendWhatsAppTemplate = async (phoneNumber, templateName, parameters = []) => {
  try {
    if (!API_KEY) {
      console.error('DoubleTick API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    if (!FROM_NUMBER) {
      console.error('DoubleTick phone number not configured');
      return { success: false, error: 'From number not configured' };
    }

    // Format phone numbers - remove + and spaces
    const formattedTo = phoneNumber.replace(/[\s+]/g, '');
    const formattedFrom = FROM_NUMBER.replace(/[\s+]/g, '');
    const messageId = generateMessageId();

    const requestBody = {
      messages: [
        {
          content: {
            language: 'en',
            templateName: templateName,
            templateData: {
              body: {
                placeholders: parameters,
              },
            },
          },
          from: formattedFrom,
          to: formattedTo,
          messageId: messageId,
        },
      ],
    };

    console.log('DoubleTick request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(DOUBLETICK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,  // No 'Bearer ' prefix
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('DoubleTick response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('WhatsApp send error:', data);
      return { success: false, error: data };
    }

    console.log('WhatsApp message sent successfully');
    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send registration success message to patient
 * Uses appointment_confirmation_ddo template
 * Template: Greetings from {{1}}! Dear {{2}}, your appointment with Dr. {{3}} is confirmed on {{4}} at {{5}}.
 * Location: {{6}} {{7}} For queries, call {{8}}.
 */
export const sendRegistrationSuccessMessage = async (patientName, phoneNumber) => {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const parameters = [
    'Hope Hospital',           // {{1}} - Hospital name
    patientName,               // {{2}} - Patient name
    'our healthcare team',     // {{3}} - Doctor name (using team for registration)
    today,                     // {{4}} - Date (registration date)
    'anytime',                 // {{5}} - Time
    'AidocCall Patient Portal', // {{6}} - Location
    'Visit: aidoccall.com to book appointments', // {{7}} - Link/info
    '+918856945017'            // {{8}} - Contact number
  ];

  return sendWhatsAppTemplate(phoneNumber, 'appointment_confirmation_ddo', parameters);
};

/**
 * Send appointment confirmation message
 */
export const sendAppointmentConfirmation = async (
  patientName,
  phoneNumber,
  doctorName,
  appointmentDate,
  appointmentTime,
  location,
  meetingLink,
  contactNumber
) => {
  const parameters = [
    'Hope Hospital',    // {{1}} - Hospital name
    patientName,        // {{2}} - Patient name
    doctorName,         // {{3}} - Doctor name
    appointmentDate,    // {{4}} - Date
    appointmentTime,    // {{5}} - Time
    location || 'Online Consultation',  // {{6}} - Location
    meetingLink || 'Will be shared before appointment',  // {{7}} - Meeting link
    contactNumber || '+918856945017'  // {{8}} - Contact number
  ];

  return sendWhatsAppTemplate(phoneNumber, 'appointment_confirmation_ddo', parameters);
};

/**
 * Send 15-minute reminder before video consultation
 * Template: video_consultation_15min_reminder
 * Hi {{1}}, Your video consultation with Dr. {{2}} starts in 15 minutes!
 * Date: {{3}} Time: {{4}} Click here to join: {{5}}
 */
export const sendConsultationReminder = async (
  patientName,
  phoneNumber,
  doctorName,
  appointmentDate,
  appointmentTime,
  meetingLink
) => {
  const parameters = [
    patientName,        // {{1}} - Patient name
    doctorName,         // {{2}} - Doctor name
    appointmentDate,    // {{3}} - Date
    appointmentTime,    // {{4}} - Time
    meetingLink         // {{5}} - Meeting link
  ];

  return sendWhatsAppTemplate(phoneNumber, 'video_consultation_15min_reminder', parameters);
};

export default {
  sendWhatsAppTemplate,
  sendRegistrationSuccessMessage,
  sendAppointmentConfirmation,
  sendConsultationReminder
};
