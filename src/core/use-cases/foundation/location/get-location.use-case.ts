/**
 * Get Location Use Case
 *
 * Business logic for retrieving a single location by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Location } from "@/core/domain/entities/location.entity";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";

@injectable()
export class GetLocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
  ) {}

  /**
   * Execute get location use case
   *
   * @param id - Location ID
   * @returns Location or null if not found
   */
  async execute(id: string): Promise<Location | null> {
    return await this.locationRepository.findById(id);
  }
}
