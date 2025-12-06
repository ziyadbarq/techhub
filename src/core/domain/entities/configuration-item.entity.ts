/**
 * ConfigurationItem Entity
 *
 * Represents a configuration item (CI) in the CMDB.
 * CIs are trackable IT assets or components (servers, applications, services, etc.).
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type CriticalityEnum = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EnvironmentEnum = "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER";

export interface ConfigurationItemProps {
  id: string;
  name: string;
  ciClassId: string;
  lifecycleStateId: string | null;
  criticality: CriticalityEnum | null;
  environment: EnvironmentEnum | null;
  primaryOwnerPersonId: string | null;
  primaryOwnerOrgUnitId: string | null;
  locationId: string | null;
  linkedAssetId: string | null;
  ciKey: string | null;
  description: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConfigurationItemProps {
  name: string;
  ciClassId: string;
  lifecycleStateId?: string | null;
  criticality?: CriticalityEnum | null;
  environment?: EnvironmentEnum | null;
  primaryOwnerPersonId?: string | null;
  primaryOwnerOrgUnitId?: string | null;
  locationId?: string | null;
  linkedAssetId?: string | null;
  ciKey?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
}

export interface UpdateConfigurationItemProps {
  name?: string;
  lifecycleStateId?: string | null;
  criticality?: CriticalityEnum | null;
  environment?: EnvironmentEnum | null;
  primaryOwnerPersonId?: string | null;
  primaryOwnerOrgUnitId?: string | null;
  locationId?: string | null;
  linkedAssetId?: string | null;
  ciKey?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
}

export class ConfigurationItem {
  private constructor(private props: ConfigurationItemProps) {
    this.validate();
  }

  /**
   * Factory method to create a new Configuration Item
   */
  static create(
    props: CreateConfigurationItemProps,
    idGenerator: IIdGenerator,
  ): ConfigurationItem {
    // Validation
    this.validateName(props.name);

    if (!props.ciClassId?.trim()) {
      throw new Error("CI Class ID is required");
    }

    if (props.ciKey) {
      this.validateCiKey(props.ciKey);
    }

    if (props.criticality) {
      this.validateCriticality(props.criticality);
    }

    if (props.environment) {
      this.validateEnvironment(props.environment);
    }

    const now = new Date();

    return new ConfigurationItem({
      id: idGenerator.generateId(),
      name: props.name.trim(),
      ciClassId: props.ciClassId,
      lifecycleStateId: props.lifecycleStateId ?? null,
      criticality: props.criticality ?? null,
      environment: props.environment ?? null,
      primaryOwnerPersonId: props.primaryOwnerPersonId ?? null,
      primaryOwnerOrgUnitId: props.primaryOwnerOrgUnitId ?? null,
      locationId: props.locationId ?? null,
      linkedAssetId: props.linkedAssetId ?? null,
      ciKey: props.ciKey?.trim() || null,
      description: props.description?.trim() || null,
      attributes: props.attributes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing CI from persistence
   */
  static reconstitute(props: ConfigurationItemProps): ConfigurationItem {
    return new ConfigurationItem(props);
  }

  /**
   * Update CI properties
   */
  update(props: UpdateConfigurationItemProps): void {
    if (props.name !== undefined) {
      ConfigurationItem.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.lifecycleStateId !== undefined) {
      this.props.lifecycleStateId = props.lifecycleStateId;
    }

    if (props.criticality !== undefined) {
      if (props.criticality) {
        ConfigurationItem.validateCriticality(props.criticality);
      }
      this.props.criticality = props.criticality;
    }

    if (props.environment !== undefined) {
      if (props.environment) {
        ConfigurationItem.validateEnvironment(props.environment);
      }
      this.props.environment = props.environment;
    }

    if (props.primaryOwnerPersonId !== undefined) {
      this.props.primaryOwnerPersonId = props.primaryOwnerPersonId;
    }

    if (props.primaryOwnerOrgUnitId !== undefined) {
      this.props.primaryOwnerOrgUnitId = props.primaryOwnerOrgUnitId;
    }

    if (props.locationId !== undefined) {
      this.props.locationId = props.locationId;
    }

    if (props.linkedAssetId !== undefined) {
      this.props.linkedAssetId = props.linkedAssetId;
    }

    if (props.ciKey !== undefined) {
      if (props.ciKey) {
        ConfigurationItem.validateCiKey(props.ciKey);
      }
      this.props.ciKey = props.ciKey?.trim() || null;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.attributes !== undefined) {
      this.props.attributes = props.attributes;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Link this CI to a physical asset
   */
  linkToAsset(assetId: string): void {
    if (!assetId?.trim()) {
      throw new Error("Asset ID is required");
    }
    this.props.linkedAssetId = assetId;
    this.props.updatedAt = new Date();
  }

  /**
   * Unlink this CI from its physical asset
   */
  unlinkFromAsset(): void {
    this.props.linkedAssetId = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Assign primary owner (person)
   */
  assignOwner(personId: string): void {
    if (!personId?.trim()) {
      throw new Error("Person ID is required");
    }
    this.props.primaryOwnerPersonId = personId;
    this.props.primaryOwnerOrgUnitId = null; // Clear org unit owner
    this.props.updatedAt = new Date();
  }

  /**
   * Assign primary owner (organizational unit)
   */
  assignOwnerOrgUnit(orgUnitId: string): void {
    if (!orgUnitId?.trim()) {
      throw new Error("Organizational Unit ID is required");
    }
    this.props.primaryOwnerOrgUnitId = orgUnitId;
    this.props.primaryOwnerPersonId = null; // Clear person owner
    this.props.updatedAt = new Date();
  }

  /**
   * Check if CI has an owner assigned
   */
  hasOwner(): boolean {
    return !!(
      this.props.primaryOwnerPersonId || this.props.primaryOwnerOrgUnitId
    );
  }

  /**
   * Check if CI is linked to a physical asset
   */
  isLinkedToAsset(): boolean {
    return !!this.props.linkedAssetId;
  }

  /**
   * Validate name format
   */
  static validateName(name: string): void {
    if (!name?.trim()) {
      throw new Error("CI name is required");
    }
    if (name.trim().length < 2) {
      throw new Error("CI name must be at least 2 characters");
    }
    if (name.trim().length > 255) {
      throw new Error("CI name must not exceed 255 characters");
    }
  }

  /**
   * Validate CI key format (unique business key like hostname)
   */
  static validateCiKey(ciKey: string): void {
    if (!ciKey?.trim()) {
      return; // ciKey is optional
    }

    const trimmedKey = ciKey.trim();
    if (trimmedKey.length < 2) {
      throw new Error("CI key must be at least 2 characters");
    }
    if (trimmedKey.length > 100) {
      throw new Error("CI key must not exceed 100 characters");
    }

    // Allow alphanumeric, hyphens, underscores, dots
    const keyPattern = /^[a-zA-Z0-9._-]+$/;
    if (!keyPattern.test(trimmedKey)) {
      throw new Error(
        "CI key must contain only alphanumeric characters, dots, hyphens, and underscores",
      );
    }
  }

  /**
   * Validate criticality enum
   */
  static validateCriticality(criticality: CriticalityEnum): void {
    const validValues: CriticalityEnum[] = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];
    if (!validValues.includes(criticality)) {
      throw new Error(`Invalid criticality: ${criticality}`);
    }
  }

  /**
   * Validate environment enum
   */
  static validateEnvironment(environment: EnvironmentEnum): void {
    const validValues: EnvironmentEnum[] = [
      "PROD",
      "UAT",
      "DEV",
      "DR",
      "TEST",
      "OTHER",
    ];
    if (!validValues.includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }
  }

  /**
   * Validate entity properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("CI ID is required");
    }
    ConfigurationItem.validateName(this.props.name);
    if (!this.props.ciClassId) {
      throw new Error("CI Class ID is required");
    }
    if (this.props.ciKey) {
      ConfigurationItem.validateCiKey(this.props.ciKey);
    }
    if (this.props.criticality) {
      ConfigurationItem.validateCriticality(this.props.criticality);
    }
    if (this.props.environment) {
      ConfigurationItem.validateEnvironment(this.props.environment);
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get ciClassId(): string {
    return this.props.ciClassId;
  }

  get lifecycleStateId(): string | null {
    return this.props.lifecycleStateId;
  }

  get criticality(): CriticalityEnum | null {
    return this.props.criticality;
  }

  get environment(): EnvironmentEnum | null {
    return this.props.environment;
  }

  get primaryOwnerPersonId(): string | null {
    return this.props.primaryOwnerPersonId;
  }

  get primaryOwnerOrgUnitId(): string | null {
    return this.props.primaryOwnerOrgUnitId;
  }

  get locationId(): string | null {
    return this.props.locationId;
  }

  get linkedAssetId(): string | null {
    return this.props.linkedAssetId;
  }

  get ciKey(): string | null {
    return this.props.ciKey;
  }

  get description(): string | null {
    return this.props.description;
  }

  get attributes(): Record<string, unknown> | null {
    return this.props.attributes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Convert entity to plain object for persistence
   */
  toObject(): ConfigurationItemProps {
    return { ...this.props };
  }
}
