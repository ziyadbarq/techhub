/**
 * RevokeRoleFromUserUseCase - Unit Tests
 *
 * Tests for the RevokeRoleFromUserUseCase including:
 * - Successful role revocation
 * - Role validation
 * - Idempotent behavior
 * - Audit logging
 * - Cache invalidation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RevokeRoleFromUserUseCase } from "../revoke-role-from-user.use-case";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import { Role } from "@/core/domain/entities/role.entity";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import { RoleNotFoundError } from "@/core/domain/errors/rbac-errors";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";

/**
 * Mock Repositories
 */
class MockUserRoleRepository implements Partial<IUserRoleRepository> {
  private userRoles = new Map<string, UserRole>();

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

  async deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<void> {
    const userRole = await this.findByUserIdAndRoleId(userId, roleId);
    if (userRole) {
      this.userRoles.delete(userRole.id);
    }
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
    action: "user_role:revoke",
    createdAt: new Date(),
  });
}

describe("RevokeRoleFromUserUseCase", () => {
  let useCase: RevokeRoleFromUserUseCase;
  let mockUserRoleRepository: MockUserRoleRepository;
  let mockRoleRepository: MockRoleRepository;
  let mockAuditLogRepository: MockAuditLogRepository;
  let mockPermissionCacheService: IPermissionCacheService;

  beforeEach(() => {
    // Create fresh instances
    mockUserRoleRepository = new MockUserRoleRepository();
    mockRoleRepository = new MockRoleRepository();
    mockAuditLogRepository = new MockAuditLogRepository();
    mockPermissionCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    // Create use case
    useCase = new RevokeRoleFromUserUseCase(
      mockUserRoleRepository as unknown as IUserRoleRepository,
      mockRoleRepository as unknown as IRoleRepository,
      mockAuditLogRepository as unknown as IAuditLogRepository,
      mockPermissionCacheService,
    );
  });

  describe("execute - successful revocation", () => {
    it("should successfully revoke a role from a user", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert - Role should be deleted
      const result = await mockUserRoleRepository.findByUserIdAndRoleId(
        "user-1",
        role.id,
      );
      expect(result).toBeNull();
    });

    it("should create audit log entry on revocation", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "user_role:revoke",
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

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert
      expect(mockPermissionCacheService.invalidate).toHaveBeenCalledWith(
        "user",
        "user-1",
      );
    });
  });

  describe("execute - role validation", () => {
    it("should throw RoleNotFoundError if role does not exist", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: "non-existent-role",
          revokedBy: "admin-1",
        }),
      ).rejects.toThrow(RoleNotFoundError);
    });

    it("should include role ID in RoleNotFoundError", async () => {
      // Act & Assert
      try {
        await useCase.execute({
          userId: "user-1",
          roleId: "non-existent-role",
          revokedBy: "admin-1",
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

  describe("execute - idempotent behavior", () => {
    it("should succeed silently if user does not have the role", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      // Act & Assert - Should not throw
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: role.id,
          revokedBy: "admin-1",
        }),
      ).resolves.toBeUndefined();
    });

    it("should not create audit log if assignment does not exist", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      mockAuditLogRepository.create.mockClear();

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act - First revocation
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Act - Second revocation (should succeed silently)
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: role.id,
          revokedBy: "admin-1",
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe("audit logging details", () => {
    it("should log role name and assignment details", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        expiresAt,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-2",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            before: expect.objectContaining({
              userId: "user-1",
              roleId: role.id,
              roleName: "editor",
              expiresAt,
            }),
          }),
        }),
      );
    });

    it("should log if assignment was active", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            before: expect.objectContaining({
              wasActive: true,
            }),
          }),
        }),
      );
    });

    it("should log expired assignment details", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUserRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      const expiredUserRole = UserRole.fromPersistence({
        ...activeUserRole.toObject(),
        expiresAt: expiredDate,
      });
      mockUserRoleRepository.setUserRole(expiredUserRole);

      // Act
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            before: expect.objectContaining({
              wasActive: false, // Expired
            }),
          }),
        }),
      );
    });
  });

  describe("edge cases", () => {
    it("should handle revocation without revokedBy", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole);

      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-1",
          roleId: role.id,
        }),
      ).resolves.toBeUndefined();

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
      );
    });

    it("should handle multiple users with same role independently", async () => {
      // Arrange
      const role = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(role);

      const userRole1 = UserRole.create({
        userId: "user-1",
        roleId: role.id,
        createdBy: "admin-1",
      });
      const userRole2 = UserRole.create({
        userId: "user-2",
        roleId: role.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole1);
      mockUserRoleRepository.setUserRole(userRole2);

      // Act - Revoke from user-1 only
      await useCase.execute({
        userId: "user-1",
        roleId: role.id,
        revokedBy: "admin-1",
      });

      // Assert
      const result1 = await mockUserRoleRepository.findByUserIdAndRoleId(
        "user-1",
        role.id,
      );
      const result2 = await mockUserRoleRepository.findByUserIdAndRoleId(
        "user-2",
        role.id,
      );

      expect(result1).toBeNull(); // Revoked
      expect(result2).not.toBeNull(); // Still has role
    });

    it("should handle user with multiple roles", async () => {
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

      const userRole1 = UserRole.create({
        userId: "user-1",
        roleId: role1.id,
        createdBy: "admin-1",
      });
      const userRole2 = UserRole.create({
        userId: "user-1",
        roleId: role2.id,
        createdBy: "admin-1",
      });
      mockUserRoleRepository.setUserRole(userRole1);
      mockUserRoleRepository.setUserRole(userRole2);

      // Act - Revoke only role1
      await useCase.execute({
        userId: "user-1",
        roleId: role1.id,
        revokedBy: "admin-1",
      });

      // Assert
      const result1 = await mockUserRoleRepository.findByUserIdAndRoleId(
        "user-1",
        role1.id,
      );
      const result2 = await mockUserRoleRepository.findByUserIdAndRoleId(
        "user-1",
        role2.id,
      );

      expect(result1).toBeNull(); // Revoked
      expect(result2).not.toBeNull(); // Still has role2
    });
  });
});
