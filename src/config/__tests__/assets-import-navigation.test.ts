import { describe, expect, it } from "vitest";
import { getVisibleNavGroups } from "../navigation";
import { getRouteProtection } from "../protected-routes";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("Assets import entry points", () => {
  it("shows Data Import in the sidebar for users allowed to create assets", () => {
    const groups = getVisibleNavGroups(
      [PERMISSIONS.ASSETS_VIEW, PERMISSIONS.ASSETS_CREATE],
      { enabledFeatures: new Set(["ASSETS"]) },
    );
    const entries = groups.flatMap((group) => group.items);
    expect(entries.filter((item) => item.href === "/data-import")).toHaveLength(1);
    expect(entries.find((item) => item.href === "/data-import")?.title).toBe("Data Import");
    expect(entries.some((item) => item.href === "/assets")).toBe(true);
  });

  it("does not show Data Import without Assets create permission", () => {
    const groups = getVisibleNavGroups([PERMISSIONS.ASSETS_VIEW], {
      enabledFeatures: new Set(["ASSETS"]),
    });
    expect(groups.flatMap((group) => group.items).some((item) => item.href === "/data-import")).toBe(false);
  });

  it("does not show Data Import when Assets feature is disabled", () => {
    const groups = getVisibleNavGroups([PERMISSIONS.ASSETS_CREATE], {
      enabledFeatures: new Set(),
    });
    expect(groups.flatMap((group) => group.items).some((item) => item.href === "/data-import")).toBe(false);
  });

  it("keeps the import page protected by Assets create permission", () => {
    expect(getRouteProtection("/data-import")?.requiredPermissions).toEqual([
      PERMISSIONS.ASSETS_CREATE,
    ]);
  });
});
