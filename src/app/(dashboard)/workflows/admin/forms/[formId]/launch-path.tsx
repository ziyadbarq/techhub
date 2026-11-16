"use client";

import Link from "next/link";
import { AlertTriangle, Check, ExternalLink, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";

export type LaunchStepState = "done" | "todo" | "warning";

export interface LaunchStep {
  id: "details" | "fields" | "path" | "publish";
  title: string;
  detail: string;
  state: LaunchStepState;
  action?: { label: string; onClick?: () => void; href?: string };
}

/**
 * The journey from an empty request type to one employees can submit:
 * Details → Fields → Approval path → Publish. Each step says what is missing
 * and offers the one action that fixes it.
 */
export function LaunchPath({
  steps,
  live,
  formId,
  formName,
}: {
  steps: LaunchStep[];
  live: boolean;
  formId: string;
  formName: string;
}) {
  return (
    <section aria-label="Launch progress" className="space-y-3">
      {live ? (
        <div className="border-moss-dark/20 bg-mint-light text-moss-dark flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
          <Rocket className="h-5 w-5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">Live.</span> Employees can find “
            {formName}” in Browse forms and submit it.
          </p>
          <Link
            href={`/workflows/requests/new/${formId}`}
            className="bg-canvas text-ink inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            Try it as an employee <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "bg-canvas flex items-start gap-3 rounded-xl border p-3",
              step.state === "warning"
                ? "border-yellow-dark/40"
                : "border-hairline",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                step.state === "done"
                  ? "bg-mint-light text-moss-dark"
                  : step.state === "warning"
                    ? "bg-yellow-light text-yellow-dark"
                    : "bg-surface text-stone",
              )}
            >
              {step.state === "done" ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : step.state === "warning" ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-semibold">
                <span className="sr-only">
                  {step.state === "done"
                    ? "Done: "
                    : step.state === "warning"
                      ? "Needs attention: "
                      : "To do: "}
                </span>
                {step.title}
              </p>
              <p className="text-stone mt-0.5 text-xs leading-5">
                {step.detail}
              </p>
              {step.action ? (
                step.action.href ? (
                  <Link
                    href={step.action.href}
                    className="text-ink mt-1.5 inline-block text-xs font-semibold underline-offset-2 hover:underline"
                  >
                    {step.action.label} →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={step.action.onClick}
                    className="text-ink mt-1.5 text-xs font-semibold underline-offset-2 hover:underline"
                  >
                    {step.action.label} →
                  </button>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
