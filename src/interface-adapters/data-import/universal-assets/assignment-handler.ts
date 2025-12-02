/**
 * Assignment Handler for Universal Assets Importer
 *
 * Handles creation and management of AssetAssignments during import.
 * Supports re-assignment (closing old, creating new).
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services";
import { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import type { AssignmentResult, UniversalImportSettings } from "./types";
import type { Prisma } from "@/generated/prisma";

/**
 * Prisma transaction client type for transaction-aware methods
 */
export type TransactionClient = Prisma.TransactionClient;

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
        // Fetch old person's email for proper reporting
        const personRepo = container.get<IPersonRepository>(
          DI_TOKENS.IPersonRepository,
        );
        const oldPerson = await personRepo.findById(
          currentAssignment.assigneeId,
        );
        const previousEmail = oldPerson?.email || "Unknown";

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
          previousEmail,
          newAssignee: personId,
          newEmail: personEmail,
        });

        return {
          action: "reassigned",
          assignmentId: newAssignment.id,
          previousAssigneeEmail: previousEmail,
          newAssigneeEmail: personEmail,
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

  /**
   * Handle assignment within a Prisma transaction
   * Used for atomic asset creation + assignment
   */
  async handleAssignmentWithTransaction(
    tx: TransactionClient,
    assetId: string,
    personId: string,
    personEmail: string,
    settings: UniversalImportSettings,
  ): Promise<AssignmentResult> {
    if (!settings.handleAssignmentChanges) {
      return { action: "unchanged" };
    }

    try {
      // Find current active assignment using raw Prisma query within transaction
      const currentAssignment = await tx.assetAssignment.findFirst({
        where: {
          assetId,
          endDate: null,
          assigneeType: "PERSON",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!currentAssignment) {
        // No existing assignment - create new within transaction
        const newAssignment = await tx.assetAssignment.create({
          data: {
            assetId,
            assigneeType: "PERSON",
            assigneeId: personId,
            startDate: new Date(),
            isPrimary: true,
          },
        });

        return {
          action: "created",
          assignmentId: newAssignment.id,
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
        // Get old person's email for reporting
        const oldPerson = await tx.person.findUnique({
          where: { id: currentAssignment.assigneeId },
          select: { email: true },
        });
        const previousEmail = oldPerson?.email || "Unknown";

        // Close old assignment within transaction
        await tx.assetAssignment.update({
          where: { id: currentAssignment.id },
          data: { endDate: new Date() },
        });

        // Create new assignment within transaction
        const newAssignment = await tx.assetAssignment.create({
          data: {
            assetId,
            assigneeType: "PERSON",
            assigneeId: personId,
            startDate: new Date(),
            isPrimary: true,
          },
        });

        this.logger.info("Re-assigned asset within transaction", {
          assetId,
          previousAssignee: currentAssignment.assigneeId,
          previousEmail,
          newAssignee: personId,
          newEmail: personEmail,
        });

        return {
          action: "reassigned",
          assignmentId: newAssignment.id,
          previousAssigneeEmail: previousEmail,
          newAssigneeEmail: personEmail,
        };
      }

      // Don't close old assignments - just create new one
      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId,
          assigneeType: "PERSON",
          assigneeId: personId,
          startDate: new Date(),
          isPrimary: true,
        },
      });

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
}
