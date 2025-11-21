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
