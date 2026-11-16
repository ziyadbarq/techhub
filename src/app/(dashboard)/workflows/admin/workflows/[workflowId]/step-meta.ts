import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cog,
  GitBranch,
  Hourglass,
  Info,
  Radio,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { STEP_TYPE_TONE } from "@/components/workflows/tones";
import type { StepType } from "@/lib/workflows/builder/graph";

export interface StepTypeMeta {
  type: StepType;
  icon: LucideIcon;
  /** Shown in the "Add step" menu. */
  title: string;
  description: string;
  group: "People" | "Automatic" | "Flow control";
  tone: string;
  /** Hidden from the add menu (no editor yet); still rendered if present. */
  hidden?: boolean;
}

export const STEP_META: Record<StepType, StepTypeMeta> = {
  APPROVAL: {
    type: "APPROVAL",
    icon: CheckCircle2,
    title: "Approval",
    description: "Someone approves or rejects the request.",
    group: "People",
    tone: STEP_TYPE_TONE.APPROVAL!,
  },
  EXECUTION: {
    type: "EXECUTION",
    icon: ClipboardCheck,
    title: "Task",
    description: "Someone does the work and marks it done.",
    group: "People",
    tone: STEP_TYPE_TONE.EXECUTION!,
  },
  INFO_ACK: {
    type: "INFO_ACK",
    icon: Info,
    title: "Acknowledgement",
    description: "Someone reads a message and confirms.",
    group: "People",
    tone: STEP_TYPE_TONE.INFO_ACK!,
  },
  NOTIFICATION: {
    type: "NOTIFICATION",
    icon: Bell,
    title: "Send email",
    description: "Email people from a template, then continue.",
    group: "Automatic",
    tone: STEP_TYPE_TONE.NOTIFICATION!,
  },
  AUTOMATION: {
    type: "AUTOMATION",
    icon: Cog,
    title: "Automation",
    description: "Run a built-in action, e.g. auto-approve.",
    group: "Automatic",
    tone: STEP_TYPE_TONE.AUTOMATION!,
  },
  WEBHOOK: {
    type: "WEBHOOK",
    icon: Webhook,
    title: "Call another system",
    description: "Send the request to an external URL.",
    group: "Automatic",
    tone: STEP_TYPE_TONE.WEBHOOK!,
  },
  CONDITIONAL_BRANCH: {
    type: "CONDITIONAL_BRANCH",
    icon: GitBranch,
    title: "Condition",
    description: "Choose the route from the form's answers.",
    group: "Flow control",
    tone: STEP_TYPE_TONE.CONDITIONAL_BRANCH!,
  },
  DELAY: {
    type: "DELAY",
    icon: Hourglass,
    title: "Wait",
    description: "Pause for a number of hours or days.",
    group: "Flow control",
    tone: STEP_TYPE_TONE.DELAY!,
  },
  SCHEDULE: {
    type: "SCHEDULE",
    icon: Clock,
    title: "Wait for a window",
    description: "Continue in the next allowed time window.",
    group: "Flow control",
    tone: STEP_TYPE_TONE.SCHEDULE!,
  },
  SUB_WORKFLOW: {
    type: "SUB_WORKFLOW",
    icon: Workflow,
    title: "Sub-request",
    description: "Open another request and wait for it.",
    group: "Flow control",
    tone: STEP_TYPE_TONE.SUB_WORKFLOW!,
  },
  WAIT_FOR_EVENT: {
    type: "WAIT_FOR_EVENT",
    icon: Radio,
    title: "Wait for event",
    description: "Pause until an external event arrives.",
    group: "Flow control",
    tone: STEP_TYPE_TONE.WAIT_FOR_EVENT!,
    hidden: true,
  },
};

export const STEP_GROUPS = ["People", "Automatic", "Flow control"] as const;
