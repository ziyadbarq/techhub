/**
 * ILifecycleModelRepository Interface
 * Data access contract for lifecycle models
 */

import type { LifecycleModel } from "../domain/entities/lifecycle-model.entity";

export interface ILifecycleModelRepository {
  /**
   * Create a new lifecycle model
   */
  create(model: LifecycleModel): Promise<LifecycleModel>;

  /**
   * Find lifecycle model by ID
   */
  findById(id: string): Promise<LifecycleModel | null>;

  /**
   * Find lifecycle model by name
   */
  findByName(name: string): Promise<LifecycleModel | null>;

  /**
   * Find all lifecycle models
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<LifecycleModel[]>;

  /**
   * Search lifecycle models by name
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<LifecycleModel[]>;

  /**
   * Count all lifecycle models
   */
  count(): Promise<number>;

  /**
   * Update lifecycle model
   */
  update(model: LifecycleModel): Promise<LifecycleModel>;

  /**
   * Delete lifecycle model
   */
  delete(id: string): Promise<void>;

  /**
   * Check if lifecycle model has states
   */
  hasStates(id: string): Promise<boolean>;

  /**
   * Check whether anything references this lifecycle model (states,
   * transitions, CI classes, asset categories, or license products)
   */
  isInUse(id: string): Promise<boolean>;

  /**
   * Check if lifecycle model has transitions
   */
  hasTransitions(id: string): Promise<boolean>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}
