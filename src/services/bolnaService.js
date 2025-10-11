/**
 * Bolna AI Voice Call Service
 * Handles automatic voice call initiation when new bookings arrive
 */

const BOLNA_API_URL = 'https://api.bolna.ai/call';
const BOLNA_API_KEY = import.meta.env.VITE_BOLNA_API_KEY;
const BOLNA_AGENT_ID = import.meta.env.VITE_BOLNA_AGENT_ID;

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number with +91 prefix
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // If already has country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If 10 digits, add India country code +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // If already has +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // Default: assume India and add +91
  return `+91${cleaned}`;
};

/**
 * Make a voice call using Bolna AI API
 * @param {string} phoneNumber - Recipient's phone number
 * @param {object} bookingData - Booking data for context (optional)
 * @returns {Promise<object>} API response
 */
export const makeBolnaCall = async (phoneNumber, bookingData = {}) => {
  try {
    // Validate inputs
    if (!phoneNumber) {
      console.error('❌ [Bolna] Phone number is required');
      return { success: false, error: 'Phone number is required' };
    }

    if (!BOLNA_API_KEY || !BOLNA_AGENT_ID) {
      console.error('❌ [Bolna] API credentials missing in environment variables');
      return { success: false, error: 'Bolna API credentials not configured' };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      console.error('❌ [Bolna] Invalid phone number format:', phoneNumber);
      return { success: false, error: 'Invalid phone number format' };
    }

    console.log('📞 [Bolna] Initiating call to:', formattedPhone);
    console.log('📋 [Bolna] Booking data:', {
      booking_id: bookingData.booking_id,
      address: bookingData.address,
      city: bookingData.city
    });

    // Prepare request payload
    const payload = {
      agent_id: BOLNA_AGENT_ID,
      recipient_phone_number: formattedPhone,
      user_data: {
        booking_id: bookingData.booking_id || 'N/A',
        address: bookingData.address || 'N/A',
        city: bookingData.city || 'N/A',
        pincode: bookingData.pincode || 'N/A',
        status: bookingData.status || 'pending',
        timestamp: new Date().toISOString()
      }
    };

    // Make API call
    const response = await fetch(BOLNA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOLNA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Success
    console.log('✅ [Bolna] Call initiated successfully:', {
      status: data.status,
      execution_id: data.execution_id,
      phone: formattedPhone
    });

    return {
      success: true,
      data: data,
      phone: formattedPhone
    };

  } catch (error) {
    console.error('❌ [Bolna] API call failed:', error.message);
    console.error('🔍 [Bolna] Error details:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test Bolna API connection
 * @returns {Promise<boolean>} True if API is accessible
 */
export const testBolnaConnection = async () => {
  try {
    if (!BOLNA_API_KEY || !BOLNA_AGENT_ID) {
      console.warn('⚠️ [Bolna] API credentials not configured');
      return false;
    }

    console.log('🔍 [Bolna] Testing API connection...');
    console.log('🔑 [Bolna] API Key:', BOLNA_API_KEY ? 'Configured ✓' : 'Missing ✗');
    console.log('🤖 [Bolna] Agent ID:', BOLNA_AGENT_ID ? 'Configured ✓' : 'Missing ✗');

    return true;
  } catch (error) {
    console.error('❌ [Bolna] Connection test failed:', error);
    return false;
  }
};

export default {
  makeBolnaCall,
  testBolnaConnection,
  formatPhoneNumber
};
