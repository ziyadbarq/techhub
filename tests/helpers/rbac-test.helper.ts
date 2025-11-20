/**
 * RBAC Test Helpers
 *
 * Helper functions and mock implementations for RBAC testing.
 * Provides utilities for:
 * - Creating mock repositories
 * - Setting up test data
 * - Common test assertions
 */

import { Role } from "@/core/domain/entities/role.entity";
import { Permission } from "@/core/domain/entities/permission.entity";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Test data factory for roles
 */
export class RoleTestFactory {
  static createEditor(): Role {
    return Role.create({
      name: "editor",
      displayName: "Editor",
      description: "Can edit content",
      isSystem: false,
    });
  }

  static createViewer(): Role {
    return Role.create({
      name: "viewer",
      displayName: "Viewer",
      description: "Can view content",
      isSystem: false,
    });
  }

  static createAdmin(): Role {
    return Role.create({
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      isSystem: true,
    });
  }

  static createCustom(overrides: {
    name: string;
    displayName: string;
    description?: string;
    isSystem?: boolean;
  }): Role {
    return Role.create(overrides);
  }
}

/**
 * Test data factory for permissions
 */
export class PermissionTestFactory {
  static createTasksRead(): Permission {
    return Permission.create({
      resource: "tasks",
      action: "read",
      displayName: "Read Tasks",
      description: "Can view tasks",
    });
  }

  static createTasksCreate(): Permission {
    return Permission.create({
      resource: "tasks",
      action: "create",
      displayName: "Create Tasks",
      description: "Can create new tasks",
    });
  }

  static createTasksUpdate(): Permission {
    return Permission.create({
      resource: "tasks",
      action: "update",
      displayName: "Update Tasks",
      description: "Can update existing tasks",
    });
  }

  static createTasksDelete(): Permission {
    return Permission.create({
      resource: "tasks",
      action: "delete",
      displayName: "Delete Tasks",
      description: "Can delete tasks",
    });
  }

  static createCustom(overrides: {
    resource: string;
    action: string;
    displayName: string;
    description?: string;
    isSystem?: boolean;
  }): Permission {
    return Permission.create(overrides);
  }
}

/**
 * Test data factory for user roles
 */
export class UserRoleTestFactory {
  static create(
    userId: string,
    roleId: string,
    options?: {
      expiresAt?: Date;
      createdBy?: string;
    },
  ): UserRole {
    return UserRole.create({
      userId,
      roleId,
      expiresAt: options?.expiresAt,
      createdBy: options?.createdBy,
    });
  }

  static createExpired(userId: string, roleId: string): UserRole {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    return UserRole.create({
      userId,
      roleId,
      expiresAt: expiredDate,
    });
  }

  static createWithExpiry(
    userId: string,
    roleId: string,
    daysFromNow: number,
  ): UserRole {
    const expiresAt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    return UserRole.create({
      userId,
      roleId,
      expiresAt,
    });
  }
}

/**
 * Helper to create a set of standard permissions
 */
export function createStandardPermissions(): Permission[] {
  return [
    PermissionTestFactory.createTasksRead(),
    PermissionTestFactory.createTasksCreate(),
    PermissionTestFactory.createTasksUpdate(),
    PermissionTestFactory.createTasksDelete(),
  ];
}

/**
 * Helper to create a set of standard roles
 */
export function createStandardRoles(): Role[] {
  return [
    RoleTestFactory.createAdmin(),
    RoleTestFactory.createEditor(),
    RoleTestFactory.createViewer(),
  ];
}

/**
 * Helper to create permission keys from permissions
 */
export function toPermissionKeys(permissions: Permission[]): PermissionKey[] {
  return permissions.map((p) => p.name as PermissionKey);
}

/**
 * Assertion helpers
 */
export const RBACAssertions = {
  /**
   * Assert that two permission arrays contain the same permissions
   */
  assertPermissionArraysEqual(
    actual: PermissionKey[],
    expected: PermissionKey[],
  ): void {
    const actualSorted = [...actual].sort();
    const expectedSorted = [...expected].sort();

    if (actualSorted.length !== expectedSorted.length) {
      throw new Error(
        `Permission array length mismatch: expected ${expectedSorted.length}, got ${actualSorted.length}`,
      );
    }

    for (let i = 0; i < actualSorted.length; i++) {
      if (actualSorted[i] !== expectedSorted[i]) {
        throw new Error(
          `Permission mismatch at index ${i}: expected ${expectedSorted[i]}, got ${actualSorted[i]}`,
        );
      }
    }
  },

  /**
   * Assert that a role has expected properties
   */
  assertRoleProperties(
    role: Role,
    expected: {
      name: string;
      displayName: string;
      isSystem?: boolean;
      isActive?: boolean;
    },
  ): void {
    if (role.name !== expected.name) {
      throw new Error(
        `Role name mismatch: expected ${expected.name}, got ${role.name}`,
      );
    }
    if (role.displayName !== expected.displayName) {
      throw new Error(
        `Role displayName mismatch: expected ${expected.displayName}, got ${role.displayName}`,
      );
    }
    if (
      expected.isSystem !== undefined &&
      role.isSystem !== expected.isSystem
    ) {
      throw new Error(
        `Role isSystem mismatch: expected ${expected.isSystem}, got ${role.isSystem}`,
      );
    }
    if (
      expected.isActive !== undefined &&
      role.isActive !== expected.isActive
    ) {
      throw new Error(
        `Role isActive mismatch: expected ${expected.isActive}, got ${role.isActive}`,
      );
    }
  },

  /**
   * Assert that a permission has expected properties
   */
  assertPermissionProperties(
    permission: Permission,
    expected: {
      resource: string;
      action: string;
      displayName: string;
    },
  ): void {
    if (permission.resource !== expected.resource) {
      throw new Error(
        `Permission resource mismatch: expected ${expected.resource}, got ${permission.resource}`,
      );
    }
    if (permission.action !== expected.action) {
      throw new Error(
        `Permission action mismatch: expected ${expected.action}, got ${permission.action}`,
      );
    }
    if (permission.displayName !== expected.displayName) {
      throw new Error(
        `Permission displayName mismatch: expected ${expected.displayName}, got ${permission.displayName}`,
      );
    }
  },
};
