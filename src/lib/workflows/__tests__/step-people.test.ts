import { describe, expect, it } from "vitest";

import {
  expectedAssignees,
  joinNames,
  type StepPeopleContext,
} from "../step-people";

const USERS: Record<string, string> = {
  u1: "Ahmed Ali",
  u2: "Sara Omar",
  u3: "Fahad Saleh",
};

const ctx = (over: Partial<StepPeopleContext> = {}): StepPeopleContext => ({
  nameOfUser: (id) => USERS[id] ?? null,
  roleLabel: (id) => (id === "r1" ? "Data Governance" : null),
  fieldLabel: (key) => `“${key}”`,
  fieldValues: {},
  requesterName: "Requester Person",
  managerName: "Manager Person",
  serviceAssignees: () => [],
  ...over,
});

describe("expectedAssignees", () => {
  it("names a specific person and the requester's line manager", () => {
    expect(
      expectedAssignees(
        [{ kind: "USER", userId: "u1" }, { kind: "REQUESTER_MANAGER" }],
        ctx(),
      ),
    ).toEqual(["Ahmed Ali", "Manager Person"]);
  });

  it("describes the line manager when the request has none recorded", () => {
    expect(
      expectedAssignees(
        [{ kind: "REQUESTER_MANAGER" }],
        ctx({ managerName: null }),
      ),
    ).toEqual(["Requester's line manager"]);
  });

  it("names the people in the chosen service's role", () => {
    const people = expectedAssignees(
      [
        {
          kind: "ACCESS_SERVICE_ROLE",
          serviceSnapshotKey: "service",
          role: "OWNER",
        },
      ],
      ctx({
        serviceAssignees: (key, role) =>
          key === "service" && role === "OWNER" ? ["Sara Omar"] : [],
      }),
    );
    expect(people).toEqual(["Sara Omar"]);
  });

  it("names the people for the option chosen, or says it depends", () => {
    const spec = {
      kind: "OPTION_USERS",
      fieldKey: "products",
      options: { Cards: ["u1"], Gaming: ["u2", "u3"] },
    };
    expect(
      expectedAssignees(
        [spec],
        ctx({ fieldValues: { products: ["Cards", "Gaming"] } }),
      ),
    ).toEqual(["Ahmed Ali", "Sara Omar", "Fahad Saleh"]);
    expect(expectedAssignees([spec], ctx())).toEqual(["Depends on “products”"]);
  });

  it("names the person picked in a field", () => {
    expect(
      expectedAssignees(
        [{ kind: "FIELD_USER", fieldKey: "assignee" }],
        ctx({ fieldValues: { assignee: "u3" } }),
      ),
    ).toEqual(["Fahad Saleh"]);
  });

  it("describes a role and drops duplicates", () => {
    expect(
      expectedAssignees(
        [
          { kind: "ROLE", roleId: "r1" },
          { kind: "USER", userId: "u1" },
          { kind: "USER", userId: "u1" },
        ],
        ctx(),
      ),
    ).toEqual(["Anyone with the Data Governance role", "Ahmed Ali"]);
  });
});

describe("joinNames", () => {
  it("keeps long lists short", () => {
    expect(joinNames(["A", "B"])).toBe("A, B");
    expect(joinNames(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 others");
  });
});
