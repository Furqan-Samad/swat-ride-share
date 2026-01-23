/**
 * Sanitizes user input for ILIKE pattern matching queries
 * Prevents pattern injection and limits input length
 */
export const sanitizeSearchInput = (input: string): string => {
  // Trim whitespace and limit length to prevent abuse
  const trimmed = input.trim().slice(0, 50);
  
  // Escape ILIKE special characters (% and _) to prevent pattern injection
  return trimmed.replace(/[%_]/g, (match) => `\\${match}`);
};

/**
 * Validates that a string input is safe for use in queries
 */
export const isValidSearchInput = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  
  // Check for reasonable length
  if (input.length > 100) return false;
  
  // Check for suspicious patterns (excessive special characters)
  const suspiciousPattern = /[%_]{3,}/;
  if (suspiciousPattern.test(input)) return false;
  
  return true;
};
