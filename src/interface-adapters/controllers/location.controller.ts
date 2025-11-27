/**
 * Location Controller
 * Server actions for Location CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateLocationSchema,
  UpdateLocationSchema,
  LocationIdSchema,
  type CreateLocationDTO,
  type UpdateLocationDTO,
} from "../dtos/generated/location.dto";
import {
  presentLocation,
  presentLocations,
  type LocationDTO,
} from "../presenters/location.presenter";
import type {
  CreateLocationUseCase,
  ListLocationsUseCase,
  GetLocationUseCase,
  UpdateLocationUseCase,
  DeleteLocationUseCase,
} from "@/core/use-cases/foundation/location";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createLocationAction(
  data: CreateLocationDTO,
): Promise<ActionResponse<LocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_CREATE);

    const validated = CreateLocationSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateLocationUseCase>(
      DI_TOKENS.CreateLocationUseCase,
    );

    const location = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description ?? undefined,
      locationType: validated.locationType,
      parentId: validated.parentId ?? undefined,
      address: validated.address ?? undefined,
      city: validated.city ?? undefined,
      state: validated.state ?? undefined,
      country: validated.country ?? undefined,
      postalCode: validated.postalCode ?? undefined,
      latitude: validated.latitude ?? undefined,
      longitude: validated.longitude ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/locations");

    return {
      success: true,
      data: presentLocation(location),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLocationAction" },
      "Failed to create location",
    );
  }
}

export async function listLocationsAction(): Promise<
  ActionResponse<LocationDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListLocationsUseCase>(
      DI_TOKENS.ListLocationsUseCase,
    );

    const locations = await useCase.execute();

    return {
      success: true,
      data: presentLocations(locations),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLocationsAction" },
      "Failed to list locations",
    );
  }
}

export async function getLocationAction(
  id: string,
): Promise<ActionResponse<LocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_VIEW);

    const validated = LocationIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetLocationUseCase>(
      DI_TOKENS.GetLocationUseCase,
    );

    const location = await useCase.execute(validated.id);

    if (!location) {
      return {
        success: false,
        error: "Location not found",
      };
    }

    return {
      success: true,
      data: presentLocation(location),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLocationAction" },
      "Failed to get location",
    );
  }
}

export async function updateLocationAction(
  data: UpdateLocationDTO,
): Promise<ActionResponse<LocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_UPDATE);

    const validated = UpdateLocationSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLocationUseCase>(
      DI_TOKENS.UpdateLocationUseCase,
    );

    const location = await useCase.execute({
      id: validated.id,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      locationType: validated.locationType,
      parentId: validated.parentId,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      country: validated.country,
      postalCode: validated.postalCode,
      latitude: validated.latitude,
      longitude: validated.longitude,
      metadata: validated.metadata,
    });

    revalidatePath("/locations");
    revalidatePath(`/locations/${validated.id}`);

    return {
      success: true,
      data: presentLocation(location),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLocationAction" },
      "Failed to update location",
    );
  }
}

export async function deleteLocationAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_DELETE);

    const validated = LocationIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteLocationUseCase>(
      DI_TOKENS.DeleteLocationUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/locations");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLocationAction" },
      "Failed to delete location",
    );
  }
}

export async function bulkCreateLocationsAction(
  itemsData: CreateLocationDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateLocationUseCase>(
      DI_TOKENS.CreateLocationUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process locations sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        const validated = CreateLocationSchema.parse(itemData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          description: validated.description ?? undefined,
          locationType: validated.locationType,
          parentId: validated.parentId ?? undefined,
          address: validated.address ?? undefined,
          city: validated.city ?? undefined,
          state: validated.state ?? undefined,
          country: validated.country ?? undefined,
          postalCode: validated.postalCode ?? undefined,
          latitude: validated.latitude ?? undefined,
          longitude: validated.longitude ?? undefined,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: itemData.code || itemData.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/locations");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateLocationsAction" },
      "Failed to bulk create locations",
    );
  }
}

/**
 * Check for existing locations by code (batch lookup for duplicate detection)
 */
