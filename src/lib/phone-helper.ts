/**
 * Utilities for phone number normalization and formatting
 */

/**
 * Normalize a phone number by removing common formatting characters
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove common formatting: spaces, dashes, parentheses, dots
  return phone.replace(/[\s\-().]/g, "");
}

/**
 * Detect if a phone number already has a country code
 */
export function hasCountryCode(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.startsWith("+");
}

/**
 * Add a country code to a phone number if it doesn't have one
 */
export function addCountryCode(phone: string, countryCode: string): string {
  if (!phone) return "";

  const normalized = normalizePhoneNumber(phone);

  // Already has a country code
  if (normalized.startsWith("+")) {
    return normalized;
  }

  // Remove leading zeros (common in local formats)
  const withoutLeadingZeros = normalized.replace(/^0+/, "");

  return `${countryCode}${withoutLeadingZeros}`;
}

/**
 * Format a phone number for display (basic formatting)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  const normalized = normalizePhoneNumber(phone);

  // If it has a country code, format as: +X XXX XXX XXXX
  if (normalized.startsWith("+")) {
    const parts = normalized.match(/^(\+\d{1,3})(\d{3})(\d{3})(\d+)$/);
    if (parts) {
      return `${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]}`;
    }
    // Fallback: just add space after country code
    const codeMatch = normalized.match(/^(\+\d{1,4})(.*)/);
    if (codeMatch) {
      return `${codeMatch[1]} ${codeMatch[2]}`;
    }
  }

  // Basic formatting for numbers without country code
  if (normalized.length === 10) {
    // Format as: XXX XXX XXXX
    return normalized.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  return normalized;
}

/**
 * Extract country code from a phone number
 */
export function extractCountryCode(phone: string): string | null {
  const normalized = normalizePhoneNumber(phone);
  const match = normalized.match(/^(\+\d{1,4})/);
  return match ? match[1] : null;
}
