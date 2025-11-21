/**
 * Delete Lifecycle Transition Use Case
 *
 * Business logic for deleting a lifecycle transition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";

@injectable()
export class DeleteLifecycleTransitionUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleTransitionRepository)
    private readonly lifecycleTransitionRepository: ILifecycleTransitionRepository,
  ) {}

  /**
   * Execute delete lifecycle transition use case
   *
   * @param id - Lifecycle transition ID to delete
   * @throws NotFoundError if lifecycle transition not found
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const lifecycleTransition =
      await this.lifecycleTransitionRepository.findById(id);
    if (!lifecycleTransition) {
      throw new NotFoundError(
        "Lifecycle transition not found",
        "LifecycleTransition",
        id,
      );
    }

    await this.lifecycleTransitionRepository.delete(id);
  }
}
