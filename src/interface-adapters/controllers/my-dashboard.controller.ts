/**
 * My Dashboard Controller
 * Server actions for fetching personalized dashboard data
 * All actions return data scoped to the current authenticated user
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getCurrentUserId } from "@/lib/auth/session";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { presentPerson, type PersonDTO } from "../presenters/person.presenter";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import type { IDisposalApprovalRepository } from "@/core/repositories/disposal-approval.repository.interface";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/server";
import { getRedis } from "@/lib/redis";

// ============================================================================
// Person / Profile Actions
// ============================================================================

/**
 * Get the Person entity linked to the current authenticated user
 * Returns null if user has no linked Person (system accounts, etc.)
 */
export async function getCurrentPersonAction(): Promise<
  ActionResponse<PersonDTO | null>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: null };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    const person = await personRepository.findByUserId(userId);

    return {
      success: true,
      data: person ? presentPerson(person) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getCurrentPersonAction" },
      "Failed to get current person",
    );
  }
}

// ============================================================================
// Profile / Settings Actions
// ============================================================================

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters")
    .optional(),
  image: z
    .string()
    .url("Image must be a valid URL")
    .max(500, "Image URL too long")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

/**
 * Update current Better Auth user profile (name, image)
 */
export async function updateMyProfileAction(
  data: UpdateProfileDTO,
): Promise<ActionResponse<{ name?: string; image?: string | null }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const validated = UpdateProfileSchema.parse(data);

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.name,
        image: validated.image === "" ? null : validated.image,
      },
      select: {
        name: true,
        image: true,
      },
    });

    return {
      success: true,
      data: {
        name: updated.name ?? undefined,
        image: updated.image ?? null,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateMyProfileAction" },
      "Failed to update profile",
    );
  }
}

// Preferences stored in Redis (per-user key)
const preferencesKey = (userId: string) => `user:preferences:${userId}`;

const PreferencesSchema = z.object({
  timezone: z.string().optional(),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"])
    .optional()
    .default("dd/MM/yyyy"),
  currencyDisplay: z.enum(["sar", "original", "dual"]).optional(),
  notifications: z
    .object({
      emailNotifications: z.boolean().optional(),
      teamsNotifications: z.boolean().optional(),
      whatsappNotifications: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      assetAlerts: z.boolean().optional(),
      approvalAlerts: z.boolean().optional(),
      warrantyAlerts: z.boolean().optional(),
    })
    .optional(),
});

export type UserPreferencesDTO = z.infer<typeof PreferencesSchema>;

const defaultPreferences: Required<UserPreferencesDTO> = {
  timezone: "Asia/Riyadh",
  dateFormat: "dd/MM/yyyy",
  currencyDisplay: "dual",
  notifications: {
    emailNotifications: true,
    teamsNotifications: false,
    whatsappNotifications: false,
    weeklyDigest: true,
    assetAlerts: true,
    approvalAlerts: true,
    warrantyAlerts: true,
  },
};

/**
 * Get current user's preferences (Redis-backed)
 */
export async function getMyPreferencesAction(): Promise<
  ActionResponse<UserPreferencesDTO>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const redis = getRedis();
    const raw = await redis.get(preferencesKey(userId));
    if (!raw) {
      return { success: true, data: defaultPreferences };
    }

    const parsed = PreferencesSchema.partial().parse(JSON.parse(raw));
    return {
      success: true,
      data: {
        ...defaultPreferences,
        ...parsed,
        notifications: {
          ...defaultPreferences.notifications,
          ...(parsed.notifications ?? {}),
        },
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyPreferencesAction" },
      "Failed to load preferences",
    );
  }
}

/**
 * Update current user's preferences (Redis-backed)
 */
export async function updateMyPreferencesAction(
  data: UserPreferencesDTO,
): Promise<ActionResponse<UserPreferencesDTO>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const redis = getRedis();
    const validated = PreferencesSchema.parse(data);

    const merged: UserPreferencesDTO = {
      ...defaultPreferences,
      ...validated,
      notifications: {
        ...defaultPreferences.notifications,
        ...(validated.notifications ?? {}),
      },
    };

    await redis.set(preferencesKey(userId), JSON.stringify(merged));

    return { success: true, data: merged };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateMyPreferencesAction" },
      "Failed to update preferences",
    );
  }
}

