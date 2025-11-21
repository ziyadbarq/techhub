/**
 * Validation helpers for DTOs
 *
 * Provides reusable validation schemas and refinements for common data types
 */

import { z } from "zod";

/**
 * Creates a validated currency/financial field schema
 *
 * Validates:
 * - Non-negative values
 * - Maximum value based on DB precision (Decimal(12, 2) = max 9999999999.99)
 * - Maximum 2 decimal places (matches DB precision)
 *
 * @param fieldName - Name of the field for error messages
 * @param required - Whether the field is required (default: false)
 */
export function currencyField(fieldName: string, required = false) {
  const schema = z
    .number({ message: `${fieldName} must be a number` })
    .nonnegative(`${fieldName} cannot be negative`)
    .max(9999999999.99, `${fieldName} cannot exceed 9999999999.99`)
    .refine(
      (val) => {
        // Check that the value has at most 2 decimal places
        const decimalPlaces = (val.toString().split(".")[1] || "").length;
        return decimalPlaces <= 2;
      },
      {
        message: `${fieldName} can have at most 2 decimal places`,
      },
    );

  return required ? schema : schema.optional().nullable();
}

/**
 * Creates a validated coordinate field schema (latitude/longitude)
 *
 * Validates:
 * - Range appropriate for lat/long
 * - Maximum 7 decimal places (matches DB precision Decimal(10, 7))
 *
 * @param fieldName - Name of the field for error messages
 * @param min - Minimum value (default: -180)
 * @param max - Maximum value (default: 180)
 */
export function coordinateField(fieldName: string, min = -180, max = 180) {
  return z
    .number({ message: `${fieldName} must be a number` })
    .min(min, `${fieldName} must be at least ${min}`)
    .max(max, `${fieldName} cannot exceed ${max}`)
    .refine(
      (val) => {
        // Check that the value has at most 7 decimal places
        const decimalPlaces = (val.toString().split(".")[1] || "").length;
        return decimalPlaces <= 7;
      },
      {
        message: `${fieldName} can have at most 7 decimal places`,
      },
    )
    .optional()
    .nullable();
}

/**
 * Currency code validation (3-letter ISO code)
 */
export const currencyCode = z
  .string()
  .length(3, "Currency must be a 3-letter ISO code")
  .regex(
    /^[A-Z]{3}$/,
    "Currency must be 3 uppercase letters (e.g., USD, EUR, SAR)",
  )
  .optional()
  .nullable();

/**
 * Helper schema for optional date coercion
 */
export const optionalDate = z.coerce.date().optional().nullable();

/**
 * Helper schema for required date coercion
 */
export const requiredDate = z.coerce.date({
  message: "Invalid date format",
});
