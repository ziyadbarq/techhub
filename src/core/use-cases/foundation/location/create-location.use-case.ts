/**
 * Create Location Use Case
 *
 * Business logic for creating a new location.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { Location } from "@/core/domain/entities/location.entity";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { LocationType } from "@/core/domain/value-objects/foundation-enums";

export interface CreateLocationProps {
  code: string;
  name: string;
  description?: string;
  locationType: LocationType;
  parentId?: string | null;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateLocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
  ) {}

  /**
   * Execute create location use case
   *
   * @param props - Location creation properties
   * @returns Created location
   * @throws Error if code already exists
   */
  async execute(props: CreateLocationProps): Promise<Location> {
    // Check for duplicate code
    const existsByCode = await this.locationRepository.existsByCode(props.code);
    if (existsByCode) {
      throw new Error(`Location with code "${props.code}" already exists`);
    }

    const location = Location.create(props);
    const created = await this.locationRepository.create(location);
    return created;
  }
}
