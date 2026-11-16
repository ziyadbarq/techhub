"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CornerUpLeft,
  Flag,
  GitBranch,
  Send,
  UserRound,
} from "lucide-react";

import {
  approvalRuleLabel,
  summariseAssignees,
  type Directory,
} from "@/lib/workflows/builder/assignees";
import {
  happyNext,
  HUMAN_STEP_TYPES,
  stepName,
  type Graph,
  type GraphIssue,
  type StepDef,
  type StepType,
} from "@/lib/workflows/builder/graph";
import { cn } from "@/lib/utils";

import { AddStepMenu } from "./add-step-menu";
import { STEP_META } from "./step-meta";

function Connector({
  onAdd,
  addLabel,
}: {
  onAdd: (type: StepType) => void;
  addLabel: string;
}) {
  return (
    <div
      className="relative flex h-12 items-center justify-center"
      aria-hidden={false}
    >
      <span
        aria-hidden="true"
        className="bg-hairline-strong absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
      />
      <span className="relative">
        <AddStepMenu onAdd={onAdd} label={addLabel} />
      </span>
    </div>
  );
}

function RouteLine({
  icon: Icon,
  tone,
  label,
  target,
}: {
  icon: typeof ArrowRight;
  tone: string;
  label: string;
  target: string;
}) {
  return (
    <p className="flex items-center gap-1.5 text-xs">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
      <span className="text-stone">{label}</span>
      <ArrowRight className="text-stone h-3 w-3 shrink-0" />
      <span className="text-ink truncate font-medium">{target}</span>
    </p>
  );
}

function StepCard({
  step,
  index,
  graph,
  directory,
  issues,
  selected,
  unreachable,
  onSelect,
}: {
  step: StepDef;
  index: number;
  graph: Graph;
  directory: Directory;
  issues: GraphIssue[];
  selected: boolean;
  unreachable: boolean;
  onSelect: () => void;
}) {
  const meta = STEP_META[step.type];
  const Icon = meta.icon;
  const nameOf = (key: string | null) => {
    if (!key) return "Request completed";
    const target = graph.steps.find((s) => s.key === key);
    return target ? stepName(target) : "Missing step";
  };
  const next = happyNext(step);
  const who = HUMAN_STEP_TYPES.has(step.type)
    ? summariseAssignees(step.config.assignees, directory)
    : null;
  const branches = Array.isArray(step.config.branches)
    ? (step.config.branches as Array<{ goTo?: string }>)
    : [];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "bg-canvas group w-full rounded-xl border p-4 text-left shadow-sm transition-all",
        selected
          ? "border-ink ring-ink/10 ring-4"
          : "border-hairline hover:border-hairline-strong",
        unreachable && !selected && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            meta.tone,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-stone font-mono text-[11px]">
              {index + 1}
            </span>
            <h3 className="text-ink truncate text-[15px] font-semibold">
              {stepName(step)}
            </h3>
          </div>
          <p className="text-stone mt-0.5 text-xs">
            {meta.title}
            {step.type === "APPROVAL" &&
            typeof step.config.onlyWhenServiceRequiresManagerApproval ===
              "string"
              ? " · only if the chosen service requires it"
              : ""}
          </p>
        </div>
        {issues.length > 0 ? (
          <span
            title={issues.map((i) => i.message).join("\n")}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
          >
            <AlertTriangle className="h-3 w-3" />{" "}
            {issues.length === 1
              ? "Needs attention"
              : `${issues.length} issues`}
          </span>
        ) : unreachable ? (
          <span className="bg-surface text-stone shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
            Not connected
          </span>
        ) : null}
      </div>

      {HUMAN_STEP_TYPES.has(step.type) ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs">
          <UserRound className="text-stone h-3.5 w-3.5 shrink-0" />
          {who ? (
            <span className="text-ink truncate">{who}</span>
          ) : (
            <span className="font-medium text-amber-700 dark:text-amber-300">
              Nobody assigned yet
            </span>
          )}
          {step.type === "APPROVAL" && who ? (
            <span className="text-stone shrink-0">
              ·{" "}
              {approvalRuleLabel(
                step.config.multiAssigneePolicy,
                step.config.quorum,
              )}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="border-hairline-soft mt-3 space-y-1.5 border-t pt-3">
        {step.type === "APPROVAL" ? (
          <>
            <RouteLine
              icon={CheckCircle2}
              tone="text-emerald-700 dark:text-emerald-400"
              label="If approved"
              target={nameOf(next)}
            />
            {step.config.allowReject !== false ? (
              <RouteLine
                icon={CornerUpLeft}
                tone="text-coral-dark"
                label="If rejected"
                target="Back to the requester"
              />
            ) : null}
          </>
        ) : step.type === "CONDITIONAL_BRANCH" ? (
          <>
            {branches.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No conditions yet.
              </p>
            ) : (
              branches.map((branch, i) => (
                <RouteLine
                  key={i}
                  icon={GitBranch}
                  tone="text-coral-dark"
                  label={`Condition ${i + 1}`}
                  target={nameOf(branch.goTo ?? null)}
                />
              ))
            )}
            <RouteLine
              icon={ArrowRight}
              tone="text-stone"
              label="Otherwise"
              target={nameOf(
                typeof step.config.default === "string"
                  ? step.config.default
                  : next,
              )}
            />
          </>
        ) : (
          <RouteLine
            icon={ArrowRight}
            tone="text-stone"
            label="Then"
            target={nameOf(next)}
          />
        )}
      </div>
    </button>
  );
}

/** The workflow as a top-to-bottom path the author can read and edit. */
export function WorkflowPath({
  graph,
  directory,
  issues,
  unreachable,
  selectedKey,
  onSelect,
  onInsert,
}: {
  graph: Graph;
  directory: Directory;
  issues: GraphIssue[];
  unreachable: ReadonlySet<string>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onInsert: (type: StepType, afterKey: string | null) => void;
}) {
  // Show the first step at the top even if it isn't first in the list.
  const ordered = [...graph.steps].sort((a, b) => {
    if (a.key === graph.start) return -1;
    if (b.key === graph.start) return 1;
    return a.position - b.position;
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <div className="flex justify-center">
        <span className="bg-ink text-canvas inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
          <Send className="h-3.5 w-3.5" /> Request submitted
        </span>
      </div>
      <Connector
        onAdd={(type) => onInsert(type, null)}
        addLabel="Add a step at the start"
      />

      {ordered.map((step, index) => (
        <div key={step.key}>
          <StepCard
            step={step}
            index={index}
            graph={graph}
            directory={directory}
            issues={issues.filter((i) => i.stepKey === step.key)}
            selected={selectedKey === step.key}
            unreachable={unreachable.has(step.key)}
            onSelect={() => onSelect(step.key)}
          />
          <Connector
            onAdd={(type) => onInsert(type, step.key)}
            addLabel={`Add a step after “${stepName(step)}”`}
          />
        </div>
      ))}

      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
          <Flag className="h-3.5 w-3.5" /> Request completed
        </span>
      </div>
    </div>
  );
}
