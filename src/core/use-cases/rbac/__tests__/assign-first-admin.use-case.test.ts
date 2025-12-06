/**
 * AssignFirstAdminUseCase - Unit Tests
 *
 * Ensures the first administrator assignment flow handles:
 * - Successful first-user assignment
 * - Missing admin role guardrails
 * - Existing admin protections
 * - Duplicate role prevention for the caller
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssignFirstAdminUseCase } from "../assign-first-admin.use-case";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { Role } from "@/core/domain/entities/role.entity";
import { UserRole } from "@/core/domain/entities/user-role.entity";

/**
 * Helpers to create deterministic role instances for tests
 */
const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

function createAdminRole(
  overrides: Partial<ReturnType<Role["toObject"]>> = {},
) {
  return Role.fromPersistence({
    id: "role-system-admin",
    name: SYSTEM_ADMIN_ROLE_NAME,
    displayName: "System Administrator",
    description: "Full system access",
    isSystem: true,
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  });
}

class MockRoleRepository implements Partial<IRoleRepository> {
  private roles = new Map<string, Role>();

  async findByName(name: string): Promise<Role | null> {
    return this.roles.get(name) ?? null;
  }

  setRole(role: Role): void {
    this.roles.set(role.name, role);
  }
}

class MockUserRoleRepository implements Partial<IUserRoleRepository> {
  private assignments: UserRole[] = [];

  async findByRoleId(roleId: string): Promise<UserRole[]> {
    return this.assignments.filter(
      (assignment) => assignment.roleId === roleId,
    );
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return this.assignments.filter(
      (assignment) => assignment.userId === userId,
    );
  }

  async create(userRole: UserRole): Promise<UserRole> {
    this.assignments.push(userRole);
    return userRole;
  }

  /**
   * Test helper to seed assignments
   */
  addAssignment(userRole: UserRole): void {
    this.assignments.push(userRole);
  }
}

class MockAuditLogRepository implements Partial<IAuditLogRepository> {
  create = vi.fn().mockResolvedValue({
    id: "audit-1",
    action: "role:assign",
    entityType: "user-role",
    createdAt: new Date(),
  });
}

class MockLogger implements Partial<ILoggerService> {
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
}

// Mock ID generator for tests
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => "test-cuid-clx7abc123"),
};

describe("AssignFirstAdminUseCase", () => {
  let useCase: AssignFirstAdminUseCase;
  let mockRoleRepository: MockRoleRepository;
  let mockUserRoleRepository: MockUserRoleRepository;
  let mockAuditLogRepository: MockAuditLogRepository;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockRoleRepository = new MockRoleRepository();
    mockUserRoleRepository = new MockUserRoleRepository();
    mockAuditLogRepository = new MockAuditLogRepository();
    mockLogger = new MockLogger();

    useCase = new AssignFirstAdminUseCase(
      mockUserRoleRepository as unknown as IUserRoleRepository,
      mockRoleRepository as unknown as IRoleRepository,
      mockAuditLogRepository as unknown as IAuditLogRepository,
      mockLogger as unknown as ILoggerService,
      mockIdGenerator,
    );
  });

  it("should assign system admin role to the first user when none exist", async () => {
    // Arrange
    const adminRole = createAdminRole();
    mockRoleRepository.setRole(adminRole);

    // Act
    const result = await useCase.execute({
      userId: "user-1",
      metadata: { ipAddress: "1.1.1.1", userAgent: "vitest" },
    });

    // Assert
    expect(result).toEqual({
      success: true,
      message: "System Administrator role assigned successfully.",
    });

    const assignments = await mockUserRoleRepository.findByUserId("user-1");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].roleId).toBe(adminRole.id);

    expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({
          after: expect.objectContaining({
            userId: "user-1",
            roleId: adminRole.id,
            roleName: SYSTEM_ADMIN_ROLE_NAME,
          }),
        }),
        metadata: expect.objectContaining({
          reason: "First system administrator setup",
          isFirstAdmin: true,
          ipAddress: "1.1.1.1",
          userAgent: "vitest",
        }),
      }),
    );
  });

  it("should fail when system admin role is missing", async () => {
    // Act
    const result = await useCase.execute({ userId: "user-1" });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("System Administrator role not found");
    }
    expect(mockAuditLogRepository.create).not.toHaveBeenCalled();
  });

  it("should fail if a system admin already exists", async () => {
    // Arrange
    const adminRole = createAdminRole();
    mockRoleRepository.setRole(adminRole);
    const existingAdmin = UserRole.create(
      {
        userId: "admin-user",
        roleId: adminRole.id,
        createdBy: "system",
      },
      mockIdGenerator,
    );
    mockUserRoleRepository.addAssignment(existingAdmin);

    // Act
    const result = await useCase.execute({ userId: "new-user" });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("System Administrator already exists.");
    }
    expect(mockAuditLogRepository.create).not.toHaveBeenCalled();
  });

  it("should fail when the requesting user already has the system admin role", async () => {
    // Arrange
    const adminRole = createAdminRole();
    mockRoleRepository.setRole(adminRole);
    const existingAssignment = UserRole.create(
      {
        userId: "user-1",
        roleId: adminRole.id,
        createdBy: "system",
      },
      mockIdGenerator,
    );
    mockUserRoleRepository.addAssignment(existingAssignment);

    // Force repository to simulate scenario where no other admins exist yet
    // so the branch that checks the caller's assignments is executed.
    vi.spyOn(mockUserRoleRepository, "findByRoleId").mockResolvedValue([]);

    // Act
    const result = await useCase.execute({ userId: "user-1" });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        "User already has System Administrator role.",
      );
    }
    expect(mockAuditLogRepository.create).not.toHaveBeenCalled();
  });
});
