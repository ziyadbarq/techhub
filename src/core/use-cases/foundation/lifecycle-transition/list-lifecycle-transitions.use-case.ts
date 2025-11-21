/**
 * List Lifecycle Transitions Use Case
 *
 * Business logic for listing lifecycle transitions with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleTransition } from "@/core/domain/entities/lifecycle-transition.entity";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";

export interface ListLifecycleTransitionsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "displayOrder" | "createdAt";
  order?: "asc" | "desc";
  lifecycleModelId?: string;
  fromStateId?: string;
  requiresApproval?: boolean;
}

@injectable()
export class ListLifecycleTransitionsUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleTransitionRepository)
    private readonly lifecycleTransitionRepository: ILifecycleTransitionRepository,
  ) {}

  /**
   * Execute list lifecycle transitions use case
   *
   * @param options - Optional filter options
   * @returns Array of lifecycle transitions
   */
  async execute(
    options?: ListLifecycleTransitionsOptions,
  ): Promise<LifecycleTransition[]> {
    if (options?.lifecycleModelId) {
      return await this.lifecycleTransitionRepository.findByLifecycleModelId(
        options.lifecycleModelId,
      );
    }

    // TODO: Implement findByFromStateId and findRequiringApproval methods in repository
    // if (options?.fromStateId) {
    //   return await this.lifecycleTransitionRepository.findByFromStateId(
    //     options.fromStateId,
    //   );
    // }

    // if (options?.requiresApproval !== undefined) {
    //   return await this.lifecycleTransitionRepository.findRequiringApproval(
    //     options.requiresApproval,
    //   );
    // }

    return await this.lifecycleTransitionRepository.findAll(options);
  }
}
