/**
 * Universal Field Validators
 *
 * Comprehensive validation functions for all field types in the data import system.
 * Provides type checking, format validation, range validation, and business rules.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */

import { isValid, parseISO, isFuture, isPast } from "date-fns";
import type {
  EntityFieldConfig,
  FieldType,
  FieldValidationResult,
  ValidationError,
  ValidationRule,
  LookupMap,
} from "./entity-config.types";

/**
 * Main validator class for field validation
 */
export class UniversalFieldValidator {
  /**
   * Validate a single field value
   */
  validateField(
    value: any,
    field: EntityFieldConfig,
    lookupMaps?: Map<string, LookupMap>,
  ): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required
    if (field.required && this.isEmpty(value)) {
      errors.push(`${field.label} is required`);
      return {
        field: field.name,
        valid: false,
        errors,
        warnings,
        value,
      };
    }

    // Skip further validation if empty and not required
    if (this.isEmpty(value)) {
      return {
        field: field.name,
        valid: true,
        errors: [],
        warnings: [],
        value: field.defaultValue ?? null,
      };
    }

    // Type validation
    const typeResult = this.validateType(value, field.type);
    if (!typeResult.valid) {
      errors.push(...typeResult.errors);
    }

    // Length validation
    if (field.minLength !== undefined || field.maxLength !== undefined) {
      const lengthResult = this.validateLength(
        String(value),
        field.minLength,
        field.maxLength,
        field.label,
      );
      if (!lengthResult.valid) {
        errors.push(...lengthResult.errors);
      }
    }

    // Range validation for numbers
    if (
      field.type === "number" &&
      (field.min !== undefined || field.max !== undefined)
    ) {
      const rangeResult = this.validateRange(
        Number(value),
        field.min,
        field.max,
        field.label,
      );
      if (!rangeResult.valid) {
        errors.push(...rangeResult.errors);
      }
    }

    // Pattern validation
    if (field.pattern) {
      const patternResult = this.validatePattern(
        String(value),
        field.pattern,
        field.label,
      );
      if (!patternResult.valid) {
        errors.push(...patternResult.errors);
      }
    }

    // Enum validation
    if (field.enum && field.enum.length > 0) {
      const enumResult = this.validateEnum(
        String(value),
        field.enum,
        field.label,
      );
      if (!enumResult.valid) {
        errors.push(...enumResult.errors);
      }
    }

    // Lookup validation
    if (field.type === "lookup" && field.lookupTarget && lookupMaps) {
      const lookupMap = lookupMaps.get(field.lookupTarget);
      if (lookupMap) {
        const lookupResult = this.validateLookup(
          String(value),
          lookupMap,
          field.label,
        );
        if (!lookupResult.valid) {
          errors.push(...lookupResult.errors);
        }
        if (lookupResult.warnings.length > 0) {
          warnings.push(...lookupResult.warnings);
        }
      }
    }

    // Custom validation rules
    if (field.validations && field.validations.length > 0) {
      for (const rule of field.validations) {
        const ruleResult = this.validateRule(value, rule, field.label);
        if (!ruleResult.valid) {
          if (rule.severity === "warning") {
            warnings.push(...ruleResult.errors);
          } else {
            errors.push(...ruleResult.errors);
          }
        }
      }
    }

