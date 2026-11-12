import { describe, expect, it } from "vitest";
import { safeReturnPath } from "../safe-return-path";

describe("safeReturnPath", () => {
  it("preserves a direct form deep link", () => {
    expect(safeReturnPath("/request/form-123")).toBe("/request/form-123");
  });
  it("uses a safe fallback for external or protocol-relative URLs", () => {
    expect(safeReturnPath("https://untrusted.example")).toBe("/dashboard");
    expect(safeReturnPath("//untrusted.example")).toBe("/dashboard");
    expect(safeReturnPath("/\\untrusted.example")).toBe("/dashboard");
    expect(safeReturnPath(null)).toBe("/dashboard");
  });
});
