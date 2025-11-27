/**
 * Prisma Intune Device Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  IntuneDevice as PrismaIntuneDevice,
  IntuneComplianceHistory as PrismaIntuneComplianceHistory,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IIntuneDeviceRepository,
  IIntuneComplianceHistoryRepository,
  ComplianceStats,
  OwnershipStats,
  LinkStats,
  IntuneDeviceFilters,
  PaginationOptions,
} from "@/core/repositories/intune-device.repository.interface";
import {
  IntuneDevice,
  type IntuneComplianceState,
  type IntuneManagementState,
  type IntuneDeviceOwnershipType,
  type AssetLinkMethod,
  type PersonLinkMethod,
} from "@/core/domain/entities/intune-device.entity";
import { IntuneComplianceHistory } from "@/core/domain/entities/intune-compliance-history.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaIntuneDeviceRepository implements IIntuneDeviceRepository {
  private readonly logger = createRepositoryLogger("IntuneDeviceRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  // ==========================================
  // CRUD Operations
  // ==========================================

  async create(device: IntuneDevice): Promise<IntuneDevice> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.intuneDevice.create({
        data: {
          intuneDeviceId: device.intuneDeviceId,
          azureAdDeviceId: device.azureAdDeviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          manufacturer: device.manufacturer,
          model: device.model,
          operatingSystem: device.operatingSystem,
          osVersion: device.osVersion,
          imei: device.imei,
          wiFiMacAddress: device.wiFiMacAddress,
          ethernetMacAddress: device.ethernetMacAddress,
          intuneUserId: device.intuneUserId,
          userPrincipalName: device.userPrincipalName,
          userDisplayName: device.userDisplayName,
          ownershipType: device.ownershipType,
          complianceState: device.complianceState,
          managementState: device.managementState,
          isEncrypted: device.isEncrypted,
          isSupervised: device.isSupervised,
          isJailBroken: device.isJailBroken,
          enrolledDateTime: device.enrolledDateTime,
          lastSyncDateTime: device.lastSyncDateTime,
          linkedAssetId: device.linkedAssetId,
          linkedPersonId: device.linkedPersonId,
          assetLinkMethod: device.assetLinkMethod,
          assetLinkedAt: device.assetLinkedAt,
          personLinkMethod: device.personLinkMethod,
          personLinkedAt: device.personLinkedAt,
          lastSyncedFromIntune: device.lastSyncedFromIntune,
          isActive: device.isActive,
        },
      });

      this.logger.timed("create", "Intune Device created", timer(), {
        id: created.id,
        intuneDeviceId: created.intuneDeviceId,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create Intune device", error);
      throw error;
    }
  }

  async findById(id: string): Promise<IntuneDevice | null> {
    const device = await this.prisma.intuneDevice.findUnique({
      where: { id },
    });

    return device ? this.toDomain(device) : null;
  }

  async findByIntuneDeviceId(
    intuneDeviceId: string,
  ): Promise<IntuneDevice | null> {
    const device = await this.prisma.intuneDevice.findUnique({
      where: { intuneDeviceId },
    });

    return device ? this.toDomain(device) : null;
  }

  async findByAzureAdDeviceId(
    azureAdDeviceId: string,
  ): Promise<IntuneDevice | null> {
    const device = await this.prisma.intuneDevice.findUnique({
      where: { azureAdDeviceId },
    });

    return device ? this.toDomain(device) : null;
  }

  async findBySerialNumber(serialNumber: string): Promise<IntuneDevice | null> {
    const device = await this.prisma.intuneDevice.findFirst({
      where: {
        serialNumber: {
          equals: serialNumber,
          mode: "insensitive",
        },
      },
    });

    return device ? this.toDomain(device) : null;
  }

  async findAll(
    filters?: IntuneDeviceFilters,
    pagination?: PaginationOptions,
  ): Promise<IntuneDevice[]> {
    const where = this.buildWhereClause(filters);

    const devices = await this.prisma.intuneDevice.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async count(filters?: IntuneDeviceFilters): Promise<number> {
    const where = this.buildWhereClause(filters);

    return this.prisma.intuneDevice.count({ where });
  }

  async update(device: IntuneDevice): Promise<IntuneDevice> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.intuneDevice.update({
        where: { id: device.id },
        data: {
          // Include intuneDeviceId for re-enrollment scenarios
          intuneDeviceId: device.intuneDeviceId,
          azureAdDeviceId: device.azureAdDeviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          manufacturer: device.manufacturer,
          model: device.model,
          operatingSystem: device.operatingSystem,
          osVersion: device.osVersion,
          imei: device.imei,
          wiFiMacAddress: device.wiFiMacAddress,
          ethernetMacAddress: device.ethernetMacAddress,
          intuneUserId: device.intuneUserId,
          userPrincipalName: device.userPrincipalName,
          userDisplayName: device.userDisplayName,
          ownershipType: device.ownershipType,
          complianceState: device.complianceState,
          managementState: device.managementState,
          isEncrypted: device.isEncrypted,
          isSupervised: device.isSupervised,
          isJailBroken: device.isJailBroken,
          enrolledDateTime: device.enrolledDateTime,
          lastSyncDateTime: device.lastSyncDateTime,
          linkedAssetId: device.linkedAssetId,
          linkedPersonId: device.linkedPersonId,
          assetLinkMethod: device.assetLinkMethod,
          assetLinkedAt: device.assetLinkedAt,
          personLinkMethod: device.personLinkMethod,
          personLinkedAt: device.personLinkedAt,
          lastSyncedFromIntune: device.lastSyncedFromIntune,
          isActive: device.isActive,
          updatedAt: device.updatedAt,
        },
      });

      this.logger.timed("update", "Intune Device updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update Intune device", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.intuneDevice.delete({
        where: { id },
      });

      this.logger.timed("delete", "Intune Device deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete Intune device", error);
      throw error;
    }
  }

  async bulkUpsert(devices: IntuneDevice[]): Promise<IntuneDevice[]> {
    const timer = this.logger.startTimer();

    try {
      const results: IntuneDevice[] = [];

      // Use transaction for bulk operations
      await this.prisma.$transaction(async (tx) => {
        for (const device of devices) {
          const upserted = await tx.intuneDevice.upsert({
            where: { intuneDeviceId: device.intuneDeviceId },
            create: {
              intuneDeviceId: device.intuneDeviceId,
              azureAdDeviceId: device.azureAdDeviceId,
              deviceName: device.deviceName,
              serialNumber: device.serialNumber,
              manufacturer: device.manufacturer,
              model: device.model,
              operatingSystem: device.operatingSystem,
              osVersion: device.osVersion,
              imei: device.imei,
              wiFiMacAddress: device.wiFiMacAddress,
              ethernetMacAddress: device.ethernetMacAddress,
              intuneUserId: device.intuneUserId,
              userPrincipalName: device.userPrincipalName,
              userDisplayName: device.userDisplayName,
              ownershipType: device.ownershipType,
              complianceState: device.complianceState,
              managementState: device.managementState,
              isEncrypted: device.isEncrypted,
              isSupervised: device.isSupervised,
              isJailBroken: device.isJailBroken,
              enrolledDateTime: device.enrolledDateTime,
              lastSyncDateTime: device.lastSyncDateTime,
              lastSyncedFromIntune: device.lastSyncedFromIntune,
              isActive: device.isActive,
            },
            update: {
              azureAdDeviceId: device.azureAdDeviceId,
              deviceName: device.deviceName,
              serialNumber: device.serialNumber,
              manufacturer: device.manufacturer,
              model: device.model,
              operatingSystem: device.operatingSystem,
              osVersion: device.osVersion,
              imei: device.imei,
              wiFiMacAddress: device.wiFiMacAddress,
              ethernetMacAddress: device.ethernetMacAddress,
              intuneUserId: device.intuneUserId,
              userPrincipalName: device.userPrincipalName,
              userDisplayName: device.userDisplayName,
              ownershipType: device.ownershipType,
              complianceState: device.complianceState,
              managementState: device.managementState,
              isEncrypted: device.isEncrypted,
              isSupervised: device.isSupervised,
              isJailBroken: device.isJailBroken,
              enrolledDateTime: device.enrolledDateTime,
              lastSyncDateTime: device.lastSyncDateTime,
              lastSyncedFromIntune: device.lastSyncedFromIntune,
              isActive: device.isActive,
            },
          });
          results.push(this.toDomain(upserted));
        }
      });

      this.logger.timed("bulkUpsert", "Bulk upsert completed", timer(), {
        count: results.length,
      });
      return results;
    } catch (error) {
      this.logger.error("bulkUpsert", "Failed to bulk upsert devices", error);
      throw error;
    }
  }

  // ==========================================
  // Query Operations
  // ==========================================

  async findByLinkedAsset(assetId: string): Promise<IntuneDevice | null> {
    const device = await this.prisma.intuneDevice.findUnique({
      where: { linkedAssetId: assetId },
    });

    return device ? this.toDomain(device) : null;
  }

  async findByLinkedPerson(personId: string): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: { linkedPersonId: personId },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findByIntuneUserId(intuneUserId: string): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: { intuneUserId },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findByComplianceState(
    state: IntuneComplianceState,
  ): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: { complianceState: state, isActive: true },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findByOperatingSystem(os: string): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: {
        operatingSystem: { contains: os, mode: "insensitive" },
        isActive: true,
      },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  // ==========================================
  // Reconciliation Operations
  // ==========================================

  async findUnlinkedFromAssets(): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: {
        linkedAssetId: null,
        isActive: true,
        serialNumber: { not: null },
      },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findUnlinkedFromPersons(): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: {
        linkedPersonId: null,
        isActive: true,
        intuneUserId: { not: null },
      },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findNonCompliant(): Promise<IntuneDevice[]> {
    const devices = await this.prisma.intuneDevice.findMany({
      where: {
        complianceState: "NON_COMPLIANT",
        isActive: true,
      },
      orderBy: { deviceName: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async findStaleDevices(days: number): Promise<IntuneDevice[]> {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - days);

    const devices = await this.prisma.intuneDevice.findMany({
      where: {
        lastSyncDateTime: { lt: staleDate },
        isActive: true,
      },
      orderBy: { lastSyncDateTime: "asc" },
    });

    return devices.map((device) => this.toDomain(device));
  }

  async deactivateNotIn(intuneDeviceIds: string[]): Promise<number> {
    const timer = this.logger.startTimer();

    try {
      const result = await this.prisma.intuneDevice.updateMany({
        where: {
          intuneDeviceId: { notIn: intuneDeviceIds },
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.timed("deactivateNotIn", "Devices deactivated", timer(), {
        count: result.count,
      });
      return result.count;
    } catch (error) {
      this.logger.error(
        "deactivateNotIn",
        "Failed to deactivate devices",
        error,
      );
      throw error;
    }
  }

  // ==========================================
  // Statistics Operations
  // ==========================================

  async getComplianceStats(): Promise<ComplianceStats> {
    const counts = await this.prisma.intuneDevice.groupBy({
      by: ["complianceState"],
      where: { isActive: true },
      _count: true,
    });

    const stats: ComplianceStats = {
      total: 0,
      compliant: 0,
      nonCompliant: 0,
      inGracePeriod: 0,
      conflict: 0,
      error: 0,
      configManager: 0,
      unknown: 0,
    };

    for (const count of counts) {
      const value = count._count;
      stats.total += value;

      switch (count.complianceState) {
        case "COMPLIANT":
          stats.compliant = value;
          break;
        case "NON_COMPLIANT":
          stats.nonCompliant = value;
          break;
        case "IN_GRACE_PERIOD":
          stats.inGracePeriod = value;
          break;
        case "CONFLICT":
          stats.conflict = value;
          break;
        case "ERROR":
          stats.error = value;
          break;
        case "CONFIG_MANAGER":
          stats.configManager = value;
          break;
        case "UNKNOWN":
          stats.unknown = value;
          break;
      }
    }

    return stats;
  }

  async getOwnershipStats(): Promise<OwnershipStats> {
    const counts = await this.prisma.intuneDevice.groupBy({
      by: ["ownershipType"],
      where: { isActive: true },
      _count: true,
    });

    const stats: OwnershipStats = {
      total: 0,
      corporate: 0,
      personal: 0,
      unknown: 0,
    };

    for (const count of counts) {
      const value = count._count;
      stats.total += value;

      switch (count.ownershipType) {
        case "CORPORATE":
          stats.corporate = value;
          break;
        case "PERSONAL":
          stats.personal = value;
          break;
        case "UNKNOWN":
          stats.unknown = value;
          break;
      }
    }

    return stats;
  }

  async getLinkStats(): Promise<LinkStats> {
    const [total, linkedToAsset, linkedToPerson] = await Promise.all([
      this.prisma.intuneDevice.count({ where: { isActive: true } }),
      this.prisma.intuneDevice.count({
        where: { isActive: true, linkedAssetId: { not: null } },
      }),
      this.prisma.intuneDevice.count({
        where: { isActive: true, linkedPersonId: { not: null } },
      }),
    ]);

    return {
      total,
      linkedToAsset,
      unlinkedFromAsset: total - linkedToAsset,
      linkedToPerson,
      unlinkedFromPerson: total - linkedToPerson,
    };
  }

  async countByOperatingSystem(): Promise<Record<string, number>> {
    const counts = await this.prisma.intuneDevice.groupBy({
      by: ["operatingSystem"],
      where: { isActive: true },
      _count: true,
    });

    const result: Record<string, number> = {};
    for (const count of counts) {
      const os = count.operatingSystem || "Unknown";
      result[os] = count._count;
    }

    return result;
  }

  // ==========================================
  // Existence Checks
  // ==========================================

  async existsByIntuneDeviceId(intuneDeviceId: string): Promise<boolean> {
    const count = await this.prisma.intuneDevice.count({
      where: { intuneDeviceId },
    });

    return count > 0;
  }

  async existsBySerialNumber(serialNumber: string): Promise<boolean> {
    const count = await this.prisma.intuneDevice.count({
      where: {
        serialNumber: { equals: serialNumber, mode: "insensitive" },
      },
    });

    return count > 0;
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private buildWhereClause(filters?: IntuneDeviceFilters) {
    if (!filters) return {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.complianceState) {
      where.complianceState = filters.complianceState;
    }

    if (filters.managementState) {
      where.managementState = filters.managementState;
    }

    if (filters.ownershipType) {
      where.ownershipType = filters.ownershipType;
    }

    if (filters.operatingSystem) {
      where.operatingSystem = {
        contains: filters.operatingSystem,
        mode: "insensitive",
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isLinkedToAsset !== undefined) {
      where.linkedAssetId = filters.isLinkedToAsset ? { not: null } : null;
    }

    if (filters.isLinkedToPerson !== undefined) {
      where.linkedPersonId = filters.isLinkedToPerson ? { not: null } : null;
    }

    if (filters.searchQuery) {
      where.OR = [
        { deviceName: { contains: filters.searchQuery, mode: "insensitive" } },
        {
          serialNumber: { contains: filters.searchQuery, mode: "insensitive" },
        },
        {
          userPrincipalName: {
            contains: filters.searchQuery,
            mode: "insensitive",
          },
        },
        {
          userDisplayName: {
            contains: filters.searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    return where;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaDevice: PrismaIntuneDevice): IntuneDevice {
    return IntuneDevice.reconstitute({
      id: prismaDevice.id,
      intuneDeviceId: prismaDevice.intuneDeviceId,
      azureAdDeviceId: prismaDevice.azureAdDeviceId,
      deviceName: prismaDevice.deviceName,
      serialNumber: prismaDevice.serialNumber,
      manufacturer: prismaDevice.manufacturer,
      model: prismaDevice.model,
      operatingSystem: prismaDevice.operatingSystem,
      osVersion: prismaDevice.osVersion,
      imei: prismaDevice.imei,
      wiFiMacAddress: prismaDevice.wiFiMacAddress,
      ethernetMacAddress: prismaDevice.ethernetMacAddress,
      intuneUserId: prismaDevice.intuneUserId,
      userPrincipalName: prismaDevice.userPrincipalName,
      userDisplayName: prismaDevice.userDisplayName,
      ownershipType: prismaDevice.ownershipType as IntuneDeviceOwnershipType,
      complianceState: prismaDevice.complianceState as IntuneComplianceState,
      managementState: prismaDevice.managementState as IntuneManagementState,
      isEncrypted: prismaDevice.isEncrypted,
      isSupervised: prismaDevice.isSupervised,
      isJailBroken: prismaDevice.isJailBroken,
      enrolledDateTime: prismaDevice.enrolledDateTime,
      lastSyncDateTime: prismaDevice.lastSyncDateTime,
      linkedAssetId: prismaDevice.linkedAssetId,
      linkedPersonId: prismaDevice.linkedPersonId,
      assetLinkMethod: prismaDevice.assetLinkMethod as AssetLinkMethod | null,
      assetLinkedAt: prismaDevice.assetLinkedAt,
      personLinkMethod:
        prismaDevice.personLinkMethod as PersonLinkMethod | null,
      personLinkedAt: prismaDevice.personLinkedAt,
      lastSyncedFromIntune: prismaDevice.lastSyncedFromIntune,
      isActive: prismaDevice.isActive,
      createdAt: prismaDevice.createdAt,
      updatedAt: prismaDevice.updatedAt,
    });
  }
}

@injectable()
export class PrismaIntuneComplianceHistoryRepository
  implements IIntuneComplianceHistoryRepository
{
  private readonly logger = createRepositoryLogger(
    "IntuneComplianceHistoryRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    history: IntuneComplianceHistory,
  ): Promise<IntuneComplianceHistory> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.intuneComplianceHistory.create({
        data: {
          intuneDeviceId: history.intuneDeviceId,
          previousState: history.previousState,
          newState: history.newState,
          changedAt: history.changedAt,
          policyName: history.policyName,
          policyId: history.policyId,
          reason: history.reason,
        },
      });

      this.logger.timed("create", "Compliance history entry created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create compliance history entry",
        error,
      );
      throw error;
    }
  }

  async findByDeviceId(
    intuneDeviceId: string,
    pagination?: PaginationOptions,
  ): Promise<IntuneComplianceHistory[]> {
    const entries = await this.prisma.intuneComplianceHistory.findMany({
      where: { intuneDeviceId },
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { changedAt: "desc" },
    });

    return entries.map((entry) => this.toDomain(entry));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions,
  ): Promise<IntuneComplianceHistory[]> {
    const entries = await this.prisma.intuneComplianceHistory.findMany({
      where: {
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { changedAt: "desc" },
    });

    return entries.map((entry) => this.toDomain(entry));
  }

  async findRecentNonCompliantTransitions(
    since: Date,
  ): Promise<IntuneComplianceHistory[]> {
    const entries = await this.prisma.intuneComplianceHistory.findMany({
      where: {
        newState: "NON_COMPLIANT",
        changedAt: { gte: since },
      },
      orderBy: { changedAt: "desc" },
    });

    return entries.map((entry) => this.toDomain(entry));
  }

  async countByDeviceId(intuneDeviceId: string): Promise<number> {
    return this.prisma.intuneComplianceHistory.count({
      where: { intuneDeviceId },
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const timer = this.logger.startTimer();

    try {
      const result = await this.prisma.intuneComplianceHistory.deleteMany({
        where: { changedAt: { lt: date } },
      });

      this.logger.timed(
        "deleteOlderThan",
        "Old compliance history deleted",
        timer(),
        { count: result.count },
      );
      return result.count;
    } catch (error) {
      this.logger.error(
        "deleteOlderThan",
        "Failed to delete old compliance history",
        error,
      );
      throw error;
    }
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(
    prismaHistory: PrismaIntuneComplianceHistory,
  ): IntuneComplianceHistory {
    return IntuneComplianceHistory.reconstitute({
      id: prismaHistory.id,
      intuneDeviceId: prismaHistory.intuneDeviceId,
      previousState: prismaHistory.previousState as IntuneComplianceState,
      newState: prismaHistory.newState as IntuneComplianceState,
      changedAt: prismaHistory.changedAt,
      policyName: prismaHistory.policyName,
      policyId: prismaHistory.policyId,
      reason: prismaHistory.reason,
    });
  }
}
