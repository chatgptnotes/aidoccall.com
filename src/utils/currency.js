// Currency utility for handling INR/USD based on patient residency

// Fixed conversion rate (you can update this or fetch from an API)
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

export default {
  getCurrency,
  convertFromINR,
  convertToINR,
  formatPrice,
  getConversionRate
};
