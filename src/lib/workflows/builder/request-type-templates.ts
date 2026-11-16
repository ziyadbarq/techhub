/**
 * Request-type templates: a form AND its approval path, created together
 * from "New request type". Unlike the path-only WORKFLOW_TEMPLATES, these
 * also fill in the form's fields and per-step field visibility.
 */

import type { Graph } from "./graph";

type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";

export interface TemplateField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
}

export interface RequestTypeTemplate {
  id: string;
  name: string;
  description: string;
  /** Suggested request-type name and description. */
  suggestedName: string;
  suggestedDescription: string;
  fields: () => TemplateField[];
  graph: () => Graph;
  perStepFieldState: () => Record<string, Record<string, FieldStateValue>>;
}

const SERVICE_FIELD = "service";

const accessFields = (): TemplateField[] => [
  {
    key: "requester_name",
    label: "Requester name",
    type: "SYSTEM_FIELD",
    position: 1,
    config: { systemField: "REQUESTER_NAME" },
  },
  {
    key: "requester_email",
    label: "Requester email",
    type: "SYSTEM_FIELD",
    position: 2,
    config: { systemField: "REQUESTER_EMAIL" },
  },
  {
    key: "access_type",
    label: "Access type",
    type: "RADIO",
    required: true,
    position: 3,
    config: { options: ["New access", "New permission", "Revoke access"] },
  },
  {
    key: "expiry_date",
    label: "Expiry date",
    type: "DATE",
    position: 4,
  },
  {
    key: "justification",
    label: "Reason / justification",
    type: "LONG_TEXT",
    required: true,
    position: 5,
  },
  {
    key: SERVICE_FIELD,
    label: "Service",
    type: "LOOKUP",
    required: true,
    position: 6,
    config: { dataSource: "ACCESS_SERVICES" },
  },
  {
    key: "line_manager",
    label: "Requester line manager",
    type: "SYSTEM_FIELD",
    position: 7,
    config: { systemField: "REQUESTER_MANAGER_NAME" },
  },
  {
    key: "notes",
    label: "Notes",
    type: "LONG_TEXT",
    position: 8,
  },
];

const approval = (
  key: string,
  name: string,
  assignee: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) => ({
  key,
  type: "APPROVAL" as const,
  name,
  config: {
    type: "APPROVAL",
    assignees: [assignee],
    multiAssigneePolicy: "ANY",
    allowReject: true,
    ...extra,
  },
});

const accessGraph = (): Graph => {
  const steps = [
    approval(
      "manager_approval",
      "Line manager approval",
      { kind: "REQUESTER_MANAGER" },
      // Only for services whose catalog entry asks for it.
      { onlyWhenServiceRequiresManagerApproval: SERVICE_FIELD },
    ),
    approval("owner_approval", "Service owner approval", {
      kind: "ACCESS_SERVICE_ROLE",
      serviceSnapshotKey: SERVICE_FIELD,
      role: "OWNER",
    }),
    approval("cybersecurity_approval", "Cybersecurity approval", {
      kind: "ACCESS_SERVICE_ROLE",
      serviceSnapshotKey: SERVICE_FIELD,
      role: "CYBERSECURITY",
    }),
    {
      key: "implementation",
      type: "EXECUTION" as const,
      name: "Grant the access",
      config: {
        type: "EXECUTION",
        assignees: [
          {
            kind: "ACCESS_SERVICE_ROLE",
            serviceSnapshotKey: SERVICE_FIELD,
            role: "IMPLEMENTER",
          },
        ],
      },
    },
    {
      key: "requester_informed",
      type: "INFO_ACK" as const,
      name: "Requester informed",
      config: {
        type: "INFO_ACK",
        assignees: [{ kind: "REQUESTER" }],
        message: "Your access request has been completed.",
      },
    },
  ];
  return {
    start: steps[0]!.key,
    steps: steps.map((step, index) => {
      const following = steps[index + 1];
      const next = following
        ? step.type === "APPROVAL"
          ? { onAction: { APPROVE: following.key } }
          : { default: following.key }
        : undefined;
      return { ...step, position: index + 1, next };
    }),
  };
};

/** Approvers and the implementer read the request; they don't rewrite it. */
const accessFieldState = (): Record<
  string,
  Record<string, FieldStateValue>
> => {
  const readOnly = Object.fromEntries(
    accessFields()
      .filter((field) => field.type !== "SYSTEM_FIELD")
      .map((field) => [field.key, "READ_ONLY" as const]),
  );
  return {
    manager_approval: readOnly,
    owner_approval: readOnly,
    cybersecurity_approval: readOnly,
    implementation: { ...readOnly, notes: "EDITABLE" },
    requester_informed: readOnly,
  };
};

export const REQUEST_TYPE_TEMPLATES: readonly RequestTypeTemplate[] = [
  {
    id: "access-request",
    name: "Access request (by service)",
    description:
      "Service from the catalog; line manager (if the service needs it), owner, cybersecurity, then the implementer.",
    suggestedName: "Access request",
    suggestedDescription:
      "Request new access, a new permission, or removal of access to a system or service.",
    fields: accessFields,
    graph: accessGraph,
    perStepFieldState: accessFieldState,
  },
];
