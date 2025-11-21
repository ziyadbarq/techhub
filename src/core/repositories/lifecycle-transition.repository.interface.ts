/**
 * ILifecycleTransitionRepository Interface
 * Data access contract for lifecycle transitions
 */

import type { LifecycleTransition } from "../domain/entities/lifecycle-transition.entity";

export interface ILifecycleTransitionRepository {
  /**
   * Create a new lifecycle transition
   */
  create(transition: LifecycleTransition): Promise<LifecycleTransition>;

  /**
   * Find lifecycle transition by ID
   */
  findById(id: string): Promise<LifecycleTransition | null>;

  /**
   * Find transition by from/to states
   */
  findByStates(
    lifecycleModelId: string,
    fromStateId: string,
    toStateId: string,
  ): Promise<LifecycleTransition | null>;

  /**
   * Find all transitions for a lifecycle model
   */
  findByLifecycleModelId(
    lifecycleModelId: string,
  ): Promise<LifecycleTransition[]>;

  /**
   * Find valid transitions from a specific state
   */
  findValidTransitionsFromState(
    lifecycleModelId: string,
    fromStateId: string,
  ): Promise<LifecycleTransition[]>;

  /**
   * Find valid transitions to a specific state
   */
  findValidTransitionsToState(
    lifecycleModelId: string,
    toStateId: string,
  ): Promise<LifecycleTransition[]>;

  /**
   * Find automated transitions
   */
  findAutomatedTransitions(
    lifecycleModelId: string,
  ): Promise<LifecycleTransition[]>;

  /**
   * Find transitions requiring specific role
   */
  findByRequiredRole(roleId: string): Promise<LifecycleTransition[]>;

  /**
   * Find all lifecycle transitions
   */
  findAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<LifecycleTransition[]>;

  /**
   * Update lifecycle transition
   */
  update(transition: LifecycleTransition): Promise<LifecycleTransition>;

  /**
   * Delete lifecycle transition
   */
  delete(id: string): Promise<void>;

  /**
   * Check if transition exists (for uniqueness)
   */
  existsByStates(
    lifecycleModelId: string,
    fromStateId: string,
    toStateId: string,
    excludeId?: string,
  ): Promise<boolean>;
}
