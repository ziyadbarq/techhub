/**
 * My Dashboard Controller
 * Server actions for fetching personalized dashboard data
 * All actions return data scoped to the current authenticated user
 */

"use server";

import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getCurrentUserId } from "@/lib/auth/session";
import { requirePermission, hasPermission } from "@/lib/permissions/server";
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
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/server";
import type { GetUserPreferencesUseCase } from "@/core/use-cases/user-preferences/get-user-preferences.use-case";
import type { UpdateUserPreferencesUseCase } from "@/core/use-cases/user-preferences/update-user-preferences.use-case";
import type { IImageOptimizationService } from "@/core/services/image-optimization.service.interface";
import { isFeatureEnabled } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import type { ILoggerService } from "@/core/services";

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
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logger.warn("Profile update attempted without authentication", {
        function: "updateMyProfileAction",
      });
      return { success: false, error: "Not authenticated" };
    }

    const validated = UpdateProfileSchema.parse(data);

    logger.info("Profile update initiated", {
      function: "updateMyProfileAction",
      userId,
      hasNameUpdate: !!validated.name,
      hasImageUpdate: validated.image !== undefined,
      imageAction:
        validated.image === "" ? "remove" : validated.image ? "set" : "none",
    });

    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    // Build update data object - only include fields that are explicitly provided
    const updateData: { name?: string; image?: string | null } = {};
    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }
    if (validated.image !== undefined) {
      updateData.image = validated.image === "" ? null : validated.image;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        name: true,
        image: true,
      },
    });

    logger.info("Profile updated successfully", {
      function: "updateMyProfileAction",
      userId,
      updatedName: !!updated.name,
      updatedImage: !!updated.image,
    });

    return {
      success: true,
      data: {
        name: updated.name ?? undefined,
        image: updated.image ?? null,
      },
    };
  } catch (error) {
    logger.error(
      "Profile update failed",
      error instanceof Error ? error : undefined,
      {
        function: "updateMyProfileAction",
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return handleControllerError(
      error,
      { function: "updateMyProfileAction" },
      "Failed to update profile",
    );
  }
}

/**
 * Upload Profile Photo
 * Login-method-based strategy:
 * - SSO users (Microsoft OAuth): Cannot upload (avatar managed by Microsoft)
 * - Email/Password users: Can upload if ATTACHMENTS feature flag is enabled
 */
export async function uploadProfilePhotoAction(
  formData: FormData,
): Promise<ActionResponse<{ imageUrl: string }>> {
  const startTime = Date.now();
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logger.warn("Profile photo upload attempted without authentication", {
        function: "uploadProfilePhotoAction",
      });
      return { success: false, error: "Not authenticated" };
    }

    logger.info("Profile photo upload initiated", {
      function: "uploadProfilePhotoAction",
      userId,
    });

    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    // Fetch user with login method
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, lastLoginMethod: true, email: true },
    });

    if (!user) {
      logger.error("User not found for profile photo upload", undefined, {
        function: "uploadProfilePhotoAction",
        userId,
      });
      return { success: false, error: "User not found" };
    }

    // Check login method: SSO users cannot upload custom avatars
    if (user.lastLoginMethod === "microsoft") {
      logger.warn("SSO user attempted to upload custom avatar", {
        function: "uploadProfilePhotoAction",
        userId,
        loginMethod: user.lastLoginMethod,
      });
      return {
        success: false,
        error:
          "SSO users cannot upload custom avatars. Your profile picture is automatically synced from Microsoft. Contact your IT admin to update it.",
      };
    }

    // Check feature flag: ATTACHMENTS must be enabled for email/password users
    const attachmentsEnabled = await isFeatureEnabled(
      FEATURE_FLAGS.ATTACHMENTS,
    );
    if (!attachmentsEnabled) {
      logger.warn("Profile photo upload attempted with ATTACHMENTS disabled", {
        function: "uploadProfilePhotoAction",
        userId,
        featureFlag: FEATURE_FLAGS.ATTACHMENTS,
      });
      return {
        success: false,
        error:
          "File uploads are currently disabled. Please use the image URL input instead.",
      };
    }

    // Extract file from FormData
    const file = formData.get("file") as File | null;
    if (!file) {
      logger.warn("Profile photo upload attempted without file", {
        function: "uploadProfilePhotoAction",
        userId,
      });
      return { success: false, error: "No file provided" };
    }

    logger.debug("File received for upload", {
      function: "uploadProfilePhotoAction",
      userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Validate file type (JPEG, PNG, WebP)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      logger.warn("Invalid file type for profile photo upload", {
        function: "uploadProfilePhotoAction",
        userId,
        fileName: file.name,
        fileType: file.type,
        allowedTypes: allowedMimeTypes,
      });
      return {
        success: false,
        error:
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      logger.warn("File size exceeds limit for profile photo upload", {
        function: "uploadProfilePhotoAction",
        userId,
        fileName: file.name,
        fileSize: file.size,
        maxSize,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
      });
      return {
        success: false,
        error: "File size exceeds 5MB limit. Please choose a smaller image.",
      };
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.debug("File converted to buffer, starting optimization", {
      function: "uploadProfilePhotoAction",
      userId,
      bufferSize: buffer.length,
    });

    // Optimize avatar and generate multiple size variants
    const optimizationService = container.get<IImageOptimizationService>(
      DI_TOKENS.IImageOptimizationService,
    );

    const optimizationStart = Date.now();
    const result = await optimizationService.optimizeAvatar(
      buffer,
      userId,
      file.name,
    );
    const optimizationDuration = Date.now() - optimizationStart;

    logger.info("Avatar optimization completed", {
      function: "uploadProfilePhotoAction",
      userId,
      variants: Object.keys(result.variants),
      optimizationDurationMs: optimizationDuration,
      originalSize: file.size,
    });

    // Update User.image with default 128px variant (most common size)
    const imageUrl = result.variants[128];
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    const totalDuration = Date.now() - startTime;

    logger.info("Profile photo upload completed successfully", {
      function: "uploadProfilePhotoAction",
      userId,
      imageUrl,
      totalDurationMs: totalDuration,
      optimizationDurationMs: optimizationDuration,
      uploadDurationMs: totalDuration - optimizationDuration,
    });

    return {
      success: true,
      data: { imageUrl },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logger.error(
      "Profile photo upload failed",
      error instanceof Error ? error : undefined,
      {
        function: "uploadProfilePhotoAction",
        error: error instanceof Error ? error.message : String(error),
        totalDurationMs: totalDuration,
      },
    );

    return handleControllerError(
      error,
      { function: "uploadProfilePhotoAction" },
      "Failed to upload profile photo",
    );
  }
}

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

/**
 * Get current user's preferences (Database-backed)
 */
export async function getMyPreferencesAction(): Promise<
  ActionResponse<UserPreferencesDTO>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const container = getContainer();
    const getUserPreferences = container.get<GetUserPreferencesUseCase>(
      DI_TOKENS.GetUserPreferencesUseCase,
    );

    const preferences = await getUserPreferences.execute(userId);

    return {
      success: true,
      data: {
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat as
          "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd",
        currencyDisplay: preferences.currencyDisplay as
          "sar" | "original" | "dual",
        notifications: preferences.notifications,
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
 * Update current user's preferences (Database-backed)
 */
export async function updateMyPreferencesAction(
  data: UserPreferencesDTO,
): Promise<ActionResponse<UserPreferencesDTO>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const validated = PreferencesSchema.parse(data);

    const container = getContainer();
    const updateUserPreferences = container.get<UpdateUserPreferencesUseCase>(
      DI_TOKENS.UpdateUserPreferencesUseCase,
    );

    const preferences = await updateUserPreferences.execute({
      userId,
      timezone: validated.timezone,
      dateFormat: validated.dateFormat,
      currencyDisplay: validated.currencyDisplay,
      notifications: validated.notifications,
    });

    return {
      success: true,
      data: {
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat as
          "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd",
        currencyDisplay: preferences.currencyDisplay as
          "sar" | "original" | "dual",
        notifications: preferences.notifications,
      },
    };
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

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

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

// ============================================================================
// Dashboard Overview Actions (org-wide, permission-gated per domain)
// ============================================================================

export interface DashboardMetricsDTO {
  totalAssets: number;
  pendingMaintenance: number;
  expiringWarranties: number;
  overdueMaintenance: number;
}

const EXPIRING_WARRANTY_DAYS = 30;
const PENDING_MAINTENANCE_DAYS = 7;

/**
 * Aggregate summary metrics for the dashboard overview.
 *
 * Each metric is gated by both its feature flag and the viewer's permission,
 * defaulting to 0 when the module is disabled or the user cannot view it —
 * so a metric never reveals data the user isn't allowed to see.
 */
export async function getDashboardMetricsAction(): Promise<
  ActionResponse<DashboardMetricsDTO>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: true,
        data: {
          totalAssets: 0,
          pendingMaintenance: 0,
          expiringWarranties: 0,
          overdueMaintenance: 0,
        },
      };
    }

    const container = getContainer();

    const [assetsEnabled, maintenanceEnabled, warrantiesEnabled] =
      await Promise.all([
        isFeatureEnabled(FEATURE_FLAGS.ASSETS),
        isFeatureEnabled(FEATURE_FLAGS.MAINTENANCE),
        isFeatureEnabled(FEATURE_FLAGS.WARRANTIES),
      ]);

    const [canViewAssets, canViewMaintenance, canViewWarranties] =
      await Promise.all([
        hasPermission(PERMISSIONS.ASSETS_VIEW),
        hasPermission(PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW),
        hasPermission(PERMISSIONS.WARRANTIES_VIEW),
      ]);

    const dueBefore = new Date();
    dueBefore.setDate(dueBefore.getDate() + PENDING_MAINTENANCE_DAYS);

    const [
      totalAssets,
      pendingMaintenance,
      overdueMaintenance,
      expiringWarranties,
    ] = await Promise.all([
      assetsEnabled && canViewAssets
        ? container
            .get<IAssetRepository>(DI_TOKENS.IAssetRepository)
            .getStatistics()
            .then((stats) => stats.total)
        : Promise.resolve(0),
      maintenanceEnabled && canViewMaintenance
        ? container
            .get<IMaintenanceScheduleRepository>(
              DI_TOKENS.IMaintenanceScheduleRepository,
            )
            .count({ isActive: true, dueBefore })
        : Promise.resolve(0),
      maintenanceEnabled && canViewMaintenance
        ? container
            .get<IMaintenanceScheduleRepository>(
              DI_TOKENS.IMaintenanceScheduleRepository,
            )
            .count({ isActive: true, overdueOnly: true })
        : Promise.resolve(0),
      warrantiesEnabled && canViewWarranties
        ? container
            .get<IWarrantyRepository>(DI_TOKENS.IWarrantyRepository)
            .countExpiringSoon(EXPIRING_WARRANTY_DAYS)
        : Promise.resolve(0),
    ]);

    return {
      success: true,
      data: {
        totalAssets,
        pendingMaintenance,
        expiringWarranties,
        overdueMaintenance,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getDashboardMetricsAction" },
      "Failed to get dashboard metrics",
    );
  }
}

export interface RecentActivityDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

/**
 * Recent audit-log activity for the current user (their own actions).
 * Naturally user-scoped, so no extra permission beyond authentication.
 */
export async function getMyRecentActivityAction(): Promise<
  ActionResponse<RecentActivityDTO[]>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: true, data: [] };
    }

    const container = getContainer();
    const auditRepository = container.get<IAuditLogRepository>(
      DI_TOKENS.IAuditLogRepository,
    );

    const entries = await auditRepository.findByUserId(userId, 10);

    const activity: RecentActivityDTO[] = entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      createdAt: entry.createdAt.toISOString(),
    }));

    return { success: true, data: activity };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyRecentActivityAction" },
      "Failed to get recent activity",
    );
  }
}