    return {
      field: field.name,
      valid: errors.length === 0,
      errors,
      warnings,
      value,
    };
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  }

  /**
   * Validate field type
   */
  private validateType(
    value: any,
    type: FieldType,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case "string":
        if (typeof value !== "string") {
          errors.push("Must be text");
        }
        break;

      case "number":
        if (typeof value === "string") {
          const num = parseFloat(value);
          if (isNaN(num)) {
            errors.push("Must be a number");
          }
        } else if (typeof value !== "number") {
          errors.push("Must be a number");
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          const str = String(value).toLowerCase();
          const validBooleans = [
            "true",
            "false",
            "yes",
            "no",
            "1",
            "0",
            "y",
            "n",
          ];
          if (!validBooleans.includes(str)) {
            errors.push("Must be true/false or yes/no");
          }
        }
        break;

      case "date":
      case "datetime":
        if (!this.isValidDate(value)) {
          errors.push("Must be a valid date (YYYY-MM-DD)");
        }
        break;

      case "json":
        if (typeof value === "string") {
          try {
            JSON.parse(value);
          } catch {
            errors.push("Must be valid JSON");
          }
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate string length
   */
  validateLength(
    value: string,
    minLength?: number,
    maxLength?: number,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const label = fieldLabel || "Value";

    if (minLength !== undefined && value.length < minLength) {
      errors.push(`${label} must be at least ${minLength} characters`);
    }

    if (maxLength !== undefined && value.length > maxLength) {
      errors.push(`${label} must be at most ${maxLength} characters`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate numeric range
   */
  validateRange(
    value: number,
    min?: number,
    max?: number,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const label = fieldLabel || "Value";

    if (min !== undefined && value < min) {
      errors.push(`${label} must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      errors.push(`${label} must be at most ${max}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate regex pattern
   */
  validatePattern(
    value: string,
    pattern: RegExp,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pattern.test(value)) {
      errors.push(`${fieldLabel || "Value"} has an invalid format`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate enum value
   */
  validateEnum(
    value: string,
    allowedValues: string[],
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!allowedValues.includes(value)) {
      errors.push(
        `${fieldLabel || "Value"} must be one of: ${allowedValues.join(", ")}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate lookup reference
   */
  validateLookup(
    value: string,
    lookupMap: LookupMap,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!lookupMap.entries.has(value)) {
      errors.push(
        `${fieldLabel || "Value"} '${value}' not found in ${lookupMap.targetEntity}`,
      );

      // Find closest match for suggestion
      const closest = this.findClosestMatch(value, lookupMap.allValues);
      if (closest && closest.similarity > 70) {
        warnings.push(`Did you mean '${closest.match}'?`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate custom validation rule
   */
  private validateRule(
    value: any,
    rule: ValidationRule,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const label = fieldLabel || "Value";

    switch (rule.type) {
      case "email":
        if (!this.isValidEmail(String(value))) {
          errors.push(rule.message || `${label} must be a valid email address`);
        }
        break;

      case "url":
        if (!this.isValidURL(String(value))) {
          errors.push(rule.message || `${label} must be a valid URL`);
        }
        break;

      case "phone":
        if (!this.isValidPhone(String(value))) {
          errors.push(rule.message || `${label} must be a valid phone number`);
        }
        break;

      case "alphanumeric":
        if (!/^[a-zA-Z0-9]+$/.test(String(value))) {
          errors.push(rule.message || `${label} must be alphanumeric`);
        }
        break;

      case "numeric":
        if (!/^\d+$/.test(String(value))) {
          errors.push(rule.message || `${label} must be numeric`);
        }
        break;

      case "positive":
        if (Number(value) <= 0) {
          errors.push(rule.message || `${label} must be positive`);
        }
        break;

      case "negative":
        if (Number(value) >= 0) {
          errors.push(rule.message || `${label} must be negative`);
        }
        break;

      case "integer":
        if (!Number.isInteger(Number(value))) {
          errors.push(rule.message || `${label} must be an integer`);
        }
        break;

      case "pastDate":
        if (this.isValidDate(value)) {
          const date = new Date(value);
          if (!isPast(date)) {
            errors.push(rule.message || `${label} must be in the past`);
          }
        }
        break;

      case "futureDate":
        if (this.isValidDate(value)) {
          const date = new Date(value);
          if (!isFuture(date)) {
            errors.push(rule.message || `${label} must be in the future`);
          }
        }
        break;

      case "pattern":
        if (
          rule.value &&
          typeof rule.value === "string" &&
          !new RegExp(rule.value).test(String(value))
        ) {
          errors.push(rule.message || `${label} has an invalid format`);
        }
        break;

      case "minLength":
        if (
          rule.value &&
          typeof rule.value === "number" &&
          String(value).length < rule.value
        ) {
          errors.push(
            rule.message ||
              `${label} must be at least ${rule.value} characters`,
          );
        }
        break;

      case "maxLength":
        if (
          rule.value &&
          typeof rule.value === "number" &&
          String(value).length > rule.value
        ) {
          errors.push(
            rule.message || `${label} must be at most ${rule.value} characters`,
          );
        }
        break;

      case "min":
        if (
          rule.value &&
          typeof rule.value === "number" &&
          Number(value) < rule.value
        ) {
          errors.push(
            rule.message || `${label} must be at least ${rule.value}`,
          );
        }
        break;

      case "max":
        if (
          rule.value &&
          typeof rule.value === "number" &&
          Number(value) > rule.value
        ) {
          errors.push(rule.message || `${label} must be at most ${rule.value}`);
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
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
  private isValidPhone(phone: string): boolean {
    // Remove common separators
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    // Check if remaining characters are digits (and optionally starts with +)
    return /^\+?\d{8,15}$/.test(cleaned);
  }

  /**
   * Validate date
   */
  private isValidDate(value: any): boolean {
    if (!value) return false;

    // Try parsing as ISO date
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(date);
  }

  /**
   * Find closest match using Levenshtein distance
   */
  private findClosestMatch(
    input: string,
    validValues: string[],
  ): { match: string; similarity: number } | null {
    if (validValues.length === 0) return null;

    let closestMatch = validValues[0];
    let minDistance = this.levenshteinDistance(
      input.toLowerCase(),
      closestMatch.toLowerCase(),
    );

    for (const value of validValues.slice(1)) {
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        value.toLowerCase(),
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = value;
      }
    }

    // Calculate similarity percentage
    const maxLength = Math.max(input.length, closestMatch.length);
    const similarity = Math.round(
      ((maxLength - minDistance) / maxLength) * 100,
    );

    return { match: closestMatch, similarity };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize first column and row
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Validate uniqueness within a dataset
   */
  validateUnique(
    value: any,
    existingValues: Set<string>,
    fieldLabel?: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (existingValues.has(String(value))) {
      errors.push(`${fieldLabel || "Value"} '${value}' is duplicated`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a complete row
   */
  validateRow(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
    rowNumber: number,
    lookupMaps?: Map<string, LookupMap>,
  ): {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const field of fields) {
      const value = row[field.name];
      const result = this.validateField(value, field, lookupMaps);

      if (!result.valid) {
        for (const error of result.errors) {
          errors.push({
            field: field.name,
            message: error,
            severity: "error",
            value,
          });
        }
      }

      for (const warning of result.warnings) {
        warnings.push({
          field: field.name,
          message: warning,
          severity: "warning",
          value,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Singleton instance
 */
export const fieldValidator = new UniversalFieldValidator();
