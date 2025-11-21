/**
 * Seed Data Factories
 *
 * Type-safe factories for generating realistic test data.
 * Uses builder pattern for flexibility and DRY principles.
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import type { WarrantyCoverageType } from "@/generated/prisma/enums";
import { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";
import { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";
import {
  ScheduleType,
  calculateNextDueDate,
} from "@/core/domain/value-objects/schedule-type";
import {
  generateAssetTag,
  generateSerialNumber,
  generateSequentialCode,
  getRelativeDate,
  getRelativeDateByYears,
  randomInt,
  optionalConnect,
  requireConnect,
} from "./seed-utils.js";

// ==============================================
// Asset Factory
// ==============================================

export interface AssetFactoryOptions {
  assetCategoryId: string;
  assetModelId?: string;
  vendorId?: string;
  assetTag?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currency?: string;
  lifecycleStateId?: string;
  condition?: string;
  currentStockLocationId?: string;
  note?: string;
}

export class AssetFactory {
  private options: AssetFactoryOptions;

  constructor(options: AssetFactoryOptions) {
    this.options = options;
  }

  /**
   * Generate asset data for Prisma create
   */
  build(): Prisma.AssetCreateInput {
    const {
      assetCategoryId,
      assetModelId,
      vendorId,
      assetTag,
      serialNumber,
      purchaseDate,
      purchaseCost,
      currency,
      lifecycleStateId,
      condition,
      currentStockLocationId,
      note,
    } = this.options;

    const data = {
      ...requireConnect(assetCategoryId, "assetCategory"),
      ...optionalConnect(assetModelId, "assetModel"),
      ...optionalConnect(vendorId, "vendor"),
      assetTag: assetTag ?? generateAssetTag("ASSET", Date.now()),
      serialNumber,
      purchaseDate: purchaseDate ?? getRelativeDateByYears(-1),
      purchaseCost,
      currency: currency ?? "SAR",
      ...optionalConnect(lifecycleStateId, "lifecycleState"),
      condition,
      ...optionalConnect(currentStockLocationId, "currentStockLocation"),
      note,
    } satisfies Prisma.AssetCreateInput;

    return data;
  }

  /**
   * Create asset in database
   */
  async create(prisma: PrismaClient) {
    return prisma.asset.create({
      data: this.build(),
    });
  }

  /**
   * Create multiple assets with sequential numbering
   */
  static async createBatch(
    prisma: PrismaClient,
    options: Omit<AssetFactoryOptions, "assetTag" | "serialNumber">,
    count: number,
    categoryCode: string,
  ) {
    const assets = [];
    for (let i = 1; i <= count; i++) {
      const factory = new AssetFactory({
        ...options,
        assetTag: generateAssetTag(categoryCode, i),
        serialNumber: generateSerialNumber(
          categoryCode,
          new Date().getFullYear(),
          i,
        ),
      });
      assets.push(await factory.create(prisma));
    }
    return assets;
  }
}

// ==============================================
// Warranty Factory
// ==============================================

export interface WarrantyFactoryOptions {
  assetId: string;
  vendorId?: string;
  coverageType: WarrantyCoverageType;
  coverageDetails?: string;
  policyReference?: string;
  slaDetails?: Prisma.InputJsonValue;
  startDate: Date;
  endDate: Date;
  cost?: number;
  currency?: string;
  note?: string;
}

export class WarrantyFactory {
  private options: WarrantyFactoryOptions;

