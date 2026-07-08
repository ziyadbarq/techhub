"use server";

/**
 * IntuneDevice Controller
 *
 * Server actions for Intune device management.
 */

import { revalidatePath } from "next/cache";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  ListIntuneDevicesUseCase,
  GetIntuneDeviceUseCase,
  GetIntuneComplianceStatsUseCase,
  GetDeviceComplianceHistoryUseCase,
  SyncDevicesFromIntuneUseCase,
  LinkIntuneDeviceToAssetUseCase,
  UnlinkIntuneDeviceFromAssetUseCase,
  LinkIntuneDeviceToPersonUseCase,
  UnlinkIntuneDeviceFromPersonUseCase,
  CreateAssetFromIntuneDeviceUseCase,
  BulkCreateAssetsFromIntuneDevicesUseCase,
} from "@/core/use-cases/intune";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IntuneDeviceFilters } from "@/core/repositories/intune-device.repository.interface";
import {
  presentIntuneDevice,
  presentIntuneDevices,
  presentComplianceStats,
  presentComplianceHistories,
  presentSyncResult,
} from "@/interface-adapters/presenters/intune-device.presenter";
import {
  LinkDeviceToAssetSchema,
  LinkDeviceToPersonSchema,
  UnlinkDeviceSchema,
  TriggerIntuneSyncSchema,
  IntuneDeviceFiltersSchema,
  CreateAssetFromDeviceSchema,
  BulkCreateAssetsFromDevicesSchema,
  type IntuneDeviceDTO,
  type IntuneComplianceStatsDTO,
  type IntuneComplianceHistoryDTO,
  type IntuneSyncResultDTO,
  type LinkDeviceToAssetDTO,
  type LinkDeviceToPersonDTO,
  type UnlinkDeviceDTO,
  type TriggerIntuneSyncDTO,
  type IntuneDeviceFiltersDTO,
  type CreateAssetFromDeviceDTO,
  type CreateAssetFromDeviceResultDTO,
  type BulkCreateAssetsFromDevicesDTO,
  type BulkCreateAssetsResultDTO,
} from "@/interface-adapters/dtos/generated/intune-device.dto";

// ==========================================
// Data Enrichment
// ==========================================

/**
 * Enriches devices with linked entity names
 */
async function enrichDevices(
  devices: IntuneDeviceDTO[],
): Promise<IntuneDeviceDTO[]> {
  if (devices.length === 0) return devices;

  const container = getContainer();
  const assetRepository = container.get<IAssetRepository>(
    DI_TOKENS.IAssetRepository,
  );
  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  // Collect unique IDs
  const assetIds = [
    ...new Set(
      devices.map((d) => d.linkedAssetId).filter((id): id is string => !!id),
    ),
  ];
  const personIds = [
    ...new Set(
      devices.map((d) => d.linkedPersonId).filter((id): id is string => !!id),
    ),
  ];

  // Fetch assets in parallel (has findByIds)
  const assets =
    assetIds.length > 0 ? await assetRepository.findByIds(assetIds) : [];

  // Fetch persons individually (no findByIds method)
  const personPromises = personIds.map((id) => personRepository.findById(id));
  const personResults = await Promise.all(personPromises);
  const persons = personResults.filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );

  // Create lookup maps
  const assetMap = new Map(assets.map((a) => [a.id, a.assetTag]));
  const personMap = new Map(
    persons.map((p) => [p.id, `${p.firstName} ${p.lastName}`]),
  );

  // Enrich devices
  return devices.map((device) => ({
    ...device,
    linkedAssetTag: device.linkedAssetId
      ? (assetMap.get(device.linkedAssetId) ?? null)
      : null,
    linkedPersonName: device.linkedPersonId
      ? (personMap.get(device.linkedPersonId) ?? null)
      : null,
  }));
}

// ==========================================
// Filter Mapping
// ==========================================

/**
 * Maps DTO filters to repository filters
 * Handles property name differences between API and repository layer
 */
