/**
 * Person Details Controller
 * Server actions for the Person detail page (360-degree view)
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  presentEmployeeDirectory,
  type EmployeeDirectoryDTO,
} from "../presenters/employee-directory.presenter";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import {
  presentIntuneDevices,
  type IntuneDeviceDTO,
} from "@/interface-adapters/presenters/intune-device.presenter";
import { hasPermission, requirePermission } from "@/lib/permissions/server";
import { isFeatureEnabled, requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { PrismaClient } from "@/generated/prisma/server";

/**
 * Counts of related entities for person detail tabs
 */
export interface PersonRelationCounts {
  directReports: number;
  roleAssignments: number;
  intuneDevices: number;
  licenseAllocations: number;
  // Assets & Inventory
  assetReservations: number;
  kitCheckouts: number;
  stockMovements: number;
  maintenanceSchedules: number;
  // Services & CMDB
  serviceOwnerships: number;
  configurationItems: number;
  dataOwnerships: number;
  // Governance
  verificationCampaigns: number;
  verificationItems: number;
  attachments: number;
  // Disposals
  initiatedDisposals: number;
  approvedDisposals: number;
}

/**
 * Lightweight DTOs for related data rendered in tabs
 */
export interface PersonLicenseAllocationDTO {
  id: string;
  licenseProductName: string | null;
  allocatedQuantity: number;
  allocatedAt: string;
  deallocatedAt: string | null;
}

export interface PersonAssetReservationDTO {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  purpose: string | null;
  assetId: string;
  assetTag: string;
  assetName: string | null;
}

export interface PersonKitCheckoutDTO {
  id: string;
  status: string;
  checkoutDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  note: string | null;
  kitId: string;
  kitName: string;
}

export interface PersonMaintenanceScheduleDTO {
  id: string;
  title: string;
  priority: string;
  nextDueDate: string;
  scheduleType: string;
  assetId: string;
  assetTag: string;
}

export interface PersonStockMovementDTO {
  id: string;
  movementType: string;
  occurredAt: string;
  quantity: number;
  assetId: string | null;
  assetTag: string | null;
  stockLocationFrom: string | null;
  stockLocationTo: string | null;
  status: string;
}

export interface PersonServiceOwnershipDTO {
  id: string;
  serviceId: string;
  serviceName: string;
  ownershipType: string;
  isPrimary: boolean;
  status: string;
  criticality: string;
}

export interface PersonConfigurationItemDTO {
  id: string;
  name: string;
  ciClassName: string | null;
  lifecycleStateName: string | null;
  environment: string | null;
}

export interface PersonDataOwnershipDTO {
  id: string;
  dataDomainName: string;
  note: string | null;
}

export interface PersonVerificationCampaignDTO {
  id: string;
  name: string;
  targetType: string;
  scheduledStart: string;
  scheduledEnd: string | null;
}

export interface PersonVerificationItemDTO {
  id: string;
  status: string;
  verifiedAt: string | null;
  targetType: string;
  campaignName: string;
}

export interface PersonAttachmentDTO {
  id: string;
  fileName: string;
  sizeBytes: number | null;
  uploadedAt: string;
  attachmentType: string;
  targetType: string;
}

export interface PersonDisposalDTO {
  id: string;
  assetTag: string;
  disposalType: string;
  status: string;
  disposalDate: string | null;
  role: "initiated" | "approved";
}

export interface PersonRoleAssignmentSummaryDTO {
  id: string;
  roleName: string;
  scope: string | null;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

export interface PersonAuditLogDTO {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  fieldName: string | null;
  changedAt: string;
  note: string | null;
  sourceSystem: string | null;
}

export interface PersonAuditLogResponse {
  performed: PersonAuditLogDTO[];
  affecting: PersonAuditLogDTO[];
}

/**
 * Get person details with directory relations
 * Used for the person detail page initial load
 */
export async function getPersonDetailsAction(
  id: string,
): Promise<ActionResponse<EmployeeDirectoryDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!id) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    // Use findAllForDirectory with a filter for this specific person
    // This gives us the person with all the directory relations in one query
    const results = await personRepo.findAllForDirectory({
      // No filters - we'll find by ID after
    });

    // Find the specific person in results
    const personWithRelations = results.find((r) => r.person.id === id);

    if (!personWithRelations) {
      return {
        success: false,
        error: "Person not found",
      };
    }

    return {
      success: true,
      data: presentEmployeeDirectory(personWithRelations),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonDetailsAction" },
      "Failed to get person details",
    );
  }
}

