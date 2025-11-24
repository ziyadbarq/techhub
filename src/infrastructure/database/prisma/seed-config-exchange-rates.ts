/**
 * Exchange Rates Seed Configuration
 *
 * Defines exchange rates for multi-currency support (all rates are to SAR).
 * SAR is the base currency for Barq's financial operations.
 */

export const EXCHANGE_RATE_DATA = [
  { currency: "USD", rateToSAR: 3.75, isActive: true }, // US Dollar
  { currency: "EUR", rateToSAR: 4.08, isActive: true }, // Euro
  { currency: "GBP", rateToSAR: 4.75, isActive: true }, // British Pound
  { currency: "JPY", rateToSAR: 0.025, isActive: true }, // Japanese Yen
  { currency: "AUD", rateToSAR: 2.45, isActive: true }, // Australian Dollar
  { currency: "CAD", rateToSAR: 2.7, isActive: true }, // Canadian Dollar
  { currency: "CHF", rateToSAR: 4.2, isActive: true }, // Swiss Franc
  { currency: "CNY", rateToSAR: 0.52, isActive: true }, // Chinese Yuan
  { currency: "INR", rateToSAR: 0.045, isActive: true }, // Indian Rupee
  { currency: "AED", rateToSAR: 1.02, isActive: true }, // UAE Dirham
  { currency: "KWD", rateToSAR: 12.2, isActive: true }, // Kuwaiti Dinar
  { currency: "BHD", rateToSAR: 9.95, isActive: true }, // Bahraini Dinar
  { currency: "OMR", rateToSAR: 9.75, isActive: true }, // Omani Rial
  { currency: "QAR", rateToSAR: 1.03, isActive: true }, // Qatari Riyal
] as const;
