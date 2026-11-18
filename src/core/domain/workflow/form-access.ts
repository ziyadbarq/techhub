/**
 * What a form's people may do on its requests, beyond the workflow's own
 * step assignees.
 *
 * - OWNER   — act on any active step (approve, reject, complete…) without
 *             being assigned; their decision completes the step.
 * - MANAGER — correct the field values of a submitted request.
 * - VIEWER  — open and follow every request of the form.
 *
 * Each role includes the ones below it: an owner may also correct fields and
 * view, a manager may also view.
 *
 * Pure: the engine, the API routes and the request page share it.
 */

import { isEmptyValue, isSystemFilled } from "./step-field-state";
import type { FormFieldDefinition, FormSchema } from "./types";

export const FORM_MEMBER_ROLES = ["OWNER", "MANAGER", "VIEWER"] as const;
export type FormMemberRole = (typeof FORM_MEMBER_ROLES)[number];

export interface FormAccess {
  canView: boolean;
  canCorrectFields: boolean;
  canActOnAnyStep: boolean;
}

export const NO_FORM_ACCESS: FormAccess = {
  canView: false,
  canCorrectFields: false,
  canActOnAnyStep: false,
};

export function formAccessFor(
  roles: ReadonlyArray<FormMemberRole | string>,
): FormAccess {
  const owner = roles.includes("OWNER");
  const manager = owner || roles.includes("MANAGER");
  const viewer = manager || roles.includes("VIEWER");
  return {
    canView: viewer,
    canCorrectFields: manager,
    canActOnAnyStep: owner,
  };
}

/**
 * Fields a form manager may correct on a submitted request.
 *
 * Not: fields the system fills (requester details, computed values, section
 * headers), files (they belong to whoever uploaded them), hidden or
 * admin-only fields, or an Access Services lookup (the request's approvers
 * were taken from it at submit, so changing it would leave them out of step).
 */
export function isCorrectableField(
  field: Pick<FormFieldDefinition, "type" | "key"> & {
    visibility?: string;
    config?: Record<string, unknown> | null;
  },
): boolean {
  if (isSystemFilled(field)) return false;
  if (field.type === "FILE") return false;
  if (field.visibility === "HIDDEN") return false;
  if (field.visibility === "ADMINISTRATIVE") return false;
  if (
    field.type === "LOOKUP" &&
    field.config?.dataSource === "ACCESS_SERVICES"
  ) {
    return false;
  }
  return true;
}

/**
 * Checks a form manager's corrections. Returns readable problems; none means
 * they may be applied.
 *
 * - Only correctable fields may change.
 * - A required field the form currently shows can't be emptied.
 */
export function checkFieldCorrections(input: {
  schema: FormSchema;
  updates: Record<string, unknown>;
  /** Field values after the corrections are applied. */
  merged: Record<string, unknown>;
  /** Whether a field's condition currently shows it (true when it has none). */
  isShown: (field: FormFieldDefinition) => boolean;
}): string[] {
  const { schema, updates, merged, isShown } = input;
  const problems: string[] = [];
  const byKey = new Map(schema.fields.map((f) => [f.key, f]));

  if (Object.keys(updates).length === 0) {
    problems.push("Nothing to change.");
  }
  for (const key of Object.keys(updates)) {
    const field = byKey.get(key);
    if (!field) {
      problems.push(`"${key}" is not a field of this form.`);
    } else if (!isCorrectableField(field)) {
      problems.push(`${field.label} can't be corrected.`);
    } else if (
      field.required &&
      isShown(field) &&
      isEmptyValue(merged[field.key])
    ) {
      problems.push(`${field.label} is required.`);
    }
  }
  return problems;
}
