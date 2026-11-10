import { describe, expect, it } from "vitest";
import { Role } from "@/core/domain/entities/role.entity";
import {
  SYSTEM_ADMIN_ROLE_NAME,
  isProtectedSystemRoleName,
} from "../system-role-policy";

const idGenerator = { generateId: () => "role-1" };

describe("only the system administrator is protected", () => {
  it("recognizes exactly the system administrator", () => {
    expect(isProtectedSystemRoleName(SYSTEM_ADMIN_ROLE_NAME)).toBe(true);
    expect(isProtectedSystemRoleName("  SYSTEM-ADMINISTRATOR ")).toBe(true);
    for (const name of ["admin", "viewer", "auditor", "finance-manager", "custom-role"]) {
      expect(isProtectedSystemRoleName(name)).toBe(false);
    }
  });

  it("protects the administrator even when a legacy persisted flag is false", () => {
    const admin = Role.create(
      { name: SYSTEM_ADMIN_ROLE_NAME, displayName: "System Administrator", isSystem: false },
      idGenerator,
    );
    expect(admin.isSystem).toBe(true);
    expect(admin.canBeDeleted()).toBe(false);
    expect(() => admin.deactivate()).toThrow("Cannot deactivate system role");
  });

  it("allows ordinary roles to be edited or deactivated", () => {
    const viewer = Role.create(
      { name: "viewer", displayName: "Viewer", isSystem: false },
      idGenerator,
    );
    expect(viewer.isSystem).toBe(false);
    expect(viewer.canBeDeleted()).toBe(true);
    expect(viewer.deactivate().isActive).toBe(false);
  });
});
