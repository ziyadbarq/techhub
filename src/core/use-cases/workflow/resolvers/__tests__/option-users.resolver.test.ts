import { describe, it, expect } from "vitest";
import { OptionUsersAssigneeResolver } from "../option-users.resolver";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx } from "@/core/repositories/workflow";

function exec(
  fieldValues: Record<string, unknown>,
): ExecCtx & { requesterId: string } {
  return {
    requestId: "req-1",
    requesterId: "requester",
    stepInstanceId: "step-1",
    fieldValues,
    ctx: { userId: "requester", system: undefined },
    tx: {} as ExecCtx["tx"],
  };
}

const spec: AssigneeSpec = {
  kind: "OPTION_USERS",
  fieldKey: "products",
  options: {
    Accounts: ["owner-accounts"],
    Cards: ["owner-cards"],
    Gaming: ["owner-gaming-1", "owner-gaming-2"],
    "Customer Support": [],
  },
};

describe("OptionUsersAssigneeResolver", () => {
  const resolver = new OptionUsersAssigneeResolver();

  it("returns the people of a single chosen option", async () => {
    expect(await resolver.resolve(spec, exec({ products: "Cards" }))).toEqual([
      "owner-cards",
    ]);
  });

  it("returns everyone mapped to any chosen option, once", async () => {
    const ids = await resolver.resolve(
      { ...spec, options: { ...spec.options, Cards: ["owner-accounts"] } },
      exec({ products: ["Accounts", "Cards", "Gaming"] }),
    );
    expect(ids).toEqual(["owner-accounts", "owner-gaming-1", "owner-gaming-2"]);
  });

  it("adds no one for an option without people, or no answer", async () => {
    expect(
      await resolver.resolve(spec, exec({ products: ["Customer Support"] })),
    ).toEqual([]);
    expect(await resolver.resolve(spec, exec({}))).toEqual([]);
    expect(await resolver.resolve(spec, exec({ products: "Unknown" }))).toEqual(
      [],
    );
  });

  it("ignores other assignee kinds", async () => {
    expect(
      await resolver.resolve(
        { kind: "REQUESTER" },
        exec({ products: "Cards" }),
      ),
    ).toEqual([]);
  });
});
