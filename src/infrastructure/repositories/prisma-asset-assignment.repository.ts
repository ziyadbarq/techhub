/**
 * Prisma AssetAssignment Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  AssetAssignment as PrismaAssetAssignment,
  Prisma,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetAssignmentRepository,
  ConflictFilters,
} from "@/core/repositories/asset-assignment.repository.interface";
import {
  AssetAssignment,
  type AssigneeType,
  type AssignmentSource,
} from "@/core/domain/entities/asset-assignment.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetAssignmentRepository
  implements IAssetAssignmentRepository
{
  private readonly logger = createRepositoryLogger("AssetAssignmentRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(assignment: AssetAssignment): Promise<AssetAssignment> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.assetAssignment.create({
        data: {
          assetId: assignment.assetId,
          assigneeType: assignment.assigneeType,
          assigneeId: assignment.assigneeId,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isPrimary: assignment.isPrimary,
          conditionOnAssignment: assignment.conditionOnAssignment,
          conditionOnReturn: assignment.conditionOnReturn,
          note: assignment.note,
          // Source tracking
          source: assignment.source,
          sourceReferenceType: assignment.sourceReferenceType,
          sourceReferenceId: assignment.sourceReferenceId,
          // Conflict tracking
          hasConflict: assignment.hasConflict,
          conflictNote: assignment.conflictNote,
        },
      });

      this.logger.timed("create", "Asset assignment created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create asset assignment", error);
      throw error;
    }
  }

  async findById(id: string): Promise<AssetAssignment | null> {
    const assignment = await this.prisma.assetAssignment.findUnique({
      where: { id },
    });

    return assignment ? this.toDomain(assignment) : null;
  }

  async findByAsset(assetId: string): Promise<AssetAssignment[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: { assetId },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findActiveByAsset(assetId: string): Promise<AssetAssignment[]> {
    const now = new Date();
    const assignments = await this.prisma.assetAssignment.findMany({
      where: {
        assetId,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findPrimaryByAsset(assetId: string): Promise<AssetAssignment | null> {
    const now = new Date();
    const assignment = await this.prisma.assetAssignment.findFirst({
      where: {
        assetId,
        isPrimary: true,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: "desc" },
    });

    return assignment ? this.toDomain(assignment) : null;
  }

  async findByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<AssetAssignment[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: {
        assigneeType,
        assigneeId,
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findActiveByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<AssetAssignment[]> {
    const now = new Date();
    const assignments = await this.prisma.assetAssignment.findMany({
      where: {
        assigneeType,
        assigneeId,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findByAssigneeType(
    assigneeType: AssigneeType,
  ): Promise<AssetAssignment[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: { assigneeType },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AssetAssignment[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: {
        AND: [
          { startDate: { lte: endDate } },
          {
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
        ],
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async findAll(limit?: number, offset?: number): Promise<AssetAssignment[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      orderBy: { startDate: "desc" },
      take: limit,
      skip: offset,
    });

    return assignments.map((a) => this.toDomain(a));
  }

  async count(): Promise<number> {
    return await this.prisma.assetAssignment.count();
  }

  async countActive(): Promise<number> {
    const now = new Date();
    return await this.prisma.assetAssignment.count({
      where: {
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });
  }

  async update(assignment: AssetAssignment): Promise<AssetAssignment> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.assetAssignment.update({
        where: { id: assignment.id },
        data: {
          assigneeType: assignment.assigneeType,
          assigneeId: assignment.assigneeId,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isPrimary: assignment.isPrimary,
          note: assignment.note,
          updatedAt: assignment.updatedAt,
        },
      });

      this.logger.timed("update", "Asset assignment updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update asset assignment", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.assetAssignment.delete({
        where: { id },
      });

      this.logger.timed("delete", "Asset assignment deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete asset assignment", error);
      throw error;
    }
  }

  async hasOverlappingAssignments(
    assetId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<boolean> {
    const where: Prisma.AssetAssignmentWhereInput = {
      assetId,
      ...(excludeId && { id: { not: excludeId } }),
    };

    // Check for overlapping date ranges
    if (endDate) {
      // If assignment has end date, check for any overlap
      where.AND = [
        { startDate: { lte: endDate } },
        {
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
      ];
    } else {
      // If assignment has no end date (ongoing), check if any active assignments exist
      where.OR = [{ endDate: null }, { endDate: { gte: startDate } }];
    }

    const count = await this.prisma.assetAssignment.count({ where });

    return count > 0;
  }

  async endActiveAssignments(assetId: string, endDate?: Date): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      const end = endDate || new Date();
      const now = new Date();

      await this.prisma.assetAssignment.updateMany({
        where: {
          assetId,
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        data: {
          endDate: end,
          updatedAt: new Date(),
        },
      });

      this.logger.timed(
        "endActiveAssignments",
        "Active asset assignments ended",
        timer(),
        { assetId },
      );
    } catch (error) {
      this.logger.error(
        "endActiveAssignments",
        "Failed to end active asset assignments",
        error,
      );
      throw error;
    }
  }

  async setPrimaryAssignment(assignmentId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      // Get the assignment to find the assetId
      const assignment = await this.prisma.assetAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new Error(`Assignment with ID "${assignmentId}" not found`);
      }

      // Use transaction to ensure consistency
      await this.prisma.$transaction([
        // Unset all primary flags for this asset
        this.prisma.assetAssignment.updateMany({
          where: {
            assetId: assignment.assetId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
            updatedAt: new Date(),
          },
        }),
        // Set the new primary
        this.prisma.assetAssignment.update({
          where: { id: assignmentId },
          data: {
            isPrimary: true,
            updatedAt: new Date(),
          },
        }),
      ]);

      this.logger.timed(
        "setPrimaryAssignment",
        "Primary asset assignment set",
        timer(),
        { assignmentId },
      );
    } catch (error) {
      this.logger.error(
        "setPrimaryAssignment",
        "Failed to set primary asset assignment",
        error,
      );
      throw error;
    }
  }

  /**
   * Find assignment by source reference
   */
  async findBySourceReference(
    sourceReferenceType: string,
    sourceReferenceId: string,
  ): Promise<AssetAssignment | null> {
    const assignment = await this.prisma.assetAssignment.findFirst({
      where: {
        sourceReferenceType,
        sourceReferenceId,
      },
      orderBy: { createdAt: "desc" },
    });

    return assignment ? this.toDomain(assignment) : null;
  }

  /**
   * Find all active assignments for an asset grouped by source
   */
  async findAllActiveByAssetGrouped(assetId: string): Promise<{
    manual: AssetAssignment[];
    intune: AssetAssignment[];
  }> {
    const now = new Date();
    const assignments = await this.prisma.assetAssignment.findMany({
      where: {
        assetId,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: "desc" },
    });

    const manual: AssetAssignment[] = [];
    const intune: AssetAssignment[] = [];

    for (const a of assignments) {
      const domain = this.toDomain(a);
      if (domain.isIntuneManaged()) {
        intune.push(domain);
      } else {
        manual.push(domain);
      }
    }

    return { manual, intune };
  }

  /**
   * Find assignments with conflicts
   */
  async findConflicts(filters?: ConflictFilters): Promise<AssetAssignment[]> {
    const where: Prisma.AssetAssignmentWhereInput = {
      hasConflict: true,
      ...(filters?.assetId && { assetId: filters.assetId }),
      ...(filters?.source && { source: filters.source }),
    };

    // Filter by person (must be PERSON assignee type)
    if (filters?.personId) {
      where.assigneeType = "PERSON";
      where.assigneeId = filters.personId;
    }

    const assignments = await this.prisma.assetAssignment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return assignments.map((a) => this.toDomain(a));
  }

  /**
   * Update conflict status for an assignment
   */
  async updateConflictStatus(
    assignmentId: string,
    hasConflict: boolean,
    conflictNote?: string | null,
  ): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.assetAssignment.update({
        where: { id: assignmentId },
        data: {
          hasConflict,
          conflictNote: conflictNote ?? null,
          updatedAt: new Date(),
        },
      });

      this.logger.timed(
        "updateConflictStatus",
        "Conflict status updated",
        timer(),
        { assignmentId, hasConflict },
      );
    } catch (error) {
      this.logger.error(
        "updateConflictStatus",
        "Failed to update conflict status",
        error,
      );
      throw error;
    }
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaAssignment: PrismaAssetAssignment): AssetAssignment {
    return AssetAssignment.reconstitute({
      id: prismaAssignment.id,
      assetId: prismaAssignment.assetId,
      assigneeType: prismaAssignment.assigneeType as AssigneeType,
      assigneeId: prismaAssignment.assigneeId,
      startDate: prismaAssignment.startDate,
      endDate: prismaAssignment.endDate,
      isPrimary: prismaAssignment.isPrimary,
      conditionOnAssignment: prismaAssignment.conditionOnAssignment,
      conditionOnReturn: prismaAssignment.conditionOnReturn,
      note: prismaAssignment.note,
      // Source tracking
      source: prismaAssignment.source as AssignmentSource,
      sourceReferenceType: prismaAssignment.sourceReferenceType,
      sourceReferenceId: prismaAssignment.sourceReferenceId,
      // Conflict tracking
      hasConflict: prismaAssignment.hasConflict,
      conflictNote: prismaAssignment.conflictNote,
      createdAt: prismaAssignment.createdAt,
      updatedAt: prismaAssignment.updatedAt,
    });
  }
}
