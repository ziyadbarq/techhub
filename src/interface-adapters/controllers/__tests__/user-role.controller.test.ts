/**
 * User Role Controller - Unit Tests
 *
 * Tests for user role management server actions including:
 * - List users with roles
 * - Get single user with roles
 * - Assign role to user
 * - Revoke role from user
 * - List available roles
 * - Error handling
 * - Permission checks
 * - Audit logging metadata
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listUsersWithRolesAction,
  getUserWithRolesAction,
  assignRoleToUserAction,
  revokeRoleFromUserAction,
  listAvailableRolesAction,
} from "../user-role.controller";
import type { Role } from "@/core/domain/entities/role.entity";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  startTimer: vi.fn(() => ({ startTime: Date.now() })),
  endTimer: vi.fn(),
};

// Mock use cases
const mockAssignRoleToUserUseCase = {
  execute: vi.fn(),
};

const mockRevokeRoleFromUserUseCase = {
  execute: vi.fn(),
};

const mockListRolesUseCase = {
  execute: vi.fn(),
};

const mockCheckPermissionUseCase = {
  execute: vi.fn(),
};

// Mock Prisma client
const _mockPrismaUser = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
};

vi.mock("@/infrastructure/database/prisma/client", () => {
  const mockUser = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  };
  return {
    prisma: {
      user: mockUser,
    },
  };
});

// Mock getSession
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "user-123", email: "admin@test.com" },
      session: { id: "session-123" },
    }),
  ),
}));

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn((key: string) => {
        if (key === "x-forwarded-for") return "192.168.1.1";
        if (key === "user-agent") return "Mozilla/5.0";
        return null;
      }),
    }),
  ),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("AssignRoleToUserUseCase").toString()) {
        return mockAssignRoleToUserUseCase;
      }
      if (tokenKey === Symbol.for("RevokeRoleFromUserUseCase").toString()) {
        return mockRevokeRoleFromUserUseCase;
      }
      if (tokenKey === Symbol.for("ListRolesUseCase").toString()) {
        return mockListRolesUseCase;
      }
      if (tokenKey === Symbol.for("CheckPermissionUseCase").toString()) {
        return mockCheckPermissionUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

interface MockPrisma {
  user: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
}

describe("User Role Controller", () => {
  let prisma: MockPrisma;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCheckPermissionUseCase.execute.mockResolvedValue(true);
    // Get the mocked prisma instance
    const prismaModule = await import(
      "@/infrastructure/database/prisma/client"
    );
    prisma = prismaModule.prisma as unknown as MockPrisma;
  });

  // Sample user data
  const createMockUser = () => ({
    id: "user-1",
    email: "user@test.com",
    name: "Test User",
    image: null,
    emailVerified: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    roles: [
      {
        id: "ur-1",
        roleId: "role-1",
        expiresAt: null,
        role: {
          name: "editor",
          displayName: "Editor",
        },
      },
    ],
  });

  const createMockRole = (overrides?: Partial<Role>): Role =>
    ({
      id: "role-1",
      name: "editor",
      displayName: "Editor",
      description: "Can edit content",
      isSystem: false,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    }) as Role;

  describe("listUsersWithRolesAction", () => {
    it("should list all users with their roles", async () => {
      // Arrange
      const mockUsers = [createMockUser()];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe("user-1");
        expect(result.data[0].roles).toHaveLength(1);
      }
    });

    it("should check USERS_MANAGE permission", async () => {
      // Arrange
      prisma.user.findMany.mockResolvedValue([]);

      // Act
      await listUsersWithRolesAction();

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        permission: "users:manage",
      });
    });

    it("should return error when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Insufficient permissions");
      }
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      const { getSession } = await import("@/lib/auth/session");
      vi.mocked(getSession).mockResolvedValueOnce({
        user: null,
        session: null,
      });

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should mark expired roles as inactive", async () => {
      // Arrange
      const mockUsers = [
        {
          ...createMockUser(),
          roles: [
            {
              id: "ur-1",
              roleId: "role-1",
              expiresAt: new Date("2020-01-01"), // Expired
              role: {
                name: "editor",
                displayName: "Editor",
              },
            },
          ],
        },
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].roles[0].isActive).toBe(false);
      }
    });

    it("should return error response on database error", async () => {
      // Arrange
      prisma.user.findMany.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getUserWithRolesAction", () => {
    it("should get user with roles by id", async () => {
      // Arrange
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await getUserWithRolesAction("user-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("user-1");
        expect(result.data.roles).toHaveLength(1);
      }
    });

    it("should check USERS_MANAGE permission", async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(createMockUser());

      // Act
      await getUserWithRolesAction("user-1");

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        permission: "users:manage",
      });
    });

    it("should return error when user not found", async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await getUserWithRolesAction("nonexistent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("should return error when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await getUserWithRolesAction("user-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Insufficient permissions");
      }
    });

    it("should call Prisma with correct query", async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(createMockUser());

      // Act
      await getUserWithRolesAction("user-1");

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  });

  describe("assignRoleToUserAction", () => {
    it("should assign role to user successfully", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await assignRoleToUserAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should include audit metadata", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      await assignRoleToUserAction(data);

      // Assert
      expect(mockAssignRoleToUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should support role expiration", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockResolvedValue(undefined);

      const expiresAt = new Date("2025-12-31");
      const data = {
        userId: "user-1",
        roleId: "role-1",
        expiresAt,
      };

      // Act
      await assignRoleToUserAction(data);

      // Assert
      expect(mockAssignRoleToUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt,
        }),
      );
    });

    it("should check USERS_MANAGE permission", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      await assignRoleToUserAction(data);

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        permission: "users:manage",
      });
    });

    it("should return error when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await assignRoleToUserAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Insufficient permissions");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockRejectedValue(
        new Error("Role not found"),
      );

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await assignRoleToUserAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });
  });

  describe("revokeRoleFromUserAction", () => {
    it("should revoke role from user successfully", async () => {
      // Arrange
      mockRevokeRoleFromUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await revokeRoleFromUserAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should include audit metadata", async () => {
      // Arrange
      mockRevokeRoleFromUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      await revokeRoleFromUserAction(data);

      // Assert
      expect(mockRevokeRoleFromUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          revokedBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should call use case with validated data", async () => {
      // Arrange
      mockRevokeRoleFromUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      await revokeRoleFromUserAction(data);

      // Assert
      expect(mockRevokeRoleFromUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: data.userId,
          roleId: data.roleId,
        }),
      );
    });

    it("should check USERS_MANAGE permission", async () => {
      // Arrange
      mockRevokeRoleFromUserUseCase.execute.mockResolvedValue(undefined);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      await revokeRoleFromUserAction(data);

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        permission: "users:manage",
      });
    });

    it("should return error when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await revokeRoleFromUserAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Insufficient permissions");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockRevokeRoleFromUserUseCase.execute.mockRejectedValue(
        new Error("Role assignment not found"),
      );

      const data = {
        userId: "user-1",
        roleId: "role-1",
      };

      // Act
      const result = await revokeRoleFromUserAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role assignment not found");
      }
    });
  });

  describe("listAvailableRolesAction", () => {
    it("should list available roles", async () => {
      // Arrange
      const mockRoles = [
        createMockRole(),
        createMockRole({ id: "role-2", name: "admin", displayName: "Admin" }),
      ];
      mockListRolesUseCase.execute.mockResolvedValue(mockRoles);

      // Act
      const result = await listAvailableRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toHaveProperty("id");
        expect(result.data[0]).toHaveProperty("name");
        expect(result.data[0]).toHaveProperty("displayName");
      }
    });

    it("should exclude inactive roles", async () => {
      // Arrange
      const mockRoles = [createMockRole()];
      mockListRolesUseCase.execute.mockResolvedValue(mockRoles);

      // Act
      await listAvailableRolesAction();

      // Assert
      expect(mockListRolesUseCase.execute).toHaveBeenCalledWith({
        includeInactive: false,
      });
    });

    it("should check USERS_MANAGE permission", async () => {
      // Arrange
      mockListRolesUseCase.execute.mockResolvedValue([]);

      // Act
      await listAvailableRolesAction();

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        permission: "users:manage",
      });
    });

    it("should return error when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await listAvailableRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Insufficient permissions");
      }
    });

    it("should return simple DTO format", async () => {
      // Arrange
      const mockRoles = [createMockRole()];
      mockListRolesUseCase.execute.mockResolvedValue(mockRoles);

      // Act
      const result = await listAvailableRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toEqual({
          id: "role-1",
          name: "editor",
          displayName: "Editor",
        });
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListRolesUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAvailableRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("error handling", () => {
    it("should handle permission check failures", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle authentication failures", async () => {
      // Arrange
      const { getSession } = await import("@/lib/auth/session");
      vi.mocked(getSession).mockResolvedValueOnce({
        user: null,
        session: null,
      });

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockAssignRoleToUserUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await assignRoleToUserAction({
        userId: "user-1",
        roleId: "role-1",
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      prisma.user.findMany.mockResolvedValue([]);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("data");
        expect(result).not.toHaveProperty("error");
      }
    });

    it("should return discriminated union with success=false for errors", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await listUsersWithRolesAction();

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });
  });
});
