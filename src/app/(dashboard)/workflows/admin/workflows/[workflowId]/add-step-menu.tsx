"use client";

import { Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StepType } from "@/lib/workflows/builder/graph";
import { cn } from "@/lib/utils";

import { STEP_GROUPS, STEP_META } from "./step-meta";

/** "+" between steps, or a full button for the first step. */
export function AddStepMenu({
  onAdd,
  variant = "inline",
  label = "Add a step",
}: {
  onAdd: (type: StepType) => void;
  variant?: "inline" | "button";
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "inline" ? (
          <button
            type="button"
            aria-label={label}
            title={label}
            className="border-hairline-strong bg-canvas text-stone hover:border-ink hover:text-ink focus-visible:ring-ink/20 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            className="bg-ink text-canvas inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {label}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-80 p-1.5">
        {STEP_GROUPS.map((group, index) => (
          <div key={group}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-stone px-2 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.05em] uppercase">
              {group}
            </DropdownMenuLabel>
            {Object.values(STEP_META)
              .filter((meta) => meta.group === group && !meta.hidden)
              .map((meta) => {
                const Icon = meta.icon;
                return (
                  <DropdownMenuItem
                    key={meta.type}
                    onSelect={() => onAdd(meta.type)}
                    className="items-start gap-3 rounded-md px-2 py-2"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        meta.tone,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="text-ink block text-sm font-medium">
                        {meta.title}
                      </span>
                      <span className="text-stone block text-xs leading-5">
                        {meta.description}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
