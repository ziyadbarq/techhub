/**
 * CSV Data Sanitization Utilities
 *
 * Provides comprehensive data cleaning and normalization for imported data.
 * Handles whitespace, special characters, format standardization, and auto-fixes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-control-regex */

import type {
  EntityFieldConfig,
  FieldType,
  SanitizationRule,
} from "./entity-config.types";

/**
 * Main sanitizer class for cleaning import data
 */
export class CSVSanitizer {
  /**
   * Sanitize an entire row of data based on field configurations
   */
  sanitizeRow(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const field of fields) {
      const value = row[field.name];

      if (value === null || value === undefined || value === "") {
        sanitized[field.name] = field.defaultValue ?? undefined;
        continue;
      }

      // Apply field-specific sanitization
      sanitized[field.name] = this.sanitizeValue(
        value,
        field.type,
        field.sanitization,
      );
    }

    return sanitized;
  }

  /**
   * Sanitize a single value based on type and rules
   */
  sanitizeValue(value: any, type: FieldType, rules?: SanitizationRule[]): any {
    if (value === null || value === undefined) {
      return undefined;
    }

    // Convert to string for initial processing
    let sanitized = String(value);

    // Apply sanitization rules in order
    if (rules && rules.length > 0) {
      for (const rule of rules) {
        sanitized = this.applySanitizationRule(sanitized, rule);
      }
    }

    // Type-specific sanitization
    switch (type) {
      case "string":
        return this.sanitizeString(sanitized);
      case "number":
        return this.sanitizeNumber(sanitized);
      case "boolean":
        return this.sanitizeBoolean(sanitized);
      case "date":
      case "datetime":
        return this.sanitizeDate(sanitized);
      case "enum":
        return this.sanitizeEnum(sanitized);
      case "lookup":
        return this.sanitizeLookup(sanitized);
      case "json":
        return this.sanitizeJSON(sanitized);
      default:
        return sanitized;
    }
  }

  /**
   * Apply a single sanitization rule
   */
  private applySanitizationRule(value: string, rule: SanitizationRule): string {
    switch (rule.operation) {
      case "trim":
        return value.trim();

      case "uppercase":
        return value.toUpperCase();

      case "lowercase":
        return value.toLowerCase();

      case "titleCase":
        return this.toTitleCase(value);

      case "removeSpaces":
        return value.replace(/\s+/g, "");

      case "removeSpecialChars":
        return value.replace(/[^a-zA-Z0-9\s-]/g, "");

      case "normalizeWhitespace":
        return value.replace(/\s+/g, " ").trim();

      case "removeBOM":
        return value.replace(/^\uFEFF/, "");

      case "normalizeLineEndings":
        return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      default:
        return value;
    }
  }

  /**
   * Sanitize string values
   */
  private sanitizeString(value: string): string {
    // Remove invisible characters
    let cleaned = this.removeInvisibleChars(value);

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Fix smart quotes to straight quotes
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"'); // Smart double quotes

    // Fix em-dash and en-dash to hyphen
    cleaned = cleaned.replace(/[\u2013\u2014]/g, "-");

    return cleaned;
  }

  /**
   * Sanitize numeric values
   */
  private sanitizeNumber(value: string): number | null {
    if (!value || value.trim() === "") {
      return null;
    }

    // Remove common formatting
    const cleaned = value
      .trim()
      .replace(/,/g, "") // Remove thousands separators
      .replace(/\$/g, "") // Remove currency symbols
      .replace(/€/g, "")
      .replace(/£/g, "")
      .replace(/ر\.س/g, "") // SAR symbol
      .replace(/SAR/gi, "")
      .replace(/USD/gi, "")
      .replace(/EUR/gi, "")
      .replace(/GBP/gi, "");

    // Handle percentages
    if (cleaned.endsWith("%")) {
      const num = parseFloat(cleaned.replace("%", ""));
      return isNaN(num) ? null : num / 100;
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Sanitize boolean values
   */
  private sanitizeBoolean(value: string): boolean | null {
    if (!value) {
      return null;
    }

    const cleaned = value.toString().trim().toLowerCase();

    // True values
    const trueValues = [
      "true",
      "yes",
      "y",
      "1",
      "on",
      "t",
      "enabled",
      "active",
    ];
    if (trueValues.includes(cleaned)) {
      return true;
    }

    // False values
    const falseValues = [
      "false",
      "no",
      "n",
      "0",
      "off",
      "f",
      "disabled",
      "inactive",
    ];
    if (falseValues.includes(cleaned)) {
      return false;
    }

    return null;
  }

  /**
   * Sanitize date values
   */
  private sanitizeDate(value: string): string | null {
    if (!value || value.trim() === "") {
      return null;
    }

    const cleaned = value.trim();

    // Try parsing as ISO date first
    const isoDate = new Date(cleaned);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString().split("T")[0]; // Return YYYY-MM-DD
    }

    // Try common date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY
    ];

    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        // Try both date interpretations (US vs EU format)
        const attempts = [
          new Date(`${match[3]}-${match[1]}-${match[2]}`), // YYYY-MM-DD
          new Date(`${match[3]}-${match[2]}-${match[1]}`), // YYYY-DD-MM
        ];

        for (const attempt of attempts) {
          if (!isNaN(attempt.getTime())) {
            return attempt.toISOString().split("T")[0];
          }
        }
      }
    }

    return null;
  }

  /**
   * Sanitize enum values
   */
  private sanitizeEnum(value: string): string {
    return value.trim().toUpperCase();
  }

  /**
   * Sanitize lookup values (codes, references)
   */
  private sanitizeLookup(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^A-Z0-9_-]/g, ""); // Remove invalid characters
  }

  /**
   * Sanitize JSON values
   */
  private sanitizeJSON(value: string): any {
    if (!value || value.trim() === "") {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  /**
   * Remove invisible and control characters
   */
  private removeInvisibleChars(value: string): string {
    return value
      .replace(/\uFEFF/g, "") // BOM
      .replace(/\u200B/g, "") // Zero-width space
      .replace(/\u200C/g, "") // Zero-width non-joiner
      .replace(/\u200D/g, "") // Zero-width joiner
      .replace(/\u2060/g, "") // Word joiner
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Control characters
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Trim all fields in a row
   */
  trimAllFields(row: Record<string, any>): Record<string, any> {
    const trimmed: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string") {
        trimmed[key] = value.trim();
      } else {
        trimmed[key] = value;
      }
    }

    return trimmed;
  }

  /**
   * Normalize case for all fields based on type
   */
  normalizeCaseByType(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
  ): Record<string, any> {
    const normalized: Record<string, any> = {};

    for (const field of fields) {
      const value = row[field.name];

      if (typeof value !== "string") {
        normalized[field.name] = value;
        continue;
      }

      // Apply case normalization based on field type
      switch (field.type) {
        case "lookup":
        case "enum":
          normalized[field.name] = value.toUpperCase();
          break;

        case "string":
          if (field.name.toLowerCase().includes("email")) {
            normalized[field.name] = value.toLowerCase();
          } else if (
            field.name.toLowerCase().includes("name") ||
            field.name.toLowerCase().includes("title")
          ) {
            normalized[field.name] = this.toTitleCase(value);
          } else {
            normalized[field.name] = value;
          }
          break;

        default:
          normalized[field.name] = value;
      }
    }

    return normalized;
  }

  /**
   * Auto-fix common data entry errors
   */
  autoFixCommonErrors(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
  ): Record<string, any> {
    const fixed: Record<string, any> = {};

    for (const field of fields) {
      let value = row[field.name];

      if (value === null || value === undefined) {
        fixed[field.name] = value;
        continue;
      }

      // Fix common typos and variations
      if (typeof value === "string") {
        value = this.fixCommonTypos(value);
        value = this.fixDateFormats(value, field.type);
        value = this.fixBooleanVariations(value, field.type);
        value = this.fixNumberFormats(value, field.type);
      }

      fixed[field.name] = value;
    }

    return fixed;
  }

  /**
   * Fix common typos
   */
  private fixCommonTypos(value: string): string {
    const typoMap: Record<string, string> = {
      emial: "email",
      addres: "address",
      adress: "address",
      teh: "the",
      recieve: "receive",
      seperate: "separate",
      occured: "occurred",
    };

    let fixed = value;
    for (const [typo, correct] of Object.entries(typoMap)) {
      fixed = fixed.replace(new RegExp(`\\b${typo}\\b`, "gi"), correct);
    }

    return fixed;
  }

  /**
   * Fix date format variations
   */
  private fixDateFormats(value: string, type: FieldType): string {
    if (type !== "date" && type !== "datetime") {
      return value;
    }

    // Common date format fixes
    return value
      .replace(/\//g, "-") // Replace slashes with hyphens
      .replace(/\./g, "-"); // Replace dots with hyphens
  }

  /**
   * Fix boolean variations
   */
  private fixBooleanVariations(value: string, type: FieldType): string {
    if (type !== "boolean") {
      return value;
    }

    const cleaned = value.trim().toLowerCase();

    // Map variations to standard true/false
    if (["yes", "y", "1", "on", "enabled", "active"].includes(cleaned)) {
      return "true";
    }

    if (["no", "n", "0", "off", "disabled", "inactive"].includes(cleaned)) {
      return "false";
    }

    return value;
  }

  /**
   * Fix number format variations
   */
  private fixNumberFormats(value: string, type: FieldType): string {
    if (type !== "number") {
      return value;
    }

    // Remove common number formatting
    return value
      .replace(/,/g, "") // Thousands separators
      .replace(/\$/g, "") // Currency symbols
      .replace(/€/g, "")
      .replace(/£/g, "")
      .trim();
  }

  /**
   * Check if a row is empty
   */
  isEmptyRow(row: Record<string, any>): boolean {
    return Object.values(row).every(
      (value) =>
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === ""),
    );
  }

  /**
   * Remove empty rows from dataset
   */
  removeEmptyRows(rows: Record<string, any>[]): Record<string, any>[] {
    return rows.filter((row) => !this.isEmptyRow(row));
  }
}

/**
 * Singleton instance
 */
export const csvSanitizer = new CSVSanitizer();
