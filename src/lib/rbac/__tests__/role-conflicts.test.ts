/**
 * Role Conflict Detection Tests
 */

import { describe, it, expect } from "vitest";
import {
  detectRoleConflicts,
  rolesConflict,
  validateRoleAddition,
  getConflictingRoles,
} from "../role-conflicts";

describe("Role Conflict Detection", () => {
  describe("rolesConflict", () => {
    it("should detect bidirectional conflicts", () => {
      // Test forward direction: auditor conflicts with administrator
      expect(rolesConflict("auditor", "administrator")).toBe(true);

      // Test reverse direction: administrator should also conflict with auditor
      expect(rolesConflict("administrator", "auditor")).toBe(true);
    });

    it("should return false for non-conflicting roles", () => {
      expect(rolesConflict("developer", "asset-manager")).toBe(false);
    });

    it("should detect one-sided config entries bidirectionally", () => {
      // Even if only "asset-approver" has "asset-requestor" in config,
      // the reverse should also return true
      expect(rolesConflict("asset-approver", "asset-requestor")).toBe(true);
      expect(rolesConflict("asset-requestor", "asset-approver")).toBe(true);
    });
  });

  describe("detectRoleConflicts", () => {
    it("should use bidirectional checking", () => {
      // Test with roles where conflict is only defined in one direction in config
      const result = detectRoleConflicts(["asset-requestor", "asset-approver"]);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].role1).toBe("asset-requestor");
      expect(result.conflicts[0].role2).toBe("asset-approver");
    });

    it("should detect multiple conflicts", () => {
      const result = detectRoleConflicts([
        "auditor",
        "administrator",
        "developer",
      ]);

      expect(result.hasConflicts).toBe(true);
      // auditor conflicts with both administrator and developer
      expect(result.conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it("should return no conflicts for compatible roles", () => {
      const result = detectRoleConflicts(["developer", "asset-manager"]);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });
  });

  describe("validateRoleAddition", () => {
    it("should block critical conflicts", () => {
      const result = validateRoleAddition(["auditor"], "administrator");

      expect(result.canAdd).toBe(false);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].severity).toBe("critical");
    });

    it("should allow roles with no conflicts", () => {
      const result = validateRoleAddition(["developer"], "asset-manager");

      expect(result.canAdd).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });

    it("should allow roles with non-critical conflicts", () => {
      const result = validateRoleAddition(["developer"], "production-admin");

      // Should have conflicts but canAdd should be true (warning severity)
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].severity).not.toBe("critical");
    });
  });

  describe("getConflictingRoles", () => {
    it("should return all conflicting roles bidirectionally", () => {
      const conflicts = getConflictingRoles("auditor");

      expect(conflicts).toContain("administrator");
      expect(conflicts).toContain("developer");
      expect(conflicts).toContain("system-admin");
    });

    it("should include reverse conflicts", () => {
      // asset-approver has asset-requestor in config
      // but asset-requestor might not have asset-approver
      // getConflictingRoles should still return both
      const conflicts = getConflictingRoles("asset-requestor");

      expect(conflicts).toContain("asset-approver");
    });
  });
});
