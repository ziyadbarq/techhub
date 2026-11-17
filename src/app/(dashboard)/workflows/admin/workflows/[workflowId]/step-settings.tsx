"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Flag,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  APPROVAL_RULES,
  ASSIGNEE_OPTIONS,
  CHOICE_FIELD_TYPES,
  choiceOptions,
  describeAssignee,
  roleLabel,
  SERVICE_ROLE_LABEL,
  type AssigneeKind,
  type Directory,
} from "@/lib/workflows/builder/assignees";
import {
  happyNext,
  HUMAN_STEP_TYPES,
  slugKey,
  stepName,
  type Graph,
  type GraphIssue,
  type StepDef,
  withHappyNext,
} from "@/lib/workflows/builder/graph";
import { cn } from "@/lib/utils";

import { STEP_META } from "./step-meta";

const END = "__end__";
const NONE = "__none__";

type Assignee = Record<string, unknown> & { kind: AssigneeKind };

const HOUR_MS = 60 * 60 * 1000;

const AUTOMATION_HANDLERS = [
  { value: "auto-approve", label: "Approve automatically" },
  { value: "set-field", label: "Set a field value" },
  { value: "generate-reference-number", label: "Generate a reference number" },
];

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div>
        <h4 className="text-ink text-sm font-semibold">{title}</h4>
        {hint ? (
          <p className="text-stone mt-0.5 text-xs leading-5">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function newAssignee(kind: AssigneeKind, directory: Directory): Assignee {
  switch (kind) {
    case "ROLE":
      return { kind, roleId: "" };
    case "USER":
      return { kind, userId: "" };
    case "FIELD_USER":
      return {
        kind,
        fieldKey:
          directory.fields.find((f) => f.type === "USER_PICKER")?.key ?? "",
      };
    case "ACCESS_SERVICE_ROLE":
      return { kind, serviceSnapshotKey: "", role: "OWNER" };
    case "OPTION_USERS":
      return {
        kind,
        fieldKey:
          directory.fields.find((f) => CHOICE_FIELD_TYPES.has(f.type))?.key ??
          "",
        options: {},
      };
    case "FALLBACK":
      return {
        kind,
        primary: { kind: "REQUESTER_MANAGER" },
        fallbackFieldKey: "",
      };
    default:
      return { kind };
  }
}

/** Who handles the step for each option of a choice field. */
function OptionUsersEditor({
  assignee,
  directory,
  onChange,
}: {
  assignee: Assignee;
  directory: Directory;
  onChange: (next: Assignee) => void;
}) {
  const field = directory.fields.find((f) => f.key === assignee.fieldKey);
  const options = choiceOptions(field);
  const mapping = (assignee.options ?? {}) as Record<string, string[]>;
  const nameOf = (id: string) => {
    const user = directory.users.find((u) => u.id === id);
    return user ? user.name || user.email : "Unknown person";
  };
  const setPeople = (option: string, people: string[]) =>
    onChange({ ...assignee, options: { ...mapping, [option]: people } });

  if (!field) return null;
  if (options.length === 0) {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-300">
        “{field.label}” has no options yet. Add them in the form builder.
      </p>
    );
  }
  return (
    <ul className="divide-hairline-soft divide-y">
      {options.map((option) => {
        const people = Array.isArray(mapping[option]) ? mapping[option] : [];
        const available = directory.users.filter((u) => !people.includes(u.id));
        return (
          <li key={option} className="space-y-1.5 py-2 first:pt-0 last:pb-0">
            <p className="text-ink text-xs font-medium">{option}</p>
            {people.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {people.map((id) => (
                  <span
                    key={id}
                    className="bg-surface text-ink border-hairline inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 text-[11px]"
                  >
                    {nameOf(id)}
                    <button
                      type="button"
                      aria-label={`Remove ${nameOf(id)} from ${option}`}
                      onClick={() =>
                        setPeople(
                          option,
                          people.filter((p) => p !== id),
                        )
                      }
                      className="text-stone hover:text-coral-dark rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-stone text-[11px]">
                Nobody: choosing it adds no one.
              </p>
            )}
            <Select
              value=""
              onValueChange={(id) => setPeople(option, [...people, id])}
            >
              <SelectTrigger
                className="h-7 text-xs"
                aria-label={`Add a person for ${option}`}
              >
                <SelectValue placeholder="Add a person" />
              </SelectTrigger>
              <SelectContent>
                {available.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        );
      })}
    </ul>
  );
}

function AssigneeRow({
  assignee,
  directory,
  onChange,
  onRemove,
}: {
  assignee: Assignee;
  directory: Directory;
  onChange: (next: Assignee) => void;
  onRemove: () => void;
}) {
  const userPickers = directory.fields.filter((f) => f.type === "USER_PICKER");
  const choiceFields = directory.fields.filter((f) =>
    CHOICE_FIELD_TYPES.has(f.type),
  );
  const serviceFields = directory.fields.filter(
    (f) => f.type === "LOOKUP" && f.config?.dataSource === "ACCESS_SERVICES",
  );
  const fieldSelect = (
    value: unknown,
    options: typeof directory.fields,
    onPick: (key: string) => void,
    placeholder: string,
  ) =>
    options.length > 0 ? (
      <Select
        value={typeof value === "string" && value ? value : undefined}
        onValueChange={onPick}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((field) => (
            <SelectItem key={field.key} value={field.key}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <p className="text-xs text-amber-700 dark:text-amber-300">
        The linked form has no suitable field. Add one in the form builder
        first.
      </p>
    );

  return (
    <li className="border-hairline-soft bg-surface/40 space-y-2 rounded-lg border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-ink text-xs leading-5 font-medium">
          {describeAssignee(assignee, directory)}
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="text-stone hover:text-coral-dark -m-1 rounded p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {assignee.kind === "ROLE" ? (
        <Select
          value={
            typeof assignee.roleId === "string" && assignee.roleId
              ? assignee.roleId
              : undefined
          }
          onValueChange={(roleId) => onChange({ ...assignee, roleId })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {directory.roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {roleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {assignee.kind === "USER" ? (
        <Select
          value={
            typeof assignee.userId === "string" && assignee.userId
              ? assignee.userId
              : undefined
          }
          onValueChange={(userId) => onChange({ ...assignee, userId })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Choose a person" />
          </SelectTrigger>
          <SelectContent>
            {directory.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {assignee.kind === "FIELD_USER"
        ? fieldSelect(
            assignee.fieldKey,
            userPickers,
            (fieldKey) => onChange({ ...assignee, fieldKey }),
            "Choose the person field",
          )
        : null}

      {assignee.kind === "ACCESS_SERVICE_ROLE" ? (
        <div className="grid grid-cols-2 gap-2">
          {fieldSelect(
            assignee.serviceSnapshotKey,
            serviceFields,
            (serviceSnapshotKey) =>
              onChange({ ...assignee, serviceSnapshotKey }),
            "Service field",
          )}
          <Select
            value={String(assignee.role ?? "OWNER")}
            onValueChange={(role) => onChange({ ...assignee, role })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_ROLE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {assignee.kind === "OPTION_USERS" ? (
        <div className="space-y-2">
          {fieldSelect(
            assignee.fieldKey,
            choiceFields,
            (fieldKey) => onChange({ ...assignee, fieldKey, options: {} }),
            "Choose the question",
          )}
          <OptionUsersEditor
            assignee={assignee}
            directory={directory}
            onChange={onChange}
          />
        </div>
      ) : null}

      {assignee.kind === "FALLBACK"
        ? fieldSelect(
            assignee.fallbackFieldKey,
            userPickers,
            (fallbackFieldKey) => onChange({ ...assignee, fallbackFieldKey }),
            "Backup person field",
          )
        : null}
    </li>
  );
}

export function StepSettings({
  step,
  graph,
  directory,
  catalog,
  issues,
  onChange,
  onRename,
  onMakeFirst,
  onMove,
  onDelete,
  onClose,
}: {
  step: StepDef;
  graph: Graph;
  directory: Directory;
  catalog: {
    emailTemplates: ReadonlyArray<{ key: string; subject: string }>;
    forms: ReadonlyArray<{ id: string; name: string }>;
  };
  issues: GraphIssue[];
  onChange: (next: StepDef) => void;
  onRename: (key: string) => boolean;
  onMakeFirst: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const meta = STEP_META[step.type];
  const Icon = meta.icon;
  const config = step.config;
  const [keyDraft, setKeyDraft] = useState(step.key);
  const [keyError, setKeyError] = useState<string | null>(null);

  const assignees = (
    Array.isArray(config.assignees) ? config.assignees : []
  ) as Assignee[];
  const setConfig = (patch: Record<string, unknown>) =>
    onChange({ ...step, config: { ...config, ...patch } });
  const setAssignees = (next: Assignee[]) => setConfig({ assignees: next });

  const others = graph.steps.filter((s) => s.key !== step.key);
  const next = happyNext(step);
  const isFirst = graph.start === step.key;
  const index = graph.steps.findIndex((s) => s.key === step.key);

  const routeSelect = (
    value: string | null,
    onPick: (key: string | null) => void,
  ) => (
    <Select
      value={value ?? END}
      onValueChange={(v) => onPick(v === END ? null : v)}
    >
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {others.map((s) => (
          <SelectItem key={s.key} value={s.key}>
            {stepName(s)}
          </SelectItem>
        ))}
        <SelectItem value={END}>
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" /> Finish (request completed)
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const whoTitle =
    step.type === "APPROVAL"
      ? "Who approves?"
      : step.type === "EXECUTION"
        ? "Who does the work?"
        : "Who is informed?";

  return (
    <div className="space-y-6">
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
          <p className="text-stone text-xs">
            {meta.title}
            {isFirst ? " · First step" : ""}
          </p>
          <h3 className="text-ink truncate font-semibold">{stepName(step)}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close step settings"
          className="text-stone hover:text-ink rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {issues.length > 0 ? (
        <ul className="space-y-1 rounded-lg bg-amber-100 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
          {issues.map((issue) => (
            <li key={issue.message}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="step-name" className="text-sm font-semibold">
          Step name
        </Label>
        <Input
          id="step-name"
          value={step.name ?? ""}
          placeholder={stepName(step)}
          onChange={(event) => onChange({ ...step, name: event.target.value })}
        />
        <p className="text-stone text-xs">
          Shown to approvers and on the request timeline.
        </p>
      </div>

      {HUMAN_STEP_TYPES.has(step.type) ? (
        <Section
          title={whoTitle}
          hint={
            assignees.length > 1
              ? "Everyone listed receives the step."
              : undefined
          }
        >
          {assignees.length > 0 ? (
            <ul className="space-y-2">
              {assignees.map((assignee, i) => (
                <AssigneeRow
                  key={i}
                  assignee={assignee}
                  directory={directory}
                  onChange={(nextAssignee) =>
                    setAssignees(
                      assignees.map((a, j) => (j === i ? nextAssignee : a)),
                    )
                  }
                  onRemove={() =>
                    setAssignees(assignees.filter((_, j) => j !== i))
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Nobody yet. Add at least one.
            </p>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-hairline-strong text-ink hover:bg-surface inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {ASSIGNEE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.kind}
                  onSelect={() =>
                    setAssignees([
                      ...assignees,
                      newAssignee(option.kind, directory),
                    ])
                  }
                  className="flex-col items-start gap-0"
                >
                  <span className="text-sm">{option.label}</span>
                  <span className="text-stone text-xs">{option.hint}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>
      ) : null}

      {step.type === "APPROVAL" ? (
        <ServiceGate
          value={
            typeof config.onlyWhenServiceRequiresManagerApproval === "string"
              ? config.onlyWhenServiceRequiresManagerApproval
              : null
          }
          serviceFields={directory.fields.filter(
            (f) =>
              f.type === "LOOKUP" && f.config?.dataSource === "ACCESS_SERVICES",
          )}
          onChange={(value) => {
            const next = { ...config };
            if (value === null)
              delete next.onlyWhenServiceRequiresManagerApproval;
            else next.onlyWhenServiceRequiresManagerApproval = value;
            onChange({ ...step, config: next });
          }}
        />
      ) : null}

      {step.type === "APPROVAL" && assignees.length > 0 ? (
        <Section title="How many must approve?">
          <div className="grid grid-cols-2 gap-2">
            {APPROVAL_RULES.map((rule) => {
              const current =
                config.multiAssigneePolicy === "UNANIMOUS"
                  ? "ALL"
                  : (config.multiAssigneePolicy ?? "ANY");
              const active = current === rule.value;
              return (
                <button
                  key={rule.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setConfig({
                      multiAssigneePolicy: rule.value,
                      ...(rule.value === "QUORUM" && !config.quorum
                        ? { quorum: 2 }
                        : {}),
                    })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-ink bg-surface"
                      : "border-hairline-soft hover:border-hairline-strong",
                  )}
                >
                  <span className="text-ink block text-xs font-semibold">
                    {rule.label}
                  </span>
                  <span className="text-stone block text-[11px] leading-4">
                    {rule.hint}
                  </span>
                </button>
              );
            })}
          </div>
          {config.multiAssigneePolicy === "QUORUM" ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone">At least</span>
              <Input
                type="number"
                min={1}
                value={String(config.quorum ?? 2)}
                onChange={(event) =>
                  setConfig({
                    quorum: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="h-8 w-20"
                aria-label="Approvals required"
              />
              <span className="text-stone">approvals</span>
            </div>
          ) : null}
        </Section>
      ) : null}

      {step.type === "INFO_ACK" ? (
        <Section
          title="Message"
          hint="What the person reads before confirming."
        >
          <Textarea
            value={String(config.message ?? "")}
            onChange={(event) => setConfig({ message: event.target.value })}
            rows={3}
            placeholder="e.g. Your access has been granted."
          />
        </Section>
      ) : null}

      {step.type === "NOTIFICATION" ? (
        <Section title="Email template" hint="The email that is sent.">
          {catalog.emailTemplates.length > 0 ? (
            <Select
              value={
                typeof config.templateKey === "string" && config.templateKey
                  ? config.templateKey
                  : undefined
              }
              onValueChange={(templateKey) => setConfig({ templateKey })}
            >
              <SelectTrigger className="h-auto min-h-9 py-1.5 text-left">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {catalog.emailTemplates.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    <span className="block text-sm">{template.subject}</span>
                    <span className="text-stone block font-mono text-[11px]">
                      {template.key}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              No email templates yet. Create one first.
            </p>
          )}
          <Link
            href="/workflows/admin/email-templates"
            className="text-stone hover:text-ink text-xs underline"
          >
            Manage email templates
          </Link>
        </Section>
      ) : null}

      {step.type === "AUTOMATION" ? (
        <Section title="Action">
          <Select
            value={String(config.handler ?? "auto-approve")}
            onValueChange={(handler) => setConfig({ handler })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTOMATION_HANDLERS.map((handler) => (
                <SelectItem key={handler.value} value={handler.value}>
                  {handler.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      ) : null}

      {step.type === "WEBHOOK" ? (
        <Section
          title="Endpoint"
          hint="The request is sent here when the step runs."
        >
          <div className="flex gap-2">
            <Select
              value={String(config.method ?? "POST")}
              onValueChange={(method) => setConfig({ method })}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["POST", "PUT", "PATCH", "GET", "DELETE"].map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={String(config.url ?? "")}
              onChange={(event) =>
                setConfig({ url: event.target.value.trim() })
              }
              placeholder="https://"
              className="font-mono text-sm"
            />
          </div>
          <label className="flex items-center justify-between gap-3 text-xs">
            <span className="text-stone">
              Stop the request if the call fails
            </span>
            <Switch
              checked={config.failOnError !== false}
              onCheckedChange={(failOnError) => setConfig({ failOnError })}
            />
          </label>
        </Section>
      ) : null}

      {step.type === "DELAY" ? (
        <Section title="Wait for">
          {(() => {
            const ms = Number(config.durationMs) || 0;
            const inDays = ms > 0 && ms % (24 * HOUR_MS) === 0;
            const unit = inDays ? "days" : "hours";
            const amount = inDays
              ? ms / (24 * HOUR_MS)
              : Math.round((ms / HOUR_MS) * 100) / 100;
            const set = (value: number, u: string) =>
              setConfig({
                durationMs:
                  Math.max(0, value) * (u === "days" ? 24 * HOUR_MS : HOUR_MS),
              });
            return (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={String(amount)}
                  onChange={(event) =>
                    set(Number(event.target.value) || 0, unit)
                  }
                  className="h-9 w-24"
                  aria-label="Amount"
                />
                <Select value={unit} onValueChange={(u) => set(amount, u)}>
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
        </Section>
      ) : null}

      {step.type === "SUB_WORKFLOW" ? (
        <Section
          title="Form to open"
          hint="The sub-request is created from this form."
        >
          <Select
            value={
              typeof config.childFormId === "string" && config.childFormId
                ? config.childFormId
                : undefined
            }
            onValueChange={(childFormId) => setConfig({ childFormId })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose a form" />
            </SelectTrigger>
            <SelectContent>
              {catalog.forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center justify-between gap-3 text-xs">
            <span className="text-stone">
              Wait until the sub-request finishes
            </span>
            <Switch
              checked={config.waitForOutcome !== false}
              onCheckedChange={(waitForOutcome) =>
                setConfig({ waitForOutcome })
              }
            />
          </label>
        </Section>
      ) : null}

      <Section title="What happens next?">
        {step.type === "APPROVAL" ? (
          <>
            <div className="space-y-1.5">
              <p className="text-stone text-xs font-medium">
                When approved, go to
              </p>
              {routeSelect(next, (target) =>
                onChange(withHappyNext(step, target)),
              )}
            </div>
            <div className="border-hairline-soft rounded-lg border p-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-ink text-xs font-medium">
                  Approvers can reject
                </span>
                <Switch
                  checked={config.allowReject !== false}
                  onCheckedChange={(allowReject) => setConfig({ allowReject })}
                />
              </label>
              {config.allowReject !== false ? (
                <p className="text-stone mt-1.5 text-xs leading-5">
                  A rejected request goes back to the requester to correct and
                  resubmit, as set in{" "}
                  <Link
                    href="/workflows/admin/rejection-policies"
                    className="hover:text-ink underline"
                  >
                    rejection policies
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </>
        ) : step.type === "CONDITIONAL_BRANCH" ? (
          <div className="space-y-1.5">
            <p className="text-stone text-xs leading-5">
              {Array.isArray(config.branches) && config.branches.length > 0
                ? `${config.branches.length} condition(s) are set. Edit conditions with “Draft with AI”.`
                : "No conditions yet. Describe them with “Draft with AI”."}
            </p>
            <p className="text-stone text-xs font-medium">
              When no condition matches, go to
            </p>
            <Select
              value={
                typeof config.default === "string" && config.default
                  ? config.default
                  : NONE
              }
              onValueChange={(target) => {
                const nextConfig = { ...config };
                if (target === NONE) delete nextConfig.default;
                else nextConfig.default = target;
                onChange({ ...step, config: nextConfig });
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Follow the next step</SelectItem>
                {others.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {stepName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-stone text-xs font-medium">Then go to</p>
            {routeSelect(next, (target) =>
              onChange(withHappyNext(step, target)),
            )}
          </div>
        )}
      </Section>

      <div className="border-hairline-soft flex flex-wrap items-center gap-2 border-t pt-4">
        {!isFirst ? (
          <button
            type="button"
            onClick={onMakeFirst}
            className="border-hairline-strong hover:bg-surface rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            Make this the first step
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index <= 0}
          aria-label="Move up in the list"
          className="border-hairline-strong hover:bg-surface rounded-lg border p-1.5 disabled:opacity-40"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === graph.steps.length - 1}
          aria-label="Move down in the list"
          className="border-hairline-strong hover:bg-surface rounded-lg border p-1.5 disabled:opacity-40"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-400/15"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove step
        </button>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="text-stone hover:text-ink group inline-flex items-center gap-1 text-xs font-medium">
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
          Advanced
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-1.5">
          <Label htmlFor="step-key" className="text-xs">
            Step key
          </Label>
          <div className="flex gap-2">
            <Input
              id="step-key"
              value={keyDraft}
              onChange={(event) => {
                setKeyDraft(event.target.value);
                setKeyError(null);
              }}
              className="h-8 font-mono text-xs"
            />
            <button
              type="button"
              disabled={keyDraft === step.key}
              onClick={() => {
                const clean = slugKey(keyDraft);
                if (onRename(clean)) setKeyDraft(clean);
                else setKeyError("That key is already used.");
              }}
              className="border-hairline-strong hover:bg-surface rounded-lg border px-3 text-xs font-medium disabled:opacity-40"
            >
              Rename
            </button>
          </div>
          <p
            className={cn(
              "text-xs",
              keyError ? "text-coral-dark" : "text-stone",
            )}
          >
            {keyError ??
              "Used by integrations and field visibility. Routes update automatically."}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * "Only when the chosen service needs it": the step is skipped for services
 * whose catalog entry doesn't require manager approval.
 */
function ServiceGate({
  value,
  serviceFields,
  onChange,
}: {
  value: string | null;
  serviceFields: ReadonlyArray<{ key: string; label: string }>;
  onChange: (value: string | null) => void;
}) {
  const enabled = value !== null;
  return (
    <div className="border-hairline-soft space-y-2 rounded-lg border p-3">
      <label className="flex items-start justify-between gap-3">
        <span>
          <span className="text-ink block text-xs font-semibold">
            Only when the chosen service requires it
          </span>
          <span className="text-stone mt-0.5 block text-xs leading-5">
            Skipped for services whose catalog entry doesn&apos;t ask for
            manager approval. The request then continues as if approved.
          </span>
        </span>
        <Switch
          checked={enabled}
          disabled={!enabled && serviceFields.length === 0}
          onCheckedChange={(on) =>
            onChange(on ? (serviceFields[0]?.key ?? "") : null)
          }
        />
      </label>
      {enabled ? (
        serviceFields.length > 0 ? (
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Service field" />
            </SelectTrigger>
            <SelectContent>
              {serviceFields.map((field) => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            The linked form has no service field. Add a Lookup field using the
            Access Services catalog.
          </p>
        )
      ) : serviceFields.length === 0 ? (
        <p className="text-stone text-xs">
          Needs a service field (Lookup → Access Services) in the linked form.
        </p>
      ) : null}
    </div>
  );
}