  constructor(options: WarrantyFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.WarrantyCreateInput {
    const {
      assetId,
      vendorId,
      coverageType,
      coverageDetails,
      policyReference,
      slaDetails,
      startDate,
      endDate,
      cost,
      currency,
      note,
    } = this.options;

    const data = {
      ...requireConnect(assetId, "asset"),
      ...optionalConnect(vendorId, "vendor"),
      coverageType,
      coverageDetails,
      policyReference,
      slaDetails,
      startDate,
      endDate,
      cost,
      currency,
      note,
    } satisfies Prisma.WarrantyCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.warranty.create({
      data: this.build(),
    });
  }

  /**
   * Create warranty with standard duration
   */
  static fromAsset(
    asset: { id: string; purchaseDate: Date | null },
    warrantyMonths: number,
    provider: string,
    type: WarrantyCoverageType,
    sequenceNumber: number,
  ): WarrantyFactory {
    const purchaseDate = asset.purchaseDate ?? new Date();
    const startDate = new Date(purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setMonth(endDate.getMonth() + warrantyMonths);

    return new WarrantyFactory({
      assetId: asset.id,
      coverageType: type,
      policyReference: generateSequentialCode(`WTY-${type}`, sequenceNumber),
      startDate,
      endDate,
      coverageDetails: `${warrantyMonths}-month ${type.toLowerCase()} warranty from ${provider}`,
      note:
        type === "EXTENDED"
          ? "Premium support included"
          : "Standard terms apply",
    });
  }
}

// ==============================================
// Maintenance Schedule Factory
// ==============================================

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

// ==============================================
// Maintenance Record Factory
// ==============================================

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

// ==============================================
// Asset Disposal Factory
// ==============================================

export interface AssetDisposalFactoryOptions {
  assetId: string;
  disposalType: "DONATION" | "SALE" | "RECYCLING" | "DESTRUCTION" | "OTHER";
  reason?: string;
  initiatedById: string;
  approvedById?: string;
  approvedAt?: Date;
  disposalDate?: Date;
  estimatedValue?: number;
  actualProceeds?: number;
  currency?: string;
  status:
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  sanitizationChecklist?: Prisma.InputJsonValue;
  certificateNumber?: string;
  certificateIssuedAt?: Date;
  disposalVendorId?: string;
  recipientInfo?: string;
  note?: string;
}

export class AssetDisposalFactory {
  private options: AssetDisposalFactoryOptions;

  constructor(options: AssetDisposalFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetDisposalCreateInput {
    const data = {
      ...requireConnect(this.options.assetId, "asset"),
      ...requireConnect(this.options.initiatedById, "initiatedBy"),
      ...optionalConnect(this.options.approvedById, "approvedBy"),
      ...optionalConnect(this.options.disposalVendorId, "disposalVendor"),
      disposalType: this.options.disposalType,
      reason: this.options.reason,
      approvedAt: this.options.approvedAt,
      disposalDate: this.options.disposalDate,
      estimatedValue: this.options.estimatedValue,
      actualProceeds: this.options.actualProceeds,
      currency: this.options.currency,
      status: this.options.status,
      sanitizationChecklist: this.options.sanitizationChecklist,
      certificateNumber: this.options.certificateNumber,
      certificateIssuedAt: this.options.certificateIssuedAt,
      recipientInfo: this.options.recipientInfo,
      note: this.options.note,
    } satisfies Prisma.AssetDisposalCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetDisposal.create({
      data: this.build(),
    });
  }
}

// ==============================================
// Asset Kit Factory
// ==============================================

export interface AssetKitFactoryOptions {
  name: string;
  code: string;
  description: string;
  kitType:
    | "NEW_HIRE"
    | "CONTRACTOR"
    | "EXECUTIVE"
    | "PROJECT"
    | "TEMPORARY"
    | "OTHER";
  isActive?: boolean;
  metadata?: Prisma.InputJsonValue;
}

export class AssetKitFactory {
  private options: AssetKitFactoryOptions;

  constructor(options: AssetKitFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetKitCreateInput {
    const data = {
      name: this.options.name,
      code: this.options.code,
      description: this.options.description,
      kitType: this.options.kitType,
      isActive: this.options.isActive ?? true,
      metadata: this.options.metadata,
    } satisfies Prisma.AssetKitCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetKit.create({
      data: this.build(),
    });
  }

  /**
   * Create kit with predefined items
   */
  static async createWithItems(
    prisma: PrismaClient,
    kitOptions: AssetKitFactoryOptions,
    items: Array<{
      assetCategoryId?: string;
      assetModelId?: string;
      quantity: number;
      isRequired?: boolean;
      note?: string;
    }>,
  ) {
    const kit = await new AssetKitFactory(kitOptions).create(prisma);

    for (const item of items) {
      await prisma.assetKitItem.create({
        data: {
          assetKitId: kit.id,
          assetCategoryId: item.assetCategoryId,
          assetModelId: item.assetModelId,
          quantity: item.quantity,
          isRequired: item.isRequired ?? true,
          note: item.note,
        },
      });
    }

    return kit;
  }
}

// ==============================================
// Asset Reservation Factory
// ==============================================

export interface AssetReservationFactoryOptions {
  assetId: string;
  reservedForPersonId?: string;
  reservedForOrgUnitId?: string;
  reservedById: string;
  startDate: Date;
  endDate: Date;
  purpose?: string;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  note?: string;
  confirmedById?: string;
  confirmationDate?: Date;
}

export class AssetReservationFactory {
  private options: AssetReservationFactoryOptions;

  constructor(options: AssetReservationFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetReservationCreateInput {
    const data = {
      ...requireConnect(this.options.assetId, "asset"),
      ...requireConnect(this.options.reservedById, "reservedBy"),
      ...optionalConnect(this.options.reservedForPersonId, "reservedForPerson"),
      ...optionalConnect(
        this.options.reservedForOrgUnitId,
        "reservedForOrgUnit",
      ),
      ...optionalConnect(this.options.confirmedById, "confirmedBy"),
      startDate: this.options.startDate,
      endDate: this.options.endDate,
      purpose: this.options.purpose,
      status: this.options.status,
      note: this.options.note,
      confirmationDate: this.options.confirmationDate,
    } satisfies Prisma.AssetReservationCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetReservation.create({
      data: this.build(),
    });
  }

  /**
   * Create future reservation
   */
  static createFuture(
    assetId: string,
    reservedById: string,
    reservedForPersonId: string,
    startDaysFromNow: number,
    durationDays: number,
    purpose: string,
  ): AssetReservationFactory {
    return new AssetReservationFactory({
      assetId,
      reservedById,
      reservedForPersonId,
      startDate: getRelativeDate(startDaysFromNow),
      endDate: getRelativeDate(startDaysFromNow + durationDays),
      purpose,
      status: "CONFIRMED",
    });
  }
}

// ==============================================
// Configuration Item Factory
// ==============================================

export interface ConfigurationItemFactoryOptions {
  name: string;
  ciClassId: string;
  lifecycleStateId?: string;
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  environment?: "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER";
  primaryOwnerPersonId?: string;
  primaryOwnerOrgUnitId?: string;
  locationId?: string;
  linkedAssetId?: string;
  ciKey?: string;
  description?: string;
  attributes?: Prisma.InputJsonValue;
}

export class ConfigurationItemFactory {
  private options: ConfigurationItemFactoryOptions;

  constructor(options: ConfigurationItemFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.ConfigurationItemCreateInput {
    const data = {
      name: this.options.name,
      ...requireConnect(this.options.ciClassId, "ciClass"),
      ...optionalConnect(this.options.lifecycleStateId, "lifecycleState"),
      criticality: this.options.criticality,
      environment: this.options.environment,
      ...optionalConnect(
        this.options.primaryOwnerPersonId,
        "primaryOwnerPerson",
      ),
      ...optionalConnect(
        this.options.primaryOwnerOrgUnitId,
        "primaryOwnerOrgUnit",
      ),
      ...optionalConnect(this.options.locationId, "location"),
      ...optionalConnect(this.options.linkedAssetId, "linkedAsset"),
      ciKey: this.options.ciKey,
      description: this.options.description,
      attributes: this.options.attributes,
    } satisfies Prisma.ConfigurationItemCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.configurationItem.create({
      data: this.build(),
    });
  }
}

// ==============================================
// Export all factories
// ==============================================

export const factories = {
  Asset: AssetFactory,
  Warranty: WarrantyFactory,
  MaintenanceSchedule: MaintenanceScheduleFactory,
  MaintenanceRecord: MaintenanceRecordFactory,
  AssetDisposal: AssetDisposalFactory,
  AssetKit: AssetKitFactory,
  AssetReservation: AssetReservationFactory,
  ConfigurationItem: ConfigurationItemFactory,
};
