"use server";

/**
 * IntuneDevice Controller
 *
 * Server actions for Intune device management.
 */

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  ListIntuneDevicesUseCase,
  GetIntuneDeviceUseCase,
  GetIntuneComplianceStatsUseCase,
  SyncDevicesFromIntuneUseCase,
  LinkIntuneDeviceToAssetUseCase,
  UnlinkIntuneDeviceFromAssetUseCase,
  LinkIntuneDeviceToPersonUseCase,
  UnlinkIntuneDeviceFromPersonUseCase,
} from "@/core/use-cases/intune";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import {
  presentIntuneDevice,
  presentIntuneDevices,
  presentComplianceStats,
  presentSyncResult,
} from "@/interface-adapters/presenters/intune-device.presenter";
import {
  LinkDeviceToAssetSchema,
  LinkDeviceToPersonSchema,
  UnlinkDeviceSchema,
  TriggerIntuneSyncSchema,
  IntuneDeviceFiltersSchema,
  type IntuneDeviceDTO,
  type IntuneComplianceStatsDTO,
  type IntuneSyncResultDTO,
  type LinkDeviceToAssetDTO,
  type LinkDeviceToPersonDTO,
  type UnlinkDeviceDTO,
  type TriggerIntuneSyncDTO,
  type IntuneDeviceFiltersDTO,
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
// Query Actions
// ==========================================

/**
 * List Intune devices with optional filters
 */
export async function listIntuneDevicesAction(
  filters?: IntuneDeviceFiltersDTO,
  pagination?: { skip?: number; take?: number },
): Promise<
  ActionResponse<{
    devices: IntuneDeviceDTO[];
    total: number;
    hasMore: boolean;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

    const validatedFilters = filters
      ? IntuneDeviceFiltersSchema.parse(filters)
      : undefined;

    const container = getContainer();
    const listDevicesUseCase = container.get<ListIntuneDevicesUseCase>(
      DI_TOKENS.ListIntuneDevicesUseCase,
    );

    const result = await listDevicesUseCase.execute({
      filters: validatedFilters,
      pagination,
    });

    const devices = presentIntuneDevices(result.devices);
    const enrichedDevices = await enrichDevices(devices);

    return {
      success: true,
      data: {
        devices: enrichedDevices,
        total: result.total,
        hasMore: result.hasMore,
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
 * Get compliance statistics
 */
export async function getIntuneComplianceStatsAction(): Promise<
  ActionResponse<IntuneComplianceStatsDTO>
> {
  try {
    await requirePermission(PERMISSIONS.INTUNE_COMPLIANCE_VIEW);

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
