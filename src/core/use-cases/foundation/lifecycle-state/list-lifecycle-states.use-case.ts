/**
 * List Lifecycle States Use Case
 *
 * Business logic for listing lifecycle states with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";

export interface ListLifecycleStatesOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "sortOrder" | "createdAt";
  order?: "asc" | "desc";
  lifecycleModelId?: string;
  isActive?: boolean;
  isTerminal?: boolean;
}

@injectable()
export class ListLifecycleStatesUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
  ) {}

  /**
   * Execute list lifecycle states use case
   *
   * @param options - Optional filter options
   * @returns Array of lifecycle states
   */
  async execute(
    options?: ListLifecycleStatesOptions,
  ): Promise<LifecycleState[]> {
    if (options?.lifecycleModelId) {
      return await this.lifecycleStateRepository.findByLifecycleModelId(
        options.lifecycleModelId,
      );
    }

    // TODO: Implement findActive and findTerminal methods in repository
    // if (options?.isActive !== undefined) {
    //   return await this.lifecycleStateRepository.findActive(options.isActive);
    // }

    // if (options?.isTerminal !== undefined) {
    //   return await this.lifecycleStateRepository.findTerminal(
    //     options.isTerminal,
    //   );
    // }

    return await this.lifecycleStateRepository.findAll(options);
  }
}
