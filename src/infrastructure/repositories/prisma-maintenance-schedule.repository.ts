/**
 * Prisma MaintenanceSchedule Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  MaintenanceSchedule as PrismaMaintenanceSchedule,
  Prisma,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IMaintenanceScheduleRepository,
  ListMaintenanceSchedulesFilters,
} from "@/core/repositories/maintenance-schedule.repository.interface";
import { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";
import type { ScheduleType } from "@/core/domain/value-objects/schedule-type";
import type { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaMaintenanceScheduleRepository
  implements IMaintenanceScheduleRepository
{
  private readonly logger = createRepositoryLogger(
    "MaintenanceScheduleRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(schedule: MaintenanceSchedule): Promise<MaintenanceSchedule> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.maintenanceSchedule.create({
        data: {
          assetId: schedule.assetId,
          title: schedule.title,
          description: schedule.description,
          scheduleType: schedule.scheduleType,
          intervalValue: schedule.intervalValue,
          startDate: schedule.startDate,
          nextDueDate: schedule.nextDueDate,
          isActive: schedule.isActive,
          assignedToId: schedule.assignedToId,
          estimatedDurationMinutes: schedule.estimatedDurationMinutes,
          priority: schedule.priority,
          instructions: schedule.instructions,
        },
      });

      this.logger.timed("create", "Maintenance schedule created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create maintenance schedule",
        error,
      );
      throw error;
    }
  }

  async update(schedule: MaintenanceSchedule): Promise<MaintenanceSchedule> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.maintenanceSchedule.update({
        where: { id: schedule.id },
        data: {
          title: schedule.title,
          description: schedule.description,
          scheduleType: schedule.scheduleType,
          intervalValue: schedule.intervalValue,
          startDate: schedule.startDate,
          nextDueDate: schedule.nextDueDate,
          isActive: schedule.isActive,
          assignedToId: schedule.assignedToId,
          estimatedDurationMinutes: schedule.estimatedDurationMinutes,
          priority: schedule.priority,
          instructions: schedule.instructions,
          updatedAt: schedule.updatedAt,
        },
      });

      this.logger.timed("update", "Maintenance schedule updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "update",
        "Failed to update maintenance schedule",
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.maintenanceSchedule.delete({
        where: { id },
      });

      this.logger.timed("delete", "Maintenance schedule deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error(
        "delete",
        "Failed to delete maintenance schedule",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<MaintenanceSchedule | null> {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id },
    });

    return schedule ? this.toDomain(schedule) : null;
  }

  async findAll(
    filters?: ListMaintenanceSchedulesFilters,
  ): Promise<MaintenanceSchedule[]> {
    const where = this.buildWhereClause(filters);

    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where,
      orderBy: { nextDueDate: "asc" },
    });

    return schedules.map((s) => this.toDomain(s));
  }

  async count(filters?: ListMaintenanceSchedulesFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.maintenanceSchedule.count({ where });
  }

  async findDueSchedules(): Promise<MaintenanceSchedule[]> {
    const now = new Date();

    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: now },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return schedules.map((s) => this.toDomain(s));
  }

  async findByAssetId(assetId: string): Promise<MaintenanceSchedule[]> {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { assetId },
      orderBy: { nextDueDate: "asc" },
    });

    return schedules.map((s) => this.toDomain(s));
  }

  /**
   * Build where clause for filter queries
   */
  private buildWhereClause(
    filters?: ListMaintenanceSchedulesFilters,
  ): Prisma.MaintenanceScheduleWhereInput {
    if (!filters) {
      return {};
    }

    const where: Prisma.MaintenanceScheduleWhereInput = {};

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.scheduleType) {
      where.scheduleType = filters.scheduleType;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.dueBefore) {
      where.nextDueDate = { lte: filters.dueBefore };
    }

    if (filters.overdueOnly) {
      const now = new Date();
      where.isActive = true;
      where.nextDueDate = { lt: now };
    }

    return where;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(
    prismaSchedule: PrismaMaintenanceSchedule,
  ): MaintenanceSchedule {
    return MaintenanceSchedule.reconstitute({
      id: prismaSchedule.id,
      assetId: prismaSchedule.assetId,
      title: prismaSchedule.title,
      description: prismaSchedule.description,
      scheduleType: prismaSchedule.scheduleType as ScheduleType,
      intervalValue: prismaSchedule.intervalValue,
      startDate: prismaSchedule.startDate,
      nextDueDate: prismaSchedule.nextDueDate,
      isActive: prismaSchedule.isActive,
      assignedToId: prismaSchedule.assignedToId,
      estimatedDurationMinutes: prismaSchedule.estimatedDurationMinutes,
      priority: prismaSchedule.priority as MaintenancePriority,
      instructions: prismaSchedule.instructions,
      createdAt: prismaSchedule.createdAt,
      updatedAt: prismaSchedule.updatedAt,
    });
  }
}
