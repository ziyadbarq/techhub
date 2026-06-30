/**
 * FIELD_USER assignee resolver — resolves to the user(s) referenced by a
 * specific form field value. Supports both single-user (string) and
 * multi-user (string[]) field values.
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class FieldUserAssigneeResolver implements IAssigneeResolver {
  readonly kind = "FIELD_USER" as const;

  async resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "FIELD_USER") return [];
    const v = exec.fieldValues[spec.fieldKey];
    if (typeof v === "string" && v.length > 0) return [v];
    if (Array.isArray(v))
      return v.filter((x): x is string => typeof x === "string");
    return [];
  }
}
