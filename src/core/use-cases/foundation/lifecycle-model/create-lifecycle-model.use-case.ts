/**
 * Create Lifecycle Model Use Case
 *
 * Business logic for creating a new lifecycle model.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateLifecycleModelProps {
  name: string;
  description?: string;
}

@injectable()
export class CreateLifecycleModelUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleModelRepository)
    private readonly lifecycleModelRepository: ILifecycleModelRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Execute create lifecycle model use case
   *
   * @param props - Lifecycle model creation properties
   * @returns Created lifecycle model
   */
  async execute(props: CreateLifecycleModelProps): Promise<LifecycleModel> {
    const lifecycleModel = LifecycleModel.create(props);
    const created = await this.lifecycleModelRepository.create(lifecycleModel);
    return created;
  }
}
