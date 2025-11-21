/**
 * Get Lifecycle State Use Case
 *
 * Business logic for retrieving a single lifecycle state by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";

@injectable()
export class GetLifecycleStateUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
  ) {}

  /**
   * Execute get lifecycle state use case
   *
   * @param id - Lifecycle state ID
   * @returns Lifecycle state or null if not found
   */
  async execute(id: string): Promise<LifecycleState | null> {
    return await this.lifecycleStateRepository.findById(id);
  }
}
