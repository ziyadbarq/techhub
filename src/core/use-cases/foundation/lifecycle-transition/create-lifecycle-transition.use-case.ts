/**
 * Create Lifecycle Transition Use Case
 *
 * Business logic for creating a new lifecycle transition with circular detection.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import {
  LifecycleTransition,
  type ApprovalPolicy,
} from "@/core/domain/entities/lifecycle-transition.entity";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";

export interface CreateLifecycleTransitionProps {
  lifecycleModelId: string;
  fromStateId: string;
  toStateId: string;
  name: string;
  description?: string;
  requiredRoleId?: string;
  requiresApproval?: boolean;
  approvalPolicy?: ApprovalPolicy;
  conditions?: Record<string, unknown>;
  isAutomated?: boolean;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateLifecycleTransitionUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleTransitionRepository)
    private readonly lifecycleTransitionRepository: ILifecycleTransitionRepository,
  ) {}

  /**
   * Execute create lifecycle transition use case
   *
   * @param props - Lifecycle transition creation properties
   * @returns Created lifecycle transition
   * @throws Error if transition would create circular path
   */
  async execute(
    props: CreateLifecycleTransitionProps,
  ): Promise<LifecycleTransition> {
    const lifecycleTransition = LifecycleTransition.create(props);

    // Check for circular transitions
    const existingTransitions =
      await this.lifecycleTransitionRepository.findByLifecycleModelId(
        props.lifecycleModelId,
      );
    if (lifecycleTransition.isCircular(existingTransitions)) {
      throw new Error(
        "Cannot create transition: would create circular path in lifecycle model",
      );
    }

    const created =
      await this.lifecycleTransitionRepository.create(lifecycleTransition);
    return created;
  }
}
