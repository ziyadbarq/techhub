import { describe, expect, it } from "vitest";
import {
  buildRequestMenuChildren,
  getVisibleNavGroups,
} from "../navigation";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("Requests sidebar dropdown", () => {
  it("lists every published form by name and links directly to the form", () => {
    const items = buildRequestMenuChildren([
      { id: "form-1", name: "Asset Request", description: null },
      { id: "form-2", name: "Access Request", description: "Request access" },
      { id: "form-3", name: "Incident Report", description: null },
    ], "ready");

    expect(items.map((item) => item.title)).toEqual([
      "Asset Request",
      "Access Request",
      "Incident Report",
    ]);
    expect(items.map((item) => item.href)).toEqual([
      "/workflows/requests/new/form-1",
      "/workflows/requests/new/form-2",
      "/workflows/requests/new/form-3",
    ]);
    expect(items.some((item) => ["My Requests", "New Request"].includes(item.title))).toBe(false);
  });

  it("does not show Requests without submit permission or the workflow flag", () => {
    const noSubmit = getVisibleNavGroups(
      [PERMISSIONS.WORKFLOWS_INBOX_VIEW],
      { enabledFeatures: new Set(["WORKFLOW_ENGINE"]) },
    );
    const withoutFlag = getVisibleNavGroups(
      [PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT],
      { enabledFeatures: new Set<string>() },
    );
    expect(noSubmit.flatMap((group) => group.items).some((item) => item.title === "Requests")).toBe(false);
    expect(withoutFlag.flatMap((group) => group.items).some((item) => item.title === "Requests")).toBe(false);
  });

  it("shows an honest empty state when nothing is published", () => {
    const [item] = buildRequestMenuChildren([], "ready");
    expect(item.title).toBe("No published forms");
    expect(item.href).toBe("/workflows/forms");
  });
});
