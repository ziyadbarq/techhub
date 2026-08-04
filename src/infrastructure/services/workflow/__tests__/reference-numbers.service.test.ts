import { describe, it, expect } from "vitest";

import { applyReferenceNumberFormat } from "@/infrastructure/services/workflow/reference-numbers.service";

describe("reference number formatter", () => {
  const tokens = {
    year4: "2026",
    year2: "26",
    month: "05",
    day: "09",
    sequence: 42,
  };

  it("interpolates year/month/day placeholders", () => {
    expect(applyReferenceNumberFormat("REQ-{YYYY}-{seq:04}", tokens)).toBe(
      "REQ-2026-0042",
    );
    expect(
      applyReferenceNumberFormat("REQ-{YY}{MM}{DD}-{seq:04}", tokens),
    ).toBe("REQ-260509-0042");
  });

  it("respects the seq width", () => {
    expect(applyReferenceNumberFormat("X-{seq:6}", tokens)).toBe("X-000042");
    expect(applyReferenceNumberFormat("X-{seq}", tokens)).toBe("X-42");
    expect(applyReferenceNumberFormat("X-{seq:1}", tokens)).toBe("X-42");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(applyReferenceNumberFormat("X-{NOPE}-{seq:04}", tokens)).toBe(
      "X-{NOPE}-0042",
    );
  });
});
