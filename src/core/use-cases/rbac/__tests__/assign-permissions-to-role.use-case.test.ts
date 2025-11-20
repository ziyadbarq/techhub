/**
 * AssignPermissionsToRoleUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssignPermissionsToRoleUseCase } from "../assign-permissions-to-role.use-case";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { Role } from "@/core/domain/entities/role.entity";
import { Permission } from "@/core/domain/entities/permission.entity";
import {
  RoleNotFoundError,
  PermissionNotFoundError,
  SystemRoleModificationError,
} from "@/core/domain/errors/rbac-errors";
import { permissionCache } from "@/lib/permissions/cache";

class MockRoleRepository implements Partial<IRoleRepository> {
  private roles = new Map<string, Role>();
  private rolePermissions = new Map<string, string[]>();

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) || null;
  }

  async getRolePermissions(roleId: string): Promise<PermissionKey[]> {
    const permIds = this.rolePermissions.get(roleId) || [];
    return permIds.map((id) => `perm:${id}` as PermissionKey);
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    this.rolePermissions.set(roleId, permissionIds);
  }

  setRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  setRolePermissions(roleId: string, permissions: PermissionKey[]): void {
    this.rolePermissions.set(
      roleId,
      permissions.map((p) => p.split(":")[1]),
    );
  }

  clear(): void {
    this.roles.clear();
    this.rolePermissions.clear();
  }
}

class MockPermissionRepository implements Partial<IPermissionRepository> {
  private permissions = new Map<string, Permission>();

  async findByIds(ids: string[]): Promise<Permission[]> {
    return ids
      .map((id) => this.permissions.get(id))
      .filter(Boolean) as Permission[];
  }

  setPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  clear(): void {
    this.permissions.clear();
  }
}

class MockAuditLogRepository implements Partial<IAuditLogRepository> {
  create = vi.fn().mockResolvedValue({
    id: "audit-1",
    action: "role:assign-permissions",
    createdAt: new Date(),
  });
}

describe("AssignPermissionsToRoleUseCase", () => {
  let useCase: AssignPermissionsToRoleUseCase;
  let mockRoleRepository: MockRoleRepository;
  let mockPermissionRepository: MockPermissionRepository;
  let mockAuditLogRepository: MockAuditLogRepository;

  beforeEach(() => {
    mockRoleRepository = new MockRoleRepository();
    mockPermissionRepository = new MockPermissionRepository();
    mockAuditLogRepository = new MockAuditLogRepository();
    permissionCache.invalidateAll();

    useCase = new AssignPermissionsToRoleUseCase(
      mockRoleRepository as unknown as IRoleRepository,
      mockPermissionRepository as unknown as IPermissionRepository,
      mockAuditLogRepository as unknown as IAuditLogRepository,
    );
  });

  describe("execute - successful assignment", () => {
    it("should assign permissions to a role", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      const perm2 = Permission.create({
        resource: "tasks",
        action: "create",
        displayName: "Create Tasks",
      });
      mockPermissionRepository.setPermission(perm1);
      mockPermissionRepository.setPermission(perm2);

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: [perm1.id, perm2.id],
        assignedBy: "admin-1",
      });

      // Assert
      const rolePerms = await mockRoleRepository.getRolePermissions(role.id);
      expect(rolePerms).toHaveLength(2);
    });

    it("should create audit log entry", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: [perm1.id],
        assignedBy: "admin-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "role:assign-permissions",
          entityType: "role",
          entityId: role.id,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should invalidate entire permission cache", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      const invalidateAllSpy = vi.spyOn(permissionCache, "invalidateAll");

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: [perm1.id],
        assignedBy: "admin-1",
      });

      // Assert
      expect(invalidateAllSpy).toHaveBeenCalled();
    });
  });

  describe("execute - validation", () => {
    it("should throw RoleNotFoundError if role does not exist", async () => {
      // Arrange
      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      // Act & Assert
      await expect(
        useCase.execute({
          roleId: "non-existent-role",
          permissionIds: [perm1.id],
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(RoleNotFoundError);
    });

    it("should throw SystemRoleModificationError for system roles", async () => {
      // Arrange
      const role = Role.create({
        name: "admin",
        displayName: "Admin",
        isSystem: true,
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      // Act & Assert
      await expect(
        useCase.execute({
          roleId: role.id,
          permissionIds: [perm1.id],
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(SystemRoleModificationError);
    });

    it("should throw PermissionNotFoundError if any permission does not exist", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      // Act & Assert - One valid, one invalid
      await expect(
        useCase.execute({
          roleId: role.id,
          permissionIds: [perm1.id, "non-existent-perm"],
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(PermissionNotFoundError);
    });

    it("should validate all permissions exist before assignment", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act & Assert - All invalid
      await expect(
        useCase.execute({
          roleId: role.id,
          permissionIds: ["perm-1", "perm-2"],
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(PermissionNotFoundError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty permission list", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: [],
        assignedBy: "admin-1",
      });

      // Assert - Should succeed without error
      expect(mockAuditLogRepository.create).toHaveBeenCalled();
    });

    it("should handle assignment without assignedBy", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const perm1 = Permission.create({
        resource: "tasks",
        action: "read",
        displayName: "Read Tasks",
      });
      mockPermissionRepository.setPermission(perm1);

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: [perm1.id],
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
      );
    });

    it("should handle large number of permissions", async () => {
      // Arrange
      const role = Role.create({
        name: "super-role",
        displayName: "Super Role",
      });
      mockRoleRepository.setRole(role);

      const permissions = Array.from({ length: 50 }, (_, i) =>
        Permission.create({
          resource: "resource",
          action: `action-${i}`,
          displayName: `Action ${i}`,
        }),
      );
      permissions.forEach((p) => mockPermissionRepository.setPermission(p));

      // Act
      await useCase.execute({
        roleId: role.id,
        permissionIds: permissions.map((p) => p.id),
        assignedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalled();
    });
  });
});
