/**
 * Get Lifecycle Model Use Case
 *
 * Business logic for retrieving a single lifecycle model by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";

@injectable()
export class GetLifecycleModelUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleModelRepository)
    private readonly lifecycleModelRepository: ILifecycleModelRepository,
  ) {}

  /**
   * Execute get lifecycle model use case
   *
   * @param id - Lifecycle model ID
   * @returns Lifecycle model or null if not found
   */
  async execute(id: string): Promise<LifecycleModel | null> {
    return await this.lifecycleModelRepository.findById(id);
  }
}
