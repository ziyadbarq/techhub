/**
 * FeatureFlag Entity
 * Represents a feature flag in the system with dependency tracking
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type FeatureFlagCategory = "SYSTEM" | "LAYER_1" | "LAYER_2" | "LAYER_3";

export interface FeatureFlagProps {
  id: string;
  name: string; // CONTRACTS, LICENSES, CMDB, etc.
  displayName: string;
  description: string;
  category: FeatureFlagCategory;
  isEnabled: boolean;
  isSystem: boolean; // System flags (e.g., MAINTENANCE_MODE) have special behavior
  dependsOn: string[]; // Array of feature names this feature depends on
  createdAt: Date;
  updatedAt: Date;
}

export class FeatureFlag {
  private constructor(private readonly props: FeatureFlagProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error("Feature flag name is required");
    }

    if (!this.props.displayName || this.props.displayName.trim().length === 0) {
      throw new Error("Feature flag display name is required");
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error("Feature flag description is required");
    }

    // Name should be uppercase with underscores
    if (!/^[A-Z_]+$/.test(this.props.name)) {
      throw new Error(
        "Feature flag name must be uppercase with underscores (e.g., ASSET_DISPOSALS)",
      );
    }

    // Validate category
    const validCategories: FeatureFlagCategory[] = [
      "SYSTEM",
      "LAYER_1",
      "LAYER_2",
      "LAYER_3",
    ];
    if (!validCategories.includes(this.props.category)) {
      throw new Error(
        `Invalid feature flag category: ${this.props.category}. Must be one of: ${validCategories.join(", ")}`,
      );
    }

    // Validate dependencies are also uppercase with underscores
    for (const dep of this.props.dependsOn) {
      if (!/^[A-Z_]+$/.test(dep)) {
        throw new Error(
          `Invalid dependency name: ${dep}. Must be uppercase with underscores`,
        );
      }
    }
  }

  // Factory method for creating a new feature flag
  static create(
    params: {
      name: string;
      displayName: string;
      description: string;
      category: FeatureFlagCategory;
      isEnabled?: boolean;
      isSystem?: boolean;
      dependsOn?: string[];
    },
    idGenerator: IIdGenerator,
  ): FeatureFlag {
    const now = new Date();
    const name = params.name.toUpperCase().trim();

    return new FeatureFlag({
      id: idGenerator.generateId(),
      name,
      displayName: params.displayName.trim(),
      description: params.description.trim(),
      category: params.category,
      isEnabled: params.isEnabled ?? false, // Default: disabled
      isSystem: params.isSystem ?? false,
      dependsOn: params.dependsOn ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstructing from database
  static fromPersistence(data: FeatureFlagProps): FeatureFlag {
    return new FeatureFlag(data);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): FeatureFlagCategory {
    return this.props.category;
  }

  get isEnabled(): boolean {
    return this.props.isEnabled;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get dependsOn(): string[] {
    return [...this.props.dependsOn]; // Return copy to prevent mutation
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  /**
   * Enable this feature flag
   */
  enable(): FeatureFlag {
    if (this.props.isEnabled) {
      return this; // Already enabled, no change
    }

    return new FeatureFlag({
      ...this.props,
      isEnabled: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Disable this feature flag
   */
  disable(): FeatureFlag {
    if (!this.props.isEnabled) {
      return this; // Already disabled, no change
    }

    return new FeatureFlag({
      ...this.props,
      isEnabled: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Toggle the enabled state
   */
  toggle(): FeatureFlag {
    return new FeatureFlag({
      ...this.props,
      isEnabled: !this.props.isEnabled,
      updatedAt: new Date(),
    });
  }

  /**
   * Update feature flag metadata
   */
  update(params: {
    displayName?: string;
    description?: string;
    dependsOn?: string[];
  }): FeatureFlag {
    return new FeatureFlag({
      ...this.props,
      displayName: params.displayName?.trim() ?? this.props.displayName,
      description: params.description?.trim() ?? this.props.description,
      dependsOn: params.dependsOn ?? this.props.dependsOn,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if this feature depends on another feature
   */
  dependsOnFeature(featureName: string): boolean {
    return this.props.dependsOn.includes(featureName.toUpperCase());
  }

  /**
   * Check if this feature has any dependencies
   */
  hasDependencies(): boolean {
    return this.props.dependsOn.length > 0;
  }

  /**
   * Check if dependencies are satisfied
   * @param enabledFeatures Set of enabled feature names
   */
  areDependenciesSatisfied(enabledFeatures: Set<string>): boolean {
    return this.props.dependsOn.every((dep) => enabledFeatures.has(dep));
  }

  /**
   * Get unsatisfied dependencies
   * @param enabledFeatures Set of enabled feature names
   */
  getUnsatisfiedDependencies(enabledFeatures: Set<string>): string[] {
    return this.props.dependsOn.filter((dep) => !enabledFeatures.has(dep));
  }

  /**
   * Check if this is a critical system flag (e.g., MAINTENANCE_MODE)
   */
  isCriticalSystemFlag(): boolean {
    return this.props.isSystem && this.props.name === "MAINTENANCE_MODE";
  }

  /**
   * Export to plain object
   */
  toObject(): FeatureFlagProps {
    return { ...this.props, dependsOn: [...this.props.dependsOn] };
  }
}