export async function checkLocationDuplicatesAction(codes: string[]): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; code: string; name: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_CREATE);

    const container = getContainer();
    const repository = container.get<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
    );

    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return { success: true, data: { duplicates: [], duplicateCount: 0 } };
    }

    const existingLocations = await repository.findByCodes(validCodes);

    const duplicates = existingLocations.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
    }));

    return {
      success: true,
      data: { duplicates, duplicateCount: duplicates.length },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check duplicates",
    };
  }
}

/**
 * Bulk upsert locations (create or update based on duplicate strategy)
 */
export async function bulkUpsertLocationsAction(
  locationsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ code: string; name: string }>;
    updated?: Array<{ code: string; name: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
    );
    const createUseCase = container.get<CreateLocationUseCase>(
      DI_TOKENS.CreateLocationUseCase,
    );
    const updateUseCase = container.get<UpdateLocationUseCase>(
      DI_TOKENS.UpdateLocationUseCase,
    );

    const log = logger.child({
      controller: "location.bulkUpsert",
      rows: locationsData.length,
      strategy,
    });
    log.info("Bulk location upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ code: string; name: string }>,
      updated: [] as Array<{ code: string; name: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    const codes = locationsData
      .map((l) => l.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    const existingLocations = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingLocations.map((l) => [l.code.toUpperCase(), l]),
    );

    for (let i = 0; i < locationsData.length; i++) {
      const locationData = locationsData[i];
      const identifier =
        (locationData.code as string) ||
        (locationData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateLocationSchema.parse(locationData);
        const existingLocation = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingLocation) {
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Code "${validated.code}" already exists`,
              });
              break;
            case "overwrite": {
              const updateData: Record<string, unknown> = {
                id: existingLocation.id,
              };
              if (validated.name) updateData.name = validated.name;
              if (validated.description)
                updateData.description = validated.description;
              if (validated.locationType)
                updateData.locationType = validated.locationType;
              if (validated.parentId) updateData.parentId = validated.parentId;
              if (validated.address) updateData.address = validated.address;
              if (validated.city) updateData.city = validated.city;
              if (validated.state) updateData.state = validated.state;
              if (validated.country) updateData.country = validated.country;
              if (validated.postalCode)
                updateData.postalCode = validated.postalCode;
              if (validated.latitude !== undefined)
                updateData.latitude = validated.latitude;
              if (validated.longitude !== undefined)
                updateData.longitude = validated.longitude;

              await updateUseCase.execute(updateData as UpdateLocationDTO);
              results.updatedCount++;
              results.updated.push({
                code: existingLocation.code,
                name: validated.name,
              });
              break;
            }
            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate code "${validated.code}" not allowed`,
              });
              break;
            case "append": {
              const modifiedCode = `${validated.code}-COPY-${Date.now()}`;
              await createUseCase.execute({
                name: validated.name,
                code: modifiedCode,
                locationType: validated.locationType,
                description: validated.description ?? undefined,
                parentId: validated.parentId ?? undefined,
                address: validated.address ?? undefined,
                city: validated.city ?? undefined,
                state: validated.state ?? undefined,
                country: validated.country ?? undefined,
                postalCode: validated.postalCode ?? undefined,
                latitude: validated.latitude ?? undefined,
                longitude: validated.longitude ?? undefined,
                metadata: validated.metadata ?? undefined,
              });
              results.createdCount++;
              results.created.push({
                code: modifiedCode,
                name: validated.name,
              });
              break;
            }
          }
        } else {
          await createUseCase.execute({
            name: validated.name,
            code: validated.code,
            locationType: validated.locationType,
            description: validated.description ?? undefined,
            parentId: validated.parentId ?? undefined,
            address: validated.address ?? undefined,
            city: validated.city ?? undefined,
            state: validated.state ?? undefined,
            country: validated.country ?? undefined,
            postalCode: validated.postalCode ?? undefined,
            latitude: validated.latitude ?? undefined,
            longitude: validated.longitude ?? undefined,
            metadata: validated.metadata ?? undefined,
          });
          results.createdCount++;
          results.created.push({
            code: validated.code || "AUTO",
            name: validated.name,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/locations");
    log.info("Bulk location upsert completed", results);

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert locations",
    };
  }
}
