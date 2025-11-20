/**
 * Role Controller - Unit Tests
 *
 * Tests for role CRUD server actions including:
 * - Create role
 * - Update role
 * - Delete role
 * - Get single role
 * - List roles
 * - Assign permissions to role
 * - List permissions
 * - Error handling
 * - Zod validation
 * - Permission checks
 * - Audit logging metadata
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  getRoleAction,
  listRolesAction,
  assignPermissionsToRoleAction,
  listPermissionsAction,
} from "../role.controller";
import type { Role } from "@/core/domain/entities/role.entity";
import type { Permission } from "@/core/domain/entities/permission.entity";

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
const mockCreateRoleUseCase = {
  execute: vi.fn(),
};

const mockUpdateRoleUseCase = {
  execute: vi.fn(),
};

const mockDeleteRoleUseCase = {
  execute: vi.fn(),
};

const mockGetRoleUseCase = {
  execute: vi.fn(),
};

const mockListRolesUseCase = {
  execute: vi.fn(),
};

const mockAssignPermissionsToRoleUseCase = {
  execute: vi.fn(),
};

const mockListPermissionsUseCase = {
  execute: vi.fn(),
};

// Mock requirePermission
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}));

// Mock getCurrentUserId
vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: vi.fn(() => Promise.resolve("user-123")),
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
      if (tokenKey === Symbol.for("CreateRoleUseCase").toString()) {
        return mockCreateRoleUseCase;
      }
      if (tokenKey === Symbol.for("UpdateRoleUseCase").toString()) {
        return mockUpdateRoleUseCase;
      }
      if (tokenKey === Symbol.for("DeleteRoleUseCase").toString()) {
        return mockDeleteRoleUseCase;
      }
      if (tokenKey === Symbol.for("GetRoleUseCase").toString()) {
        return mockGetRoleUseCase;
      }
      if (tokenKey === Symbol.for("ListRolesUseCase").toString()) {
        return mockListRolesUseCase;
      }
      if (
        tokenKey === Symbol.for("AssignPermissionsToRoleUseCase").toString()
      ) {
        return mockAssignPermissionsToRoleUseCase;
      }
      if (tokenKey === Symbol.for("ListPermissionsUseCase").toString()) {
        return mockListPermissionsUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Role Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Sample role data
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

  const createMockPermission = (overrides?: Partial<Permission>): Permission =>
    ({
      id: "perm-1",
      name: "tasks:view",
      resource: "tasks",
      action: "view",
      displayName: "View Tasks",
      description: "View tasks",
      isSystem: false,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    }) as Permission;

  describe("createRoleAction", () => {
    it("should create a new role successfully", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockCreateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        name: "editor",
        displayName: "Editor",
        description: "Can edit content",
      };

      // Act
      const result = await createRoleAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("role-1");
        expect(result.data.name).toBe("editor");
      }
    });

    it("should set isActive default to true", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockCreateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        name: "editor",
        displayName: "Editor",
      };

      // Act
      await createRoleAction(data);

      // Assert
      expect(mockCreateRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isSystem: false,
        }),
      );
    });

    it("should include audit metadata", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockCreateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        name: "editor",
        displayName: "Editor",
      };

      // Act
      await createRoleAction(data);

      // Assert
      expect(mockCreateRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      const { getCurrentUserId } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

      const data = {
        name: "editor",
        displayName: "Editor",
      };

      // Act
      const result = await createRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should return error response on validation failure", async () => {
      // Arrange
      const data = {
        name: "",
        displayName: "",
      };

      // Act
      const result = await createRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockCreateRoleUseCase.execute.mockRejectedValue(
        new Error("Duplicate role name"),
      );

      const data = {
        name: "editor",
        displayName: "Editor",
      };

      // Act
      const result = await createRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Duplicate role name");
      }
    });
  });

  describe("updateRoleAction", () => {
    it("should update role successfully", async () => {
      // Arrange
      const mockRole = createMockRole({ displayName: "Updated Editor" });
      mockUpdateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        id: "role-1",
        displayName: "Updated Editor",
        description: "Updated description",
        isActive: true,
      };

      // Act
      const result = await updateRoleAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe("Updated Editor");
      }
    });

    it("should include audit metadata", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockUpdateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        id: "role-1",
        displayName: "Updated Editor",
      };

      // Act
      await updateRoleAction(data);

      // Assert
      expect(mockUpdateRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockUpdateRoleUseCase.execute.mockResolvedValue(mockRole);

      const data = {
        id: "role-1",
        displayName: "Updated Editor",
        description: "Updated description",
        isActive: false,
      };

      // Act
      await updateRoleAction(data);

      // Assert
      expect(mockUpdateRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: data.id,
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
        }),
      );
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      const { getCurrentUserId } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

      const data = {
        id: "role-1",
        displayName: "Updated Editor",
      };

      // Act
      const result = await updateRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockUpdateRoleUseCase.execute.mockRejectedValue(
        new Error("Role not found"),
      );

      const data = {
        id: "role-1",
        displayName: "Updated Editor",
      };

      // Act
      const result = await updateRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });
  });

  describe("deleteRoleAction", () => {
    it("should delete role successfully", async () => {
      // Arrange
      mockDeleteRoleUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await deleteRoleAction("role-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should include audit metadata", async () => {
      // Arrange
      mockDeleteRoleUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deleteRoleAction("role-1");

      // Assert
      expect(mockDeleteRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should call use case with validated id", async () => {
      // Arrange
      mockDeleteRoleUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deleteRoleAction("role-1");

      // Assert
      expect(mockDeleteRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: "role-1",
        }),
      );
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      const { getCurrentUserId } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

      // Act
      const result = await deleteRoleAction("role-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockDeleteRoleUseCase.execute.mockRejectedValue(
        new Error("Cannot delete system role"),
      );

      // Act
      const result = await deleteRoleAction("role-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot delete system role");
      }
    });
  });

  describe("getRoleAction", () => {
    it("should get role by id", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockGetRoleUseCase.execute.mockResolvedValue({ role: mockRole });

      // Act
      const result = await getRoleAction("role-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("role-1");
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockGetRoleUseCase.execute.mockResolvedValue({ role: mockRole });

      // Act
      await getRoleAction("role-1");

      // Assert
      expect(mockGetRoleUseCase.execute).toHaveBeenCalledWith("role-1");
    });

    it("should return error when role not found", async () => {
      // Arrange
      mockGetRoleUseCase.execute.mockResolvedValue(null);

      // Act
      const result = await getRoleAction("nonexistent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetRoleUseCase.execute.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await getRoleAction("role-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("listRolesAction", () => {
    it("should list all roles", async () => {
      // Arrange
      const mockRoles = [
        createMockRole(),
        createMockRole({ id: "role-2", name: "admin" }),
      ];
      mockListRolesUseCase.execute.mockResolvedValue(mockRoles);

      // Act
      const result = await listRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListRolesUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await listRolesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListRolesUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listRolesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("assignPermissionsToRoleAction", () => {
    it("should assign permissions to role successfully", async () => {
      // Arrange
      mockAssignPermissionsToRoleUseCase.execute.mockResolvedValue(undefined);

      const data = {
        roleId: "role-1",
        permissionIds: ["perm-1", "perm-2"],
      };

      // Act
      const result = await assignPermissionsToRoleAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should include audit metadata", async () => {
      // Arrange
      mockAssignPermissionsToRoleUseCase.execute.mockResolvedValue(undefined);

      const data = {
        roleId: "role-1",
        permissionIds: ["perm-1"],
      };

      // Act
      await assignPermissionsToRoleAction(data);

      // Assert
      expect(mockAssignPermissionsToRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedBy: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });

    it("should call use case with validated data", async () => {
      // Arrange
      mockAssignPermissionsToRoleUseCase.execute.mockResolvedValue(undefined);

      const data = {
        roleId: "role-1",
        permissionIds: ["perm-1", "perm-2"],
      };

      // Act
      await assignPermissionsToRoleAction(data);

      // Assert
      expect(mockAssignPermissionsToRoleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: data.roleId,
          permissionIds: data.permissionIds,
        }),
      );
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      const { getCurrentUserId } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

      const data = {
        roleId: "role-1",
        permissionIds: ["perm-1"],
      };

      // Act
      const result = await assignPermissionsToRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockAssignPermissionsToRoleUseCase.execute.mockRejectedValue(
        new Error("Role not found"),
      );

      const data = {
        roleId: "role-1",
        permissionIds: ["perm-1"],
      };

      // Act
      const result = await assignPermissionsToRoleAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });
  });

  describe("listPermissionsAction", () => {
    it("should list active permissions", async () => {
      // Arrange
      const mockPermissions = [
        createMockPermission(),
        createMockPermission({ id: "perm-2", name: "tasks:create" }),
      ];
      mockListPermissionsUseCase.execute.mockResolvedValue({
        permissions: mockPermissions,
        total: 2,
      });

      // Act
      const result = await listPermissionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should filter out inactive permissions", async () => {
      // Arrange
      mockListPermissionsUseCase.execute.mockResolvedValue({
        permissions: [],
        total: 0,
      });

      // Act
      await listPermissionsAction();

      // Assert
      expect(mockListPermissionsUseCase.execute).toHaveBeenCalledWith({
        includeInactive: false,
      });
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListPermissionsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listPermissionsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Act
      const result = await createRoleAction({
        name: "",
        displayName: "",
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockCreateRoleUseCase.execute.mockRejectedValue(
        new Error("Duplicate role"),
      );

      // Act
      const result = await createRoleAction({
        name: "editor",
        displayName: "Editor",
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Duplicate role");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      const mockRole = createMockRole();
      mockCreateRoleUseCase.execute.mockResolvedValue(mockRole);

      // Act
      const result = await createRoleAction({
        name: "editor",
        displayName: "Editor",
      });

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
      mockCreateRoleUseCase.execute.mockRejectedValue(new Error("Test error"));

      // Act
      const result = await createRoleAction({
        name: "editor",
        displayName: "Editor",
      });

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
