import type {
  ConfigurationItem,
  CriticalityEnum,
  EnvironmentEnum,
} from "../domain/entities/configuration-item.entity";

export interface CIDeletionDependencies {
  relationshipsFrom: number;
  relationshipsTo: number;
  impactingRelationshipsTo: number;
  activeRelationshipsTo: number;
  activeRelationshipsFrom: number;
}

export interface CIDeletionContext {
  ci: {
    id: string;
    ciKey: string | null;
    name: string;
    ciClassName: string | null;
    criticality: string | null;
    environment: string | null;
  };
  dependencies: CIDeletionDependencies;
  impactingRelationships: Array<{
    relationshipType: string;
    relatedCIKey: string;
    relatedCIName: string;
    isImpacting: boolean;
    isActive: boolean;
  }>;
}

/**
 * Configuration Item Repository Interface
 *
 * Defines the contract for persisting and retrieving configuration items.
 */
export interface IConfigurationItemRepository {
  /**
   * Create a new configuration item
   */
  create(ci: ConfigurationItem): Promise<ConfigurationItem>;

  /**
   * Find a CI by ID
   */
  findById(id: string): Promise<ConfigurationItem | null>;

  /**
   * Find all CIs
   */
  findAll(): Promise<ConfigurationItem[]>;

  /**
   * Find a CI by its unique business key
   */
  findByCiKey(ciKey: string): Promise<ConfigurationItem | null>;

  /**
   * Find CIs by CI class
   */
  findByCiClass(ciClassId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs linked to a specific asset
   */
  findByLinkedAsset(assetId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by primary owner (person)
   */
  findByOwnerPerson(personId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by primary owner (organizational unit)
   */
  findByOwnerOrgUnit(orgUnitId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by location
   */
  findByLocation(locationId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by criticality
   */
  findByCriticality(criticality: CriticalityEnum): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by environment
   */
  findByEnvironment(environment: EnvironmentEnum): Promise<ConfigurationItem[]>;

  /**
   * Find CIs by lifecycle state
   */
  findByLifecycleState(lifecycleStateId: string): Promise<ConfigurationItem[]>;

  /**
   * Find CIs without a linked asset
   */
  findUnlinked(): Promise<ConfigurationItem[]>;

  /**
   * Find CIs without an owner
   */
  findUnowned(): Promise<ConfigurationItem[]>;

  /**
   * Search configuration items by name, ciKey, or hostname
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      ciClassId?: string;
    },
  ): Promise<ConfigurationItem[]>;

  /**
   * Update an existing CI
   */
  update(ci: ConfigurationItem): Promise<ConfigurationItem>;

  /**
   * Delete a CI
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a CI key already exists
   */
  existsByCiKey(ciKey: string): Promise<boolean>;

  /**
   * Retrieve deletion context (dependencies + relationship impacts)
   */
  getDeletionContext(ciId: string): Promise<CIDeletionContext | null>;

  /**
   * Delete a CI and its relationships in a single transaction
   */
  deleteWithRelationships(ciId: string): Promise<void>;
}