function mapFiltersToRepository(
  dtoFilters?: IntuneDeviceFiltersDTO,
): IntuneDeviceFilters | undefined {
  if (!dtoFilters) return undefined;

  return {
    searchQuery: dtoFilters.search,
    complianceState: dtoFilters.complianceState,
    ownershipType: dtoFilters.ownershipType,
    managementState: dtoFilters.managementState,
    operatingSystem: dtoFilters.operatingSystem,
    isActive: dtoFilters.isActive,
    isLinkedToAsset: dtoFilters.linkedToAsset,
    isLinkedToPerson: dtoFilters.linkedToPerson,
  };
}

// ==========================================
// Query Actions
// ==========================================

/**
 * List Intune devices with optional filters and pagination
 */
export async function listIntuneDevicesAction(
  filters?: IntuneDeviceFiltersDTO,
  pagination?: { page?: number; pageSize?: number },
): Promise<
  ActionResponse<{
    devices: IntuneDeviceDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validatedFilters = filters
      ? IntuneDeviceFiltersSchema.parse(filters)
      : undefined;

    // Map DTO filters to repository filters
    const repositoryFilters = mapFiltersToRepository(validatedFilters);

    // Default pagination
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const container = getContainer();
    const listDevicesUseCase = container.get<ListIntuneDevicesUseCase>(
      DI_TOKENS.ListIntuneDevicesUseCase,
    );

    const result = await listDevicesUseCase.execute({
      filters: repositoryFilters,
      pagination: { skip, take: pageSize },
    });

    const devices = presentIntuneDevices(result.devices);
    const enrichedDevices = await enrichDevices(devices);
    const totalPages = Math.ceil(result.total / pageSize);

    return {
      success: true,
      data: {
        devices: enrichedDevices,
        total: result.total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listIntuneDevicesAction" },
      "Failed to list Intune devices",
    );
  }
}

/**
 * Get a single Intune device by ID
 */
export async function getIntuneDeviceAction(
  id: string,
): Promise<ActionResponse<IntuneDeviceDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const container = getContainer();
    const getDeviceUseCase = container.get<GetIntuneDeviceUseCase>(
      DI_TOKENS.GetIntuneDeviceUseCase,
    );

    const device = await getDeviceUseCase.execute({ id });

    if (!device) {
      return {
        success: false,
        error: "Intune device not found",
      };
    }

    const deviceDTO = presentIntuneDevice(device);
    const [enrichedDevice] = await enrichDevices([deviceDTO]);

    return {
      success: true,
      data: enrichedDevice,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getIntuneDeviceAction", id },
      "Failed to get Intune device",
    );
  }
}

/**
 * Get Intune devices linked to a specific asset
 */
export async function getIntuneDevicesByAssetAction(
  assetId: string,
): Promise<ActionResponse<IntuneDeviceDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const container = getContainer();
    const listDevicesUseCase = container.get<ListIntuneDevicesUseCase>(
      DI_TOKENS.ListIntuneDevicesUseCase,
    );

    // Get all devices linked to assets, then filter by specific assetId
    const result = await listDevicesUseCase.execute({
      filters: { isLinkedToAsset: true },
    });

    // Filter by the specific asset ID
    const linkedDevices = result.devices.filter(
      (device) => device.linkedAssetId === assetId,
    );

    const devices = presentIntuneDevices(linkedDevices);
    const enrichedDevices = await enrichDevices(devices);

    return {
      success: true,
      data: enrichedDevices,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getIntuneDevicesByAssetAction", assetId },
      "Failed to get Intune devices by asset",
    );
  }
}

/**
 * Get compliance statistics
 */
export async function getIntuneComplianceStatsAction(): Promise<
  ActionResponse<IntuneComplianceStatsDTO>
> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_COMPLIANCE_VIEW);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const container = getContainer();
    const getStatsUseCase = container.get<GetIntuneComplianceStatsUseCase>(
      DI_TOKENS.GetIntuneComplianceStatsUseCase,
    );

    const stats = await getStatsUseCase.execute();

    return {
      success: true,
      data: presentComplianceStats(stats),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getIntuneComplianceStatsAction" },
      "Failed to get compliance statistics",
    );
  }
}

/**
 * Get compliance history for a device
 */
