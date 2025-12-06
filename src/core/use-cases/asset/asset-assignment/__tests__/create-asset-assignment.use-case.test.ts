/**
 * CreateAssetAssignmentUseCase - Unit Tests
 *
 * Tests for the CreateAssetAssignmentUseCase including:
 * - Successful assignment creation
 * - Validation errors (entity-level)
 * - Business rule errors (overlapping assignments)
 * - Primary assignment handling
 * - Edge cases (date defaults)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateAssetAssignmentUseCase } from "../create-asset-assignment.use-case";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type {
  AssetAssignment,
  AssigneeType,
} from "@/core/domain/entities/asset-assignment.entity";

/**
 * Mock AssetAssignment Repository
 */
class MockAssetAssignmentRepository
  implements Partial<IAssetAssignmentRepository>
{
  private assignments = new Map<string, AssetAssignment>();
  private idCounter = 1;
  private setPrimaryWasCalled = false;
  private lastPrimaryId: string | null = null;

  async create(assignment: AssetAssignment): Promise<AssetAssignment> {
    // Assign ID if not set (simulate repository behavior)
    if (!assignment.id) {
      assignment.setId(`assignment-${this.idCounter++}`);
    }
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async hasOverlappingAssignments(
    assetId: string,
    startDate: Date,
    endDate: Date | null,
  ): Promise<boolean> {
    // Simple implementation: check if any assignment exists for this asset
    // In a real repo, this would check for actual date overlaps
    for (const assignment of this.assignments.values()) {
      if (assignment.assetId === assetId) {
        // Check for overlap
        const assignmentEnd = assignment.endDate || new Date("2099-12-31");
        const checkEnd = endDate || new Date("2099-12-31");

        // Overlap exists if:
        // - New start is before existing end AND
        // - New end is after existing start
        if (startDate <= assignmentEnd && checkEnd >= assignment.startDate) {
          return true;
        }
      }
    }
    return false;
  }

  async setPrimaryAssignment(assignmentId: string): Promise<void> {
    this.setPrimaryWasCalled = true;
    this.lastPrimaryId = assignmentId;
    // In a real repo, this would unset other primary assignments
  }

  wasPrimaryAssignmentCalled(): boolean {
    return this.setPrimaryWasCalled;
  }

  getLastPrimaryId(): string | null {
    return this.lastPrimaryId;
  }

  clear(): void {
    this.assignments.clear();
    this.idCounter = 1;
    this.setPrimaryWasCalled = false;
    this.lastPrimaryId = null;
  }
}

// Mock ID generator for tests
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => "test-cuid-clx7abc123"),
};

describe("CreateAssetAssignmentUseCase", () => {
  let useCase: CreateAssetAssignmentUseCase;
  let mockRepository: MockAssetAssignmentRepository;

  beforeEach(() => {
    mockRepository = new MockAssetAssignmentRepository();
    useCase = new CreateAssetAssignmentUseCase(
      mockRepository as unknown as IAssetAssignmentRepository,
      mockIdGenerator,
    );
  });

  describe("execute - successful creation", () => {
    it("should create an assignment with valid data", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result).toBeDefined();
      expect(result.assetId).toBe("asset-1");
      expect(result.assigneeType).toBe("PERSON");
      expect(result.assigneeId).toBe("person-1");
      expect(result.startDate).toEqual(new Date("2024-01-01"));
      expect(result.endDate).toEqual(new Date("2024-12-31"));
      expect(result.id).toBeDefined();
    });

    it("should create an assignment without start date (defaults to now)", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.startDate).toBeInstanceOf(Date);
      // Should be close to now (within 1 second)
      const now = new Date();
      expect(Math.abs(result.startDate.getTime() - now.getTime())).toBeLessThan(
        1000,
      );
    });

    it("should create an assignment without end date (ongoing)", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "ORG_UNIT" as AssigneeType,
        assigneeId: "org-1",
        startDate: new Date("2024-01-01"),
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.endDate).toBeNull();
    });

    it("should create primary assignment and call setPrimaryAssignment", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        isPrimary: true,
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.isPrimary).toBe(true);
      expect(mockRepository.wasPrimaryAssignmentCalled()).toBe(true);
      expect(mockRepository.getLastPrimaryId()).toBe(result.id);
    });
  });

  describe("execute - business rule validation", () => {
    it("should reject overlapping assignment", async () => {
      // Arrange - Create first assignment
      await useCase.execute({
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      // Act & Assert - Try to create overlapping assignment
      await expect(
        useCase.execute({
          assetId: "asset-1",
          assigneeType: "PERSON" as AssigneeType,
          assigneeId: "person-2",
          startDate: new Date("2024-06-01"), // Overlaps with first
          endDate: new Date("2024-09-30"),
        }),
      ).rejects.toThrow(/overlapping assignment/);
    });
  });

  describe("execute - entity validation", () => {
    it("should reject invalid assignee type", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "INVALID" as AssigneeType,
        assigneeId: "person-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /Invalid assignee type/,
      );
    });

    it("should reject empty assignee ID", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /Assignee ID cannot be empty/,
      );
    });

    it("should reject end date before start date", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        startDate: new Date("2024-12-31"),
        endDate: new Date("2024-01-01"), // Before start date
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /End date cannot be before start date/,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle assignment at exact same time (start equals end)", async () => {
      // Arrange
      const sameDate = new Date("2024-01-01T12:00:00Z");
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        startDate: sameDate,
        endDate: sameDate,
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.startDate).toEqual(sameDate);
      expect(result.endDate).toEqual(sameDate);
    });

    it("should not call setPrimaryAssignment when isPrimary is false", async () => {
      // Arrange
      const props = {
        assetId: "asset-1",
        assigneeType: "PERSON" as AssigneeType,
        assigneeId: "person-1",
        isPrimary: false,
      };

      // Act
      await useCase.execute(props);

      // Assert
      expect(mockRepository.wasPrimaryAssignmentCalled()).toBe(false);
    });
  });
});
