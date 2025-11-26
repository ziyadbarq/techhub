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
  // Display fields (enriched from relations)
  fromStateName?: string | null;
  toStateName?: string | null;
}

export interface LifecycleTransitionEnrichment {
  fromStateName?: string | null;
  toStateName?: string | null;
}

export function presentLifecycleTransition(
  transition: LifecycleTransition,
  enrichment?: LifecycleTransitionEnrichment,
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
    // Display fields
    fromStateName: enrichment?.fromStateName,
    toStateName: enrichment?.toStateName,
  };
}

export function presentLifecycleTransitions(
  transitions: LifecycleTransition[],
  enrichmentMap?: Map<string, LifecycleTransitionEnrichment>,
): LifecycleTransitionDTO[] {
  return transitions.map((t) =>
    presentLifecycleTransition(t, enrichmentMap?.get(t.id)),
  );
}
