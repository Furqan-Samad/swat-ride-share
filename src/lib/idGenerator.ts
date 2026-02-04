/**
 * Generates a unique booking reference code for display purposes
 * Format: SPB-XXXXXX (SP = SwatPool, B = Booking)
 */
export const generateBookingReference = (bookingId: string): string => {
  // Take first 6 chars of UUID and convert to uppercase
  const shortId = bookingId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `SPB-${shortId}`;
};

/**
 * Generates a unique ride reference code for display purposes
 * Format: SPR-XXXXXX (SP = SwatPool, R = Ride)
 */
export const generateRideReference = (rideId: string): string => {
  const shortId = rideId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `SPR-${shortId}`;
};

/**
 * Validates that a UUID is properly formatted
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Formats phone number to international format (Pakistan)
 */
export const formatPhoneToInternational = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Pakistan numbers
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  
  return '+' + cleaned;
};

/**
 * Validates Pakistani phone number format
 */
export const isValidPakistaniPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  
  // Pakistani numbers: 03XX-XXXXXXX (11 digits) or 92 3XX XXXXXXX (12 digits)
  return (
    (cleaned.length === 11 && cleaned.startsWith('03')) ||
    (cleaned.length === 12 && cleaned.startsWith('923'))
  );
};
