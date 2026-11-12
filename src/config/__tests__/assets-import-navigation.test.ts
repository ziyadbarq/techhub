import { describe, expect, it } from "vitest";
import { getVisibleNavGroups } from "../navigation";
import { getRouteProtection } from "../protected-routes";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("Assets import entry point", () => {
  it("does not show the retired Data Import sidebar shortcut", () => {
    const groups = getVisibleNavGroups(
      [PERMISSIONS.ASSETS_VIEW, PERMISSIONS.DATA_IMPORT_MANAGE],
      { enabledFeatures: new Set(["ASSETS", "DATA_IMPORT"]) },
    );
    const entries = groups.flatMap((group) => group.items);
    expect(entries.some((item) => item.href === "/data-import")).toBe(false);
    expect(entries.some((item) => item.href === "/assets")).toBe(true);
  });

  it("keeps the bookmarked route under Assets view protection", () => {
    expect(getRouteProtection("/data-import")?.requiredPermissions)
      .toEqual([PERMISSIONS.ASSETS_VIEW]);
  });
});
