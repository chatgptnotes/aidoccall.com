// Currency utility for handling INR/USD based on patient residency

// Fallback conversion rate (used only if doctor hasn't set international fee)
const INR_TO_USD_RATE = 0.012; // 1 INR = 0.012 USD (approx 83 INR = 1 USD)

/**
 * Get currency info based on patient's India residency status
 * @param {boolean} isIndianResident - Whether patient is Indian resident
 * @returns {object} Currency info { code, symbol, name }
 */
export const getCurrency = (isIndianResident) => {
  if (isIndianResident === true) {
    return {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee'
    };
  }
  return {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar'
  };
};

/**
 * Convert amount from INR to the patient's currency
 * @param {number} amountInINR - Amount in Indian Rupees
 * @param {boolean} isIndianResident - Whether patient is Indian resident
 * @returns {number} Converted amount
 */
export const convertFromINR = (amountInINR, isIndianResident) => {
  if (!amountInINR || amountInINR === 0) return 0;
  
  if (isIndianResident === true) {
    return amountInINR; // No conversion needed
  }
  
  // Convert to USD for international patients
  return Math.round(amountInINR * INR_TO_USD_RATE * 100) / 100; // Round to 2 decimals
};

/**
 * Convert amount from patient's currency back to INR (for payment processing)
 * @param {number} amount - Amount in patient's currency
 * @param {boolean} isIndianResident - Whether patient is Indian resident
 * @returns {number} Amount in INR
 */
export const convertToINR = (amount, isIndianResident) => {
  if (!amount || amount === 0) return 0;
  
  if (isIndianResident === true) {
    return amount; // Already in INR
  }
  
  // Convert from USD to INR
  return Math.round(amount / INR_TO_USD_RATE);
};

/**
 * Format amount with currency symbol
 * @param {number} amountInINR - Amount in Indian Rupees (base currency)
 * @param {boolean} isIndianResident - Whether patient is Indian resident
 * @param {boolean} showCode - Whether to show currency code (e.g., "INR" or "USD")
 * @returns {string} Formatted price string
 */
export const formatPrice = (amountInINR, isIndianResident, showCode = false) => {
  const currency = getCurrency(isIndianResident);
  const convertedAmount = convertFromINR(amountInINR, isIndianResident);
  
  if (isIndianResident === true) {
    // Format for INR
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedAmount);
    
    return showCode ? `${currency.symbol}${formatted} ${currency.code}` : `${currency.symbol}${formatted}`;
  }
  
  // Format for USD
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(convertedAmount);
  
  return showCode ? `${currency.symbol}${formatted} ${currency.code}` : `${currency.symbol}${formatted}`;
};

/**
 * Get current conversion rate info
 * @returns {object} Rate info
 */
export const getConversionRate = () => {
  return {
    rate: INR_TO_USD_RATE,
    from: 'INR',
    to: 'USD',
    inverseRate: Math.round(1 / INR_TO_USD_RATE),
    lastUpdated: '2024-01-01' // Update this when you change the rate
  };
};

/**
 * Get the appropriate consultation fee based on patient residency
 * @param {object} doctor - Doctor object with fee fields
 * @param {boolean} isIndianResident - Whether patient is Indian resident
 * @param {string} visitType - 'online' or 'physical'
 * @returns {object} { amount, currency, symbol }
 */
export const getDoctorFee = (doctor, isIndianResident, visitType = 'physical') => {
  if (!doctor) return { amount: 0, currency: 'INR', symbol: '₹' };
  
  const currency = getCurrency(isIndianResident);
  
  if (isIndianResident === true) {
    // Indian patient - use INR fees (prefer new _inr fields, fallback to legacy fields)
    const fee = visitType === 'online' 
      ? (doctor.online_fee_inr || doctor.online_fee || doctor.consultation_fee || 0)
      : (doctor.consultation_fee_inr || doctor.consultation_fee || doctor.online_fee || 0);
    
    return {
      amount: fee,
      currency: 'INR',
      symbol: '₹',
      formatted: formatPrice(fee, true)
    };
  } else {
    // International patient - use USD fees if available, else convert
    const intlFee = visitType === 'online'
      ? (doctor.online_fee_usd || doctor.consultation_fee_usd)
      : (doctor.consultation_fee_usd || doctor.online_fee_usd);
    
    if (intlFee && intlFee > 0) {
      // Doctor has set specific USD fee
      return {
        amount: intlFee,
        currency: 'USD',
        symbol: '$',
        formatted: `$${intlFee.toFixed(2)}`
      };
    } else {
      // Fallback: Convert INR fee to USD (only if doctor hasn't set USD pricing)
      const inrFee = visitType === 'online'
        ? (doctor.online_fee_inr || doctor.online_fee || doctor.consultation_fee || 0)
        : (doctor.consultation_fee_inr || doctor.consultation_fee || doctor.online_fee || 0);
      const convertedFee = convertFromINR(inrFee, false);
      
      return {
        amount: convertedFee,
        currency: 'USD',
        symbol: '$',
        formatted: `$${convertedFee.toFixed(2)}`,
        isConverted: true // Flag to show it's auto-converted
      };
    }
  }
};

/**
 * Format doctor fee for display
 * @param {object} doctor - Doctor object
 * @param {boolean} isIndianResident - Whether patient is Indian resident  
 * @param {string} visitType - 'online' or 'physical'
 * @returns {string} Formatted price string
 */
export const formatDoctorFee = (doctor, isIndianResident, visitType = 'physical') => {
  const feeInfo = getDoctorFee(doctor, isIndianResident, visitType);
  return feeInfo.formatted;
};

export default {
  getCurrency,
  convertFromINR,
  convertToINR,
  formatPrice,
  getConversionRate,
  getDoctorFee,
  formatDoctorFee
};
