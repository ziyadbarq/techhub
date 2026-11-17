/**
 * OPTION_USERS assignee resolver: the people mapped to the option(s) chosen
 * in a choice field. A single choice is a string, a multi-select an array;
 * the result is everyone mapped to any chosen option, without duplicates.
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

export function chosenOptions(value: unknown): string[] {
  if (typeof value === "string") return value ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && !!v);
  }
  return [];
}

@injectable()
export class OptionUsersAssigneeResolver implements IAssigneeResolver {
  readonly kind = "OPTION_USERS" as const;

  async resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "OPTION_USERS") return [];
    const users = new Set<string>();
    for (const option of chosenOptions(exec.fieldValues[spec.fieldKey])) {
      const mapped = spec.options?.[option];
      if (!Array.isArray(mapped)) continue;
      for (const userId of mapped) {
        if (typeof userId === "string" && userId) users.add(userId);
      }
    }
    return [...users];
  }
}
