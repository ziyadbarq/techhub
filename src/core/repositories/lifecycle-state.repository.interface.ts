/**
 * ILifecycleStateRepository Interface
 * Data access contract for lifecycle states
 */

import type { LifecycleState } from "../domain/entities/lifecycle-state.entity";

export interface ILifecycleStateRepository {
  /**
   * Create a new lifecycle state
   */
  create(state: LifecycleState): Promise<LifecycleState>;

  /**
   * Find lifecycle state by ID
   */
  findById(id: string): Promise<LifecycleState | null>;

  /**
   * Find lifecycle state by code within a model
   */
  findByCode(
    lifecycleModelId: string,
    code: string,
  ): Promise<LifecycleState | null>;

  /**
   * Find all states for a lifecycle model
   */
  findByLifecycleModelId(lifecycleModelId: string): Promise<LifecycleState[]>;

  /**
   * Find all active states in a lifecycle model
   */
  findActiveStates(lifecycleModelId: string): Promise<LifecycleState[]>;

  /**
   * Find all terminal states in a lifecycle model
   */
  findTerminalStates(lifecycleModelId: string): Promise<LifecycleState[]>;

  /**
   * Find all lifecycle states
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "sortOrder" | "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<LifecycleState[]>;

  /**
   * Count states in a lifecycle model
   */
  countByLifecycleModelId(lifecycleModelId: string): Promise<number>;

  /**
   * Update lifecycle state
   */
  update(state: LifecycleState): Promise<LifecycleState>;

  /**
   * Delete lifecycle state
   */
  delete(id: string): Promise<void>;

  /**
   * Check if state has transitions (from or to)
   */
  hasTransitions(id: string): Promise<boolean>;

  /**
   * Check if state is used by any CIs or assets
   */
  isInUse(id: string): Promise<boolean>;

  /**
   * Check if code exists within a lifecycle model (for uniqueness)
   */
  existsByCode(
    lifecycleModelId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean>;
}
