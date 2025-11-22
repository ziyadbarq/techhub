/**
 * Create Lifecycle State Use Case
 *
 * Business logic for creating a new lifecycle state.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type { StateType } from "@/core/domain/value-objects/foundation-enums";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateLifecycleStateProps {
  lifecycleModelId: string;
  name: string;
  code?: string;
  description?: string;
  stateType: StateType;
  isActiveState?: boolean;
  isTerminalState?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateLifecycleStateUseCase {
  constructor(
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  /**
   * Execute create lifecycle state use case
   *
   * @param props - Lifecycle state creation properties
   * @returns Created lifecycle state
   */
  async execute(props: CreateLifecycleStateProps): Promise<LifecycleState> {
    // Auto-generate code if not provided
    // Scoped to lifecycle model since code is unique within model
    const code =
      props.code ??
      (await this.codeGenerator.generateCode("LIFECYCLE_STATE", "STATE", {
        scopeId: props.lifecycleModelId,
      }));

    const lifecycleState = LifecycleState.create({ ...props, code });
    const created = await this.lifecycleStateRepository.create(lifecycleState);
    return created;
  }
}
