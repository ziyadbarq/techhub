/**
 * Status and step-type colours for the workflow screens.
 *
 * Tailwind colours with explicit dark variants (as the design Badge does):
 * the older `--color-*-light` / `--color-*-dark` token pairs keep a dark
 * text colour in dark mode, which put dark text on dark tints.
 */
export const TONE = {
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
  violet:
    "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-300",
} as const;

export const STEP_TYPE_TONE: Record<string, string> = {
  APPROVAL: TONE.warning,
  EXECUTION: TONE.success,
  INFO_ACK: TONE.info,
  NOTIFICATION: TONE.pink,
  AUTOMATION: TONE.neutral,
  WEBHOOK: TONE.violet,
  CONDITIONAL_BRANCH: TONE.orange,
  DELAY: TONE.neutral,
  SCHEDULE: TONE.neutral,
  SUB_WORKFLOW: TONE.teal,
  WAIT_FOR_EVENT: TONE.neutral,
};

/** Step-instance status pill: solid where it must catch the eye. */
export const STEP_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: {
    label: "In progress",
    tone: "bg-blue-600 text-white dark:bg-blue-500",
  },
  COMPLETED: { label: "Done", tone: TONE.success },
  FAILED: { label: "Rejected", tone: TONE.danger },
  CANCELLED: { label: "Cancelled", tone: TONE.neutral },
  SKIPPED: { label: "Skipped", tone: TONE.neutral },
  PENDING: { label: "Waiting", tone: TONE.neutral },
};
