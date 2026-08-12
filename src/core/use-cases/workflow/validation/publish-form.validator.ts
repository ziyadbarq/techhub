/**
 * Validates a form draft before it can be published.
 * Returns an array of human-readable error strings; empty means valid.
 */

import type { FormFieldDefinition, FormSchema } from "@/core/domain/workflow";

const PROTECTED_PREFIX = "_sys_";
const ALLOWED_SYSTEM_FIELDS = new Set([
  "REQUESTER_NAME",
  "REQUESTER_EMAIL",
  "REQUESTER_MANAGER_NAME",
]);

// Sync-only expression parse check (just ensures the object has known structure)
function isValidExpression(expr: unknown): boolean {
  if (expr === null || expr === undefined) return false;
  if (typeof expr !== "object" || Array.isArray(expr)) return false;
  const obj = expr as Record<string, unknown>;
  // Must have at least one known key
  const known = [
    "const",
    "field",
    "now",
    "not",
    "and",
    "or",
    "op",
    "in",
    "addDays",
  ];
  return known.some((k) => k in obj);
}

export interface PublishFormValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFormForPublish(
  schema: FormSchema,
  allowedLookupSources: Set<string>,
): PublishFormValidationResult {
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  for (const field of schema.fields) {
    // Duplicate key check
    if (seenKeys.has(field.key)) {
      errors.push(`Duplicate field key: "${field.key}"`);
    }
    seenKeys.add(field.key);

    // Protected prefix check — admins must not author _sys_ keys
    if (field.key.startsWith(PROTECTED_PREFIX)) {
      errors.push(
        `Field key "${field.key}" uses the reserved prefix "_sys_" — choose a different key.`,
      );
    }

    // SYSTEM_FIELD checks
    if (field.type === "SYSTEM_FIELD") {
      if (field.required) {
        errors.push(`SYSTEM_FIELD "${field.key}" must not be required.`);
      }
      const config = field.config as { systemField?: string } | undefined;
      if (
        !config?.systemField ||
        !ALLOWED_SYSTEM_FIELDS.has(config.systemField)
      ) {
        errors.push(
          `SYSTEM_FIELD "${field.key}" has an invalid or missing systemField config. ` +
            `Allowed values: ${[...ALLOWED_SYSTEM_FIELDS].join(", ")}.`,
        );
      }
      if (field.computedFormula) {
        errors.push(
          `SYSTEM_FIELD "${field.key}" must not have a computedFormula.`,
        );
      }
    }

    // LOOKUP[ACCESS_SERVICES] checks
    if (field.type === "LOOKUP") {
      const config = field.config as { dataSource?: string } | undefined;
      if (config?.dataSource && config.dataSource !== "static") {
        if (!allowedLookupSources.has(config.dataSource)) {
          errors.push(
            `LOOKUP field "${field.key}" references unknown dataSource "${config.dataSource}".`,
          );
        }
      }
    }

    // Expression syntax check (visibility rules)
    if (field.visibilityRules) {
      if (!isValidExpression(field.visibilityRules)) {
        errors.push(
          `Field "${field.key}" has an invalid visibilityRules expression.`,
        );
      }
    }

    // Expression syntax check (computed formula)
    if (field.computedFormula && field.type !== "SYSTEM_FIELD") {
      if (!isValidExpression(field.computedFormula)) {
        errors.push(
          `Field "${field.key}" has an invalid computedFormula expression.`,
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Re-export FormFieldDefinition for use in tests
export type { FormFieldDefinition };
