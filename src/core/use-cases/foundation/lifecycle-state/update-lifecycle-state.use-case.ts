/**
 * Update Lifecycle State Use Case
 *
 * Business logic for updating an existing lifecycle state.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { StateType } from "@/core/domain/value-objects/foundation-enums";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";

export interface UpdateLifecycleStateProps {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  stateType?: StateType;
  isActiveState?: boolean;
  isTerminalState?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateLifecycleStateUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
  ) {}

  /**
   * Execute update lifecycle state use case
   *
   * @param props - Update properties
   * @returns Updated lifecycle state
   * @throws NotFoundError if lifecycle state not found
   */
  async execute(props: UpdateLifecycleStateProps): Promise<LifecycleState> {
    // Fetch existing lifecycle state
    const lifecycleState = await this.lifecycleStateRepository.findById(
      props.id,
    );
    if (!lifecycleState) {
      throw new NotFoundError(
        "Lifecycle state not found",
        "LifecycleState",
        props.id,
      );
    }

    // Update using entity's update method (includes validation)
    lifecycleState.update({
      name: props.name,
      code: props.code,
      description: props.description,
      stateType: props.stateType,
      isActiveState: props.isActiveState,
      isTerminalState: props.isTerminalState,
      sortOrder: props.sortOrder,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.lifecycleStateRepository.update(lifecycleState);
  }
}
