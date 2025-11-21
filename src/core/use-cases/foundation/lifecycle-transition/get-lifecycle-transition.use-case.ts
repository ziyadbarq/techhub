/**
 * Get Lifecycle Transition Use Case
 *
 * Business logic for retrieving a single lifecycle transition by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleTransition } from "@/core/domain/entities/lifecycle-transition.entity";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";

@injectable()
export class GetLifecycleTransitionUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleTransitionRepository)
    private readonly lifecycleTransitionRepository: ILifecycleTransitionRepository,
  ) {}

  /**
   * Execute get lifecycle transition use case
   *
   * @param id - Lifecycle transition ID
   * @returns Lifecycle transition or null if not found
   */
  async execute(id: string): Promise<LifecycleTransition | null> {
    return await this.lifecycleTransitionRepository.findById(id);
  }
}