/**
 * Get counts of all related entities for a person
 * Used for tab badges and quick stats
 */
export async function getPersonRelationCountsAction(
  personId: string,
): Promise<ActionResponse<PersonRelationCounts>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    // Feature flags for related modules
    const [
      intuneEnabled,
      licensesEnabled,
      assetReservationsEnabled,
      assetKitsEnabled,
      inventoryEnabled,
      maintenanceEnabled,
      servicesEnabled,
      cmdbEnabled,
      governanceEnabled,
      attachmentsEnabled,
      assetDisposalsEnabled,
    ] = await Promise.all([
      isFeatureEnabled("INTUNE"),
      isFeatureEnabled("LICENSES"),
      isFeatureEnabled("ASSET_RESERVATIONS"),
      isFeatureEnabled("ASSET_KITS"),
      isFeatureEnabled("INVENTORY"),
      isFeatureEnabled("MAINTENANCE"),
      isFeatureEnabled("SERVICES"),
      isFeatureEnabled("CMDB"),
      isFeatureEnabled("GOVERNANCE"),
      isFeatureEnabled("ATTACHMENTS"),
      isFeatureEnabled("ASSET_DISPOSALS"),
    ]);

    // Permission checks for related modules
    const [
      canViewRoleAssignments,
      canViewIntune,
      canViewLicenseAllocations,
      canViewAssetReservations,
      canViewAssetKits,
      canViewStockMovements,
      canViewMaintenanceSchedules,
      canViewServices,
      canViewConfigurationItems,
      canViewDataOwnerships,
      canViewVerificationCampaigns,
      canViewVerificationItems,
      canViewAttachments,
      canViewAssetDisposals,
    ] = await Promise.all([
      hasPermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW),
      hasPermission(PERMISSIONS.INTUNE_DEVICES_VIEW),
      hasPermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW),
      hasPermission(PERMISSIONS.ASSET_RESERVATIONS_VIEW),
      hasPermission(PERMISSIONS.ASSET_KITS_VIEW),
      hasPermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW),
      hasPermission(PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW),
      hasPermission(PERMISSIONS.SERVICES_VIEW),
      hasPermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW),
      hasPermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW),
      hasPermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW),
      hasPermission(PERMISSIONS.VERIFICATION_ITEMS_VIEW),
      hasPermission(PERMISSIONS.ATTACHMENTS_VIEW),
      hasPermission(PERMISSIONS.ASSET_DISPOSALS_VIEW),
    ]);

    // Fetch all counts in parallel using Prisma directly for efficiency
    const [
      directReports,
      roleAssignments,
      intuneDevices,
      licenseAllocations,
      assetReservations,
      kitCheckouts,
      stockMovements,
      maintenanceSchedules,
      serviceOwnerships,
      configurationItems,
      dataOwnerships,
      verificationCampaigns,
      verificationItems,
      attachments,
      initiatedDisposals,
      approvedDisposals,
    ] = await Promise.all([
      prisma.person.count({ where: { managerId: personId, isActive: true } }),
      canViewRoleAssignments
        ? prisma.personRoleAssignment.count({
            where: { personId, isActive: true },
          })
        : Promise.resolve(0),
      intuneEnabled && canViewIntune
        ? prisma.intuneDevice.count({ where: { linkedPersonId: personId } })
        : Promise.resolve(0),
      licensesEnabled && canViewLicenseAllocations
        ? prisma.licenseAllocation.count({
            where: { targetType: "PERSON", targetId: personId },
          })
        : Promise.resolve(0),
      assetReservationsEnabled && canViewAssetReservations
        ? prisma.assetReservation.count({
            where: { reservedForPersonId: personId },
          })
        : Promise.resolve(0),
      assetKitsEnabled && canViewAssetKits
        ? prisma.assetKitCheckout.count({ where: { checkedOutById: personId } })
        : Promise.resolve(0),
      inventoryEnabled && canViewStockMovements
        ? prisma.stockMovement.count({ where: { performedById: personId } })
        : Promise.resolve(0),
      maintenanceEnabled && canViewMaintenanceSchedules
        ? prisma.maintenanceSchedule.count({
            where: { assignedToId: personId },
          })
        : Promise.resolve(0),
      servicesEnabled && canViewServices
        ? prisma.serviceOwnership.count({ where: { personId } })
        : Promise.resolve(0),
      cmdbEnabled && canViewConfigurationItems
        ? prisma.configurationItem.count({
            where: { primaryOwnerPersonId: personId },
          })
        : Promise.resolve(0),
      governanceEnabled && canViewDataOwnerships
        ? prisma.dataOwnership.count({ where: { ownerPersonId: personId } })
        : Promise.resolve(0),
      governanceEnabled && canViewVerificationCampaigns
        ? prisma.verificationCampaign.count({
            where: { createdById: personId },
          })
        : Promise.resolve(0),
      governanceEnabled && canViewVerificationItems
        ? prisma.verificationItem.count({
            where: { verifierPersonId: personId },
          })
        : Promise.resolve(0),
      attachmentsEnabled && canViewAttachments
        ? prisma.attachment.count({ where: { uploadedById: personId } })
        : Promise.resolve(0),
      assetDisposalsEnabled && canViewAssetDisposals
        ? prisma.assetDisposal.count({ where: { initiatedById: personId } })
        : Promise.resolve(0),
      assetDisposalsEnabled && canViewAssetDisposals
        ? prisma.assetDisposal.count({ where: { approvedById: personId } })
        : Promise.resolve(0),
    ]);

    return {
      success: true,
      data: {
        directReports,
        roleAssignments,
        intuneDevices,
        licenseAllocations,
        assetReservations,
        kitCheckouts,
        stockMovements,
        maintenanceSchedules,
        serviceOwnerships,
        configurationItems,
        dataOwnerships,
        verificationCampaigns,
        verificationItems,
        attachments,
        initiatedDisposals,
        approvedDisposals,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonRelationCountsAction" },
      "Failed to get person relation counts",
    );
  }
}

