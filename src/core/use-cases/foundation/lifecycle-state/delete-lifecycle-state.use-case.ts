/**
 * Delete Lifecycle State Use Case
 *
 * Business logic for deleting a lifecycle state.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";

@injectable()
export class DeleteLifecycleStateUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
  ) {}

  /**
   * Execute delete lifecycle state use case
   *
   * @param id - Lifecycle state ID to delete
   * @throws NotFoundError if lifecycle state not found
   * @throws Error if lifecycle state is in use
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const lifecycleState = await this.lifecycleStateRepository.findById(id);
    if (!lifecycleState) {
      throw new NotFoundError(
        "Lifecycle state not found",
        "LifecycleState",
        id,
      );
    }

    // Check if in use (transitions or configuration items)
    const inUse = await this.lifecycleStateRepository.isInUse(id);
    if (inUse) {
      throw new Error(
        "Cannot delete lifecycle state because it is in use by lifecycle transitions or configuration items",
      );
    }

    await this.lifecycleStateRepository.delete(id);
  }
}
