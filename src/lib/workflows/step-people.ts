/**
 * Who each step of a request is for — shown on the request's timeline.
 *
 * - A finished step: who acted on it (approved, rejected, completed…).
 * - The active step: who it is waiting for, from its assignee snapshot.
 * - A step not reached yet: who it is expected to go to, worked out from the
 *   request's own data where it can be (the requester's line manager, the
 *   people in the chosen service's role, the person picked in a field, the
 *   people for the chosen option), and described otherwise.
 *
 * Pure, so the request page and tests share it. The engine still decides
 * the real assignees when a step starts; an upcoming step's list is a
 * preview.
 */

export interface StepActor {
  name: string;
  /** "Approved", "Rejected", "Completed", "Acknowledged". */
  action: string;
  asFormOwner: boolean;
}

export type StepPeople =
  | { state: "done"; actors: StepActor[]; assigned: string[] }
  | { state: "waiting"; assigned: string[] }
  | { state: "upcoming"; expected: string[] };

export interface StepPeopleContext {
  nameOfUser: (userId: string) => string | null;
  roleLabel: (roleId: string) => string | null;
  fieldLabel: (fieldKey: string) => string;
  fieldValues: Record<string, unknown>;
  requesterName: string | null;
  managerName: string | null;
  /** Names of the people in a role of the service chosen in a field. */
  serviceAssignees: (fieldKey: string, role: string) => string[];
}

const SERVICE_ROLE_LABEL: Record<string, string> = {
  OWNER: "Service owner",
  CYBERSECURITY: "Cybersecurity approver",
  IMPLEMENTER: "Implementer",
};

const ACTION_LABEL: Record<string, string> = {
  "step.approve": "Approved",
  "step.reject": "Rejected",
  "step.complete": "Completed",
  "step.acknowledge": "Acknowledged",
};

/** Audit actions that record a person deciding a step. */
export const STEP_DECISION_ACTIONS = Object.keys(ACTION_LABEL);

export function actionLabel(action: string): string | null {
  return ACTION_LABEL[action] ?? null;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && !!v);
  }
  return typeof value === "string" && value ? [value] : [];
}

function names(ids: readonly string[], ctx: StepPeopleContext): string[] {
  return ids
    .map((id) => ctx.nameOfUser(id))
    .filter((name): name is string => !!name);
}

/** The people (or a description of them) one assignee spec points to. */
function expectedFor(raw: unknown, ctx: StepPeopleContext): string[] {
  const spec = (raw ?? {}) as Record<string, unknown>;
  switch (spec.kind) {
    case "USER": {
      const name = ctx.nameOfUser(String(spec.userId ?? ""));
      return name ? [name] : [];
    }
    case "ROLE": {
      const role = ctx.roleLabel(String(spec.roleId ?? ""));
      return [role ? `Anyone with the ${role} role` : "A role"];
    }
    case "REQUESTER":
      return [ctx.requesterName ?? "The requester"];
    case "REQUESTER_MANAGER":
      return [ctx.managerName ?? "Requester's line manager"];
    case "FIELD_USER": {
      const key = String(spec.fieldKey ?? "");
      const picked = names(asList(ctx.fieldValues[key]), ctx);
      return picked.length > 0
        ? picked
        : [`The person in ${ctx.fieldLabel(key)}`];
    }
    case "ACCESS_SERVICE_ROLE": {
      const key = String(spec.serviceSnapshotKey ?? "");
      const role = String(spec.role ?? "OWNER");
      const people = ctx.serviceAssignees(key, role);
      return people.length > 0
        ? people
        : [
            `${SERVICE_ROLE_LABEL[role] ?? "Service owner"} of the chosen service`,
          ];
    }
    case "OPTION_USERS": {
      const key = String(spec.fieldKey ?? "");
      const options = (spec.options ?? {}) as Record<string, unknown>;
      const chosen = asList(ctx.fieldValues[key]);
      const ids = chosen.flatMap((option) => asList(options[option]));
      const people = names(ids, ctx);
      return people.length > 0 ? people : [`Depends on ${ctx.fieldLabel(key)}`];
    }
    case "FALLBACK": {
      const primary = expectedFor(spec.primary, ctx);
      const fallbackKey = String(spec.fallbackFieldKey ?? "");
      const fallback = names(asList(ctx.fieldValues[fallbackKey]), ctx);
      // The manager when there is one, else the person picked instead.
      return ctx.managerName || fallback.length === 0 ? primary : fallback;
    }
    default:
      return [];
  }
}

/** Who a step not reached yet is expected to go to (deduplicated). */
export function expectedAssignees(
  assignees: unknown,
  ctx: StepPeopleContext,
): string[] {
  if (!Array.isArray(assignees)) return [];
  return [...new Set(assignees.flatMap((spec) => expectedFor(spec, ctx)))];
}

/** "Ahmed, Sara and 2 others" — keeps a step card to one line. */
export function joinNames(list: readonly string[], max = 3): string {
  if (list.length <= max) return list.join(", ");
  const rest = list.length - max;
  return `${list.slice(0, max).join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`;
}
