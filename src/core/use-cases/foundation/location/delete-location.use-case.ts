/**
 * Delete Location Use Case
 *
 * Business logic for deleting a location.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";

@injectable()
export class DeleteLocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
  ) {}

  /**
   * Execute delete location use case
   *
   * @param id - Location ID to delete
   * @throws NotFoundError if location not found
   * @throws Error if location has children, configuration items, or assets
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const location = await this.locationRepository.findById(id);
    if (!location) {
      throw new NotFoundError("Location not found", "Location", id);
    }

    // Check for children
    const hasChildren = await this.locationRepository.hasChildren(id);
    if (hasChildren) {
      throw new ValidationError(
        "Cannot delete location because it has child locations. Delete or move children first.",
      );
    }

    // Check for configuration items
    const hasCIs = await this.locationRepository.hasConfigurationItems(id);
    if (hasCIs) {
      throw new ValidationError(
        "Cannot delete location because it is referenced by configuration items",
      );
    }

    // Check for assets
    const hasAssets = await this.locationRepository.hasAssets(id);
    if (hasAssets) {
      throw new ValidationError(
        "Cannot delete location because it is referenced by assets",
      );
    }

    await this.locationRepository.delete(id);
  }
}
