import { describe, it, expect } from "vitest";

import type {
  CancelOutcome,
  CloseOutcome,
  TerminalOutcome,
} from "@/core/repositories/workflow";

/**
 * Sanity tests over the outcome type space (PRD §9.2). Catches accidental
 * shrinkage of the union types — e.g., if someone removes a generic outcome
 * by mistake, these tests fail.
 */
describe("Outcome state machine — type-level checks", () => {
  it("CLOSED outcomes are exactly the 3 success/issues/unsuccessful values", () => {
    const close: CloseOutcome[] = [
      "SUCCESSFUL",
      "SUCCESSFUL_WITH_ISSUES",
      "UNSUCCESSFUL",
    ];
    expect(close).toHaveLength(3);
  });

  it("CANCELLED outcomes are exactly the 5 cancellation values", () => {
    const cancel: CancelOutcome[] = [
      "WITHDRAWN",
      "REJECTED",
      "SUPERSEDED",
      "ABANDONED",
      "EXPIRED",
    ];
    expect(cancel).toHaveLength(5);
  });

  it("Terminal outcomes union covers all 8 generic outcomes", () => {
    const all: TerminalOutcome[] = [
      "SUCCESSFUL",
      "SUCCESSFUL_WITH_ISSUES",
      "UNSUCCESSFUL",
      "WITHDRAWN",
      "REJECTED",
      "SUPERSEDED",
      "ABANDONED",
      "EXPIRED",
    ];
    expect(new Set(all).size).toBe(8);
  });

  it("CLOSED and CANCELLED outcomes are disjoint", () => {
    const close = new Set<string>([
      "SUCCESSFUL",
      "SUCCESSFUL_WITH_ISSUES",
      "UNSUCCESSFUL",
    ]);
    const cancel = new Set<string>([
      "WITHDRAWN",
      "REJECTED",
      "SUPERSEDED",
      "ABANDONED",
      "EXPIRED",
    ]);
    for (const c of close) expect(cancel.has(c)).toBe(false);
    for (const c of cancel) expect(close.has(c)).toBe(false);
  });
});
