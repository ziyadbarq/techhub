"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, GitBranch, Loader2, Workflow } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows/builder/graph";

interface WorkflowOption {
  id: string;
  name: string;
  published: boolean;
  formCount: number;
}

type PathChoice = "new" | "existing";

async function readError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return body.message || body.error || fallback;
}

export function NewFormClient({
  workflows,
  canCreateWorkflow,
}: {
  workflows: WorkflowOption[];
  canCreateWorkflow: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [choice, setChoice] = useState<PathChoice>(
    canCreateWorkflow ? "new" : "existing",
  );
  const [templateId, setTemplateId] = useState(WORKFLOW_TEMPLATES[0]!.id);
  const [workflowId, setWorkflowId] = useState(
    workflows.find((w) => w.published)?.id ?? workflows[0]?.id ?? "",
  );
  const [referenceNumberFormat, setReferenceNumberFormat] = useState(
    "REQ-{YYYY}-{seq:04}",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready =
    name.trim().length > 0 && (choice === "new" ? !!templateId : !!workflowId);

  async function handleCreate() {
    if (!ready || busy) return;
    setError(null);
    try {
      let definitionId = workflowId;

      if (choice === "new") {
        setBusy("Creating the approval path…");
        const created = await fetch("/api/workflow/admin/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${name.trim()} approval`,
            description: `Approval path for “${name.trim()}”.`,
          }),
        });
        if (!created.ok) {
          throw new Error(
            await readError(created, "The approval path couldn't be created."),
          );
        }
        const body = (await created.json()) as { definition: { id: string } };
        definitionId = body.definition.id;

        const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId)!;
        const draft = await fetch(
          `/api/workflow/admin/workflows/${definitionId}/draft`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(template.build()),
          },
        );
        if (!draft.ok) {
          throw new Error(
            await readError(draft, "The approval path couldn't be set up."),
          );
        }
      }

      setBusy("Creating the form…");
      const response = await fetch("/api/workflow/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          workflowDefinitionId: definitionId,
          referenceNumberFormat,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readError(response, "The form couldn't be created."),
        );
      }
      const body = (await response.json()) as { form: { id: string } };
      router.push(`/workflows/admin/forms/${body.form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }

  return (
    <div className="grid max-w-5xl gap-6">
      <section className="border-hairline bg-canvas rounded-2xl border p-6">
        <h2 className="text-ink flex items-center gap-2 font-semibold">
          <span className="bg-ink text-canvas flex h-6 w-6 items-center justify-center rounded-full text-xs">
            1
          </span>
          What is it?
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="form-name">Name</Label>
            <Input
              id="form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptop request"
              autoFocus
            />
            <p className="text-stone text-xs">
              What employees look for in Browse forms.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="When to use it, and what happens after submitting."
            />
          </div>
        </div>
      </section>

      <section className="border-hairline bg-canvas rounded-2xl border p-6">
        <h2 className="text-ink flex items-center gap-2 font-semibold">
          <span className="bg-ink text-canvas flex h-6 w-6 items-center justify-center rounded-full text-xs">
            2
          </span>
          How is it approved?
        </h2>
        <p className="text-stone mt-1 text-sm">
          You can change every step afterwards in the approval path.
        </p>

        <div
          role="radiogroup"
          aria-label="Approval path"
          className="mt-5 grid gap-3 md:grid-cols-2"
        >
          {[
            {
              value: "new" as const,
              icon: GitBranch,
              title: "Start a new approval path",
              hint: "From a ready-made template, just for this form.",
              disabled: !canCreateWorkflow,
            },
            {
              value: "existing" as const,
              icon: Workflow,
              title: "Reuse an existing path",
              hint: "Share a path other forms already use.",
              disabled: workflows.length === 0,
            },
          ].map((option) => {
            const Icon = option.icon;
            const active = choice === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={option.disabled}
                onClick={() => setChoice(option.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-ink bg-surface/60"
                    : "border-hairline hover:border-hairline-strong",
                )}
              >
                <Icon className="text-ink mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-sm font-semibold">
                    {option.title}
                  </span>
                  <span className="text-stone block text-xs leading-5">
                    {option.disabled && option.value === "new"
                      ? "Your role can't create approval paths."
                      : option.hint}
                  </span>
                </span>
                {active ? (
                  <Check className="text-ink h-4 w-4 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {choice === "new" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {WORKFLOW_TEMPLATES.map((template) => {
              const active = templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTemplateId(template.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-ink ring-ink/10 ring-4"
                      : "border-hairline hover:border-hairline-strong",
                  )}
                >
                  <span className="text-ink block text-sm font-semibold">
                    {template.name}
                  </span>
                  <span className="text-stone mt-1 block text-xs leading-5">
                    {template.description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 max-w-md space-y-1.5">
            <Label>Approval path</Label>
            <Select
              value={workflowId || undefined}
              onValueChange={setWorkflowId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choose a path" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                    <span className="text-stone">
                      {" · "}
                      {w.published
                        ? `used by ${w.formCount} form${w.formCount === 1 ? "" : "s"}`
                        : "not published"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workflows.find((w) => w.id === workflowId && !w.published) ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This path isn&apos;t published yet. Publish it before employees
                can submit.
              </p>
            ) : null}
          </div>
        )}

        <Collapsible className="mt-6">
          <CollapsibleTrigger className="text-stone hover:text-ink group inline-flex items-center gap-1 text-xs font-medium">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            Advanced: reference number
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 max-w-md space-y-1.5">
            <Label htmlFor="ref-format" className="text-xs">
              Reference number format
            </Label>
            <Input
              id="ref-format"
              value={referenceNumberFormat}
              onChange={(e) => setReferenceNumberFormat(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-stone text-xs">
              Tokens: {"{YYYY}"}, {"{YY}"}, {"{MM}"}, {"{DD}"}, {"{seq:04}"}.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-800 dark:bg-rose-400/15 dark:text-rose-300"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!ready || !!busy}
          className="bg-ink text-canvas inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ?? "Create and add fields"}
        </button>
        <p className="text-stone text-xs">
          Nothing is visible to employees until you publish.
        </p>
      </div>
    </div>
  );
}
