/**
 * AssetAssignment Controller - Unit Tests
 *
 * Tests for asset assignment CRUD server actions including:
 * - Create asset assignment
 * - Update asset assignment
 * - Delete asset assignment
 * - Get single asset assignment
 * - List asset assignments
 * - Get active assignment
 * - Bulk create asset assignments
 * - Error handling
 * - Zod validation
 * - Permission checks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAssetAssignmentAction,
  updateAssetAssignmentAction,
  deleteAssetAssignmentAction,
  getAssetAssignmentAction,
  listAssetAssignmentsAction,
  getActiveAssignmentAction,
  bulkCreateAssetAssignmentsAction,
} from "../asset-assignment.controller";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import type {
  CreateAssetAssignmentDTO,
  UpdateAssetAssignmentDTO,
} from "../../dtos/generated/asset-assignment.dto";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
};

// Mock use cases
const mockCreateAssetAssignmentUseCase = {
  execute: vi.fn(),
};

const mockUpdateAssetAssignmentUseCase = {
  execute: vi.fn(),
};

const mockDeleteAssetAssignmentUseCase = {
  execute: vi.fn(),
};

const mockGetAssetAssignmentUseCase = {
  execute: vi.fn(),
};

const mockListAssetAssignmentsUseCase = {
  execute: vi.fn(),
};

const mockListAssetsUseCase = {
  execute: vi.fn(),
};

const mockListPersonsUseCase = {
  execute: vi.fn(),
};

const mockListOrganizationUnitsUseCase = {
  execute: vi.fn(),
};

const mockListLocationsUseCase = {
  execute: vi.fn(),
};

const mockListConfigurationItemsUseCase = {
  execute: vi.fn(),
};

const mockAssetRepository = {
  findById: vi.fn(),
};

// Mock requirePermission
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Sample asset assignment data - includes methods that presenter calls
const createMockAssetAssignment = (
  overrides?: Partial<AssetAssignment>,
): AssetAssignment =>
  ({
    id: "assign-1",
    assetId: "asset-1",
    assigneeType: "PERSON",
    assigneeId: "person-1",
    startDate: new Date("2024-01-01"),
    endDate: null,
    isPrimary: true,
    conditionOnAssignment: null,
    conditionOnReturn: null,
    note: "Test assignment",
    source: "MANUAL",
    sourceReferenceType: null,
    sourceReferenceId: null,
    hasConflict: false,
    conflictNote: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    // Methods required by presenter
    isActive: () => true,
    getDurationInDays: () => 365,
    isIntuneManaged: () => false,
    isManual: () => true,
    ...overrides,
  }) as AssetAssignment;

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CreateAssetAssignmentUseCase").toString()) {
        return mockCreateAssetAssignmentUseCase;
      }
      if (tokenKey === Symbol.for("UpdateAssetAssignmentUseCase").toString()) {
        return mockUpdateAssetAssignmentUseCase;
      }
      if (tokenKey === Symbol.for("DeleteAssetAssignmentUseCase").toString()) {
        return mockDeleteAssetAssignmentUseCase;
      }
      if (tokenKey === Symbol.for("GetAssetAssignmentUseCase").toString()) {
        return mockGetAssetAssignmentUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetAssignmentsUseCase").toString()) {
        return mockListAssetAssignmentsUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetsUseCase").toString()) {
        return mockListAssetsUseCase;
      }
      if (tokenKey === Symbol.for("ListPersonsUseCase").toString()) {
        return mockListPersonsUseCase;
      }
      if (tokenKey === Symbol.for("ListOrganizationUnitsUseCase").toString()) {
        return mockListOrganizationUnitsUseCase;
      }
      if (tokenKey === Symbol.for("ListLocationsUseCase").toString()) {
        return mockListLocationsUseCase;
      }
      if (tokenKey === Symbol.for("ListConfigurationItemsUseCase").toString()) {
        return mockListConfigurationItemsUseCase;
      }
      if (tokenKey === Symbol.for("IAssetRepository").toString()) {
        return mockAssetRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("AssetAssignment Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    mockAssetRepository.findById.mockResolvedValue({
      id: "asset-1",
      assetTag: "LAPTOP-001",
    });

    // Mock related entity lists for enrichment
    mockListAssetsUseCase.execute.mockResolvedValue([
      { id: "asset-1", assetTag: "LAPTOP-001" },
    ]);
    mockListPersonsUseCase.execute.mockResolvedValue([
      { id: "person-1", fullName: "John Doe" },
    ]);
    mockListOrganizationUnitsUseCase.execute.mockResolvedValue([
      { id: "org-1", name: "IT Department" },
    ]);
    mockListLocationsUseCase.execute.mockResolvedValue([
      { id: "loc-1", name: "HQ Building" },
    ]);
    mockListConfigurationItemsUseCase.execute.mockResolvedValue([
      { id: "ci-1", name: "Production Server" },
    ]);
  });

  describe("createAssetAssignmentAction", () => {
    it("should create a new asset assignment successfully", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      const data: CreateAssetAssignmentDTO = {
        assetId: "asset-1",
        assigneeType: "PERSON",
        assigneeId: "person-1",
        startDate: new Date("2024-01-01"),
        isPrimary: true,
      };

      // Act
      const result = await createAssetAssignmentAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("assign-1");
        expect(result.data.assetId).toBe("asset-1");
        expect(result.data.assigneeType).toBe("PERSON");
      }
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      const data: CreateAssetAssignmentDTO = {
        assetId: "asset-1",
        assigneeType: "ORG_UNIT",
        assigneeId: "org-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isPrimary: false,
        note: "Temporary assignment",
      };

      // Act
      await createAssetAssignmentAction(data);

      // Assert
      expect(mockCreateAssetAssignmentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: "asset-1",
          assigneeType: "ORG_UNIT",
          assigneeId: "org-1",
          isPrimary: false,
          note: "Temporary assignment",
        }),
      );
    });

    it("should create assignment to location", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment({
        assigneeType: "LOCATION",
        assigneeId: "loc-1",
      });
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      const data: CreateAssetAssignmentDTO = {
        assetId: "asset-1",
        assigneeType: "LOCATION",
        assigneeId: "loc-1",
        startDate: new Date("2024-01-01"),
        isPrimary: true,
      };

      // Act
      const result = await createAssetAssignmentAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assigneeType).toBe("LOCATION");
      }
    });

    it("should create assignment to configuration item", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment({
        assigneeType: "CI",
        assigneeId: "ci-1",
      });
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      const data: CreateAssetAssignmentDTO = {
        assetId: "asset-1",
        assigneeType: "CI",
        assigneeId: "ci-1",
        startDate: new Date("2024-01-01"),
        isPrimary: true,
      };

      // Act
      const result = await createAssetAssignmentAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assigneeType).toBe("CI");
      }
    });

    it("should return error response on validation failure", async () => {
      // Arrange - missing required fields
      const data = {
        assetId: "asset-1",
      } as CreateAssetAssignmentDTO;

      // Act
      const result = await createAssetAssignmentAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockCreateAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Asset already has an active assignment"),
      );

      const data: CreateAssetAssignmentDTO = {
        assetId: "asset-1",
        assigneeType: "PERSON",
        assigneeId: "person-1",
        startDate: new Date("2024-01-01"),
        isPrimary: true,
      };

      // Act
      const result = await createAssetAssignmentAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset already has an active assignment");
      }
    });
  });

  describe("listAssetAssignmentsAction", () => {
    it("should list all asset assignments", async () => {
      // Arrange
      const mockAssignments = [
        createMockAssetAssignment(),
        createMockAssetAssignment({ id: "assign-2", assetId: "asset-2" }),
      ];
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue(
        mockAssignments,
      );

      // Act
      const result = await listAssetAssignmentsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await listAssetAssignmentsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should pass filter options to use case", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue([]);

      const options = {
        assetId: "asset-1",
        activeOnly: true,
      };

      // Act
      await listAssetAssignmentsAction(options);

      // Assert
      expect(mockListAssetAssignmentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: "asset-1",
          activeOnly: true,
        }),
      );
    });

    it("should enrich assignments with asset tags and assignee names", async () => {
      // Arrange
      const mockAssignments = [createMockAssetAssignment()];
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue(
        mockAssignments,
      );

      // Act
      const result = await listAssetAssignmentsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].assetTag).toBe("LAPTOP-001");
        expect(result.data[0].assigneeName).toBe("John Doe");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAssetAssignmentsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getActiveAssignmentAction", () => {
    it("should return active assignment for asset", async () => {
      // Arrange
      const mockAssignments = [createMockAssetAssignment()];
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue(
        mockAssignments,
      );

      // Act
      const result = await getActiveAssignmentAction("asset-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data?.assetId).toBe("asset-1");
      }
    });

    it("should call use case with activeOnly filter", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue([]);

      // Act
      await getActiveAssignmentAction("asset-1");

      // Assert
      expect(mockListAssetAssignmentsUseCase.execute).toHaveBeenCalledWith({
        assetId: "asset-1",
        activeOnly: true,
      });
    });

    it("should return null when no active assignment", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await getActiveAssignmentAction("asset-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetAssignmentsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getActiveAssignmentAction("asset-1");

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("getAssetAssignmentAction", () => {
    it("should get asset assignment by id", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockGetAssetAssignmentUseCase.execute.mockResolvedValue(mockAssignment);

      // Act
      const result = await getAssetAssignmentAction("assign-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("assign-1");
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockGetAssetAssignmentUseCase.execute.mockResolvedValue(mockAssignment);

      // Act
      await getAssetAssignmentAction("assign-1");

      // Assert
      expect(mockGetAssetAssignmentUseCase.execute).toHaveBeenCalledWith(
        "assign-1",
      );
    });

    it("should return error when assignment not found", async () => {
      // Arrange
      mockGetAssetAssignmentUseCase.execute.mockResolvedValue(null);

      // Act
      const result = await getAssetAssignmentAction("nonexistent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset assignment not found");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAssetAssignmentAction("assign-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("updateAssetAssignmentAction", () => {
    it("should update asset assignment successfully", async () => {
      // Arrange
      const updatedAssignment = createMockAssetAssignment({
        endDate: new Date("2024-12-31"),
      });
      mockUpdateAssetAssignmentUseCase.execute.mockResolvedValue(
        updatedAssignment,
      );

      const data: UpdateAssetAssignmentDTO = {
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await updateAssetAssignmentAction("assign-1", data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endDate).toBeDefined();
      }
    });

    it("should call use case with id and validated data", async () => {
      // Arrange
      const updatedAssignment = createMockAssetAssignment();
      mockUpdateAssetAssignmentUseCase.execute.mockResolvedValue(
        updatedAssignment,
      );

      const data: UpdateAssetAssignmentDTO = {
        assigneeType: "ORG_UNIT",
        assigneeId: "org-1",
        isPrimary: false,
        note: "Updated note",
      };

      // Act
      await updateAssetAssignmentAction("assign-1", data);

      // Assert
      expect(mockUpdateAssetAssignmentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "assign-1",
          assigneeType: "ORG_UNIT",
          assigneeId: "org-1",
          isPrimary: false,
          note: "Updated note",
        }),
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockUpdateAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Assignment not found"),
      );

      const data: UpdateAssetAssignmentDTO = {
        note: "Updated",
      };

      // Act
      const result = await updateAssetAssignmentAction("assign-1", data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Assignment not found");
      }
    });
  });

  describe("deleteAssetAssignmentAction", () => {
    it("should delete asset assignment successfully", async () => {
      // Arrange
      mockDeleteAssetAssignmentUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await deleteAssetAssignmentAction("assign-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      mockDeleteAssetAssignmentUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deleteAssetAssignmentAction("assign-1");

      // Assert
      expect(mockDeleteAssetAssignmentUseCase.execute).toHaveBeenCalledWith(
        "assign-1",
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockDeleteAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Cannot delete active assignment"),
      );

      // Act
      const result = await deleteAssetAssignmentAction("assign-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot delete active assignment");
      }
    });
  });

  describe("bulkCreateAssetAssignmentsAction", () => {
    it("should bulk create asset assignments successfully", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      const items: CreateAssetAssignmentDTO[] = [
        {
          assetId: "asset-1",
          assigneeType: "PERSON",
          assigneeId: "person-1",
          startDate: new Date("2024-01-01"),
          isPrimary: true,
        },
        {
          assetId: "asset-2",
          assigneeType: "PERSON",
          assigneeId: "person-2",
          startDate: new Date("2024-01-01"),
          isPrimary: true,
        },
      ];

      // Act
      const result = await bulkCreateAssetAssignmentsAction(items);

      // Assert
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
    });

    it("should track failures", async () => {
      // Arrange
      mockCreateAssetAssignmentUseCase.execute
        .mockResolvedValueOnce(createMockAssetAssignment())
        .mockRejectedValueOnce(new Error("Duplicate assignment"));

      const items: CreateAssetAssignmentDTO[] = [
        {
          assetId: "asset-1",
          assigneeType: "PERSON",
          assigneeId: "person-1",
          startDate: new Date("2024-01-01"),
          isPrimary: true,
        },
        {
          assetId: "asset-1",
          assigneeType: "PERSON",
          assigneeId: "person-1",
          startDate: new Date("2024-01-01"),
          isPrimary: true,
        },
      ];

      // Act
      const result = await bulkCreateAssetAssignmentsAction(items);

      // Assert
      expect(result.success).toBe(false);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe("Duplicate assignment");
    });

    it("should handle validation failures in bulk", async () => {
      // Arrange
      const items = [
        { assetId: "asset-1" }, // Missing required fields
      ] as CreateAssetAssignmentDTO[];

      // Act
      const result = await bulkCreateAssetAssignmentsAction(items);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Act
      const result = await createAssetAssignmentAction({
        assetId: "",
        assigneeType: "" as "PERSON",
        assigneeId: "",
        startDate: new Date(),
        isPrimary: true,
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockCreateAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Business rule violation"),
      );

      // Act
      const result = await createAssetAssignmentAction({
        assetId: "asset-1",
        assigneeType: "PERSON",
        assigneeId: "person-1",
        startDate: new Date(),
        isPrimary: true,
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Business rule violation");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      const mockAssignment = createMockAssetAssignment();
      mockCreateAssetAssignmentUseCase.execute.mockResolvedValue(
        mockAssignment,
      );

      // Act
      const result = await createAssetAssignmentAction({
        assetId: "asset-1",
        assigneeType: "PERSON",
        assigneeId: "person-1",
        startDate: new Date(),
        isPrimary: true,
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
      mockCreateAssetAssignmentUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await createAssetAssignmentAction({
        assetId: "asset-1",
        assigneeType: "PERSON",
        assigneeId: "person-1",
        startDate: new Date(),
        isPrimary: true,
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
