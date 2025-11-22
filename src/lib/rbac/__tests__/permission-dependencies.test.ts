/**
 * Permission Dependencies Tests
 */

import { describe, it, expect } from "vitest";
import {
  validatePermissionDependencies,
  getPermissionDependencies,
  hasPermissionDependencies,
} from "../permission-dependencies";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("Permission Dependencies", () => {
  describe("validatePermissionDependencies", () => {
    it("should pass validation when all dependencies are present", () => {
      const result = validatePermissionDependencies([
        PERMISSIONS.ASSETS_VIEW,
        PERMISSIONS.ASSETS_UPDATE,
      ]);

      expect(result.valid).toBe(true);
      expect(result.missing.length).toBe(0);
    });

    it("should fail validation when dependencies are missing", () => {
      const result = validatePermissionDependencies([
        PERMISSIONS.ASSETS_UPDATE, // requires ASSETS_VIEW
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBe(1);
      expect(result.missing[0].permission).toBe(PERMISSIONS.ASSETS_UPDATE);
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_VIEW,
      );
    });

    it("should detect multiple missing dependencies", () => {
      const result = validatePermissionDependencies([
        PERMISSIONS.ASSETS_MANAGE, // requires VIEW, CREATE, UPDATE, DELETE, CHECKOUT
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBe(1);
      expect(result.missing[0].requiredDependencies.length).toBeGreaterThan(1);
    });

    it("should handle DELETE requiring VIEW", () => {
      const result = validatePermissionDependencies([
        PERMISSIONS.ASSETS_DELETE, // requires ASSETS_VIEW
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing[0].requiredDependencies).toContain(
        PERMISSIONS.ASSETS_VIEW,
      );
    });
  });

  describe("getPermissionDependencies", () => {
    it("should return dependencies for permissions that have them", () => {
      const deps = getPermissionDependencies(PERMISSIONS.ASSETS_UPDATE);

      expect(deps).toContain(PERMISSIONS.ASSETS_VIEW);
      expect(deps.length).toBeGreaterThan(0);
    });

    it("should return empty array for permissions without dependencies", () => {
      const deps = getPermissionDependencies(PERMISSIONS.ASSETS_VIEW);

      expect(deps).toEqual([]);
    });
  });

  describe("hasPermissionDependencies", () => {
    it("should return true for permissions with dependencies", () => {
      expect(hasPermissionDependencies(PERMISSIONS.ASSETS_UPDATE)).toBe(true);
      expect(hasPermissionDependencies(PERMISSIONS.ASSETS_DELETE)).toBe(true);
      expect(hasPermissionDependencies(PERMISSIONS.ASSETS_MANAGE)).toBe(true);
    });

    it("should return false for permissions without dependencies", () => {
      expect(hasPermissionDependencies(PERMISSIONS.ASSETS_VIEW)).toBe(false);
      expect(hasPermissionDependencies(PERMISSIONS.ASSETS_CREATE)).toBe(false);
    });
  });
});
