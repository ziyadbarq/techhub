/**
 * Prisma MaintenanceRecord Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  MaintenanceRecord as PrismaMaintenanceRecord,
  Prisma,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IMaintenanceRecordRepository,
  ListMaintenanceRecordsFilters,
} from "@/core/repositories/maintenance-record.repository.interface";
import { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";
import type { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaMaintenanceRecordRepository
  implements IMaintenanceRecordRepository
{
  private readonly logger = createRepositoryLogger(
    "MaintenanceRecordRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(record: MaintenanceRecord): Promise<MaintenanceRecord> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.maintenanceRecord.create({
        data: {
          assetId: record.assetId,
          maintenanceScheduleId: record.maintenanceScheduleId,
          title: record.title,
          description: record.description,
          scheduledDate: record.scheduledDate,
          completedDate: record.completedDate,
          performedById: record.performedById,
          status: record.status,
          notes: record.notes,
          cost: record.cost ?? null,
          currency: record.currency,
          partsUsed: toJsonValue(record.partsUsed),
          nextMaintenanceDate: record.nextMaintenanceDate,
        },
      });

      this.logger.timed("create", "Maintenance record created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create maintenance record", error);
      throw error;
    }
  }

  async update(record: MaintenanceRecord): Promise<MaintenanceRecord> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.maintenanceRecord.update({
        where: { id: record.id },
        data: {
          title: record.title,
          description: record.description,
          scheduledDate: record.scheduledDate,
          completedDate: record.completedDate,
          performedById: record.performedById,
          status: record.status,
          notes: record.notes,
          cost: record.cost ?? null,
          currency: record.currency,
          partsUsed: toJsonValue(record.partsUsed),
          nextMaintenanceDate: record.nextMaintenanceDate,
          updatedAt: record.updatedAt,
        },
      });

      this.logger.timed("update", "Maintenance record updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update maintenance record", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.maintenanceRecord.delete({
        where: { id },
      });

      this.logger.timed("delete", "Maintenance record deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error("delete", "Failed to delete maintenance record", error);
      throw error;
    }
  }

  async findById(id: string): Promise<MaintenanceRecord | null> {
    const record = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(
    filters?: ListMaintenanceRecordsFilters,
  ): Promise<MaintenanceRecord[]> {
    const where = this.buildWhereClause(filters);

    const records = await this.prisma.maintenanceRecord.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  async count(filters?: ListMaintenanceRecordsFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.maintenanceRecord.count({ where });
  }

  async findOverdueRecords(): Promise<MaintenanceRecord[]> {
    const now = new Date();

    const records = await this.prisma.maintenanceRecord.findMany({
      where: {
        status: "SCHEDULED",
        scheduledDate: { lt: now },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByAssetId(assetId: string): Promise<MaintenanceRecord[]> {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { scheduledDate: "desc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByScheduleId(scheduleId: string): Promise<MaintenanceRecord[]> {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { maintenanceScheduleId: scheduleId },
      orderBy: { scheduledDate: "desc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  /**
   * Build where clause for filter queries
   */
  private buildWhereClause(
    filters?: ListMaintenanceRecordsFilters,
  ): Prisma.MaintenanceRecordWhereInput {
    if (!filters) {
      return {};
    }

    const where: Prisma.MaintenanceRecordWhereInput = {};

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.maintenanceScheduleId) {
      where.maintenanceScheduleId = filters.maintenanceScheduleId;
    }

    if (filters.performedById) {
      where.performedById = filters.performedById;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Scheduled date range
    if (filters.scheduledAfter || filters.scheduledBefore) {
      where.scheduledDate = {
        ...(filters.scheduledAfter && { gte: filters.scheduledAfter }),
        ...(filters.scheduledBefore && { lte: filters.scheduledBefore }),
      };
    }

    // Completed date range
    if (filters.completedAfter || filters.completedBefore) {
      where.completedDate = {
        ...(filters.completedAfter && { gte: filters.completedAfter }),
        ...(filters.completedBefore && { lte: filters.completedBefore }),
      };
    }

    return where;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaRecord: PrismaMaintenanceRecord): MaintenanceRecord {
    return MaintenanceRecord.reconstitute({
      id: prismaRecord.id,
      assetId: prismaRecord.assetId,
      maintenanceScheduleId: prismaRecord.maintenanceScheduleId,
      title: prismaRecord.title,
      description: prismaRecord.description,
      scheduledDate: prismaRecord.scheduledDate,
      completedDate: prismaRecord.completedDate,
      performedById: prismaRecord.performedById,
      status: prismaRecord.status as MaintenanceStatus,
      notes: prismaRecord.notes,
      cost: prismaRecord.cost?.toNumber() ?? null,
      currency: prismaRecord.currency,
      partsUsed: fromJsonValue<string[]>(prismaRecord.partsUsed),
      nextMaintenanceDate: prismaRecord.nextMaintenanceDate,
      createdAt: prismaRecord.createdAt,
      updatedAt: prismaRecord.updatedAt,
    });
  }
}
