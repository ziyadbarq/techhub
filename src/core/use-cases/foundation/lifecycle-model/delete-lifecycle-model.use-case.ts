/**
 * Delete Lifecycle Model Use Case
 *
 * Business logic for deleting a lifecycle model.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";

@injectable()
export class DeleteLifecycleModelUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleModelRepository)
    private readonly lifecycleModelRepository: ILifecycleModelRepository,
  ) {}

  /**
   * Execute delete lifecycle model use case
   *
   * @param id - Lifecycle model ID to delete
   * @throws NotFoundError if lifecycle model not found
   * @throws Error if lifecycle model is in use
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const lifecycleModel = await this.lifecycleModelRepository.findById(id);
    if (!lifecycleModel) {
      throw new NotFoundError(
        "Lifecycle model not found",
        "LifecycleModel",
        id,
      );
    }

    // Check if in use (states, transitions, CI classes, asset categories,
    // or license products reference it)
    const inUse = await this.lifecycleModelRepository.isInUse(id);
    if (inUse) {
      throw new ValidationError(
        "Cannot delete lifecycle model because it is in use. Remove its states, transitions, and references from CI classes, asset categories, and license products first.",
      );
    }

    await this.lifecycleModelRepository.delete(id);
  }
}