/**
 * Get Intune devices linked to a person
 * Used for the Assets tab detail list
 */
export async function getPersonIntuneDevicesAction(
  personId: string,
): Promise<ActionResponse<IntuneDeviceDTO[]>> {
  try {
    await requireFeature("INTUNE");
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const deviceRepo = container.get<IIntuneDeviceRepository>(
      DI_TOKENS.IIntuneDeviceRepository,
    );

    const devices = await deviceRepo.findByLinkedPerson(personId);

    return {
      success: true,
      data: presentIntuneDevices(devices),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonIntuneDevicesAction", personId },
      "Failed to get Intune devices for person",
    );
  }
}

/**
 * Get license allocations for a person
 */
export async function getPersonLicenseAllocationsAction(
  personId: string,
): Promise<ActionResponse<PersonLicenseAllocationDTO[]>> {
  try {
    await requireFeature("LICENSES");
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const allocations = await prisma.licenseAllocation.findMany({
      where: { targetType: "PERSON", targetId: personId },
      orderBy: { allocatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        allocatedQuantity: true,
        allocatedAt: true,
        deallocatedAt: true,
        licenseEntitlement: {
          select: {
            licenseProduct: { select: { name: true } },
          },
        },
      },
    });

    return {
      success: true,
      data: allocations.map((allocation) => ({
        id: allocation.id,
        licenseProductName:
          allocation.licenseEntitlement.licenseProduct?.name ?? null,
        allocatedQuantity: allocation.allocatedQuantity,
        allocatedAt: allocation.allocatedAt.toISOString(),
        deallocatedAt: allocation.deallocatedAt
          ? allocation.deallocatedAt.toISOString()
          : null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonLicenseAllocationsAction", personId },
      "Failed to get license allocations for person",
    );
  }
}

/**
 * Get asset reservations for a person
 */
export async function getPersonAssetReservationsAction(
  personId: string,
): Promise<ActionResponse<PersonAssetReservationDTO[]>> {
  try {
    await requireFeature("ASSET_RESERVATIONS");
    await requirePermission(PERMISSIONS.ASSET_RESERVATIONS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const reservations = await prisma.assetReservation.findMany({
      where: { reservedForPersonId: personId },
      orderBy: { startDate: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        purpose: true,
        asset: {
          select: {
            id: true,
            assetTag: true,
            assetModel: { select: { name: true } },
            assetCategory: { select: { name: true } },
          },
        },
      },
    });

    return {
      success: true,
      data: reservations.map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOString(),
        purpose: reservation.purpose ?? null,
        assetId: reservation.asset.id,
        assetTag: reservation.asset.assetTag,
        assetName:
          reservation.asset.assetModel?.name ??
          reservation.asset.assetCategory?.name ??
          null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonAssetReservationsAction", personId },
      "Failed to get asset reservations for person",
    );
  }
}

/**
 * Get kit checkouts initiated by person
 */
export async function getPersonKitCheckoutsAction(
  personId: string,
): Promise<ActionResponse<PersonKitCheckoutDTO[]>> {
  try {
    await requireFeature("ASSET_KITS");
    await requirePermission(PERMISSIONS.ASSET_KITS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const checkouts = await prisma.assetKitCheckout.findMany({
      where: { checkedOutById: personId },
      orderBy: { checkoutDate: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        checkoutDate: true,
        expectedReturnDate: true,
        actualReturnDate: true,
        note: true,
        assetKit: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: checkouts.map((checkout) => ({
        id: checkout.id,
        status: checkout.status,
        checkoutDate: checkout.checkoutDate.toISOString(),
        expectedReturnDate: checkout.expectedReturnDate
          ? checkout.expectedReturnDate.toISOString()
          : null,
        actualReturnDate: checkout.actualReturnDate
          ? checkout.actualReturnDate.toISOString()
          : null,
        note: checkout.note,
        kitId: checkout.assetKit.id,
        kitName: checkout.assetKit.name,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonKitCheckoutsAction", personId },
      "Failed to get kit checkouts for person",
    );
  }
}

/**
 * Get maintenance schedules assigned to person
 */
export async function getPersonMaintenanceSchedulesAction(
  personId: string,
): Promise<ActionResponse<PersonMaintenanceScheduleDTO[]>> {
  try {
    await requireFeature("MAINTENANCE");
    await requirePermission(PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { assignedToId: personId, deletedAt: null },
      orderBy: { nextDueDate: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        priority: true,
        scheduleType: true,
        nextDueDate: true,
        asset: { select: { id: true, assetTag: true } },
      },
    });

    return {
      success: true,
      data: schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        priority: schedule.priority,
        scheduleType: schedule.scheduleType,
        nextDueDate: schedule.nextDueDate.toISOString(),
        assetId: schedule.asset.id,
        assetTag: schedule.asset.assetTag,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonMaintenanceSchedulesAction", personId },
      "Failed to get maintenance schedules for person",
    );
  }
}

/**
 * Get stock movements performed by person
 */
export async function getPersonStockMovementsAction(
  personId: string,
): Promise<ActionResponse<PersonStockMovementDTO[]>> {
  try {
    await requireFeature("INVENTORY");
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const movements = await prisma.stockMovement.findMany({
      where: { performedById: personId },
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: {
        id: true,
        movementType: true,
        occurredAt: true,
        quantity: true,
        status: true,
        asset: { select: { id: true, assetTag: true } },
        stockLocationFrom: { select: { name: true } },
        stockLocationTo: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: movements.map((movement) => ({
        id: movement.id,
        movementType: movement.movementType,
        occurredAt: movement.occurredAt.toISOString(),
        quantity: movement.quantity,
        status: movement.status,
        assetId: movement.asset?.id ?? null,
        assetTag: movement.asset?.assetTag ?? null,
        stockLocationFrom: movement.stockLocationFrom?.name ?? null,
        stockLocationTo: movement.stockLocationTo?.name ?? null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonStockMovementsAction", personId },
      "Failed to get stock movements for person",
    );
  }
}

/**
 * Get person's direct reports
 * Used for Organization tab
 */
export async function getPersonDirectReportsAction(
  personId: string,
): Promise<ActionResponse<EmployeeDirectoryDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    const directReports =
      await personRepo.findDirectReportsForDirectory(personId);

    return {
      success: true,
      data: directReports.map(presentEmployeeDirectory),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonDirectReportsAction" },
      "Failed to get direct reports",
    );
  }
}

/**
 * Get service ownerships for person
 */
export async function getPersonServiceOwnershipsAction(
  personId: string,
): Promise<ActionResponse<PersonServiceOwnershipDTO[]>> {
  try {
    await requireFeature("SERVICES");
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const ownerships = await prisma.serviceOwnership.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        ownershipType: true,
        isPrimary: true,
        service: {
          select: {
            id: true,
            name: true,
            currentStatus: true,
            criticality: true,
          },
        },
      },
    });

    return {
      success: true,
      data: ownerships.map((ownership) => ({
        id: ownership.id,
        serviceId: ownership.service.id,
        serviceName: ownership.service.name,
        ownershipType: ownership.ownershipType,
        isPrimary: ownership.isPrimary,
        status: ownership.service.currentStatus,
        criticality: ownership.service.criticality,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonServiceOwnershipsAction", personId },
      "Failed to get service ownerships for person",
    );
  }
}

/**
 * Get configuration items owned by person
 */
export async function getPersonConfigurationItemsAction(
  personId: string,
): Promise<ActionResponse<PersonConfigurationItemDTO[]>> {
  try {
    await requireFeature("CMDB");
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const cis = await prisma.configurationItem.findMany({
      where: { primaryOwnerPersonId: personId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        environment: true,
        ciClass: { select: { name: true } },
        lifecycleState: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: cis.map((ci) => ({
        id: ci.id,
        name: ci.name,
        environment: ci.environment,
        ciClassName: ci.ciClass?.name ?? null,
        lifecycleStateName: ci.lifecycleState?.name ?? null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonConfigurationItemsAction", personId },
      "Failed to get configuration items for person",
    );
  }
}

/**
 * Get data ownerships for person
 */
export async function getPersonDataOwnershipsAction(
  personId: string,
): Promise<ActionResponse<PersonDataOwnershipDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const ownerships = await prisma.dataOwnership.findMany({
      where: { ownerPersonId: personId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        note: true,
        dataDomain: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: ownerships.map((ownership) => ({
        id: ownership.id,
        note: ownership.note,
        dataDomainName: ownership.dataDomain.name,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonDataOwnershipsAction", personId },
      "Failed to get data ownerships for person",
    );
  }
}

/**
 * Get verification campaigns created by person
 */
export async function getPersonVerificationCampaignsAction(
  personId: string,
): Promise<ActionResponse<PersonVerificationCampaignDTO[]>> {
  try {
    await requireFeature("GOVERNANCE");
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const campaigns = await prisma.verificationCampaign.findMany({
      where: { createdById: personId },
      orderBy: { scheduledStart: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        targetType: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    return {
      success: true,
      data: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        targetType: campaign.targetType,
        scheduledStart: campaign.scheduledStart.toISOString(),
        scheduledEnd: campaign.scheduledEnd
          ? campaign.scheduledEnd.toISOString()
          : null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonVerificationCampaignsAction", personId },
      "Failed to get verification campaigns for person",
    );
  }
}

/**
 * Get verification items assigned to person
 */
export async function getPersonVerificationItemsAction(
  personId: string,
): Promise<ActionResponse<PersonVerificationItemDTO[]>> {
  try {
    await requireFeature("GOVERNANCE");
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const items = await prisma.verificationItem.findMany({
      where: { verifierPersonId: personId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        verifiedAt: true,
        targetType: true,
        verificationCampaign: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        status: item.status,
        verifiedAt: item.verifiedAt ? item.verifiedAt.toISOString() : null,
        targetType: item.targetType,
        campaignName: item.verificationCampaign.name,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonVerificationItemsAction", personId },
      "Failed to get verification items for person",
    );
  }
}

/**
 * Get attachments uploaded by person
 */
export async function getPersonAttachmentsAction(
  personId: string,
): Promise<ActionResponse<PersonAttachmentDTO[]>> {
  try {
    await requireFeature("ATTACHMENTS");
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const attachments = await prisma.attachment.findMany({
      where: { uploadedById: personId },
      orderBy: { uploadedAt: "desc" },
      take: 10,
      select: {
        id: true,
        fileName: true,
        sizeBytes: true,
        uploadedAt: true,
        targetType: true,
        attachmentType: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        sizeBytes: attachment.sizeBytes ? Number(attachment.sizeBytes) : null,
        uploadedAt: attachment.uploadedAt.toISOString(),
        targetType: attachment.targetType,
        attachmentType: attachment.attachmentType.name,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonAttachmentsAction", personId },
      "Failed to get attachments for person",
    );
  }
}

/**
 * Get disposals initiated or approved by person
 */
export async function getPersonDisposalsAction(
  personId: string,
): Promise<ActionResponse<PersonDisposalDTO[]>> {
  try {
    await requireFeature("ASSET_DISPOSALS");
    await requirePermission(PERMISSIONS.ASSET_DISPOSALS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const [initiated, approved] = await Promise.all([
      prisma.assetDisposal.findMany({
        where: { initiatedById: personId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          disposalType: true,
          status: true,
          disposalDate: true,
          asset: { select: { assetTag: true } },
        },
      }),
      prisma.assetDisposal.findMany({
        where: { approvedById: personId },
        orderBy: { approvedAt: "desc" },
        take: 5,
        select: {
          id: true,
          disposalType: true,
          status: true,
          disposalDate: true,
          asset: { select: { assetTag: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: [
        ...initiated.map<PersonDisposalDTO>((disposal) => ({
          id: disposal.id,
          assetTag: disposal.asset.assetTag,
          disposalType: disposal.disposalType,
          status: disposal.status,
          disposalDate: disposal.disposalDate
            ? disposal.disposalDate.toISOString()
            : null,
          role: "initiated",
        })),
        ...approved.map<PersonDisposalDTO>((disposal) => ({
          id: disposal.id,
          assetTag: disposal.asset.assetTag,
          disposalType: disposal.disposalType,
          status: disposal.status,
          disposalDate: disposal.disposalDate
            ? disposal.disposalDate.toISOString()
            : null,
          role: "approved",
        })),
      ],
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonDisposalsAction", personId },
      "Failed to get disposals for person",
    );
  }
}

/**
 * Get recent audit log entries created by this person
 */
export async function getPersonAuditLogAction(
  personId: string,
): Promise<ActionResponse<PersonAuditLogResponse>> {
  try {
    await requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW);

    if (!personId) {
      return { success: false, error: "Person ID is required" };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const [performed, affecting] = await Promise.all([
      prisma.auditLogEntry.findMany({
        where: { changedById: personId },
        orderBy: { changedAt: "desc" },
        take: 12,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          fieldName: true,
          changedAt: true,
          note: true,
          sourceSystem: true,
        },
      }),
      prisma.auditLogEntry.findMany({
        where: { targetType: "PERSON", targetId: personId },
        orderBy: { changedAt: "desc" },
        take: 12,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          fieldName: true,
          changedAt: true,
          note: true,
          sourceSystem: true,
        },
      }),
    ]);

    const mapLog = (log: {
      id: string;
      targetType: string;
      targetId: string;
      fieldName: string | null;
      changedAt: Date;
      note: string | null;
      sourceSystem: string | null;
    }): PersonAuditLogDTO => ({
      id: log.id,
      action: log.fieldName ? `Changed ${log.fieldName}` : "Change recorded",
      targetType: log.targetType,
      targetId: log.targetId,
      fieldName: log.fieldName,
      changedAt: log.changedAt.toISOString(),
      note: log.note ?? null,
      sourceSystem: log.sourceSystem ?? null,
    });

    return {
      success: true,
      data: {
        performed: performed.map(mapLog),
        affecting: affecting.map(mapLog),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonAuditLogAction", personId },
      "Failed to get audit logs for person",
    );
  }
}

/**
 * Get role assignments for a person
 */
export async function getPersonRoleAssignmentsAction(
  personId: string,
): Promise<ActionResponse<PersonRoleAssignmentSummaryDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLES_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const assignments = await prisma.personRoleAssignment.findMany({
      where: { personId, isActive: true },
      orderBy: [{ isPrimary: "desc" }, { startDate: "desc" }],
      take: 10,
      select: {
        id: true,
        scope: true,
        startDate: true,
        endDate: true,
        isPrimary: true,
        isActive: true,
        role: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: assignments.map((assignment) => ({
        id: assignment.id,
        roleName: assignment.role.name,
        scope: assignment.scope,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
        isPrimary: assignment.isPrimary,
        isActive: assignment.isActive,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonRoleAssignmentsAction", personId },
      "Failed to get role assignments for person",
    );
  }
}

/**
 * Linked User info DTO for person detail page
 */
export interface PersonLinkedUserDTO {
  userId: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

/**
 * Get the linked User account for a Person
 * Returns null if the person has no linked user
 * Used for the person detail page to show user status
 */
export async function getPersonLinkedUserAction(
  personId: string,
): Promise<ActionResponse<PersonLinkedUserDTO | null>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    // Find the person with their linked user
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!person) {
      return {
        success: false,
        error: "Person not found",
      };
    }

    // Return null if no linked user
    if (!person.user) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        userId: person.user.id,
        email: person.user.email,
        name: person.user.name,
        createdAt: person.user.createdAt,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonLinkedUserAction" },
      "Failed to get linked user",
    );
  }
}
