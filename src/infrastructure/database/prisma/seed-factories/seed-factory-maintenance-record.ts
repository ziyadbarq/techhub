/**
 * Maintenance Record Factory
 *
 * Type-safe factory for generating MaintenanceRecord test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";
import {
  getRelativeDate,
  optionalConnect,
  randomInt,
  requireConnect,
} from "../seed-utils.js";

export interface MaintenanceRecordFactoryOptions {
  assetId: string;
  maintenanceScheduleId?: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  completedDate?: Date | null;
  performedByPersonId?: string;
  status: MaintenanceStatus;
  notes?: string;
  cost?: number;
  partsUsed?: string[];
  nextMaintenanceDate?: Date | null;
}

export class MaintenanceRecordFactory {
  private options: MaintenanceRecordFactoryOptions;

  constructor(options: MaintenanceRecordFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.MaintenanceRecordCreateInput {
    const {
      assetId,
      maintenanceScheduleId,
      title,
      description,
      scheduledDate,
      completedDate,
      performedByPersonId,
      status,
      notes,
      cost,
      partsUsed,
      nextMaintenanceDate,
    } = this.options;

    const data = {
      ...requireConnect(assetId, "asset"),
      ...optionalConnect(maintenanceScheduleId, "maintenanceSchedule"),
      title,
      description,
      scheduledDate,
      completedDate,
      ...optionalConnect(performedByPersonId, "performedBy"),
      status,
      notes,
      cost,
      partsUsed,
      nextMaintenanceDate,
    } satisfies Prisma.MaintenanceRecordCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.maintenanceRecord.create({
      data: this.build(),
    });
  }

  /**
   * Create completed maintenance record
   */
  static createCompleted(
    assetId: string,
    assetName: string,
    type:
      | "PREVENTIVE"
      | "CORRECTIVE"
      | "INSPECTION"
      | "CLEANING"
      | "CALIBRATION"
      | "UPGRADE"
      | "UPDATE"
      | "OTHER",
    performedByPersonId: string,
    daysAgo: number,
  ): MaintenanceRecordFactory {
    const scheduledDate = getRelativeDate(-daysAgo - 2);
    const completedDate = getRelativeDate(-daysAgo);

    return new MaintenanceRecordFactory({
      assetId,
      title: `${type} Maintenance - ${assetName}`,
      description: `Completed ${type.toLowerCase()} maintenance`,
      scheduledDate,
      completedDate,
      performedByPersonId,
      status: MaintenanceStatus.COMPLETED,
      notes: "All tasks completed successfully",
      cost: randomInt(150, 750),
      partsUsed: [`${type} kit`, "Consumables"],
      nextMaintenanceDate: getRelativeDate(30),
    });
  }

  /**
   * Create scheduled maintenance record
   */
  static createScheduled(
    assetId: string,
    assetName: string,
    type:
      | "PREVENTIVE"
      | "CORRECTIVE"
      | "INSPECTION"
      | "CLEANING"
      | "CALIBRATION"
      | "UPGRADE"
      | "UPDATE"
      | "OTHER",
    performedByPersonId: string,
    daysFromNow: number,
  ): MaintenanceRecordFactory {
    return new MaintenanceRecordFactory({
      assetId,
      title: `Scheduled ${type} - ${assetName}`,
      description: `Upcoming ${type.toLowerCase()} maintenance`,
      scheduledDate: getRelativeDate(daysFromNow),
      performedByPersonId,
      status: MaintenanceStatus.SCHEDULED,
      notes: "Scheduled via maintenance plan",
    });
  }
}
