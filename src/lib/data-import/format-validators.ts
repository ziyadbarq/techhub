/**
 * Format Validators
 *
 * Pure functions for validating various data formats.
 * These validators check if a value conforms to a specific format pattern.
 */

import { isValid, parseISO } from "date-fns";

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Remove common separators
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Check if remaining characters are digits (and optionally starts with +)
  return /^\+?\d{8,15}$/.test(cleaned);
}

/**
 * Validate date
 */
export function isValidDate(value: unknown): boolean {
  if (!value) return false;

  // Try parsing as ISO date
  const date =
    typeof value === "string" ? parseISO(value) : new Date(value as Date);
  return isValid(date);
}

/**
 * Validate alphanumeric format
 */
export function isValidAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

/**
 * Validate numeric format (digits only)
 */
export function isValidNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Format validator registry for easy lookup
 */
export const formatValidators = {
  email: isValidEmail,
  url: isValidURL,
  phone: isValidPhone,
  date: isValidDate,
  alphanumeric: isValidAlphanumeric,
  numeric: isValidNumeric,
} as const;

/**
 * Type for format validator names
 */
export type FormatValidatorName = keyof typeof formatValidators;
