"use client";

import { cn } from "@/lib/utils";

/**
 * Renders a number value with tabular numerals. The flowbit version uses
 * @number-flow/react to animate transitions, but TechHub does not bundle that
 * dependency — so we render the value statically. Visually, the surrounding
 * layout still inherits font and weight from the parent.
 */
export function AnimatedCount({
  value,
  className,
  prefix,
  suffix,
}: {
  value: number;
  className?: string;
  /** Accepted for API compatibility with the flowbit AnimatedCount. */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
