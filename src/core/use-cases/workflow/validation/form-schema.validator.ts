/**
 * Pure, synchronous form schema validator — no DI, no database, no server imports.
 * Safe to use in browser bundles for UX validation and in the server submit path.
 *
 * The async FormSubmissionValidator runs after this and handles DB-backed
 * checks (user IDs, lookup provider validation, request links).
 */

import type { Expression, ExpressionContext } from "@/core/domain/workflow";
import { ConfigurationError } from "@/core/domain/workflow";

// ─── Public types ─────────────────────────────────────────────────────────────

export type FieldVisibility = "EDITABLE" | "READ_ONLY" | "HIDDEN";
export type FieldAudience = "VISIBLE" | "HIDDEN" | "ADMINISTRATIVE";

export interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
  visibilityRules?: Expression;
  /** Builder-set audience override: "ADMINISTRATIVE" → skip required */
  visibility?: FieldAudience;
}

export interface FormSchema {
  fields: FieldSchema[];
  perStepFieldState?: Record<string, Record<string, FieldVisibility>>;
}

export interface ValidationError {
  fieldKey: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  /** Values safe to persist — protected/system fields stripped */
  sanitizedValues: Record<string, unknown>;
}

/** Thin interface so the pure validator can use the expression evaluator without DI */
export interface IExpressionEvaluatorLike {
  evaluateBoolean(expr: Expression, ctx: ExpressionContext): boolean;
}

const PROTECTED_TYPES = new Set(["SYSTEM_FIELD", "COMPUTED", "SECTION_HEADER"]);

const PROTECTED_PREFIX = "_sys_";
const SUBMIT_STEP_KEY = "SUBMIT";

// ─── Main validator ──────────────────────────────────────────────────────────

