/**
 * Assignment Handler for Universal Assets Importer
 *
 * Handles creation and management of AssetAssignments during import.
 * Supports re-assignment (closing old, creating new).
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { ILoggerService } from "@/core/services";
import { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import type { AssignmentResult, UniversalImportSettings } from "./types";

/**
 * Assignment Handler class
 */
export class AssignmentHandler {
  private logger: ILoggerService;

  constructor() {
    const container = getContainer();
    this.logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  }

  /**
   * Handle assignment for an asset
   * Creates new assignment or handles re-assignment
   */
  async handleAssignment(
    assetId: string,
    personId: string,
    personEmail: string,
    settings: UniversalImportSettings,
  ): Promise<AssignmentResult> {
    if (!settings.handleAssignmentChanges) {
      return { action: "unchanged" };
    }

    const container = getContainer();
    const assignmentRepo = container.get<IAssetAssignmentRepository>(
      DI_TOKENS.IAssetAssignmentRepository,
    );

    try {
      // Find current active assignment (where endDate is null)
      const currentAssignment = await this.findActiveAssignment(
        assignmentRepo,
        assetId,
      );

      if (!currentAssignment) {
        // No existing assignment - create new
        const assignment = await this.createAssignment(
          assignmentRepo,
          assetId,
          personId,
        );
        return {
          action: "created",
          assignmentId: assignment.id,
        };
      }

      // Check if same person
      if (currentAssignment.assigneeId === personId) {
        return {
          action: "unchanged",
          assignmentId: currentAssignment.id,
        };
      }

      // Different person - handle re-assignment
      if (settings.closeOldAssignmentsOnReassign) {
        // Close old assignment
        await this.closeAssignment(assignmentRepo, currentAssignment);

        // Create new assignment
        const newAssignment = await this.createAssignment(
          assignmentRepo,
          assetId,
          personId,
        );

        this.logger.info("Re-assigned asset", {
          assetId,
          previousAssignee: currentAssignment.assigneeId,
          newAssignee: personId,
        });

        return {
          action: "reassigned",
          assignmentId: newAssignment.id,
          previousAssigneeEmail: personEmail, // Note: This should be the OLD assignee's email
        };
      }

      // Don't close old assignments - just create new one
      const newAssignment = await this.createAssignment(
        assignmentRepo,
        assetId,
        personId,
      );

      return {
        action: "created",
        assignmentId: newAssignment.id,
      };
    } catch (error) {
      return {
        action: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Failed to handle assignment",
      };
    }
  }

  /**
   * Find active (non-ended) assignment for an asset
   */
  private async findActiveAssignment(
    repo: IAssetAssignmentRepository,
    assetId: string,
  ): Promise<AssetAssignment | null> {
    const assignments = await repo.findActiveByAsset(assetId);

    // Return first active assignment (PERSON type preferred)
    const personAssignment = assignments.find(
      (a) => a.assigneeType === "PERSON",
    );
    return personAssignment || assignments[0] || null;
  }

  /**
   * Create a new assignment
   */
  private async createAssignment(
    repo: IAssetAssignmentRepository,
    assetId: string,
    personId: string,
  ): Promise<AssetAssignment> {
    const assignment = AssetAssignment.create({
      assetId,
      assigneeType: "PERSON",
      assigneeId: personId,
      startDate: new Date(),
      isPrimary: true,
    });

    return repo.create(assignment);
  }

  /**
   * Close an existing assignment by setting endDate
   */
  private async closeAssignment(
    repo: IAssetAssignmentRepository,
    assignment: AssetAssignment,
  ): Promise<void> {
    assignment.update({
      endDate: new Date(),
    });
    await repo.update(assignment);
  }

  /**
   * Batch check for existing assignments
   * Returns map of assetId -> current assigneeId
   */
  async batchCheckAssignments(
    assetIds: string[],
  ): Promise<Map<string, { assignmentId: string; assigneeId: string }>> {
    const result = new Map<
      string,
      { assignmentId: string; assigneeId: string }
    >();

    if (assetIds.length === 0) {
      return result;
    }

    const container = getContainer();
    const assignmentRepo = container.get<IAssetAssignmentRepository>(
      DI_TOKENS.IAssetAssignmentRepository,
    );

    // Note: This is a simplified implementation that loops through assets
    // A more efficient implementation would use a batch query
    for (const assetId of assetIds) {
      const active = await this.findActiveAssignment(assignmentRepo, assetId);
      if (active) {
        result.set(assetId, {
          assignmentId: active.id,
          assigneeId: active.assigneeId,
        });
      }
    }

    return result;
  }
}