export async function getDeviceComplianceHistoryAction(
  deviceId: string,
  options?: { maxAgeDays?: number; skip?: number; take?: number },
): Promise<
  ActionResponse<{ history: IntuneComplianceHistoryDTO[]; total: number }>
> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_COMPLIANCE_VIEW);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const container = getContainer();
    const getHistoryUseCase = container.get<GetDeviceComplianceHistoryUseCase>(
      DI_TOKENS.GetDeviceComplianceHistoryUseCase,
    );

    const result = await getHistoryUseCase.execute({
      deviceId,
      maxAgeDays: options?.maxAgeDays,
      pagination: options
        ? { skip: options.skip, take: options.take }
        : undefined,
    });

    return {
      success: true,
      data: {
        history: presentComplianceHistories(result.history),
        total: result.total,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getDeviceComplianceHistoryAction", deviceId },
      "Failed to get device compliance history",
    );
  }
}

// ==========================================
// Sync Actions
// ==========================================

/**
 * Trigger a manual Intune device sync
 */
export async function triggerIntuneSyncAction(
  options?: TriggerIntuneSyncDTO,
): Promise<ActionResponse<IntuneSyncResultDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_SYNC);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validatedOptions = options
      ? TriggerIntuneSyncSchema.parse(options)
      : undefined;

    const container = getContainer();
    const syncUseCase = container.get<SyncDevicesFromIntuneUseCase>(
      DI_TOKENS.SyncDevicesFromIntuneUseCase,
    );

    const result = await syncUseCase.execute(validatedOptions);

    revalidatePath("/intune");
    revalidatePath("/intune/devices");

    return {
      success: true,
      data: presentSyncResult(result),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "triggerIntuneSyncAction" },
      "Failed to sync Intune devices",
    );
  }
}

// ==========================================
// Link/Unlink Actions
// ==========================================

/**
 * Link an Intune device to an Asset
 */
export async function linkDeviceToAssetAction(
  data: LinkDeviceToAssetDTO,
): Promise<ActionResponse<IntuneDeviceDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = LinkDeviceToAssetSchema.parse(data);

    const container = getContainer();
    const linkUseCase = container.get<LinkIntuneDeviceToAssetUseCase>(
      DI_TOKENS.LinkIntuneDeviceToAssetUseCase,
    );

    const result = await linkUseCase.execute(validated);

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath(`/intune/devices/${validated.deviceId}`);

    const deviceDTO = presentIntuneDevice(result.device);
    const [enrichedDevice] = await enrichDevices([deviceDTO]);

    return {
      success: true,
      data: enrichedDevice,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "linkDeviceToAssetAction" },
      "Failed to link device to asset",
    );
  }
}

/**
 * Unlink an Intune device from its Asset
 */
export async function unlinkDeviceFromAssetAction(
  data: UnlinkDeviceDTO,
): Promise<ActionResponse<IntuneDeviceDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = UnlinkDeviceSchema.parse(data);

    const container = getContainer();
    const unlinkUseCase = container.get<UnlinkIntuneDeviceFromAssetUseCase>(
      DI_TOKENS.UnlinkIntuneDeviceFromAssetUseCase,
    );

    const result = await unlinkUseCase.execute(validated);

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath(`/intune/devices/${validated.deviceId}`);

    return {
      success: true,
      data: presentIntuneDevice(result.device),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "unlinkDeviceFromAssetAction" },
      "Failed to unlink device from asset",
    );
  }
}

/**
 * Link an Intune device to a Person
 */
export async function linkDeviceToPersonAction(
  data: LinkDeviceToPersonDTO,
): Promise<ActionResponse<IntuneDeviceDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = LinkDeviceToPersonSchema.parse(data);

    const container = getContainer();
    const linkUseCase = container.get<LinkIntuneDeviceToPersonUseCase>(
      DI_TOKENS.LinkIntuneDeviceToPersonUseCase,
    );

    const result = await linkUseCase.execute(validated);

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath(`/intune/devices/${validated.deviceId}`);

    const deviceDTO = presentIntuneDevice(result.device);
    const [enrichedDevice] = await enrichDevices([deviceDTO]);

    return {
      success: true,
      data: enrichedDevice,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "linkDeviceToPersonAction" },
      "Failed to link device to person",
    );
  }
}

