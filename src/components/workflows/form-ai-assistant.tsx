/**
 * Form AI Assistant panel — clipboard round-trip.
 *
 * The application never calls an AI provider. The user copies instructions
 * into whichever assistant they already use, pastes the JSON reply back, and
 * the reply is validated before anything reaches the canvas. The person
 * decides what leaves the building.
 */

"use client";

import { useState } from "react";
import { ClipboardCheck, Copy, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  GeneratedFormSchema,
  buildFormPrompt,
  findFormProblems,
  type GeneratedFormDTO,
} from "@/core/domain/value-objects/form-ai-contract";

interface FormAiAssistantProps {
  /** Field keys already on the canvas, offered for reuse. */
  existingFieldKeys: string[];
  formName?: string;
  /** Access services, so a LOOKUP can point at the catalog. */
  accessServiceNames: string[];
  onApply: (result: GeneratedFormDTO) => void;
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

export function FormAiAssistant({
  existingFieldKeys,
  formName,
  accessServiceNames,
  onApply,
  onClose,
}: FormAiAssistantProps) {
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [proposal, setProposal] = useState<GeneratedFormDTO | null>(null);

  async function handleCopyPrompt() {
    const prompt = buildFormPrompt({
      formName,
      existingFieldKeys,
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

    const parsed = GeneratedFormSchema.safeParse(json);
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

    // Schema-valid fields can still be unusable — a DROPDOWN with no options.
    const formProblems = findFormProblems(parsed.data);
    if (formProblems.length > 0) {
      setProblems(formProblems);
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
    toast.success("Fields applied — review them before publishing");
  }

  return (
    <div className="bg-card space-y-4 rounded-md border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Draft with AI</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Copy the instructions into your AI assistant, then paste its reply
            back here. Nothing is sent anywhere by this application.
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
          describe the request this form is for.
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
          placeholder='{ "summary": "...", "fields": [ ... ] }'
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
              Fields ({proposal.fields.length}) — replaces what is on the canvas
            </p>
            <ol className="space-y-1 text-xs">
              {proposal.fields.map((field) => (
                <li key={field.key} className="flex flex-wrap gap-2">
                  <span className="font-mono">{field.key}</span>
                  <span>{field.label}</span>
                  <span className="text-muted-foreground">{field.type}</span>
                  {field.required && (
                    <span className="text-muted-foreground">required</span>
                  )}
                  {field.visibility && field.visibility !== "VISIBLE" && (
                    <span className="text-muted-foreground">
                      {field.visibility}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleApply}>
              Apply fields
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
