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
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { PrismaClient } from "@/generated/prisma/server";

/**
 * Counts of related entities for person detail tabs
 */
export interface PersonRelationCounts {
  directReports: number;
  roleAssignments: number;
  intuneDevices: number;
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

    // Fetch all counts in parallel using Prisma directly for efficiency
    const [
      directReports,
      roleAssignments,
      intuneDevices,
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
      prisma.personRoleAssignment.count({
        where: { personId, isActive: true },
      }),
      prisma.intuneDevice.count({ where: { linkedPersonId: personId } }),
      prisma.assetReservation.count({
        where: { reservedForPersonId: personId },
      }),
      prisma.assetKitCheckout.count({ where: { checkedOutById: personId } }),
      prisma.stockMovement.count({ where: { performedById: personId } }),
      prisma.maintenanceSchedule.count({ where: { assignedToId: personId } }),
      prisma.serviceOwnership.count({ where: { personId } }),
      prisma.configurationItem.count({
        where: { primaryOwnerPersonId: personId },
      }),
      prisma.dataOwnership.count({ where: { ownerPersonId: personId } }),
      prisma.verificationCampaign.count({ where: { createdById: personId } }),
      prisma.verificationItem.count({ where: { verifierPersonId: personId } }),
      prisma.attachment.count({ where: { uploadedById: personId } }),
      prisma.assetDisposal.count({ where: { initiatedById: personId } }),
      prisma.assetDisposal.count({ where: { approvedById: personId } }),
    ]);

    return {
      success: true,
      data: {
        directReports,
        roleAssignments,
        intuneDevices,
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
