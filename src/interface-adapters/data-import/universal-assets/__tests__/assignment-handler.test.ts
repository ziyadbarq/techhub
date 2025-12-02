/**
 * Unit tests for assignment-handler.ts
 *
 * Tests the AssignmentHandler class which handles creation and management
 * of AssetAssignments during the universal asset import process.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AssignmentHandler,
  type TransactionClient,
} from "../assignment-handler";
import {
  createMockAssetAssignmentRepository,
  createMockPersonRepository,
} from "./mocks/repositories.mock";
import { createMockLogger } from "./mocks/logger.mock";
import {
  PERSON_FIXTURES,
  ASSIGNMENT_FIXTURES,
} from "./fixtures/entities.fixtures";
import type { UniversalImportSettings } from "../types";

// Mock DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(),
}));

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";

describe("AssignmentHandler", () => {
  let mockAssignmentRepo: ReturnType<
    typeof createMockAssetAssignmentRepository
  >;
  let mockPersonRepo: ReturnType<typeof createMockPersonRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  // Default settings for tests
  const defaultSettings: UniversalImportSettings = {
    autoCreateMissingEntities: true,
    skipRowOnAutoCreateFailure: true,
    handleAssignmentChanges: true,
    closeOldAssignmentsOnReassign: true,
    requirePersonForImport: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks
    mockAssignmentRepo = createMockAssetAssignmentRepository();
    mockPersonRepo = createMockPersonRepository();
    mockLogger = createMockLogger();

    // Seed fixtures
    mockPersonRepo.seed(PERSON_FIXTURES);
    mockAssignmentRepo.seed(ASSIGNMENT_FIXTURES);

    // Setup container mock
    (getContainer as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((token: symbol) => {
        switch (token) {
          case DI_TOKENS.ILoggerService:
            return mockLogger;
          case DI_TOKENS.IAssetAssignmentRepository:
            return mockAssignmentRepo;
          case DI_TOKENS.IPersonRepository:
            return mockPersonRepo;
          default:
            throw new Error(`Unknown token: ${String(token)}`);
        }
      }),
    });
  });

  // ============================================
  // SETTINGS-BASED BEHAVIOR
  // ============================================
  describe("settings-based behavior", () => {
    it("should return 'unchanged' when handleAssignmentChanges is false", async () => {
      const handler = new AssignmentHandler();
      const settings = { ...defaultSettings, handleAssignmentChanges: false };

      const result = await handler.handleAssignment(
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        settings,
      );

      expect(result.action).toBe("unchanged");
      expect(mockAssignmentRepo.findActiveByAsset).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // NO EXISTING ASSIGNMENT
  // ============================================
  describe("no existing assignment", () => {
    it("should create new assignment when none exists", async () => {
      const handler = new AssignmentHandler();

      // Use a new asset ID that has no assignment
      const result = await handler.handleAssignment(
        "asset-new",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("created");
      expect(result.assignmentId).toBeTruthy();
      expect(mockAssignmentRepo.create).toHaveBeenCalled();
    });

    it("should set correct assignment properties", async () => {
      const handler = new AssignmentHandler();

      await handler.handleAssignment(
        "asset-new",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      const createCall = mockAssignmentRepo.create.mock.calls[0][0];
      expect(createCall.assetId).toBe("asset-new");
      expect(createCall.assigneeId).toBe("person-2");
      expect(createCall.assigneeType).toBe("PERSON");
      expect(createCall.isPrimary).toBe(true);
      expect(createCall.startDate).toBeInstanceOf(Date);
    });
  });

  // ============================================
  // SAME PERSON (No Change)
  // ============================================
  describe("same person", () => {
    it("should return 'unchanged' when assigned to same person", async () => {
      const handler = new AssignmentHandler();

      // asset-existing-1 is already assigned to person-1
      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("unchanged");
      expect(result.assignmentId).toBe("assign-1");
      expect(mockAssignmentRepo.create).not.toHaveBeenCalled();
    });

    it("should not create new assignment for same person", async () => {
      const handler = new AssignmentHandler();

      await handler.handleAssignment(
        "asset-existing-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(mockAssignmentRepo.create).not.toHaveBeenCalled();
      expect(mockAssignmentRepo.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // REASSIGNMENT (Different Person)
  // ============================================
  describe("reassignment with closeOldAssignmentsOnReassign=true", () => {
    it("should close old assignment and create new one", async () => {
      const handler = new AssignmentHandler();

      // asset-existing-1 assigned to person-1, reassign to person-2
      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("reassigned");
      expect(result.assignmentId).toBeTruthy();
      expect(mockAssignmentRepo.update).toHaveBeenCalled();
      expect(mockAssignmentRepo.create).toHaveBeenCalled();
    });

    it("should set endDate on old assignment", async () => {
      const handler = new AssignmentHandler();

      await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      const updateCall = mockAssignmentRepo.update.mock.calls[0][0];
      expect(updateCall.endDate).toBeInstanceOf(Date);
    });

    it("should return previousAssigneeEmail", async () => {
      const handler = new AssignmentHandler();

      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      expect(result.previousAssigneeEmail).toBe("john.doe@barq.com");
      expect(result.newAssigneeEmail).toBe("jane.smith@barq.com");
    });

    it("should log reassignment", async () => {
      const handler = new AssignmentHandler();

      await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Re-assigned asset",
        expect.objectContaining({
          assetId: "asset-existing-1",
          previousAssignee: "person-1",
          newAssignee: "person-2",
        }),
      );
    });
  });

  describe("reassignment with closeOldAssignmentsOnReassign=false", () => {
    it("should NOT close old assignment", async () => {
      const handler = new AssignmentHandler();
      const settings = {
        ...defaultSettings,
        closeOldAssignmentsOnReassign: false,
      };

      await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        settings,
      );

      expect(mockAssignmentRepo.update).not.toHaveBeenCalled();
    });

    it("should create new assignment alongside old one", async () => {
      const handler = new AssignmentHandler();
      const settings = {
        ...defaultSettings,
        closeOldAssignmentsOnReassign: false,
      };

      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        settings,
      );

      expect(result.action).toBe("created");
      expect(mockAssignmentRepo.create).toHaveBeenCalled();
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  describe("error handling", () => {
    it("should return 'failed' when repository throws", async () => {
      mockAssignmentRepo.findActiveByAsset.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("failed");
      expect(result.error).toContain("DB connection failed");
    });

    it("should handle create failure", async () => {
      mockAssignmentRepo.create.mockRejectedValueOnce(
        new Error("Insert failed"),
      );

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-new",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("failed");
      expect(result.error).toContain("Insert failed");
    });

    it("should handle update failure during reassignment", async () => {
      mockAssignmentRepo.update.mockRejectedValueOnce(
        new Error("Update failed"),
      );

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("failed");
      expect(result.error).toContain("Update failed");
    });

    it("should handle missing previous person gracefully", async () => {
      // Set up findById to return null for the old assignee
      mockPersonRepo.findById.mockResolvedValueOnce(null);

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-existing-1",
        "person-2",
        "jane.smith@barq.com",
        defaultSettings,
      );

      // Should still work, with "Unknown" as previous email
      expect(result.action).toBe("reassigned");
      expect(result.previousAssigneeEmail).toBe("Unknown");
    });
  });

  // ============================================
  // BATCH CHECK ASSIGNMENTS
  // ============================================
  describe("batchCheckAssignments", () => {
    it("should return empty map for empty input", async () => {
      const handler = new AssignmentHandler();
      const result = await handler.batchCheckAssignments([]);
      expect(result.size).toBe(0);
    });

    it("should return map of assetId to assignment info", async () => {
      const handler = new AssignmentHandler();
      const result = await handler.batchCheckAssignments(["asset-existing-1"]);

      expect(result.size).toBe(1);
      expect(result.get("asset-existing-1")).toEqual({
        assignmentId: "assign-1",
        assigneeId: "person-1",
      });
    });

    it("should not include assets without active assignments", async () => {
      const handler = new AssignmentHandler();
      const result = await handler.batchCheckAssignments([
        "asset-existing-1",
        "asset-no-assignment",
      ]);

      expect(result.size).toBe(1);
      expect(result.has("asset-no-assignment")).toBe(false);
    });
  });

  // ============================================
  // TRANSACTION SUPPORT
  // ============================================
  describe("handleAssignmentWithTransaction", () => {
    let mockTx: {
      assetAssignment: {
        findFirst: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
      };
      person: {
        findUnique: ReturnType<typeof vi.fn>;
      };
    };

    beforeEach(() => {
      mockTx = {
        assetAssignment: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "new-assign-tx" }),
          update: vi.fn().mockResolvedValue({}),
        },
        person: {
          findUnique: vi.fn().mockResolvedValue({ email: "old@barq.com" }),
        },
      };
    });

    it("should return 'unchanged' when handleAssignmentChanges is false", async () => {
      const handler = new AssignmentHandler();
      const settings = { ...defaultSettings, handleAssignmentChanges: false };

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        settings,
      );

      expect(result.action).toBe("unchanged");
      expect(mockTx.assetAssignment.findFirst).not.toHaveBeenCalled();
    });

    it("should create new assignment within transaction", async () => {
      const handler = new AssignmentHandler();

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("created");
      expect(result.assignmentId).toBe("new-assign-tx");
      expect(mockTx.assetAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          assetId: "asset-1",
          assigneeId: "person-1",
          assigneeType: "PERSON",
          isPrimary: true,
        }),
      });
    });

    it("should return 'unchanged' when same person already assigned", async () => {
      mockTx.assetAssignment.findFirst.mockResolvedValue({
        id: "existing-assign",
        assigneeId: "person-1",
      });

      const handler = new AssignmentHandler();

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("unchanged");
      expect(result.assignmentId).toBe("existing-assign");
    });

    it("should reassign within transaction when closeOldAssignmentsOnReassign=true", async () => {
      mockTx.assetAssignment.findFirst.mockResolvedValue({
        id: "existing-assign",
        assigneeId: "old-person",
      });

      const handler = new AssignmentHandler();

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "new-person",
        "new@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("reassigned");
      expect(mockTx.assetAssignment.update).toHaveBeenCalledWith({
        where: { id: "existing-assign" },
        data: { endDate: expect.any(Date) },
      });
      expect(mockTx.assetAssignment.create).toHaveBeenCalled();
    });

    it("should NOT close old assignment in transaction when closeOldAssignmentsOnReassign=false", async () => {
      mockTx.assetAssignment.findFirst.mockResolvedValue({
        id: "existing-assign",
        assigneeId: "old-person",
      });

      const handler = new AssignmentHandler();
      const settings = {
        ...defaultSettings,
        closeOldAssignmentsOnReassign: false,
      };

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "new-person",
        "new@barq.com",
        settings,
      );

      expect(result.action).toBe("created");
      expect(mockTx.assetAssignment.update).not.toHaveBeenCalled();
      expect(mockTx.assetAssignment.create).toHaveBeenCalled();
    });

    it("should handle transaction errors", async () => {
      mockTx.assetAssignment.findFirst.mockRejectedValue(
        new Error("Transaction failed"),
      );

      const handler = new AssignmentHandler();

      const result = await handler.handleAssignmentWithTransaction(
        mockTx as unknown as TransactionClient,
        "asset-1",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      expect(result.action).toBe("failed");
      expect(result.error).toContain("Transaction failed");
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe("edge cases", () => {
    it("should prefer PERSON type assignment over others", async () => {
      // Add a non-PERSON assignment first
      mockAssignmentRepo.seed([
        {
          id: "assign-dept",
          assetId: "asset-multi",
          assigneeType: "DEPARTMENT",
          assigneeId: "dept-1",
          startDate: new Date("2024-01-01"),
          endDate: null,
          isPrimary: false,
        },
        {
          id: "assign-person",
          assetId: "asset-multi",
          assigneeType: "PERSON",
          assigneeId: "person-1",
          startDate: new Date("2024-02-01"),
          endDate: null,
          isPrimary: true,
        },
      ]);

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-multi",
        "person-1",
        "john.doe@barq.com",
        defaultSettings,
      );

      // Should recognize person-1 is already assigned
      expect(result.action).toBe("unchanged");
    });

    it("should handle multiple active assignments", async () => {
      // Seed multiple active assignments (unusual but possible)
      mockAssignmentRepo.seed([
        {
          id: "assign-multi-1",
          assetId: "asset-multi",
          assigneeType: "PERSON",
          assigneeId: "person-1",
          startDate: new Date("2024-01-01"),
          endDate: null,
          isPrimary: true,
        },
        {
          id: "assign-multi-2",
          assetId: "asset-multi",
          assigneeType: "PERSON",
          assigneeId: "person-2",
          startDate: new Date("2024-02-01"),
          endDate: null,
          isPrimary: false,
        },
      ]);

      const handler = new AssignmentHandler();
      const result = await handler.handleAssignment(
        "asset-multi",
        "person-3",
        "new.owner@barq.com",
        defaultSettings,
      );

      // Should still work - closes first PERSON assignment found
      expect(result.action).toBe("reassigned");
    });
  });
});
