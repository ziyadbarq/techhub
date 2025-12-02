/**
 * AssetAssignment Domain Entity - Unit Tests
 *
 * Tests for the AssetAssignment entity including:
 * - Factory method: create
 * - Factory method: reconstitute
 * - Validation rules
 * - Update methods
 * - Business logic methods
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AssetAssignment } from "../asset-assignment.entity";
import type {
  AssetAssignmentProps,
  CreateAssetAssignmentProps,
  AssigneeType,
} from "../asset-assignment.entity";

describe("AssetAssignment Entity", () => {
  // Valid test data
  const validCreateProps: CreateAssetAssignmentProps = {
    assetId: "asset-123",
    assigneeType: "PERSON",
    assigneeId: "person-456",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-12-31"),
    isPrimary: true,
    conditionOnAssignment: "NEW",
    note: "Assigned to engineering team member",
  };

  const validFullProps: AssetAssignmentProps = {
    id: "assign-123",
    assetId: "asset-123",
    assigneeType: "PERSON",
    assigneeId: "person-456",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-12-31"),
    isPrimary: true,
    conditionOnAssignment: "NEW",
    conditionOnReturn: null,
    note: "Assigned to engineering team member",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    source: "MANUAL",
    sourceReferenceType: null,
    sourceReferenceId: null,
    hasConflict: false,
    conflictNote: null,
  };

  describe("create - factory method", () => {
    it("should create an asset assignment with valid data", () => {
      const assignment = AssetAssignment.create(validCreateProps);

      expect(assignment.assetId).toBe("asset-123");
      expect(assignment.assigneeType).toBe("PERSON");
      expect(assignment.assigneeId).toBe("person-456");
      expect(assignment.startDate).toEqual(new Date("2024-01-15"));
      expect(assignment.endDate).toEqual(new Date("2024-12-31"));
      expect(assignment.isPrimary).toBe(true);
      expect(assignment.conditionOnAssignment).toBe("NEW");
      expect(assignment.note).toBe("Assigned to engineering team member");
      expect(assignment.id).toBe(""); // Not set until repository assigns it
    });

    it("should create an assignment with minimal required data", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
      });

      expect(assignment.assetId).toBe("asset-123");
      expect(assignment.assigneeType).toBe("PERSON");
      expect(assignment.assigneeId).toBe("person-456");
      expect(assignment.endDate).toBeNull();
      expect(assignment.isPrimary).toBe(false);
      expect(assignment.conditionOnAssignment).toBeNull();
      expect(assignment.conditionOnReturn).toBeNull();
      expect(assignment.note).toBeNull();
    });

    it("should default startDate to current date if not provided", () => {
      const before = new Date();
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
      });
      const after = new Date();

      expect(assignment.startDate.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(assignment.startDate.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should trim whitespace from note", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        note: "  Some note  ",
      });

      expect(assignment.note).toBe("Some note");
    });

    it("should set timestamps on creation", () => {
      const before = new Date();
      const assignment = AssetAssignment.create(validCreateProps);
      const after = new Date();

      expect(assignment.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(assignment.createdAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(assignment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(assignment.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should create assignment for each valid assignee type", () => {
      const assigneeTypes: AssigneeType[] = [
        "PERSON",
        "ORG_UNIT",
        "LOCATION",
        "CI",
      ];

      assigneeTypes.forEach((type) => {
        const assignment = AssetAssignment.create({
          assetId: "asset-123",
          assigneeType: type,
          assigneeId: `${type.toLowerCase()}-456`,
        });

        expect(assignment.assigneeType).toBe(type);
      });
    });
  });

  describe("create - validation", () => {
    describe("assignee type validation", () => {
      it("should throw error for invalid assignee type", () => {
        expect(() =>
          AssetAssignment.create({
            assetId: "asset-123",
            assigneeType: "INVALID" as AssigneeType,
            assigneeId: "id-456",
          }),
        ).toThrow('Invalid assignee type "INVALID"');
      });
    });

    describe("assignee id validation", () => {
      it("should throw error for empty assignee id", () => {
        expect(() =>
          AssetAssignment.create({
            assetId: "asset-123",
            assigneeType: "PERSON",
            assigneeId: "",
          }),
        ).toThrow("Assignee ID cannot be empty");
      });

      it("should throw error for whitespace-only assignee id", () => {
        expect(() =>
          AssetAssignment.create({
            assetId: "asset-123",
            assigneeType: "PERSON",
            assigneeId: "   ",
          }),
        ).toThrow("Assignee ID cannot be empty");
      });
    });

    describe("date range validation", () => {
      it("should throw error when end date is before start date", () => {
        expect(() =>
          AssetAssignment.create({
            assetId: "asset-123",
            assigneeType: "PERSON",
            assigneeId: "person-456",
            startDate: new Date("2024-06-15"),
            endDate: new Date("2024-01-01"),
          }),
        ).toThrow("End date cannot be before start date");
      });

      it("should accept same start and end date", () => {
        const sameDate = new Date("2024-06-15");
        const assignment = AssetAssignment.create({
          assetId: "asset-123",
          assigneeType: "PERSON",
          assigneeId: "person-456",
          startDate: sameDate,
          endDate: sameDate,
        });

        expect(assignment.startDate).toEqual(sameDate);
        expect(assignment.endDate).toEqual(sameDate);
      });
    });
  });

  describe("reconstitute - factory method", () => {
    it("should reconstitute an asset assignment from persistence", () => {
      const assignment = AssetAssignment.reconstitute(validFullProps);

      expect(assignment.id).toBe("assign-123");
      expect(assignment.assetId).toBe("asset-123");
      expect(assignment.assigneeType).toBe("PERSON");
      expect(assignment.assigneeId).toBe("person-456");
      expect(assignment.startDate).toEqual(new Date("2024-01-15"));
      expect(assignment.endDate).toEqual(new Date("2024-12-31"));
      expect(assignment.isPrimary).toBe(true);
      expect(assignment.conditionOnAssignment).toBe("NEW");
      expect(assignment.conditionOnReturn).toBeNull();
      expect(assignment.note).toBe("Assigned to engineering team member");
      expect(assignment.createdAt).toEqual(new Date("2024-01-15"));
      expect(assignment.updatedAt).toEqual(new Date("2024-01-15"));
    });
  });

  describe("update method", () => {
    let assignment: AssetAssignment;

    beforeEach(() => {
      assignment = AssetAssignment.create(validCreateProps);
    });

    it("should update assignee type", () => {
      assignment.update({ assigneeType: "ORG_UNIT" });

      expect(assignment.assigneeType).toBe("ORG_UNIT");
    });

    it("should update assignee id", () => {
      assignment.update({ assigneeId: "new-person-789" });

      expect(assignment.assigneeId).toBe("new-person-789");
    });

    it("should update start date", () => {
      const newStartDate = new Date("2024-02-01");
      assignment.update({ startDate: newStartDate });

      expect(assignment.startDate).toEqual(newStartDate);
    });

    it("should update end date", () => {
      const newEndDate = new Date("2025-06-30");
      assignment.update({ endDate: newEndDate });

      expect(assignment.endDate).toEqual(newEndDate);
    });

    it("should allow setting end date to null", () => {
      assignment.update({ endDate: null });

      expect(assignment.endDate).toBeNull();
    });

    it("should update isPrimary", () => {
      assignment.update({ isPrimary: false });

      expect(assignment.isPrimary).toBe(false);
    });

    it("should update conditionOnAssignment", () => {
      assignment.update({ conditionOnAssignment: "GOOD" });

      expect(assignment.conditionOnAssignment).toBe("GOOD");
    });

    it("should update conditionOnReturn", () => {
      assignment.update({ conditionOnReturn: "FAIR" });

      expect(assignment.conditionOnReturn).toBe("FAIR");
    });

    it("should update note", () => {
      assignment.update({ note: "Updated note" });

      expect(assignment.note).toBe("Updated note");
    });

    it("should update multiple fields at once", () => {
      assignment.update({
        assigneeType: "LOCATION",
        assigneeId: "location-999",
        isPrimary: false,
        note: "Moved to storage",
      });

      expect(assignment.assigneeType).toBe("LOCATION");
      expect(assignment.assigneeId).toBe("location-999");
      expect(assignment.isPrimary).toBe(false);
      expect(assignment.note).toBe("Moved to storage");
    });

    it("should update timestamp on update", () => {
      const beforeUpdate = assignment.updatedAt;

      assignment.update({ note: "New note" });

      expect(assignment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it("should validate assignee type on update", () => {
      expect(() =>
        assignment.update({ assigneeType: "INVALID" as AssigneeType }),
      ).toThrow("Invalid assignee type");
    });

    it("should validate assignee id on update", () => {
      expect(() => assignment.update({ assigneeId: "" })).toThrow(
        "Assignee ID cannot be empty",
      );
    });

    it("should validate date range on start date update", () => {
      expect(() =>
        assignment.update({ startDate: new Date("2025-01-01") }),
      ).toThrow("End date cannot be before start date");
    });

    it("should validate date range on end date update", () => {
      expect(() =>
        assignment.update({ endDate: new Date("2023-01-01") }),
      ).toThrow("End date cannot be before start date");
    });
  });

  describe("endAssignment method", () => {
    it("should set end date to now when no date provided", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        startDate: new Date("2024-01-15"),
      });

      const before = new Date();
      assignment.endAssignment();
      const after = new Date();

      expect(assignment.endDate).not.toBeNull();
      expect(assignment.endDate!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(assignment.endDate!.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should set end date to specified date", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        startDate: new Date("2024-01-15"),
      });

      const endDate = new Date("2024-06-30");
      assignment.endAssignment(endDate);

      expect(assignment.endDate).toEqual(endDate);
    });

    it("should throw error if end date is before start date", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        startDate: new Date("2024-06-15"),
      });

      expect(() => assignment.endAssignment(new Date("2024-01-01"))).toThrow(
        "End date cannot be before start date",
      );
    });

    it("should update timestamp", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        startDate: new Date("2024-01-15"),
      });
      const before = assignment.updatedAt;

      assignment.endAssignment();

      expect(assignment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("setAsPrimary method", () => {
    it("should set isPrimary to true", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        isPrimary: false,
      });

      assignment.setAsPrimary();

      expect(assignment.isPrimary).toBe(true);
    });

    it("should update timestamp", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
      });
      const before = assignment.updatedAt;

      assignment.setAsPrimary();

      expect(assignment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("unsetAsPrimary method", () => {
    it("should set isPrimary to false", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        isPrimary: true,
      });

      assignment.unsetAsPrimary();

      expect(assignment.isPrimary).toBe(false);
    });

    it("should update timestamp", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        isPrimary: true,
      });
      const before = assignment.updatedAt;

      assignment.unsetAsPrimary();

      expect(assignment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("isActive method", () => {
    it("should return true when no end date", () => {
      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
      });

      expect(assignment.isActive()).toBe(true);
    });

    it("should return true when end date is in the future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const assignment = AssetAssignment.create({
        assetId: "asset-123",
        assigneeType: "PERSON",
        assigneeId: "person-456",
        endDate: futureDate,
      });

      expect(assignment.isActive()).toBe(true);
    });

    it("should return false when end date is in the past", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2020-01-01"),
        endDate: pastDate,
      });

      expect(assignment.isActive()).toBe(false);
    });
  });

  describe("wasActiveOn method", () => {
    it("should return true for date within assignment period", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(assignment.wasActiveOn(new Date("2024-06-15"))).toBe(true);
    });

    it("should return true for start date", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(assignment.wasActiveOn(new Date("2024-01-01"))).toBe(true);
    });

    it("should return true for end date", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(assignment.wasActiveOn(new Date("2024-12-31"))).toBe(true);
    });

    it("should return false for date before start date", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(assignment.wasActiveOn(new Date("2023-12-31"))).toBe(false);
    });

    it("should return false for date after end date", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(assignment.wasActiveOn(new Date("2025-01-01"))).toBe(false);
    });

    it("should return true for any future date when no end date", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);

      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: null,
      });

      expect(assignment.wasActiveOn(futureDate)).toBe(true);
    });
  });

  describe("getDurationInDays method", () => {
    it("should return correct duration for completed assignment", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(assignment.getDurationInDays()).toBe(30);
    });

    it("should return correct duration for single day assignment", () => {
      const sameDate = new Date("2024-06-15");
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: sameDate,
        endDate: sameDate,
      });

      expect(assignment.getDurationInDays()).toBe(0);
    });

    it("should calculate duration from start to now when no end date", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10); // 10 days ago

      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate,
        endDate: null,
      });

      // Should be approximately 10 days (may be off by 1 due to time)
      const duration = assignment.getDurationInDays();
      expect(duration).toBeGreaterThanOrEqual(9);
      expect(duration).toBeLessThanOrEqual(11);
    });

    it("should return correct duration for year-long assignment", () => {
      const assignment = AssetAssignment.reconstitute({
        ...validFullProps,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
      });

      // 2024 is a leap year, so 366 days
      expect(assignment.getDurationInDays()).toBe(366);
    });
  });

  describe("setId method", () => {
    it("should set id when not already set", () => {
      const assignment = AssetAssignment.create(validCreateProps);

      assignment.setId("new-assign-id");

      expect(assignment.id).toBe("new-assign-id");
    });

    it("should throw error when trying to change existing id", () => {
      const assignment = AssetAssignment.reconstitute(validFullProps);

      expect(() => assignment.setId("different-id")).toThrow(
        "Cannot change asset assignment ID after it has been set",
      );
    });
  });

  describe("toObject method", () => {
    it("should return plain object representation", () => {
      const assignment = AssetAssignment.reconstitute(validFullProps);

      const obj = assignment.toObject();

      expect(obj).toEqual(validFullProps);
      expect(obj).not.toBe(validFullProps); // Should be a copy
    });
  });

  describe("equals method", () => {
    it("should return true for assignments with same id", () => {
      const assign1 = AssetAssignment.reconstitute(validFullProps);
      const assign2 = AssetAssignment.reconstitute({
        ...validFullProps,
        assigneeId: "different-person",
      });

      expect(assign1.equals(assign2)).toBe(true);
    });

    it("should return false for assignments with different ids", () => {
      const assign1 = AssetAssignment.reconstitute(validFullProps);
      const assign2 = AssetAssignment.reconstitute({
        ...validFullProps,
        id: "different-id",
      });

      expect(assign1.equals(assign2)).toBe(false);
    });
  });
});
