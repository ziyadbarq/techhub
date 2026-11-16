/**
 * Read-only linear visualization of a workflow graph. Highlights the active
 * step on a request and shows routing arrows between steps. Renders as a
 * vertical pill chain — no SVG dependency, fully accessible.
 *
 * Reads routing the way the engine does (see `@/lib/workflows/builder/graph`):
 * approved → the approve route; rejected → back to the requester.
 */
import { CheckCircle2, CornerUpLeft, Flag } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  happyNext,
  STEP_TYPE_LABEL,
  stepName,
  type StepDef,
} from "@/lib/workflows/builder/graph";

import { STEP_STATUS, STEP_TYPE_TONE, TONE } from "./tones";

interface StepNode {
  key: string;
  name?: string;
  type: string;
  position: number;
  next?: { default?: string; onAction?: Record<string, string> };
}

interface Graph {
  start: string;
  steps: StepNode[];
}

interface StepInstanceLite {
  stepKey: string;
  status: string;
}

function asStepDef(step: StepNode): StepDef {
  return {
    key: step.key,
    type: step.type as StepDef["type"],
    position: step.position,
    name: step.name,
    next: step.next as StepDef["next"],
    config: {},
  };
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
  const nameOf = (key: string | null) => {
    if (!key) return "Request completed";
    const target = graph.steps.find((s) => s.key === key);
    return target ? stepName(target) : stepName({ key });
  };

  return (
    <ol className="space-y-2">
      {sorted.map((step, i) => {
        const def = asStepDef(step);
        const status = statusByKey.get(step.key);
        const statusMeta = status
          ? (STEP_STATUS[status] ?? { label: status, tone: TONE.neutral })
          : null;
        const isActive = step.key === activeStepKey;
        const isCompleted = status === "COMPLETED" || status === "SKIPPED";
        const isFailed = status === "FAILED";
        const isStart = step.key === graph.start;
        const next = happyNext(def);

        return (
          <li key={step.key} className="relative">
            <div
              className={cn(
                "rounded-2xl border-2 px-4 py-3 transition-colors",
                isActive
                  ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-400/10"
                  : isCompleted
                    ? "border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]"
                    : isFailed
                      ? "border-rose-300 bg-rose-50 dark:border-rose-400/40 dark:bg-rose-400/10"
                      : "border-[var(--color-hairline)] bg-[var(--color-canvas)]",
              )}
            >
              {/* Row 1 — number + step name + first-step / status pills */}
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "text-caption-bold inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    STEP_TYPE_TONE[step.type] ?? TONE.neutral,
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-body-sm-medium min-w-0 flex-1 truncate text-[var(--color-ink)]">
                  {stepName(def)}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isStart ? (
                    <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                      First step
                    </span>
                  ) : null}
                  {statusMeta ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        statusMeta.tone,
                      )}
                    >
                      {statusMeta.label}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Row 2 — type */}
              <p className="text-caption mt-1.5 pl-11 text-[var(--color-stone)]">
                {STEP_TYPE_LABEL[def.type] ?? step.type}
              </p>

              {/* Row 3 — where it goes */}
              <div className="text-caption mt-1 space-y-0.5 pl-11 text-[var(--color-stone)]">
                {step.type === "APPROVAL" ? (
                  <>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      If approved →{" "}
                      <span className="text-[var(--color-ink)]">
                        {nameOf(next)}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CornerUpLeft className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      If rejected →{" "}
                      <span className="text-[var(--color-ink)]">
                        Back to the requester
                      </span>
                    </p>
                  </>
                ) : next ? (
                  <p>
                    Then →{" "}
                    <span className="text-[var(--color-ink)]">
                      {nameOf(next)}
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Then the request is completed
                  </p>
                )}
              </div>
            </div>
            {i < sorted.length - 1 ? (
              <div className="my-0.5 ml-4 h-3 w-px bg-[var(--color-hairline)]" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