export function validateFormSchema(
  schema: FormSchema,
  rawValues: Record<string, unknown>,
  evaluator: IExpressionEvaluatorLike,
  stepKey: string = SUBMIT_STEP_KEY,
  systemContext?: Record<string, unknown>,
): FormValidationResult {
  const errors: ValidationError[] = [];
  const sanitizedValues: Record<string, unknown> = {};

  const schemaKeys = new Set(schema.fields.map((f) => f.key));

  // Step 1: reject unknown fields (not in schema)
  for (const key of Object.keys(rawValues)) {
    if (!schemaKeys.has(key)) {
      errors.push({
        fieldKey: key,
        message: `UNKNOWN_FIELD: field "${key}" is not part of this form`,
      });
    }
  }
  if (errors.length > 0) return { isValid: false, errors, sanitizedValues: {} };

  // Step 2: process each schema field
  const fieldsCtx: Record<string, unknown> = { ...rawValues, ...systemContext };

  for (const field of schema.fields) {
    const rawValue = rawValues[field.key];

    // Strip protected field types — never come from the client
    if (
      PROTECTED_TYPES.has(field.type) ||
      field.key.startsWith(PROTECTED_PREFIX)
    ) {
      continue; // do not add to sanitizedValues
    }

    // Compute effective visibility
    const effective = computeEffectiveVisibility(
      field,
      schema.perStepFieldState ?? {},
      stepKey,
      fieldsCtx,
      evaluator,
    );

    if (effective === "HIDDEN") {
      // Hidden fields are never required — skip and don't persist
      continue;
    }

    // Skip required validation for administrative / system audience
    const isAdministrative =
      field.visibility === "ADMINISTRATIVE" || effective === "READ_ONLY";

    if (!isAdministrative && field.required) {
      if (isEmpty(rawValue)) {
        errors.push({
          fieldKey: field.key,
          message: `${field.label} is required`,
        });
        continue;
      }
    }

    // Primitive type validation (sync only)
    const typeError = validateFieldType(field, rawValue);
    if (typeError) {
      errors.push({ fieldKey: field.key, message: typeError });
      continue;
    }

    // Accept value into sanitized output
    if (rawValue !== undefined) {
      sanitizedValues[field.key] = normalizeValue(field, rawValue);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValues,
  };
}

// ─── Visibility resolution ────────────────────────────────────────────────────

function computeEffectiveVisibility(
  field: FieldSchema,
  perStepFieldState: Record<string, Record<string, FieldVisibility>>,
  stepKey: string,
  fieldsCtx: Record<string, unknown>,
  evaluator: IExpressionEvaluatorLike,
): FieldVisibility {
  // 1. Per-step state matrix takes priority
  const stepMatrix = perStepFieldState[stepKey];
  if (stepMatrix) {
    const stateFromMatrix = stepMatrix[field.key];
    if (stateFromMatrix) {
      // SYSTEM_FIELDs are always READ_ONLY regardless of matrix
      if (field.type === "SYSTEM_FIELD" && stateFromMatrix === "EDITABLE") {
        return "READ_ONLY";
      }
      return stateFromMatrix;
    }
  }

  // 2. Evaluate visibility rules expression
  if (field.visibilityRules) {
    try {
      const visible = evaluator.evaluateBoolean(field.visibilityRules, {
        fields: fieldsCtx,
      });
      return visible ? "EDITABLE" : "HIDDEN";
    } catch {
      // Malformed published expression → fail with ConfigurationError
      throw new ConfigurationError(
        `Malformed visibility expression for field "${field.key}". ` +
          "Contact your workflow administrator.",
      );
    }
  }

  // 3. Default: EDITABLE (field is visible)
  return field.type === "SYSTEM_FIELD" ? "READ_ONLY" : "EDITABLE";
}

// ─── Type validation (sync) ───────────────────────────────────────────────────

function validateFieldType(field: FieldSchema, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;

  switch (field.type) {
    case "NUMBER": {
      const n = typeof value === "string" ? Number(value) : value;
      if (typeof n !== "number" || !Number.isFinite(n))
        return `${field.label} must be a finite number`;
      const config = field.config as { min?: number; max?: number } | undefined;
      if (config?.min !== undefined && (n as number) < config.min)
        return `${field.label} must be at least ${config.min}`;
      if (config?.max !== undefined && (n as number) > config.max)
        return `${field.label} must be at most ${config.max}`;
      return null;
    }

    case "DATE":
    case "DATETIME": {
      if (typeof value !== "string" || isNaN(Date.parse(value)))
        return `${field.label} must be a valid date`;
      return null;
    }

    case "CHECKBOX": {
      if (typeof value !== "boolean") return `${field.label} must be a boolean`;
      return null;
    }

    case "DROPDOWN": {
      const options = getOptions(field);
      if (options.length > 0 && !options.includes(String(value)))
        return `${field.label} has an invalid option`;
      return null;
    }

    case "MULTI_SELECT": {
      if (!Array.isArray(value)) return `${field.label} must be an array`;
      const options = getOptions(field);
      if (options.length > 0) {
        const invalid = (value as unknown[]).filter(
          (v) => !options.includes(String(v)),
        );
        if (invalid.length > 0)
          return `${field.label} contains invalid options`;
      }
      return null;
    }

    case "REPEATER": {
      if (!Array.isArray(value))
        return `${field.label} must be an array of rows`;
      const config = field.config as { maxRows?: number } | undefined;
      if (
        config?.maxRows !== undefined &&
        (value as unknown[]).length > config.maxRows
      )
        return `${field.label} exceeds maximum rows (${config.maxRows})`;
      return null;
    }

    case "SHORT_TEXT":
    case "LONG_TEXT": {
      if (typeof value !== "string") return `${field.label} must be a string`;
      const config = field.config as { maxLength?: number } | undefined;
      if (config?.maxLength && (value as string).length > config.maxLength)
        return `${field.label} exceeds maximum length (${config.maxLength})`;
      return null;
    }

    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function getOptions(field: FieldSchema): string[] {
  const config = field.config as
    | { options?: Array<{ value: string } | string> }
    | undefined;
  if (!config?.options) return [];
  return config.options.map((o) => (typeof o === "string" ? o : o.value));
}

function normalizeValue(field: FieldSchema, value: unknown): unknown {
  if (field.type === "NUMBER" && typeof value === "string") {
    return Number(value);
  }
  return value;
}
