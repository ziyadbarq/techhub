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
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  },
  EXECUTION: {
    type: "EXECUTION",
    icon: ClipboardCheck,
    title: "Task",
    description: "Someone does the work and marks it done.",
    group: "People",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  INFO_ACK: {
    type: "INFO_ACK",
    icon: Info,
    title: "Acknowledgement",
    description: "Someone reads a message and confirms.",
    group: "People",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  },
  NOTIFICATION: {
    type: "NOTIFICATION",
    icon: Bell,
    title: "Send email",
    description: "Email people from a template, then continue.",
    group: "Automatic",
    tone: "bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-300",
  },
  AUTOMATION: {
    type: "AUTOMATION",
    icon: Cog,
    title: "Automation",
    description: "Run a built-in action, e.g. auto-approve.",
    group: "Automatic",
    tone: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
  },
  WEBHOOK: {
    type: "WEBHOOK",
    icon: Webhook,
    title: "Call another system",
    description: "Send the request to an external URL.",
    group: "Automatic",
    tone: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
  },
  CONDITIONAL_BRANCH: {
    type: "CONDITIONAL_BRANCH",
    icon: GitBranch,
    title: "Condition",
    description: "Choose the route from the form's answers.",
    group: "Flow control",
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  },
  DELAY: {
    type: "DELAY",
    icon: Hourglass,
    title: "Wait",
    description: "Pause for a number of hours or days.",
    group: "Flow control",
    tone: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
  },
  SCHEDULE: {
    type: "SCHEDULE",
    icon: Clock,
    title: "Wait for a window",
    description: "Continue in the next allowed time window.",
    group: "Flow control",
    tone: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
  },
  SUB_WORKFLOW: {
    type: "SUB_WORKFLOW",
    icon: Workflow,
    title: "Sub-request",
    description: "Open another request and wait for it.",
    group: "Flow control",
    tone: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
  },
  WAIT_FOR_EVENT: {
    type: "WAIT_FOR_EVENT",
    icon: Radio,
    title: "Wait for event",
    description: "Pause until an external event arrives.",
    group: "Flow control",
    tone: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
    hidden: true,
  },
};

export const STEP_GROUPS = ["People", "Automatic", "Flow control"] as const;
