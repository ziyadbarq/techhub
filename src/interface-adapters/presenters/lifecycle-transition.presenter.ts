/**
 * Lifecycle Transition Presenter
 * Transforms Lifecycle Transition domain entities into DTOs for the UI layer
 */

import type { LifecycleTransition } from "@/core/domain/entities/lifecycle-transition.entity";

export interface LifecycleTransitionDTO {
  id: string;
  name: string;
  description: string | null;
  modelId: string;
  fromStateId: string;
  toStateId: string;
  conditions: Record<string, unknown> | null;
  requiresApproval: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentLifecycleTransition(
  transition: LifecycleTransition,
): LifecycleTransitionDTO {
  return {
    id: transition.id,
    name: transition.name,
    description: transition.description,
    modelId: transition.lifecycleModelId,
    fromStateId: transition.fromStateId,
    toStateId: transition.toStateId,
    conditions: transition.conditions,
    requiresApproval: transition.requiresApproval,
    isActive: transition.isActive,
    metadata: transition.metadata,
    createdAt: transition.createdAt.toISOString(),
    updatedAt: transition.updatedAt.toISOString(),
  };
}

export function presentLifecycleTransitions(
  transitions: LifecycleTransition[],
): LifecycleTransitionDTO[] {
  return transitions.map(presentLifecycleTransition);
}
