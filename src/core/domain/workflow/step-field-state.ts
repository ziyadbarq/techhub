/**
 * Who may change which form field, and when.
 *
 * A form's `perStepFieldState` says, per step, whether a field is EDITABLE,
 * READ_ONLY or HIDDEN; a field a step doesn't mention is EDITABLE (what the
 * workflow builder shows). The submission itself is the "SUBMIT" step.
 * Fields filled by the system (SYSTEM_FIELD, COMPUTED, SECTION_HEADER) are
 * never editable by anyone.
 *
 * Pure: the engine and the request page use the same rules.
 */

import type { FormFieldDefinition, FormSchema } from "./types";

export const SUBMIT_STEP_KEY = "SUBMIT";

export type StepFieldState = "EDITABLE" | "READ_ONLY" | "HIDDEN";

const SYSTEM_FILLED = new Set(["SYSTEM_FIELD", "COMPUTED", "SECTION_HEADER"]);

export function isSystemFilled(
  field: Pick<FormFieldDefinition, "type" | "key">,
) {
  return SYSTEM_FILLED.has(field.type) || field.key.startsWith("_sys_");
}

export function fieldStateAt(
  schema: Pick<FormSchema, "perStepFieldState">,
  stepKey: string,
  field: Pick<FormFieldDefinition, "type" | "key">,
): StepFieldState {
  const state = schema.perStepFieldState?.[stepKey]?.[field.key];
  if (state === "HIDDEN") return "HIDDEN";
  if (isSystemFilled(field)) return "READ_ONLY";
  return state ?? "EDITABLE";
}

export function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Checks the field changes sent with an action on a step. Returns readable
 * problems; none means the changes may be applied.
 *
 * - Only fields EDITABLE at this step may change.
 * - Approving or completing needs every required field that is EDITABLE at
 *   this step and currently shown to have a value (rejecting doesn't).
 */
export function checkStepFieldUpdates(input: {
  schema: FormSchema;
  stepKey: string;
  updates: Record<string, unknown>;
  /** Field values after the updates are applied. */
  merged: Record<string, unknown>;
  action: string;
  /** Whether a field's condition currently shows it (true when it has none). */
  isShown: (field: FormFieldDefinition) => boolean;
}): string[] {
  const { schema, stepKey, updates, merged, action, isShown } = input;
  const problems: string[] = [];
  const byKey = new Map(schema.fields.map((f) => [f.key, f]));

  for (const key of Object.keys(updates)) {
    const field = byKey.get(key);
    if (!field) {
      problems.push(`"${key}" is not a field of this form.`);
    } else if (fieldStateAt(schema, stepKey, field) !== "EDITABLE") {
      problems.push(`${field.label} can't be changed at this step.`);
    }
  }

  if (action === "APPROVE" || action === "COMPLETE") {
    for (const field of schema.fields) {
      if (!field.required) continue;
      if (fieldStateAt(schema, stepKey, field) !== "EDITABLE") continue;
      if (!isShown(field)) continue;
      if (isEmptyValue(merged[field.key])) {
        problems.push(`${field.label} is required.`);
      }
    }
  }
  return problems;
}
