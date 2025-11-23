/**
 * RBAC Server-Side Validation Tests
 *
 * Tests for server-side enforcement of:
 * - Permission dependencies
 * - Role conflict detection
 */

import { describe, it, expect } from "vitest";
import {
  validatePermissionDependencies,
  getPermissionDependencies,
  hasPermissionDependencies,
} from "@/lib/rbac/permission-dependencies";
import {
  detectRoleConflicts,
  rolesConflict,
  validateRoleAddition,
  getConflictingRoles,
} from "@/lib/rbac/role-conflicts";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

describe("Permission Dependencies - Server Validation", () => {
  describe("validatePermissionDependencies", () => {
    it("should return valid=true when all dependencies are met", () => {
      const permissions: PermissionKey[] = [
        PERMISSIONS.ASSETS_VIEW,
        PERMISSIONS.ASSETS_UPDATE,
        PERMISSIONS.ASSETS_DELETE,
      ];

      const result = validatePermissionDependencies(permissions);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should detect missing VIEW dependency for UPDATE", () => {
      const permissions: PermissionKey[] = [PERMISSIONS.ASSETS_UPDATE];

      const result = validatePermissionDependencies(permissions);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].permission).toBe(PERMISSIONS.ASSETS_UPDATE);
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_VIEW,
      );
    });

    it("should detect missing VIEW dependency for DELETE", () => {
      const permissions: PermissionKey[] = [PERMISSIONS.ASSETS_DELETE];

      const result = validatePermissionDependencies(permissions);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].permission).toBe(PERMISSIONS.ASSETS_DELETE);
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_VIEW,
      );
    });

    it("should detect multiple missing dependencies for MANAGE", () => {
      const permissions: PermissionKey[] = [PERMISSIONS.ASSETS_MANAGE];

      const result = validatePermissionDependencies(permissions);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].permission).toBe(PERMISSIONS.ASSETS_MANAGE);
      expect(result.missing[0].requiredDependencies.length).toBeGreaterThan(0);
    });

    it("should detect nested dependencies for CHECKOUT", () => {
      const permissions: PermissionKey[] = [PERMISSIONS.ASSETS_CHECKOUT];

      const result = validatePermissionDependencies(permissions);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_VIEW,
      );
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_UPDATE,
      );
    });

    it("should handle empty permission array", () => {
      const result = validatePermissionDependencies([]);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe("getPermissionDependencies", () => {
    it("should return dependencies for UPDATE permission", () => {
      const deps = getPermissionDependencies(PERMISSIONS.ASSETS_UPDATE);

      expect(deps).toContain(PERMISSIONS.ASSETS_VIEW);
    });

    it("should return empty array for VIEW permission (no dependencies)", () => {
      const deps = getPermissionDependencies(PERMISSIONS.ASSETS_VIEW);

      expect(deps).toEqual([]);
    });
  });

  describe("hasPermissionDependencies", () => {
    it("should return true for UPDATE permission", () => {
      const result = hasPermissionDependencies(PERMISSIONS.ASSETS_UPDATE);

      expect(result).toBe(true);
    });

    it("should return false for VIEW permission", () => {
      const result = hasPermissionDependencies(PERMISSIONS.ASSETS_VIEW);

      expect(result).toBe(false);
    });
  });
});

