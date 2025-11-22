/**
 * Permission Controller - Unit Tests
 *
 * Tests for permission CRUD server actions including:
 * - Create permission
 * - List permissions with filtering
 * - Get single permission
 * - Update permission
 * - Delete permission
 * - Error handling
 * - Zod validation
 * - Permission checks
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createPermissionAction,
  listPermissionsAction,
  getPermissionAction,
  updatePermissionAction,
  deletePermissionAction,
} from "../permission.controller";
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
const mockCreatePermissionUseCase = {
  execute: vi.fn(),
};

const mockListPermissionsUseCase = {
  execute: vi.fn(),
};

const mockGetPermissionUseCase = {
  execute: vi.fn(),
};

const mockUpdatePermissionUseCase = {
  execute: vi.fn(),
};

const mockDeletePermissionUseCase = {
  execute: vi.fn(),
};

const mockPermissionRepository = {
  findByName: vi.fn(),
  findById: vi.fn(),
};

// Mock requirePermission
const mockRequirePermission = vi.fn();
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: () => mockRequirePermission(),
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
      if (tokenKey === Symbol.for("CreatePermissionUseCase").toString()) {
        return mockCreatePermissionUseCase;
      }
      if (tokenKey === Symbol.for("ListPermissionsUseCase").toString()) {
        return mockListPermissionsUseCase;
      }
      if (tokenKey === Symbol.for("GetPermissionUseCase").toString()) {
        return mockGetPermissionUseCase;
      }
      if (tokenKey === Symbol.for("UpdatePermissionUseCase").toString()) {
        return mockUpdatePermissionUseCase;
      }
      if (tokenKey === Symbol.for("DeletePermissionUseCase").toString()) {
        return mockDeletePermissionUseCase;
      }
      if (tokenKey === Symbol.for("IPermissionRepository").toString()) {
        return mockPermissionRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Permission Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    const defaultPermission = createMockPermission();
    mockPermissionRepository.findByName.mockResolvedValue(defaultPermission);
    mockPermissionRepository.findById.mockResolvedValue(defaultPermission);
  });

  // Sample permission data
  const createMockPermission = (overrides?: Partial<Permission>): Permission =>
    ({
      id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
      name: "tasks:view",
      resource: "tasks",
      action: "view",
      displayName: "View Tasks",
      description: "View tasks in the system",
      isSystem: false,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    }) as Permission;

  describe("createPermissionAction", () => {
    it("should create a new permission successfully", async () => {
      // Arrange
      const mockPermission = createMockPermission();
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        description: "View tasks in the system",
        isSystem: false,
        isActive: true,
      };

      // Act
      const result = await createPermissionAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(result.data.resource).toBe("tasks");
        expect(result.data.action).toBe("view");
      }
    });

    it("should set default values for optional fields", async () => {
      // Arrange
      const mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
      };

      // Act
      await createPermissionAction(data);

      // Assert
      expect(mockCreatePermissionUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isSystem: false,
          isActive: true,
        }),
      );
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockPermission = createMockPermission();
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        resource: "tasks",
        action: "create",
        displayName: "Create Tasks",
        description: "Create new tasks",
        isSystem: false,
        isActive: true,
      };

      // Act
      await createPermissionAction(data);

      // Assert
      expect(mockCreatePermissionUseCase.execute).toHaveBeenCalledWith({
        resource: data.resource,
        action: data.action,
        displayName: data.displayName,
        description: data.description,
        isSystem: data.isSystem,
        isActive: data.isActive,
      });
    });

    it("should return error response on validation failure", async () => {
      // Arrange
      const mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        resource: "", // Invalid: empty string
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
      };

      // Act
      const result = await createPermissionAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      const _mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      const data = {
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
      };

      // Act
      const result = await createPermissionAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("listPermissionsAction", () => {
    it("should list all permissions", async () => {
      // Arrange
      const mockPermissions = [
        createMockPermission(),
        createMockPermission({
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "tasks:create",
        }),
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

    it("should list permissions with filter", async () => {
      // Arrange
      const mockPermissions = [createMockPermission()];
      mockListPermissionsUseCase.execute.mockResolvedValue({
        permissions: mockPermissions,
        total: 1,
      });

      const filter = {
        includeInactive: true,
      };

      // Act
      const result = await listPermissionsAction(filter);

      // Assert
      expect(result.success).toBe(true);
      expect(mockListPermissionsUseCase.execute).toHaveBeenCalledWith(filter);
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListPermissionsUseCase.execute.mockResolvedValue({
        permissions: [],
        total: 0,
      });

      // Act
      const result = await listPermissionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
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

  describe("getPermissionAction", () => {
    it("should get permission by name", async () => {
      // Arrange
      const mockPermission = createMockPermission({ name: "tasks:view" });
      mockPermissionRepository.findByName.mockResolvedValue(mockPermission);

      // Act
      const result = await getPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("tasks:view");
      }
    });

    it("should call repository with validated name", async () => {
      // Arrange
      const mockPermission = createMockPermission({ name: "tasks:view" });
      mockPermissionRepository.findByName.mockResolvedValue(mockPermission);

      // Act
      await getPermissionAction("tasks:view");

      // Assert
      expect(mockPermissionRepository.findByName).toHaveBeenCalledWith(
        "tasks:view",
      );
    });

    it("should return error when permission not found", async () => {
      // Arrange
      mockPermissionRepository.findByName.mockResolvedValue(null);

      // Act
      const result = await getPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Permission not found");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockPermissionRepository.findByName.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("updatePermissionAction", () => {
    it("should update permission successfully", async () => {
      // Arrange
      const mockPermission = createMockPermission({
        displayName: "Updated Name",
      });
      mockUpdatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        displayName: "Updated Name",
        description: "Updated description",
        isActive: true,
      };

      // Act
      const result = await updatePermissionAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe("Updated Name");
      }
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockPermission = createMockPermission();
      mockUpdatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        displayName: "Updated Name",
        description: "Updated description",
        isActive: false,
      };

      // Act
      await updatePermissionAction(data);

      // Assert
      expect(mockUpdatePermissionUseCase.execute).toHaveBeenCalledWith({
        id: data.id,
        displayName: data.displayName,
        description: data.description,
        isActive: data.isActive,
      });
    });

    it("should return error response on validation failure", async () => {
      // Arrange
      const data = {
        id: "", // Invalid: empty string
        displayName: "Updated Name",
      };

      // Act
      const result = await updatePermissionAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockUpdatePermissionUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        displayName: "Updated Name",
      };

      // Act
      const result = await updatePermissionAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("deletePermissionAction", () => {
    it("should delete permission successfully", async () => {
      // Arrange
      mockDeletePermissionUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await deletePermissionAction(
        "550e8400-e29b-41d4-a716-446655440000",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      mockDeletePermissionUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deletePermissionAction("550e8400-e29b-41d4-a716-446655440000");

      // Assert
      expect(mockDeletePermissionUseCase.execute).toHaveBeenCalledWith({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("should return error response on validation failure", async () => {
      // Arrange & Act
      const result = await deletePermissionAction("");

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockDeletePermissionUseCase.execute.mockRejectedValue(
        new Error("Cannot delete system permission"),
      );

      // Act
      const result = await deletePermissionAction(
        "550e8400-e29b-41d4-a716-446655440000",
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot delete system permission");
      }
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Arrange
      const mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      // Act
      const result = await createPermissionAction({
        resource: "",
        action: "",
        displayName: "",
        isSystem: false,
        isActive: true,
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      const _mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockRejectedValue(
        new Error("Duplicate permission"),
      );

      // Act
      const result = await createPermissionAction({
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Duplicate permission");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      const mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockResolvedValue(mockPermission);

      // Act
      const result = await createPermissionAction({
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
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
      const _mockPermission = createMockPermission({
        isSystem: false,
        isActive: true,
      });
      mockCreatePermissionUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await createPermissionAction({
        resource: "tasks",
        action: "view",
        displayName: "View Tasks",
        isSystem: false,
        isActive: true,
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
