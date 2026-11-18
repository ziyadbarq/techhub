import { describe, expect, it } from "vitest";

import {
  requestListScopeWhere,
  resolveRequestListScope,
} from "../request-list-scope";

describe("resolveRequestListScope", () => {
  it("never gives 'all' without the global view permission", () => {
    expect(resolveRequestListScope("all", false)).toBe("mine");
    expect(resolveRequestListScope(undefined, false)).toBe("mine");
    expect(resolveRequestListScope("anything", false)).toBe("mine");
  });

  it("defaults to 'all' for users who may see everything", () => {
    expect(resolveRequestListScope(undefined, true)).toBe("all");
    expect(resolveRequestListScope("all", true)).toBe("all");
  });

  it("keeps 'mine', 'assigned' and 'forms' for everyone", () => {
    for (const canViewAll of [true, false]) {
      expect(resolveRequestListScope("mine", canViewAll)).toBe("mine");
      expect(resolveRequestListScope("assigned", canViewAll)).toBe("assigned");
      expect(resolveRequestListScope("forms", canViewAll)).toBe("forms");
    }
  });
});

describe("requestListScopeWhere", () => {
  it("limits 'mine' to the requester", () => {
    expect(requestListScopeWhere("mine", "u1")).toEqual({ requesterId: "u1" });
  });

  it("limits 'assigned' to requests with a step assigned to the user", () => {
    expect(requestListScopeWhere("assigned", "u1")).toEqual({
      stepInstances: { some: { snapshots: { some: { userId: "u1" } } } },
    });
  });

  it("limits 'forms' to forms the user is one of the people of", () => {
    expect(requestListScopeWhere("forms", "u1")).toEqual({
      form: { members: { some: { userId: "u1" } } },
    });
  });

  it("does not limit 'all'", () => {
    expect(requestListScopeWhere("all", "u1")).toEqual({});
  });
});
