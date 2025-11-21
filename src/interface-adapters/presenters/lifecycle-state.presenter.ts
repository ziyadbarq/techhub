/**
 * Lifecycle State Presenter
 * Transforms Lifecycle State domain entities into DTOs for the UI layer
 */

import type { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { StateType } from "@/core/domain/value-objects/foundation-enums";

export interface LifecycleStateDTO {
  id: string;
  name: string;
  description: string | null;
  modelId: string;
  stateType: StateType;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentLifecycleState(
  state: LifecycleState,
): LifecycleStateDTO {
  return {
    id: state.id,
    name: state.name,
    description: state.description,
    modelId: state.lifecycleModelId,
    stateType: state.stateType,
    isActive: state.isActive,
    metadata: state.metadata,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
  };
}

export function presentLifecycleStates(
  states: LifecycleState[],
): LifecycleStateDTO[] {
  return states.map(presentLifecycleState);
}
