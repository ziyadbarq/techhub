import { describe, it, expect } from "vitest";
import { lineManagerPersonId } from "../line-manager";

describe("lineManagerPersonId", () => {
  it("uses the manager from the directory first", () => {
    expect(
      lineManagerPersonId({
        id: "me",
        managerId: "ad-boss",
        orgUnitManagerId: "head",
      }),
    ).toBe("ad-boss");
  });

  it("falls back to the unit's manager", () => {
    expect(
      lineManagerPersonId({
        id: "me",
        managerId: null,
        orgUnitManagerId: "head",
      }),
    ).toBe("head");
  });

  it("never returns the person themselves", () => {
    expect(
      lineManagerPersonId({
        id: "head",
        managerId: null,
        orgUnitManagerId: "head",
      }),
    ).toBeNull();
    expect(
      lineManagerPersonId({
        id: "me",
        managerId: "me",
        orgUnitManagerId: null,
      }),
    ).toBeNull();
  });
});