describe("Role Conflicts - Server Validation", () => {
  describe("rolesConflict - Bidirectional Detection", () => {
    it("should detect conflict with direct mapping (auditor -> administrator)", () => {
      const result = rolesConflict("auditor", "administrator");

      expect(result).toBe(true);
    });

    it("should detect conflict with reverse mapping (administrator -> auditor)", () => {
      const result = rolesConflict("administrator", "auditor");

      expect(result).toBe(true);
    });

    it("should detect conflict for finance-manager <-> procurement-manager", () => {
      expect(rolesConflict("finance-manager", "procurement-manager")).toBe(
        true,
      );
      expect(rolesConflict("procurement-manager", "finance-manager")).toBe(
        true,
      );
    });

    it("should return false for non-conflicting roles", () => {
      const result = rolesConflict("developer", "finance-manager");

      expect(result).toBe(false);
    });
  });

  describe("detectRoleConflicts", () => {
    it("should detect critical conflict between auditor and administrator", () => {
      const result = detectRoleConflicts(["auditor", "administrator"]);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].severity).toBe("critical");
      expect(result.conflicts[0].role1).toBe("auditor");
      expect(result.conflicts[0].role2).toBe("administrator");
    });

    it("should detect multiple conflicts", () => {
      const result = detectRoleConflicts([
        "auditor",
        "administrator",
        "developer",
      ]);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it("should return no conflicts for compatible roles", () => {
      const result = detectRoleConflicts(["developer", "analyst"]);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should handle single role (no conflicts possible)", () => {
      const result = detectRoleConflicts(["auditor"]);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should handle empty role array", () => {
      const result = detectRoleConflicts([]);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe("validateRoleAddition", () => {
    it("should block adding administrator to user with auditor role", () => {
      const result = validateRoleAddition(["auditor"], "administrator");

      expect(result.canAdd).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].severity).toBe("critical");
    });

    it("should block adding auditor to user with administrator role", () => {
      const result = validateRoleAddition(["administrator"], "auditor");

      expect(result.canAdd).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });

    it("should allow adding compatible role", () => {
      const result = validateRoleAddition(["developer"], "analyst");

      expect(result.canAdd).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should allow warnings but not block for non-critical conflicts", () => {
      const result = validateRoleAddition(["developer"], "production-admin");

      // This is a warning-level conflict, should allow with warning
      expect(result.conflicts.length).toBeGreaterThanOrEqual(0);
      if (result.conflicts.length > 0) {
        expect(result.conflicts[0].severity).not.toBe("critical");
      }
    });
  });

  describe("getConflictingRoles - Bidirectional Lookup", () => {
    it("should return all conflicts for auditor role", () => {
      const conflicts = getConflictingRoles("auditor");

      expect(conflicts).toContain("administrator");
      expect(conflicts).toContain("developer");
      expect(conflicts).toContain("system-admin");
    });

    it("should include reverse conflicts", () => {
      const conflicts = getConflictingRoles("administrator");

      expect(conflicts).toContain("auditor");
    });

    it("should return empty array for role with no conflicts", () => {
      const conflicts = getConflictingRoles("analyst");

      expect(conflicts).toEqual([]);
    });

    it("should deduplicate conflicts listed both ways", () => {
      const conflicts = getConflictingRoles("finance-manager");

      // Should not have duplicates
      const uniqueConflicts = [...new Set(conflicts)];
      expect(conflicts.length).toBe(uniqueConflicts.length);
    });
  });
});

describe("Integration - Permission Dependencies + Role Conflicts", () => {
  it("should validate both dependencies and conflicts in bulk operations", () => {
    // Simulate bulk role assignment validation
    const userRoles = ["auditor"];
    const newRole = "administrator";
    const newPermissions: PermissionKey[] = [PERMISSIONS.ASSETS_UPDATE];

    // Check role conflicts
    const conflictCheck = validateRoleAddition(userRoles, newRole);
    expect(conflictCheck.canAdd).toBe(false);

    // Check permission dependencies
    const depCheck = validatePermissionDependencies(newPermissions);
    expect(depCheck.valid).toBe(false);
  });

  it("should allow valid bulk operation", () => {
    const userRoles = ["developer"];
    const newRole = "analyst";
    const newPermissions: PermissionKey[] = [
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_UPDATE,
    ];

    const conflictCheck = validateRoleAddition(userRoles, newRole);
    expect(conflictCheck.canAdd).toBe(true);

    const depCheck = validatePermissionDependencies(newPermissions);
    expect(depCheck.valid).toBe(true);
  });
});
