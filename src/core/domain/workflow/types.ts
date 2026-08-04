import type { StepType } from "./enums";
import type { Expression } from "./expression";

/** A workflow step as authored in the WorkflowVersion graph JSON. */
export interface StepDefinition {
  key: string;
  type: StepType;
  position: number;
  name?: string;
  /** When omitted on the last step, the workflow closes the request. */
  next?: StepRouting;
  /** Step-type-specific config. See per-executor docs. */
  config: StepConfig;
}

/** Either a single next step key or a per-action map. */
export type StepRouting =
  | { default: string }
  | { onAction: Record<string, string> };

export type StepConfig =
  | ApprovalStepConfig
  | ExecutionStepConfig
  | InfoAckStepConfig
  | AutomationStepConfig
  | NotificationStepConfig
  | ConditionalBranchStepConfig
  | DelayStepConfig
  | ScheduleStepConfig
  | WebhookStepConfig
  | SubWorkflowStepConfig
  | WaitForEventStepConfig;

export interface ApprovalStepConfig {
  type: "APPROVAL";
  assignees: AssigneeSpec[];
  multiAssigneePolicy?: "ANY" | "ALL" | "MAJORITY" | "QUORUM" | "UNANIMOUS";
  quorum?: number;
  allowReject?: boolean;
  sla?: SLAConfig;
}

export interface ExecutionStepConfig {
  type: "EXECUTION";
  assignees: AssigneeSpec[];
  sla?: SLAConfig;
}

export interface InfoAckStepConfig {
  type: "INFO_ACK";
  assignees: AssigneeSpec[];
  message?: string;
  sla?: SLAConfig;
}

export interface AutomationStepConfig {
  type: "AUTOMATION";
  handler: string;
  args?: Record<string, unknown>;
}

export interface NotificationStepConfig {
  type: "NOTIFICATION";
  templateKey: string;
  recipients?: AssigneeSpec[];
}

export interface ConditionalBranchStepConfig {
  type: "CONDITIONAL_BRANCH";
  branches: Array<{ when: Expression; goTo: string }>;
  /** Fallback when no branch matches. */
  default?: string;
}

export interface DelayStepConfig {
  type: "DELAY";
  durationMs: number;
}

export interface ScheduleStepConfig {
  type: "SCHEDULE";
  calendarId?: string;
  windowName?: string;
  blackoutBehavior?: "BLOCK" | "WARN" | "IGNORE";
  leadTimeMinutes?: number;
}

export interface WebhookStepConfig {
  type: "WEBHOOK";
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  /** Payload body. Strings of the form `{{field.<key>}}` resolve to current field values. */
  bodyTemplate?: Record<string, unknown>;
  /** Map response JSON paths to form fields. e.g. { "external_id": "data.id" } */
  responseFieldMapping?: Record<string, string>;
  /** Treat HTTP non-2xx as a failure that halts the workflow. Default true. */
  failOnError?: boolean;
  timeoutMs?: number;
}

export interface SubWorkflowStepConfig {
  type: "SUB_WORKFLOW";
  /** Form to submit a child request to. */
  childFormId: string;
  /** Pass-through field mapping: child field key → parent field key. */
  fieldMapping?: Record<string, string>;
  /** Wait for the child to reach a final state before advancing. Default true. */
  waitForOutcome?: boolean;
  /** Where to write the child request id on the parent (field key). */
  childRequestIdField?: string;
}

export interface WaitForEventStepConfig {
  type: "WAIT_FOR_EVENT";
  /** Stable name the callback endpoint matches against (per-step). */
  eventKey: string;
  /** Optional secret guard. When set, callbacks must include this token. */
  expectedSecret?: string;
  /** When the event arrives, map fields out of payload into form fields. */
  payloadFieldMapping?: Record<string, string>;
}

/** How an assignee is resolved for a step at activation time. */
export type AssigneeSpec =
  | { kind: "USER"; userId: string }
  | { kind: "ROLE"; roleId: string }
  | { kind: "REQUESTER" }
  | { kind: "FIELD_USER"; fieldKey: string }
  | { kind: "REQUESTER_MANAGER" };

export interface SLAConfig {
  calendarId?: string;
  durationMinutes: number;
  /** Pause SLA when status is ON_HOLD or step is awaiting requester reply. */
  pauseOnHold?: boolean;
  /** Escalation rules; the cron evaluates each rule once per StepInstance. */
  escalations?: SLAEscalationRule[];
}

export interface SLAEscalationRule {
  /** Stable per-step rule key — used for the (stepInstanceId, ruleKey) unique constraint. */
  key: string;
  /** When elapsed time crosses this many minutes, fire the rule. */
  thresholdMinutes: number;
  /** Action to take when threshold crosses. */
  action:
    | { kind: "REMINDER" }
    | { kind: "ADD_ASSIGNEE"; userId: string }
    | { kind: "REASSIGN"; toUserId: string }
    | { kind: "AUTO_ADVANCE" }
    | { kind: "AUTO_REJECT" };
}

/** Snapshot stored on FormVersion.schemaJson. */
export interface FormSchema {
  fields: FormFieldDefinition[];
  perStepFieldState?: Record<
    string,
    Record<string, "EDITABLE" | "READ_ONLY" | "HIDDEN">
  >;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
  visibilityRules?: Expression;
  computedFormula?: Expression;
}

/** Snapshot stored on WorkflowVersion.graphJson. */
export interface WorkflowGraph {
  steps: StepDefinition[];
  /** Key of the first step. */
  start: string;
}

/**
 * Identity of the entity performing an action. Single-tenant: no organizationId.
 *
 * - `userId` is set for human-triggered actions
 * - `system` is set when the engine (cron, automation) triggers the action
 *   (e.g., "sla_escalation", "schedule_tick")
 */
export interface ActorContext {
  userId: string | null;
  system?: string;
}

export interface SubmitInput {
  formId: string;
  fieldValues: Record<string, unknown>;
}

export type ActionKind =
  | "APPROVE"
  | "REJECT"
  | "COMPLETE"
  | "ACKNOWLEDGE"
  | "REQUEST_INFO"
  | "PROVIDE_INFO";

export interface TakeActionInput {
  stepInstanceId: string;
  action: ActionKind;
  comment?: string;
  fieldUpdates?: Record<string, unknown>;
}
