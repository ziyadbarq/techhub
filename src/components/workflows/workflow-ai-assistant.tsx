/**
 * Workflow AI Assistant panel — clipboard round-trip.
 *
 * The application never calls an AI provider. The user copies a generated
 * prompt into whichever assistant they already use, pastes the JSON reply
 * back here, and the reply is validated against the same contract a
 * hand-authored draft satisfies before anything reaches the canvas.
 *
 * Keeping the system out of the network path means no API key, no egress
 * from the internal network, and no provider configuration — the person
 * decides what leaves the building.
 */

"use client";

import { useState } from "react";
import { ClipboardCheck, Copy, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  GeneratedWorkflowSchema,
  buildWorkflowPrompt,
  findGraphProblems,
  type GeneratedWorkflowDTO,
} from "@/core/domain/value-objects/workflow-ai-contract";

interface WorkflowAiAssistantProps {
  /** Keys already on the canvas, offered to the AI for reuse. */
  existingStepKeys: string[];
  /** The workflow being edited, so the prompt knows what it is drafting. */
  workflowName?: string;
  workflowDescription?: string | null;
  /** Live role names, so the prompt offers real roles and the guard checks them. */
  roleNames: string[];
  /** Access services in the catalog, for service-routed assignees. */
  accessServiceNames: string[];
  /** Called when the user accepts the parsed proposal. */
  onApply: (result: GeneratedWorkflowDTO) => void;
  /** Dismiss the panel; opening is owned by the builder's action bar. */
  onClose: () => void;
}

/** Tolerate a reply wrapped in ```json fences, which chat UIs often add. */
function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function WorkflowAiAssistant({
  existingStepKeys,
  workflowName,
  workflowDescription,
  roleNames,
  accessServiceNames,
  onApply,
  onClose,
}: WorkflowAiAssistantProps) {
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [proposal, setProposal] = useState<GeneratedWorkflowDTO | null>(null);

  async function handleCopyPrompt() {
    const prompt = buildWorkflowPrompt({
      existingStepKeys,
      workflowName,
      workflowDescription: workflowDescription ?? undefined,
      roleNames,
      accessServiceNames,
    });

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Prompt copied — paste it into your AI assistant");
    } catch {
      toast.error("Could not access the clipboard. Select the text manually.");
    }
  }

  function handleParse() {
    setProblems([]);
    setProposal(null);

    let json: unknown;
    try {
      json = JSON.parse(stripCodeFences(reply));
    } catch {
      setProblems([
        "That is not valid JSON. Paste only the JSON object the assistant returned.",
      ]);
      return;
    }

    // Same contract a hand-authored draft goes through — an AI reply gets no
    // shortcut just because a human carried it here.
    const parsed = GeneratedWorkflowSchema.safeParse(json);
    if (!parsed.success) {
      setProblems(
        parsed.error.issues
          .slice(0, 6)
          .map(
            (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
          ),
      );
      return;
    }

    // Schema-valid drafts can still name steps that do not exist.
    const graphProblems = findGraphProblems(parsed.data, roleNames);
    if (graphProblems.length > 0) {
      setProblems(graphProblems);
      return;
    }

    setProposal(parsed.data);
  }

  function handleApply() {
    if (!proposal) return;
    onApply(proposal);
    setProposal(null);
    setReply("");
    onClose();
    toast.success("Draft applied — review the steps before publishing");
  }

  return (
    <div className="bg-card space-y-4 rounded-md border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Draft with AI
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Copy the prompt into your AI assistant, then paste its reply back
            here. Nothing is sent anywhere by this application.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded p-1"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium">1 · Copy the instructions</p>
        <p className="text-muted-foreground text-xs">
          Paste them into ChatGPT, Claude, or whichever assistant you use, then
          describe the process you want in that chat.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleCopyPrompt}
          className="gap-2"
        >
          {copied ? (
            <>
              <ClipboardCheck className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy prompt
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium">2 · Paste the JSON reply here</p>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={7}
          placeholder='{ "summary": "...", "start": "...", "steps": [ ... ] }'
          className="w-full rounded-md border px-3 py-2 font-mono text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleParse}
          disabled={reply.trim().length === 0}
        >
          Check and preview
        </Button>
      </div>

      {problems.length > 0 && (
        <div className="border-destructive/40 bg-destructive/5 space-y-1 rounded-md border p-3">
          <p className="text-destructive text-xs font-medium">
            The reply was rejected:
          </p>
          <ul className="text-destructive list-inside list-disc text-xs">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">
            Ask the assistant to fix it and paste the corrected JSON.
          </p>
        </div>
      )}

      {proposal && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm">{proposal.summary}</p>

          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium">
              Steps ({proposal.steps.length})
            </p>
            <ol className="space-y-1 text-xs">
              {proposal.steps.map((step) => (
                <li key={step.key} className="flex flex-wrap gap-2">
                  <span className="font-mono">{step.key}</span>
                  <span className="text-muted-foreground">{step.type}</span>
                  {step.next && "onAction" in step.next && (
                    <span className="text-muted-foreground">
                      {Object.entries(step.next.onAction)
                        .map(([action, target]) => `${action} → ${target}`)
                        .join(" · ")}
                    </span>
                  )}
                  {step.next && "default" in step.next && (
                    <span className="text-muted-foreground">
                      → {step.next.default}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {proposal.fields && proposal.fields.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Suggested form fields ({proposal.fields.length})
              </p>
              <ul className="space-y-1 text-xs">
                {proposal.fields.map((field) => (
                  <li key={field.label} className="flex gap-2">
                    <span>{field.label}</span>
                    <span className="text-muted-foreground">{field.type}</span>
                    {field.required && (
                      <span className="text-muted-foreground">required</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-1 text-xs">
                Fields are a suggestion only — add them in the form builder.
              </p>
            </div>
          )}

          {proposal.perStepFieldState &&
            Object.keys(proposal.perStepFieldState).length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Field state per step
                </p>
                <ul className="space-y-1 text-xs">
                  {Object.entries(proposal.perStepFieldState).map(
                    ([stepKey, states]) => (
                      <li key={stepKey}>
                        <span className="font-mono">{stepKey}</span>
                        <span className="text-muted-foreground">
                          {" — "}
                          {Object.entries(states)
                            .map(([field, state]) => `${field}: ${state}`)
                            .join(" · ")}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
                <p className="text-muted-foreground mt-1 text-xs">
                  Apply these in the Field state tab after adding the fields.
                </p>
              </div>
            )}

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleApply}>
              Apply steps
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setProposal(null)}
            >
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
