/**
 * Delete Lifecycle Model Use Case
 *
 * Business logic for deleting a lifecycle model.
 */

import { inject, injectable } from "inversify";
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

    // Check if in use
    // TODO: Implement isInUse method in repository
    // const inUse = await this.lifecycleModelRepository.isInUse(id);
    // if (inUse) {
    //   throw new Error(
    //     "Cannot delete lifecycle model because it is in use by lifecycle states",
    //   );
    // }

    await this.lifecycleModelRepository.delete(id);
  }
}
