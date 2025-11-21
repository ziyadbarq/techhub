/**
 * List Locations Use Case
 *
 * Business logic for listing locations with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Location } from "@/core/domain/entities/location.entity";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";

export interface ListLocationsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "locationType" | "createdAt";
  order?: "asc" | "desc";
  parentId?: string;
  locationType?: string;
  city?: string;
  country?: string;
  withCoordinates?: boolean;
}

@injectable()
export class ListLocationsUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
  ) {}

  /**
   * Execute list locations use case
   *
   * @param options - Optional filter options
   * @returns Array of locations
   */
  async execute(options?: ListLocationsOptions): Promise<Location[]> {
    if (options?.parentId === null) {
      return await this.locationRepository.findRoots();
    }

    if (options?.parentId) {
      return await this.locationRepository.findChildren(options.parentId);
    }

    if (options?.locationType) {
      return await this.locationRepository.findByType(options.locationType);
    }

    if (options?.city) {
      return await this.locationRepository.findByCity(options.city);
    }

    if (options?.country) {
      return await this.locationRepository.findByCountry(options.country);
    }

    if (options?.withCoordinates) {
      return await this.locationRepository.findWithCoordinates();
    }

    return await this.locationRepository.findAll(options);
  }
}
