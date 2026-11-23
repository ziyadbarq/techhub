import { describe, expect, it } from "vitest";
import {
  buildRequestMenuChildren,
  getVisibleNavGroups,
  isItemActive,
} from "../navigation";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("New request sidebar dropdown", () => {
  it("lists every published form by name and links directly to the form", () => {
    const items = buildRequestMenuChildren(
      [
        { id: "form-1", name: "Asset Request", description: null },
        { id: "form-2", name: "Access Request", description: "Request access" },
        { id: "form-3", name: "Incident Report", description: null },
      ],
      "ready",
    );

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
    expect(
      items.some((item) => ["My Requests", "New Request"].includes(item.title)),
    ).toBe(false);
  });

  it("does not show New request without submit permission or the workflow flag", () => {
    const noSubmit = getVisibleNavGroups([PERMISSIONS.WORKFLOWS_INBOX_VIEW], {
      enabledFeatures: new Set(["WORKFLOW_ENGINE"]),
    });
    const withoutFlag = getVisibleNavGroups(
      [PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT],
      { enabledFeatures: new Set<string>() },
    );
    expect(
      noSubmit
        .flatMap((group) => group.items)
        .some((item) => item.title === "New request"),
    ).toBe(false);
    expect(
      withoutFlag
        .flatMap((group) => group.items)
        .some((item) => item.title === "New request"),
    ).toBe(false);
  });

  it("shows an honest empty state when nothing is published", () => {
    const [item] = buildRequestMenuChildren([], "ready");
    expect(item.title).toBe("No published forms");
    expect(item.href).toBe("/workflows/forms");
  });
});

describe("Requests list in the sidebar", () => {
  const workflowItems = (permissions: string[]) =>
    getVisibleNavGroups(permissions as never, {
      enabledFeatures: new Set(["WORKFLOW_ENGINE"]),
    })
      .flatMap((group) => group.items)
      .map((item) => ({ title: item.title, href: item.href }));

  it("links to the requests list for anyone who can view their own", () => {
    expect(
      workflowItems([
        PERMISSIONS.WORKFLOWS_INBOX_VIEW,
        PERMISSIONS.WORKFLOWS_REQUESTS_VIEW_OWN,
        PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT,
      ]).filter((item) => item.href.startsWith("/workflows/")),
    ).toEqual([
      { title: "Inbox", href: "/workflows/inbox" },
      { title: "Requests", href: "/workflows/requests" },
      { title: "New request", href: "/workflows/forms" },
    ]);
  });

  it("is active on a request, not while filling a new one", () => {
    const item = {
      href: "/workflows/requests",
      activeExcludes: ["/workflows/requests/new"],
    };
    expect(isItemActive(item, "/workflows/requests")).toBe(true);
    expect(isItemActive(item, "/workflows/requests/req-1")).toBe(true);
    expect(isItemActive(item, "/workflows/requests/new/form-1")).toBe(false);
  });
});
