/**
 * Indonesian Phone Number Validation Utility
 * Format: 08xx-xxxx-xxxx (10-13 digits starting with 08)
 */

// Valid Indonesian mobile prefixes
const VALID_PREFIXES = [
  '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819', // Telkomsel
  '0821', '0822', '0823', '0852', '0853', // Telkomsel
  '0831', '0832', '0833', '0838', // Axis
  '0855', '0856', '0857', '0858', // Indosat
  '0814', '0815', '0816', // Indosat
  '0817', '0818', '0819', '0859', '0877', '0878', // XL
  '0895', '0896', '0897', '0898', '0899', // Three
  '0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889', // Smartfren
];

/**
 * Validates an Indonesian phone number
 * @param phone - The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export function isValidIndonesianPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length (10-13 digits)
  if (cleaned.length < 10 || cleaned.length > 13) {
    return false;
  }
  
  // Must start with 08
  if (!cleaned.startsWith('08')) {
    return false;
  }
  
  // Check if it has a valid prefix (first 4 digits)
  const prefix = cleaned.substring(0, 4);
  return VALID_PREFIXES.includes(prefix);
}

/**
 * Formats an Indonesian phone number to 08xx-xxxx-xxxx format
 * @param phone - The phone number to format
 * @returns Formatted phone number or original if invalid
 */
export function formatIndonesianPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with +62, convert to 0
  let normalized = cleaned;
  if (cleaned.startsWith('62')) {
    normalized = '0' + cleaned.substring(2);
  }
  
  // Format as 08xx-xxxx-xxxx
  if (normalized.length >= 10) {
    const part1 = normalized.substring(0, 4);
    const part2 = normalized.substring(4, 8);
    const part3 = normalized.substring(8);
    return `${part1}-${part2}-${part3}`;
  }
  
  return phone;
}

/**
 * Normalizes phone input (removes formatting but keeps digits)
 * @param phone - The phone number to normalize
 * @returns Normalized phone number (digits only)
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert +62 to 0
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  return cleaned;
}

/**
 * Gets validation error message for Indonesian phone number
 * @param phone - The phone number to validate
 * @returns Error message or null if valid
 */
export function getPhoneValidationError(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return null; // Empty is allowed (optional field)
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    return 'Nomor telepon minimal 10 digit';
  }
  
  if (cleaned.length > 13) {
    return 'Nomor telepon maksimal 13 digit';
  }
  
  if (!cleaned.startsWith('08') && !cleaned.startsWith('62')) {
    return 'Nomor telepon harus dimulai dengan 08';
  }
  
  // Normalize to check prefix
  let normalized = cleaned;
  if (cleaned.startsWith('62')) {
    normalized = '0' + cleaned.substring(2);
  }
  
  const prefix = normalized.substring(0, 4);
  if (!VALID_PREFIXES.includes(prefix)) {
    return 'Kode operator tidak valid';
  }
  
  return null;
}

/**
 * Validates a phone number and returns result object
 * @param phone - The phone number to validate
 * @returns Object with isValid and error message
 */
export function validatePhone(phone: string): { isValid: boolean; error: string | null } {
  const error = getPhoneValidationError(phone);
  return {
    isValid: error === null && phone.trim() !== '',
    error,
  };
}

/**
 * Checks if phone is in WhatsApp format (Indonesian 08xx format)
 * @param phone - The phone number to check
 * @returns boolean indicating if it's a valid WhatsApp format
 */
export function isWhatsAppFormat(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert +62 to 0
  let normalized = cleaned;
  if (cleaned.startsWith('62')) {
    normalized = '0' + cleaned.substring(2);
  }
  
  // Must be valid Indonesian number starting with 08
  return normalized.startsWith('08') && normalized.length >= 10 && normalized.length <= 13;
}

/**
 * Converts Indonesian phone to international WhatsApp format
 * @param phone - The phone number to convert
 * @returns Phone in 62xxx format for WhatsApp
 */
export function toWhatsAppFormat(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // If already starts with 62, return as is
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  
  // If starts with 0, replace with 62
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  
  return cleaned;
}