// ============================================================================
// My Assets Actions
// ============================================================================

export interface MyAssetDTO {
  id: string;
  assetId: string;
  assetTag: string | null;
  assetCategoryId: string | null;
  assetModelId: string | null;
  condition: string | null;
  assignedAt: string;
}

/**
 * Get assets assigned to the current user's Person
 * Enriches assignment data with asset details
 */
export async function getMyAssetsAction(): Promise<
  ActionResponse<MyAssetDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const assignmentRepository = container.get<IAssetAssignmentRepository>(
      DI_TOKENS.IAssetAssignmentRepository,
    );
    const assetRepository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const assignments = await assignmentRepository.findActiveByAssignee(
      "PERSON",
      person.id,
    );

    // Batch fetch all assets in a single query (fixes N+1)
    const assetIds = assignments.map((a) => a.assetId);
    const assets = await assetRepository.findByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const myAssets: MyAssetDTO[] = assignments.map((assignment) => {
      const asset = assetMap.get(assignment.assetId);
      return {
        id: assignment.id,
        assetId: assignment.assetId,
        assetTag: asset?.assetTag || null,
        assetCategoryId: asset?.assetCategoryId || null,
        assetModelId: asset?.assetModelId || null,
        condition: assignment.conditionOnAssignment || null,
        assignedAt: assignment.startDate.toISOString(),
      };
    });

    return { success: true, data: myAssets };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyAssetsAction" },
      "Failed to get my assets",
    );
  }
}

// ============================================================================
// My Reservations Actions
// ============================================================================

export interface MyReservationDTO {
  id: string;
  assetId: string;
  assetTag: string | null;
  startDate: string;
  endDate: string;
  status: string;
  purpose: string | null;
}

/**
 * Get asset reservations for the current user's Person
 */
export async function getMyReservationsAction(): Promise<
  ActionResponse<MyReservationDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_RESERVATIONS_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const reservationRepository = container.get<IAssetReservationRepository>(
      DI_TOKENS.IAssetReservationRepository,
    );
    const assetRepository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const reservations = await reservationRepository.findByPersonId(person.id);

    // Batch fetch all assets in a single query (fixes N+1)
    const assetIds = reservations.map((r) => r.assetId);
    const assets = await assetRepository.findByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const myReservations: MyReservationDTO[] = reservations.map((res) => {
      const asset = assetMap.get(res.assetId);
      return {
        id: res.id,
        assetId: res.assetId,
        assetTag: asset?.assetTag || null,
        startDate: res.startDate.toISOString(),
        endDate: res.endDate.toISOString(),
        status: res.status,
        purpose: res.purpose,
      };
    });

    return { success: true, data: myReservations };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyReservationsAction" },
      "Failed to get my reservations",
    );
  }
}

// ============================================================================
// My Maintenance Tasks Actions
// ============================================================================

export interface MyMaintenanceTaskDTO {
  id: string;
  assetId: string;
  assetTag: string | null;
  title: string;
  nextDueDate: string | null;
  priority: string;
  scheduleType: string;
}

/**
 * Get maintenance schedules assigned to the current user's Person
 */
export async function getMyMaintenanceTasksAction(): Promise<
  ActionResponse<MyMaintenanceTaskDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const scheduleRepository = container.get<IMaintenanceScheduleRepository>(
      DI_TOKENS.IMaintenanceScheduleRepository,
    );
    const assetRepository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const schedules = await scheduleRepository.findAll({
      assignedToId: person.id,
      isActive: true,
    });

    // Batch fetch all assets in a single query (fixes N+1)
    const assetIds = schedules.map((s) => s.assetId);
    const assets = await assetRepository.findByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const myTasks: MyMaintenanceTaskDTO[] = schedules.map((schedule) => {
      const asset = assetMap.get(schedule.assetId);
      return {
        id: schedule.id,
        assetId: schedule.assetId,
        assetTag: asset?.assetTag || null,
        title: schedule.title,
        nextDueDate: schedule.nextDueDate?.toISOString() || null,
        priority: schedule.priority,
        scheduleType: schedule.scheduleType.toString(),
      };
    });

    return { success: true, data: myTasks };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyMaintenanceTasksAction" },
      "Failed to get my maintenance tasks",
    );
  }
}

// ============================================================================
// My Pending Approvals Actions
// ============================================================================

