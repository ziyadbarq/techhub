/**
 * Update Lifecycle Transition Use Case
 *
 * Business logic for updating an existing lifecycle transition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { LifecycleTransition } from "@/core/domain/entities/lifecycle-transition.entity";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";
import type { ApprovalPolicy } from "@/core/domain/entities/lifecycle-transition.entity";

export interface UpdateLifecycleTransitionProps {
  id: string;
  name?: string;
  description?: string | null;
  requiredRoleId?: string | null;
  requiresApproval?: boolean;
  approvalPolicy?: ApprovalPolicy | null;
  conditions?: Record<string, unknown> | null;
  isAutomated?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateLifecycleTransitionUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleTransitionRepository)
    private readonly lifecycleTransitionRepository: ILifecycleTransitionRepository,
  ) {}

  /**
   * Execute update lifecycle transition use case
   *
   * @param props - Update properties
   * @returns Updated lifecycle transition
   * @throws NotFoundError if lifecycle transition not found
   */
  async execute(
    props: UpdateLifecycleTransitionProps,
  ): Promise<LifecycleTransition> {
    // Fetch existing lifecycle transition
    const lifecycleTransition =
      await this.lifecycleTransitionRepository.findById(props.id);
    if (!lifecycleTransition) {
      throw new NotFoundError(
        "Lifecycle transition not found",
        "LifecycleTransition",
        props.id,
      );
    }

    // Update using entity's update method (includes validation)
    lifecycleTransition.update({
      name: props.name,
      description: props.description,
      requiredRoleId: props.requiredRoleId,
      requiresApproval: props.requiresApproval,
      approvalPolicy: props.approvalPolicy,
      conditions: props.conditions,
      isAutomated: props.isAutomated,
      isActive: props.isActive,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.lifecycleTransitionRepository.update(lifecycleTransition);
  }
}
