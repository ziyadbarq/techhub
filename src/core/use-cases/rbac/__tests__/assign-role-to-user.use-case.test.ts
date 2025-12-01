/**
 * AssignRoleToUserUseCase - Unit Tests
 *
 * Tests for the AssignRoleToUserUseCase including:
 * - Successful role assignment
 * - Role validation
 * - Duplicate assignment prevention
 * - Expired role handling
 * - Audit logging
 * - Cache invalidation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssignRoleToUserUseCase } from "../assign-role-to-user.use-case";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import { Role } from "@/core/domain/entities/role.entity";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import {
  RoleNotFoundError,
  RoleAlreadyAssignedError,
} from "@/core/domain/errors/rbac-errors";
import type { IRbacPolicyService } from "@/core/services/rbac-policy.service.interface";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";
import { permissionCache } from "@/lib/permissions/cache";

/**
 * Mock Repositories
 */
class MockUserRoleRepository implements Partial<IUserRoleRepository> {
  private userRoles = new Map<string, UserRole>();

  async create(userRole: UserRole): Promise<UserRole> {
    this.userRoles.set(userRole.id, userRole);
    return userRole;
  }

  async findByUserIdAndRoleId(
    userId: string,
    roleId: string,
  ): Promise<UserRole | null> {
    return (
      Array.from(this.userRoles.values()).find(
        (ur) => ur.userId === userId && ur.roleId === roleId,
      ) || null
    );
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values()).filter(
      (ur) => ur.userId === userId,
    );
  }

  setUserRole(userRole: UserRole): void {
    this.userRoles.set(userRole.id, userRole);
  }

  clear(): void {
    this.userRoles.clear();
  }
}

class MockRoleRepository implements Partial<IRoleRepository> {
  private roles = new Map<string, Role>();

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) || null;
  }

  setRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  clear(): void {
    this.roles.clear();
  }
}

class MockAuditLogRepository implements Partial<IAuditLogRepository> {
  create = vi.fn().mockResolvedValue({
    id: "audit-1",
    action: "user_role:assign",
    createdAt: new Date(),
  });
}