export interface MyPendingApprovalDTO {
  id: string;
  type: "DISPOSAL";
  disposalId: string;
  status: string;
  createdAt: string;
}

/**
 * Get disposal approvals pending for the current user
 */
export async function getMyPendingApprovalsAction(): Promise<
  ActionResponse<MyPendingApprovalDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_DISPOSALS_APPROVE);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const approvalRepository = container.get<IDisposalApprovalRepository>(
      DI_TOKENS.IDisposalApprovalRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const pendingApprovals = await approvalRepository.findPendingByApprover(
      person.id,
    );

    const approvals: MyPendingApprovalDTO[] = pendingApprovals.map(
      (approval) => ({
        id: approval.id,
        type: "DISPOSAL" as const,
        disposalId: approval.disposalId,
        status: approval.status,
        createdAt: approval.createdAt.toISOString(),
      }),
    );

    return { success: true, data: approvals };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyPendingApprovalsAction" },
      "Failed to get my pending approvals",
    );
  }
}

// ============================================================================
// My Software Licenses Actions
// ============================================================================

export interface MyLicenseDTO {
  id: string;
  licenseEntitlementId: string;
  allocatedQuantity: number;
  allocatedAt: string;
  note: string | null;
}

/**
 * Get software licenses allocated to the current user's Person
 */
export async function getMyLicensesAction(): Promise<
  ActionResponse<MyLicenseDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const allocationRepository = container.get<ILicenseAllocationRepository>(
      DI_TOKENS.ILicenseAllocationRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const allocations = await allocationRepository.findByTarget(
      AllocationTargetType.PERSON,
      person.id,
    );

    // Filter to only active allocations (not deallocated)
    const activeAllocations = allocations.filter((a) => !a.deallocatedAt);

    const myLicenses: MyLicenseDTO[] = activeAllocations.map((allocation) => ({
      id: allocation.id,
      licenseEntitlementId: allocation.licenseEntitlementId,
      allocatedQuantity: allocation.allocatedQuantity,
      allocatedAt: allocation.allocatedAt.toISOString(),
      note: allocation.note,
    }));

    return { success: true, data: myLicenses };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyLicensesAction" },
      "Failed to get my licenses",
    );
  }
}

// ============================================================================
// My Services Actions
// ============================================================================

export interface MyServiceDTO {
  id: string;
  serviceName: string;
  serviceType: string;
  criticality: string;
  status: string;
}

/**
 * Get services owned by the current user's Person
 */
export async function getMyServicesAction(): Promise<
  ActionResponse<MyServiceDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const serviceRepository = container.get<IServiceRepository>(
      DI_TOKENS.IServiceRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const services = await serviceRepository.findByOwner(person.id);

    const myServices: MyServiceDTO[] = services.map((service) => ({
      id: service.id,
      serviceName: service.name,
      serviceType: service.serviceType,
      criticality: service.criticality,
      status: service.currentStatus,
    }));

    return { success: true, data: myServices };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyServicesAction" },
      "Failed to get my services",
    );
  }
}

// ============================================================================
// My Equipment Kits Actions
// ============================================================================

export interface MyEquipmentKitDTO {
  id: string;
  assetKitId: string;
  checkoutDate: string;
  expectedReturnDate: string | null;
  status: string;
}

/**
 * Get equipment kits checked out to the current user's Person
 */
export async function getMyEquipmentKitsAction(): Promise<
  ActionResponse<MyEquipmentKitDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_KITS_VIEW);

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const checkoutRepository = container.get<IAssetKitCheckoutRepository>(
      DI_TOKENS.IAssetKitCheckoutRepository,
    );

    const person = await personRepository.findByUserId(userId);
    if (!person) {
      return { success: true, data: [] };
    }

    const checkouts = await checkoutRepository.findByAssignee(
      "PERSON",
      person.id,
    );

    const myKits: MyEquipmentKitDTO[] = checkouts.map((checkout) => ({
      id: checkout.id,
      assetKitId: checkout.assetKitId,
      checkoutDate: checkout.checkoutDate.toISOString(),
      expectedReturnDate: checkout.expectedReturnDate?.toISOString() || null,
      status: checkout.status,
    }));

    return { success: true, data: myKits };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyEquipmentKitsAction" },
      "Failed to get my equipment kits",
    );
  }
}
