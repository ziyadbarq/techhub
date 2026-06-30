/**
 * Read-only linear visualization of a workflow graph. Highlights the active
 * step on a request and shows routing arrows between steps. Renders as a
 * vertical pill chain — no SVG dependency, fully accessible.
 */
interface StepNode {
  key: string;
  type: string;
  position: number;
  next?: { default?: string; onAction?: Record<string, string> };
}

interface Graph {
  start: string;
  steps: StepNode[];
}

const TYPE_TONE: Record<string, { bg: string; text: string; label: string }> = {
  APPROVAL: {
    bg: "bg-[var(--color-yellow-light)]",
    text: "text-[var(--color-yellow-dark)]",
    label: "Approval",
  },
  EXECUTION: {
    bg: "bg-[var(--color-teal-light)]",
    text: "text-[var(--color-moss-dark)]",
    label: "Execution",
  },
  INFO_ACK: {
    bg: "bg-[var(--color-rose-light)]",
    text: "text-[var(--color-coral-dark)]",
    label: "Info / Ack",
  },
  AUTOMATION: {
    bg: "bg-[var(--color-surface-featured)]",
    text: "text-[var(--color-brand-blue)]",
    label: "Automation",
  },
  NOTIFICATION: {
    bg: "bg-[var(--color-coral-light)]",
    text: "text-[var(--color-coral-dark)]",
    label: "Notification",
  },
  CONDITIONAL_BRANCH: {
    bg: "bg-[var(--color-brand-orange-light)]",
    text: "text-[var(--color-yellow-dark)]",
    label: "Conditional",
  },
  DELAY: {
    bg: "bg-[var(--color-surface-soft)]",
    text: "text-[var(--color-slate)]",
    label: "Delay",
  },
  SCHEDULE: {
    bg: "bg-[var(--color-surface-soft)]",
    text: "text-[var(--color-slate)]",
    label: "Schedule",
  },
  WEBHOOK: {
    bg: "bg-[var(--color-surface-featured)]",
    text: "text-[var(--color-brand-blue)]",
    label: "Webhook",
  },
  SUB_WORKFLOW: {
    bg: "bg-[var(--color-surface-featured)]",
    text: "text-[var(--color-brand-blue)]",
    label: "Sub-workflow",
  },
};

interface StepInstanceLite {
  stepKey: string;
  status: string;
}

export function WorkflowGraph({
  graph,
  stepInstances = [],
  activeStepKey,
}: {
  graph: Graph;
  stepInstances?: StepInstanceLite[];
  activeStepKey?: string | null;
}) {
  if (!graph?.steps?.length) {
    return (
      <p className="text-body-sm text-[var(--color-stone)]">
        No workflow definition to render.
      </p>
    );
  }

  const sorted = [...graph.steps].sort((a, b) => a.position - b.position);
  const statusByKey = new Map(stepInstances.map((s) => [s.stepKey, s.status]));

  return (
    <ol className="space-y-2">
      {sorted.map((step, i) => {
        const tone = TYPE_TONE[step.type] ?? TYPE_TONE.EXECUTION;
        const status = statusByKey.get(step.key);
        const isActive = step.key === activeStepKey;
        const isCompleted = status === "COMPLETED" || status === "SKIPPED";
        const isFailed = status === "FAILED" || status === "CANCELLED";
        const isStart = step.key === graph.start;

        return (
          <li key={step.key} className="relative">
            <div
              className={
                "rounded-2xl border-2 px-4 py-3 transition-colors " +
                (isActive
                  ? "border-[var(--color-brand-blue)] bg-[var(--color-surface-featured)]"
                  : isCompleted
                    ? "border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]"
                    : isFailed
                      ? "border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/30"
                      : "border-[var(--color-hairline)] bg-[var(--color-canvas)]")
              }
            >
              {/* Row 1 — number + step key + start/status pill */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.text} text-caption-bold`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-body-sm-medium text-[var(--color-ink)]">
                  {step.key}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isStart ? (
                    <span className="rounded-full bg-[var(--color-brand-yellow)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-ink)]">
                      START
                    </span>
                  ) : null}
                  {status ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusPill(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Row 2 — type label */}
              <p className="mt-1.5 pl-11 text-caption text-[var(--color-stone)]">
                {tone.label}
              </p>

              {/* Row 3 — routing arrow on its own line */}
              <p className="mt-1 pl-11 text-caption text-[var(--color-stone)]">
                {step.next && "default" in step.next && step.next.default ? (
                  <>
                    → <span className="font-mono">{step.next.default}</span>
                  </>
                ) : !step.next ? (
                  <>→ close</>
                ) : null}
              </p>
            </div>
            {i < sorted.length - 1 ? (
              <div className="ml-4 my-0.5 h-3 w-px bg-[var(--color-hairline)]" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function statusPill(status: string): string {
  if (status === "ACTIVE")
    return "bg-[var(--color-brand-blue)] text-white";
  if (status === "COMPLETED")
    return "bg-[var(--color-mint-light)] text-[var(--color-moss-dark)]";
  if (status === "FAILED" || status === "CANCELLED")
    return "bg-[var(--color-blush-light)] text-[var(--color-coral-dark)]";
  if (status === "SKIPPED")
    return "bg-[var(--color-surface-soft)] text-[var(--color-slate)]";
  return "bg-[var(--color-surface-soft)] text-[var(--color-stone)]";
}
