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

import { countries } from "countries-list";

/**
 * Pre-sorted list of valid country phone codes (e.g. +1246, +58, +1) by length descending
 */
const sortedCountryCodes: string[] = Array.from(
  new Set(
    Object.values(countries)
      .map((c) => (Array.isArray(c.phone) ? c.phone[0] : c.phone))
      .filter(Boolean)
      .map((p) => `+${p}`)
  )
).sort((a, b) => b.length - a.length);

/**
 * Splits a phone number into its country code and local number.
 * E.g. "+584121111111" => { countryCode: "+58", localNumber: "4121111111" }
 * E.g. "+1 (555) 123-4567" => { countryCode: "+1", localNumber: "(555) 123-4567" }
 *
 * @param phone - The full phone number string.
 * @returns Object with countryCode and localNumber.
 */
export function splitPhoneNumber(phone: string): {
  countryCode: string;
  localNumber: string;
} {
  if (!phone) return { countryCode: "", localNumber: "" };
  const trimmed = phone.trim();
  if (!trimmed.startsWith("+")) {
    return { countryCode: "", localNumber: trimmed };
  }

  const normalized = normalizePhoneNumber(trimmed);
  const matchedCode = sortedCountryCodes.find((code) =>
    normalized.startsWith(code)
  );

  if (matchedCode) {
    const rawDigitsOnlyCode = matchedCode.replace("+", "");
    const regex = new RegExp(`^\\+?\\s*${rawDigitsOnlyCode}[\\s\\-.]*`);
    const localNumber = trimmed.replace(regex, "");
    return { countryCode: matchedCode, localNumber };
  }

  return { countryCode: "", localNumber: trimmed };
}

/**
 * Extract country code from a phone number
 *
 * @param phone - The full phone number string.
 * @returns The matching country code or null.
 */
export function extractCountryCode(phone: string): string | null {
  const { countryCode } = splitPhoneNumber(phone);
  return countryCode || null;
}

