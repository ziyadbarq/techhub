/**
 * Field Validation Rules
 *
 * Strategy pattern implementation for custom validation rules.
 * Each rule type has a dedicated handler function.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isFuture, isPast } from "date-fns";
import type { ValidationRule } from "./entity-config.types";
import {
  isValidEmail,
  isValidURL,
  isValidPhone,
  isValidDate,
  isValidAlphanumeric,
  isValidNumeric,
} from "./format-validators";

/**
 * Result of a validation rule check
 */
export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation rule handler function signature
 */
type ValidationRuleHandler = (
  value: any,
  rule: ValidationRule,
  label: string,
) => string | null;

/**
 * Email validation rule handler
 */
const emailHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidEmail(String(value))) {
    return rule.message || `${label} must be a valid email address`;
  }
  return null;
};

/**
 * URL validation rule handler
 */
const urlHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidURL(String(value))) {
    return rule.message || `${label} must be a valid URL`;
  }
  return null;
};

/**
 * Phone validation rule handler
 */
const phoneHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidPhone(String(value))) {
    return rule.message || `${label} must be a valid phone number`;
  }
  return null;
};

/**
 * Alphanumeric validation rule handler
 */
const alphanumericHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidAlphanumeric(String(value))) {
    return rule.message || `${label} must be alphanumeric`;
  }
  return null;
};

/**
 * Numeric validation rule handler
 */
const numericHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidNumeric(String(value))) {
    return rule.message || `${label} must be numeric`;
  }
  return null;
};

/**
 * Positive number validation rule handler
 */
const positiveHandler: ValidationRuleHandler = (value, rule, label) => {
  if (Number(value) <= 0) {
    return rule.message || `${label} must be positive`;
  }
  return null;
};

/**
 * Negative number validation rule handler
 */
const negativeHandler: ValidationRuleHandler = (value, rule, label) => {
  if (Number(value) >= 0) {
    return rule.message || `${label} must be negative`;
  }
  return null;
};

/**
 * Integer validation rule handler
 */
const integerHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!Number.isInteger(Number(value))) {
    return rule.message || `${label} must be an integer`;
  }
  return null;
};

/**
 * Past date validation rule handler
 */
const pastDateHandler: ValidationRuleHandler = (value, rule, label) => {
  if (isValidDate(value)) {
    const date = new Date(value);
    if (!isPast(date)) {
      return rule.message || `${label} must be in the past`;
    }
  }
  return null;
};

/**
 * Future date validation rule handler
 */
const futureDateHandler: ValidationRuleHandler = (value, rule, label) => {
  if (isValidDate(value)) {
    const date = new Date(value);
    if (!isFuture(date)) {
      return rule.message || `${label} must be in the future`;
    }
  }
  return null;
};

/**
 * Pattern validation rule handler
 */
const patternHandler: ValidationRuleHandler = (value, rule, label) => {
  if (
    rule.value &&
    typeof rule.value === "string" &&
    !new RegExp(rule.value).test(String(value))
  ) {
    return rule.message || `${label} has an invalid format`;
  }
  return null;
};

/**
 * Min length validation rule handler
 */
const minLengthHandler: ValidationRuleHandler = (value, rule, label) => {
  if (
    rule.value &&
    typeof rule.value === "number" &&
    String(value).length < rule.value
  ) {
    return rule.message || `${label} must be at least ${rule.value} characters`;
  }
  return null;
};

/**
 * Max length validation rule handler
 */
const maxLengthHandler: ValidationRuleHandler = (value, rule, label) => {
  if (
    rule.value &&
    typeof rule.value === "number" &&
    String(value).length > rule.value
  ) {
    return rule.message || `${label} must be at most ${rule.value} characters`;
  }
  return null;
};

/**
 * Min value validation rule handler
 */
const minHandler: ValidationRuleHandler = (value, rule, label) => {
  if (
    rule.value &&
    typeof rule.value === "number" &&
    Number(value) < rule.value
  ) {
    return rule.message || `${label} must be at least ${rule.value}`;
  }
  return null;
};

/**
 * Max value validation rule handler
 */
const maxHandler: ValidationRuleHandler = (value, rule, label) => {
  if (
    rule.value &&
    typeof rule.value === "number" &&
    Number(value) > rule.value
  ) {
    return rule.message || `${label} must be at most ${rule.value}`;
  }
  return null;
};

/**
 * Validation rule handler registry
 *
 * Maps rule types to their handler functions.
 * This registry pattern makes it easy to add new validation rules
 * without modifying the core validation logic (Open/Closed Principle).
 */
const RULE_HANDLERS: Record<string, ValidationRuleHandler> = {
  email: emailHandler,
  url: urlHandler,
  phone: phoneHandler,
  alphanumeric: alphanumericHandler,
  numeric: numericHandler,
  positive: positiveHandler,
  negative: negativeHandler,
  integer: integerHandler,
  pastDate: pastDateHandler,
  futureDate: futureDateHandler,
  pattern: patternHandler,
  minLength: minLengthHandler,
  maxLength: maxLengthHandler,
  min: minHandler,
  max: maxHandler,
};

/**
 * Validate a custom validation rule
 *
 * Uses the strategy pattern to delegate to specific rule handlers.
 * This approach eliminates the need for large switch statements and
 * makes the code more maintainable and extensible.
 *
 * @param value - Value to validate
 * @param rule - Validation rule to apply
 * @param fieldLabel - Field label for error messages
 * @returns Validation result with errors
 *
 * @example
 * ```ts
 * const result = validateRule("test@example.com", { type: "email" }, "Email");
 * // => { valid: true, errors: [] }
 *
 * const result = validateRule("invalid", { type: "email" }, "Email");
 * // => { valid: false, errors: ["Email must be a valid email address"] }
 * ```
 */
export function validateRule(
  value: any,
  rule: ValidationRule,
  fieldLabel?: string,
): RuleValidationResult {
  const errors: string[] = [];
  const label = fieldLabel || "Value";

  // Get the appropriate handler for this rule type
  const handler = RULE_HANDLERS[rule.type];

  // If no handler exists, the rule is unknown - skip it
  if (!handler) {
    return { valid: true, errors: [] };
  }

  // Execute the handler and collect any error message
  const error = handler(value, rule, label);
  if (error) {
    errors.push(error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Register a custom validation rule handler
 *
 * Allows external code to extend the validation system with custom rules.
 *
 * @param ruleType - The rule type identifier
 * @param handler - The validation handler function
 *
 * @example
 * ```ts
 * registerRuleHandler("custom", (value, rule, label) => {
 *   if (!myCustomValidation(value)) {
 *     return `${label} failed custom validation`;
 *   }
 *   return null;
 * });
 * ```
 */
export function registerRuleHandler(
  ruleType: string,
  handler: ValidationRuleHandler,
): void {
  RULE_HANDLERS[ruleType] = handler;
}
