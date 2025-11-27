/**
 * Maintenance Schedule Factory
 *
 * Type-safe factory for generating MaintenanceSchedule test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/server";
import { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";
import {
  ScheduleType,
  calculateNextDueDate,
} from "@/core/domain/value-objects/schedule-type";
import { optionalConnect, requireConnect } from "../seed-utils.js";

export interface MaintenanceScheduleFactoryOptions {
  assetId: string;
  title: string;
  description?: string;
  scheduleType: ScheduleType;
  intervalValue?: number;
  startDate: Date;
  nextDueDate: Date;
  isActive?: boolean;
  assignedToPersonId?: string;
  estimatedDurationMinutes?: number;
  priority?: MaintenancePriority;
  instructions?: string;
}

export class MaintenanceScheduleFactory {
  private options: MaintenanceScheduleFactoryOptions;

  constructor(options: MaintenanceScheduleFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.MaintenanceScheduleCreateInput {
    const {
      assetId,
      title,
      description,
      scheduleType,
      intervalValue = 1,
      startDate,
      nextDueDate,
      isActive = true,
      assignedToPersonId,
      estimatedDurationMinutes,
      priority = MaintenancePriority.MEDIUM,
      instructions,
    } = this.options;

    const data = {
      ...requireConnect(assetId, "asset"),
      title,
      description,
      scheduleType,
      intervalValue,
      startDate,
      nextDueDate,
      isActive,
      ...optionalConnect(assignedToPersonId, "assignedTo"),
      estimatedDurationMinutes,
      priority,
      instructions,
    } satisfies Prisma.MaintenanceScheduleCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.maintenanceSchedule.create({
      data: this.build(),
    });
  }

  /**
   * Create recurring maintenance schedule
   */
  static createRecurring(
    assetId: string,
    assetName: string,
    type:
      | "PREVENTIVE"
      | "INSPECTION"
      | "CLEANING"
      | "CALIBRATION"
      | "UPGRADE"
      | "OTHER",
    frequency:
      | "DAILY"
      | "WEEKLY"
      | "MONTHLY"
      | "QUARTERLY"
      | "ANNUALLY"
      | "CUSTOM",
    durationMinutes: number,
    assignedToPersonId?: string,
    options?: { customIntervalDays?: number; priority?: MaintenancePriority },
  ): MaintenanceScheduleFactory {
    const startDate = new Date(); // Schedules begin now

    type MaintenanceFrequency =
      | "DAILY"
      | "WEEKLY"
      | "MONTHLY"
      | "QUARTERLY"
      | "ANNUALLY"
      | "CUSTOM";

    const scheduleTypeMap: Record<MaintenanceFrequency, ScheduleType> = {
      DAILY: ScheduleType.CUSTOM,
      WEEKLY: ScheduleType.WEEKLY,
      MONTHLY: ScheduleType.MONTHLY,
      QUARTERLY: ScheduleType.QUARTERLY,
      ANNUALLY: ScheduleType.YEARLY,
      CUSTOM: ScheduleType.CUSTOM,
    };

    const scheduleType = scheduleTypeMap[frequency as MaintenanceFrequency];

    const intervalValueMap: Record<MaintenanceFrequency, number> = {
      DAILY: 1,
      WEEKLY: 1,
      MONTHLY: 1,
      QUARTERLY: 1,
      ANNUALLY: 1,
      CUSTOM: options?.customIntervalDays ?? 60,
    };

    const intervalValue = intervalValueMap[frequency as MaintenanceFrequency];
    const nextDueDate = calculateNextDueDate(
      startDate,
      scheduleType,
      intervalValue,
    );

    return new MaintenanceScheduleFactory({
      assetId,
      title: `${type} Maintenance - ${assetName}`,
      description: `Recurring ${frequency.toLowerCase()} ${type.toLowerCase()} maintenance`,
      scheduleType,
      intervalValue,
      startDate,
      nextDueDate,
      estimatedDurationMinutes: durationMinutes,
      assignedToPersonId,
      priority: options?.priority ?? MaintenancePriority.MEDIUM,
    });
  }
}
