/**
 * Plain-language descriptions of who a step is assigned to.
 *
 * The graph stores engine specs (`REQUESTER_MANAGER`, `ROLE` + id, …); the
 * builder shows "Requester's line manager", "Anyone with the Workflow Officer
 * role", and so on. Pure, for tests.
 */

export type AssigneeKind =
  | "REQUESTER_MANAGER"
  | "ROLE"
  | "USER"
  | "REQUESTER"
  | "FIELD_USER"
  | "ACCESS_SERVICE_ROLE"
  | "OPTION_USERS"
  | "FALLBACK";

export interface DirectoryUser {
  id: string;
  name: string | null;
  email: string;
}

export interface DirectoryRole {
  id: string;
  name: string;
  displayName?: string | null;
}

export interface FormFieldRef {
  key: string;
  label: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface Directory {
  users: readonly DirectoryUser[];
  roles: readonly DirectoryRole[];
  fields: readonly FormFieldRef[];
}

export const ASSIGNEE_OPTIONS: ReadonlyArray<{
  kind: AssigneeKind;
  label: string;
  hint: string;
}> = [
  {
    kind: "REQUESTER_MANAGER",
    label: "Requester's line manager",
    hint: "From the organisation chart",
  },
  {
    kind: "ROLE",
    label: "People with a role",
    hint: "Anyone holding the role",
  },
  { kind: "USER", label: "A specific person", hint: "Always the same person" },
  { kind: "REQUESTER", label: "The requester", hint: "Whoever submitted it" },
  {
    kind: "FIELD_USER",
    label: "Person chosen in the form",
    hint: "From a person field",
  },
  {
    kind: "ACCESS_SERVICE_ROLE",
    label: "Owner of the chosen service",
    hint: "From a service field",
  },
  {
    kind: "OPTION_USERS",
    label: "Depends on the answer",
    hint: "People per option of a choice field",
  },
  {
    kind: "FALLBACK",
    label: "Line manager, or a backup",
    hint: "Backup from a person field",
  },
];

export const SERVICE_ROLE_LABEL: Record<string, string> = {
  OWNER: "Service owner",
  CYBERSECURITY: "Cybersecurity contact",
  IMPLEMENTER: "Implementer",
};

/** Fields whose answer can pick the assignee: one or more fixed options. */
export const CHOICE_FIELD_TYPES = new Set([
  "DROPDOWN",
  "RADIO",
  "MULTI_SELECT",
]);

export function choiceOptions(field: FormFieldRef | undefined): string[] {
  const options = field?.config?.options;
  return Array.isArray(options)
    ? options.filter((o): o is string => typeof o === "string" && !!o)
    : [];
}

/** True when at least one option of an OPTION_USERS assignee has someone. */
export function hasOptionUsers(raw: unknown): boolean {
  const options = (raw as { options?: unknown } | null)?.options;
  if (!options || typeof options !== "object") return false;
  return Object.values(options as Record<string, unknown>).some(
    (users) => Array.isArray(users) && users.length > 0,
  );
}

export function roleLabel(role: DirectoryRole): string {
  const display = role.displayName?.trim();
  if (display) return display;
  return role.name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

function fieldLabel(directory: Directory, key: unknown): string {
  if (typeof key !== "string" || !key) return "a form field";
  const field = directory.fields.find((f) => f.key === key);
  return field ? `“${field.label}”` : `field “${key}”`;
}

export function describeAssignee(raw: unknown, directory: Directory): string {
  const spec = (raw ?? {}) as Record<string, unknown>;
  switch (spec.kind) {
    case "REQUESTER_MANAGER":
      return "Requester's line manager";
    case "REQUESTER":
      return "The requester";
    case "ROLE": {
      const role = directory.roles.find((r) => r.id === spec.roleId);
      return role
        ? `Anyone with the ${roleLabel(role)} role`
        : "A role (not chosen yet)";
    }
    case "USER": {
      const user = directory.users.find((u) => u.id === spec.userId);
      return user ? user.name || user.email : "A person (not chosen yet)";
    }
    case "FIELD_USER":
      return `The person in ${fieldLabel(directory, spec.fieldKey)}`;
    case "ACCESS_SERVICE_ROLE": {
      const role =
        SERVICE_ROLE_LABEL[String(spec.role ?? spec.serviceRole ?? "OWNER")] ??
        "Service owner";
      return `${role} of the service in ${fieldLabel(directory, spec.serviceSnapshotKey)}`;
    }
    case "OPTION_USERS":
      return `Depends on the answer to ${fieldLabel(directory, spec.fieldKey)}`;
    case "FALLBACK":
      return `Line manager, or the person in ${fieldLabel(directory, spec.fallbackFieldKey)}`;
    default:
      return "Unknown assignee";
  }
}

/** One short line for a step card: "Requester's line manager +1". */
export function summariseAssignees(
  assignees: unknown,
  directory: Directory,
): string | null {
  if (!Array.isArray(assignees) || assignees.length === 0) return null;
  const first = describeAssignee(assignees[0], directory);
  return assignees.length > 1 ? `${first} +${assignees.length - 1}` : first;
}

export const APPROVAL_RULES: ReadonlyArray<{
  value: string;
  label: string;
  hint: string;
}> = [
  {
    value: "ANY",
    label: "Any one of them",
    hint: "The first approval moves it on.",
  },
  { value: "ALL", label: "Everyone", hint: "Every assignee must approve." },
  {
    value: "MAJORITY",
    label: "More than half",
    hint: "A majority of assignees approve.",
  },
  {
    value: "QUORUM",
    label: "A set number",
    hint: "At least the number you choose.",
  },
];

export function approvalRuleLabel(policy: unknown, quorum?: unknown): string {
  if (policy === "UNANIMOUS") return "Everyone";
  if (policy === "QUORUM") {
    const n = Number(quorum);
    return Number.isInteger(n) && n > 0 ? `At least ${n}` : "A set number";
  }
  return (
    APPROVAL_RULES.find((r) => r.value === policy)?.label ?? "Any one of them"
  );
}
