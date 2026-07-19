/**
 * Update Location Use Case
 *
 * Business logic for updating an existing location.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Location } from "@/core/domain/entities/location.entity";
import type { LocationType } from "@/core/domain/value-objects/foundation-enums";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";

export interface UpdateLocationProps {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  locationType?: LocationType;
  parentId?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timeZone?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateLocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
  ) {}

  /**
   * Execute update location use case
   *
   * @param props - Update properties
   * @returns Updated location
   * @throws NotFoundError if location not found
   * @throws Error if code already exists or circular reference detected
   */
  async execute(props: UpdateLocationProps): Promise<Location> {
    // Fetch existing location
    const location = await this.locationRepository.findById(props.id);
    if (!location) {
      throw new NotFoundError("Location not found", "Location", props.id);
    }

    // Check for duplicate code if changing
    if (props.code !== undefined && props.code !== location.code) {
      const existsByCode = await this.locationRepository.existsByCode(
        props.code,
        props.id,
      );
      if (existsByCode) {
        throw new ConflictError(
          `Location with code "${props.code}" already exists`,
        );
      }
    }

    // If moving to new parent, check for circular references
    if (props.parentId !== undefined && props.parentId !== location.parentId) {
      const descendants = await this.locationRepository.findDescendants(
        props.id,
      );
      const childIds = descendants.map((d) => d.id);
      location.moveTo(props.parentId, childIds);
    }

    // Update using entity's update method (includes validation)
    location.update({
      name: props.name,
      code: props.code,
      description: props.description,
      locationType: props.locationType,
      address: props.address,
      addressLine1: props.addressLine1,
      addressLine2: props.addressLine2,
      city: props.city,
      state: props.state,
      country: props.country,
      postalCode: props.postalCode,
      latitude: props.latitude,
      longitude: props.longitude,
      timeZone: props.timeZone,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.locationRepository.update(location);
  }
}