/**
 * Unlink an Intune device from its Person
 */
export async function unlinkDeviceFromPersonAction(
  data: UnlinkDeviceDTO,
): Promise<ActionResponse<IntuneDeviceDTO>> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = UnlinkDeviceSchema.parse(data);

    const container = getContainer();
    const unlinkUseCase = container.get<UnlinkIntuneDeviceFromPersonUseCase>(
      DI_TOKENS.UnlinkIntuneDeviceFromPersonUseCase,
    );

    const result = await unlinkUseCase.execute(validated);

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath(`/intune/devices/${validated.deviceId}`);

    return {
      success: true,
      data: presentIntuneDevice(result.device),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "unlinkDeviceFromPersonAction" },
      "Failed to unlink device from person",
    );
  }
}

// ==========================================
// Asset Creation Actions
// ==========================================

/**
 * Create an ITAM Asset from an Intune device
 */
export async function createAssetFromDeviceAction(
  data: CreateAssetFromDeviceDTO,
): Promise<ActionResponse<CreateAssetFromDeviceResultDTO>> {
  try {
    // Requires both assets create and intune link permissions
    await requirePermission(PERMISSIONS.ASSETS_CREATE);
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = CreateAssetFromDeviceSchema.parse(data);

    const container = getContainer();
    const createAssetUseCase =
      container.get<CreateAssetFromIntuneDeviceUseCase>(
        DI_TOKENS.CreateAssetFromIntuneDeviceUseCase,
      );

    const result = await createAssetUseCase.execute({
      deviceId: validated.deviceId,
      categoryId: validated.categoryId,
      stockLocationId: validated.stockLocationId,
      lifecycleStateId: validated.lifecycleStateId,
      autoCreateVendor: validated.autoCreateVendor,
      autoCreateModel: validated.autoCreateModel,
      autoLinkToDevice: validated.autoLinkToDevice,
    });

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath(`/intune/devices/${validated.deviceId}`);
    revalidatePath("/assets");

    return {
      success: true,
      data: {
        assetId: result.asset.id,
        assetTag: result.asset.assetTag,
        serialNumber: result.asset.serialNumber ?? "",
        vendorCreated: result.vendorCreated,
        modelCreated: result.modelCreated,
        linkedToDevice: validated.autoLinkToDevice ?? true,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetFromDeviceAction" },
      "Failed to create asset from device",
    );
  }
}

/**
 * Bulk create ITAM Assets from multiple Intune devices
 */
export async function bulkCreateAssetsFromDevicesAction(
  data: BulkCreateAssetsFromDevicesDTO,
): Promise<ActionResponse<BulkCreateAssetsResultDTO>> {
  try {
    // Requires both assets create and intune link permissions
    await requirePermission(PERMISSIONS.ASSETS_CREATE);
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_LINK);

    // Ensure Intune module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("intune");

    const validated = BulkCreateAssetsFromDevicesSchema.parse(data);

    const container = getContainer();
    const bulkCreateUseCase =
      container.get<BulkCreateAssetsFromIntuneDevicesUseCase>(
        DI_TOKENS.BulkCreateAssetsFromIntuneDevicesUseCase,
      );

    const result = await bulkCreateUseCase.execute({
      deviceIds: validated.deviceIds,
      categoryId: validated.categoryId,
      stockLocationId: validated.stockLocationId,
      lifecycleStateId: validated.lifecycleStateId,
      autoCreateVendor: validated.autoCreateVendor,
      autoCreateModel: validated.autoCreateModel,
      autoLinkToDevice: validated.autoLinkToDevice,
    });

    revalidatePath("/intune");
    revalidatePath("/intune/devices");
    revalidatePath("/assets");

    return {
      success: true,
      data: {
        results: result.results,
        summary: result.summary,
        durationMs: result.durationMs,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateAssetsFromDevicesAction" },
      "Failed to bulk create assets from devices",
    );
  }
}
