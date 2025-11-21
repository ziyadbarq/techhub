/**
 * Update Lifecycle Model Use Case
 *
 * Business logic for updating an existing lifecycle model.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";

export interface UpdateLifecycleModelProps {
  id: string;
  name?: string;
  description?: string | null;
}

@injectable()
export class UpdateLifecycleModelUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleModelRepository)
    private readonly lifecycleModelRepository: ILifecycleModelRepository,
  ) {}

  /**
   * Execute update lifecycle model use case
   *
   * @param props - Update properties
   * @returns Updated lifecycle model
   * @throws NotFoundError if lifecycle model not found
   */
  async execute(props: UpdateLifecycleModelProps): Promise<LifecycleModel> {
    // Fetch existing lifecycle model
    const lifecycleModel = await this.lifecycleModelRepository.findById(
      props.id,
    );
    if (!lifecycleModel) {
      throw new NotFoundError(
        "Lifecycle model not found",
        "LifecycleModel",
        props.id,
      );
    }

    // Update using entity's update method (includes validation)
    lifecycleModel.update({
      name: props.name,
      description: props.description,
    });

    // Persist changes
    return await this.lifecycleModelRepository.update(lifecycleModel);
  }
}
