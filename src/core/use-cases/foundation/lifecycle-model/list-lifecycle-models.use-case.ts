/**
 * List Lifecycle Models Use Case
 *
 * Business logic for listing all lifecycle models with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";

export interface ListLifecycleModelsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListLifecycleModelsUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleModelRepository)
    private readonly lifecycleModelRepository: ILifecycleModelRepository,
  ) {}

  /**
   * Execute list lifecycle models use case
   *
   * @param options - Optional filter options
   * @returns Array of lifecycle models
   */
  async execute(
    options?: ListLifecycleModelsOptions,
  ): Promise<LifecycleModel[]> {
    return await this.lifecycleModelRepository.findAll(options);
  }
}