describe("AssignRoleToUserUseCase", () => {
  let useCase: AssignRoleToUserUseCase;
  let mockUserRoleRepository: MockUserRoleRepository;
  let mockRoleRepository: MockRoleRepository;
  let mockAuditLogRepository: MockAuditLogRepository;
  let mockRbacPolicyService: IRbacPolicyService;
  let mockPermissionCacheService: IPermissionCacheService;

  beforeEach(() => {
    // Create fresh instances
    mockUserRoleRepository = new MockUserRoleRepository();
    mockRoleRepository = new MockRoleRepository();
    mockAuditLogRepository = new MockAuditLogRepository();
    mockRbacPolicyService = {
      validateRoleAddition: vi.fn().mockReturnValue({
        canAdd: true,
        conflicts: [],
      }),
      detectRoleConflicts: vi.fn(),
      validatePermissionDependencies: vi.fn(),
    };
    mockPermissionCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    // Clear permission cache
    permissionCache.invalidateAll();

    // Create use case
    useCase = new AssignRoleToUserUseCase(
      mockUserRoleRepository as unknown as IUserRoleRepository,
      mockRoleRepository as unknown as IRoleRepository,
      mockAuditLogRepository as unknown as IAuditLogRepository,
      mockRbacPolicyService,
      mockPermissionCacheService,
    );
  });

  describe("execute - successful assignment", () => {
    it("should successfully assign a role to a user", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
        description: "Can edit content",
      });
      mockRoleRepository.setRole(role);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("user-1");
      expect(result.roleId).toBe(role.id);
      expect(result.createdBy).toBe("admin-1");
    });

    it("should assign role with expiration date", async () => {
      // Arrange
      const role = Role.create({
        name: "temporary-access",
        displayName: "Temporary Access",
      });
      mockRoleRepository.setRole(role);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        expiresAt,
        assignedBy: "admin-1",
      });

      // Assert
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it("should assign role without expiration date", async () => {
      // Arrange
      const role = Role.create({
        name: "permanent-role",
        displayName: "Permanent Role",
      });
      mockRoleRepository.setRole(role);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(result.expiresAt).toBeUndefined();
    });

    it("should create audit log entry on success", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "user_role:assign",
          entityType: "user_role",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should invalidate user permission cache", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Pre-populate cache
      const invalidateSpy = vi.spyOn(permissionCache, "invalidate");

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith("user-1");
    });
  });

  describe("execute - role validation", () => {
    it("should throw RoleNotFoundError if role does not exist", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: "non-existent-role",
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(RoleNotFoundError);
    });

    it("should include role ID in RoleNotFoundError", async () => {
      // Act & Assert
      try {
        await useCase.execute({
          userId: "user-1",
          roleId: "non-existent-role",
          assignedBy: "admin-1",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(RoleNotFoundError);
        expect((error as RoleNotFoundError).roleIdentifier).toBe(
          "non-existent-role",
        );
      }
    });
  });

  describe("execute - duplicate assignment prevention", () => {
    it("should throw RoleAlreadyAssignedError if role is already assigned and active", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Create existing active assignment
      const existingUserRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(existingUserRole);

      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: role.id,
          assignedBy: "admin-1",
        }),
      ).rejects.toThrow(RoleAlreadyAssignedError);
    });

    it("should include user and role IDs in RoleAlreadyAssignedError", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const existingUserRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(existingUserRole);

      // Act & Assert
      try {
        await useCase.execute({
          userId: "user-1",
          roleId: role.id,
          assignedBy: "admin-1",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(RoleAlreadyAssignedError);
        expect((error as RoleAlreadyAssignedError).userId).toBe("user-1");
        expect((error as RoleAlreadyAssignedError).roleId).toBe(role.id);
      }
    });

    it("should allow assignment if previous assignment is expired", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Create expired assignment
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const expiredUserRole = UserRole.fromPersistence({
        id: crypto.randomUUID(),
        userId: "user-1",
        roleId: role.id,
        expiresAt: expiredDate,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(expiredUserRole);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert - Should succeed and create a new assignment
      expect(result).toBeDefined();
      expect(result.id).not.toBe(expiredUserRole.id); // Different assignment
    });
  });

  describe("audit logging details", () => {
    it("should log role name in audit trail", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
        description: "Can edit content",
      });
      mockRoleRepository.setRole(role);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            after: expect.objectContaining({
              roleName: "editor",
            }),
          }),
        }),
      );
    });

    it("should log expiration date in audit trail", async () => {
      // Arrange
      const role = Role.create({
        name: "temporary",
        displayName: "Temporary Role",
      });
      mockRoleRepository.setRole(role);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        expiresAt,
        assignedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            after: expect.objectContaining({
              expiresAt,
            }),
          }),
        }),
      );
    });
  });

  describe("edge cases", () => {
    it("should handle assignment without assignedBy", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.createdBy).toBeUndefined();
    });

    it("should handle multiple users with same role", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act
      const result1 = await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      const result2 = await useCase.execute({
        userId: "user-2",
        roleId: role.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(result1.userId).toBe("user-1");
      expect(result2.userId).toBe("user-2");
      expect(result1.roleId).toBe(result2.roleId);
    });

    it("should handle same user with multiple different roles", async () => {
      // Arrange
      const role1 = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      const role2 = Role.create({
        name: "viewer",
        displayName: "Viewer",
      });
      mockRoleRepository.setRole(role1);
      mockRoleRepository.setRole(role2);

      // Act
      const result1 = await useCase.execute({
        userId: "user-1",
        roleId: role1.id,
        assignedBy: "admin-1",
      });

      const result2 = await useCase.execute({
        userId: "user-1",
        roleId: role2.id,
        assignedBy: "admin-1",
      });

      // Assert
      expect(result1.roleId).toBe(role1.id);
      expect(result2.roleId).toBe(role2.id);
      expect(result1.userId).toBe(result2.userId);
    });
  });
});
