/**
 * IFeatureFlagRepository Interface
 * Data access contract for feature flags
 */

import type { FeatureFlag } from "../domain/entities/feature-flag.entity";

export interface IFeatureFlagRepository {
  /**
   * Create a new feature flag
   */
  create(featureFlag: FeatureFlag): Promise<FeatureFlag>;

  /**
   * Find feature flag by ID
   */
  findById(id: string): Promise<FeatureFlag | null>;

  /**
   * Find feature flag by name (unique identifier)
   */
  findByName(name: string): Promise<FeatureFlag | null>;

  /**
   * Find all feature flags
   */
  findAll(options?: {
    onlyEnabled?: boolean;
    category?: string;
    orderBy?: "name" | "displayName" | "category" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<FeatureFlag[]>;

  /**
   * Find multiple feature flags by names
   */
  findByNames(names: string[]): Promise<FeatureFlag[]>;

  /**
   * Find all enabled feature flags
   */
  findAllEnabled(): Promise<FeatureFlag[]>;

  /**
   * Find flags that depend on a specific feature
   * @param featureName The feature name to check dependencies for
   * @returns All flags that have featureName in their dependsOn array
   */
  findDependentFlags(featureName: string): Promise<FeatureFlag[]>;

  /**
   * Get all enabled feature names as a Set (for quick lookups)
   */
  getEnabledFeatureNames(): Promise<Set<string>>;

  /**
   * Count all feature flags
   */
  count(onlyEnabled?: boolean): Promise<number>;

  /**
   * Update feature flag
   */
  update(featureFlag: FeatureFlag): Promise<FeatureFlag>;

  /**
   * Toggle feature flag enabled state
   */
  toggle(name: string): Promise<FeatureFlag>;

  /**
   * Delete feature flag (hard delete - use with caution)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if feature flag exists by name
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(name: string): Promise<boolean>;

  /**
   * Get maintenance mode status
   */
  isMaintenanceModeEnabled(): Promise<boolean>;
}
