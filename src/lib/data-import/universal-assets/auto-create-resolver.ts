/**
 * Auto-Create Resolver for Universal Assets Importer
 *
 * Handles find-or-create logic for entities that can be auto-created:
 * Vendor, AssetCategory, AssetModel, Location, StockLocation
 *
 * Also handles lookup-only for: LifecycleState, Person
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services";
import { Vendor } from "@/core/domain/entities/vendor.entity";
import { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import { AssetModel } from "@/core/domain/entities/asset-model.entity";
import { Location } from "@/core/domain/entities/location.entity";
import { StockLocation } from "@/core/domain/entities/stock-location.entity";
import {
  VendorType,
  LocationType,
} from "@/core/domain/value-objects/foundation-enums";
import type {
  EntityCache,
  AutoCreateResult,
  VendorData,
  CategoryData,
  ModelData,
  LocationData,
  StockLocationData,
} from "./types";

/**
 * Generate a code from a name (slugify)
 */
function generateCodeFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Trim hyphens
    .substring(0, 50); // Max 50 chars
}

/**
 * Auto-Create Resolver class
 * Manages entity resolution and creation with caching
 */
export class AutoCreateResolver {
  private cache: EntityCache;
  private logger: ILoggerService;
  private autoCreated: AutoCreateResult[] = [];

  constructor() {
    this.cache = {
      vendors: new Map(),
      categories: new Map(),
      models: new Map(),
      locations: new Map(),
      stockLocations: new Map(),
      lifecycleStates: new Map(),
      persons: new Map(),
      fieldDefinitions: new Map(),
    };
    const container = getContainer();
    this.logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  }

  /**
   * Get all auto-created entities for reporting
   */
  getAutoCreatedEntities(): AutoCreateResult[] {
    return this.autoCreated;
  }

  /**
   * Pre-load persons by emails for batch lookup
   */
  async preloadPersons(emails: string[]): Promise<void> {
    if (emails.length === 0) return;

    const container = getContainer();
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();
      if (this.cache.persons.has(normalizedEmail)) continue;

      const person = await personRepo.findByEmail(normalizedEmail);
      if (person) {
        this.cache.persons.set(normalizedEmail, person.id);
      }
    }
  }

  /**
   * Resolve person by email (lookup only, no auto-create)
   */
  async resolvePerson(
    email: string,
  ): Promise<{ id: string | null; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check cache first
    if (this.cache.persons.has(normalizedEmail)) {
      return { id: this.cache.persons.get(normalizedEmail)! };
    }

    // Lookup in database
    const container = getContainer();
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    const person = await personRepo.findByEmail(normalizedEmail);
    if (person) {
      this.cache.persons.set(normalizedEmail, person.id);
      return { id: person.id };
    }

    return {
      id: null,
      error: `Person with email "${email}" not found. Persons must exist before import.`,
    };
  }

  /**
   * Resolve or create vendor
   */
  async resolveOrCreateVendor(
    data: VendorData,
  ): Promise<{ id: string | null; error?: string }> {
    // Need at least code or name
    const lookupKey = data.code || data.name;
    if (!lookupKey) {
      return { id: null }; // No vendor data provided
    }

    const normalizedKey = String(lookupKey).toLowerCase().trim();

    // Check cache
    if (this.cache.vendors.has(normalizedKey)) {
      return { id: this.cache.vendors.get(normalizedKey)! };
    }

    const container = getContainer();
    const vendorRepo = container.get<IVendorRepository>(
      DI_TOKENS.IVendorRepository,
    );

    // Try to find by code first
    if (data.code) {
      const existing = await vendorRepo.findByCode(data.code);
      if (existing) {
        this.cache.vendors.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Try to find by name
    if (data.name) {
      const existing = await vendorRepo.findByName(data.name);
      if (existing) {
        this.cache.vendors.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Not found - create new vendor
    try {
      const code = data.code || generateCodeFromName(data.name || "VENDOR");
      const name = data.name || code;

      const vendor = Vendor.create({
        code,
        name,
        vendorType: VendorType.OTHER,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
      });

      const created = await vendorRepo.create(vendor);

      this.cache.vendors.set(normalizedKey, created.id);
      this.autoCreated.push({
        entityType: "Vendor",
        identifier: code,
        action: "created",
        id: created.id,
      });

      this.logger.info("Auto-created vendor", { code, name, id: created.id });

      return { id: created.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.autoCreated.push({
        entityType: "Vendor",
        identifier: String(lookupKey),
        action: "failed",
        error: errorMessage,
      });
      return { id: null, error: `Failed to create vendor: ${errorMessage}` };
    }
  }

  /**
   * Resolve or create asset category
   */
  async resolveOrCreateCategory(
    data: CategoryData,
  ): Promise<{ id: string | null; error?: string }> {
    const lookupKey = data.code || data.name;
    if (!lookupKey) {
      return { id: null, error: "Category code or name is required" };
    }

    const normalizedKey = String(lookupKey).toLowerCase().trim();

    // Check cache
    if (this.cache.categories.has(normalizedKey)) {
      return { id: this.cache.categories.get(normalizedKey)! };
    }

    const container = getContainer();
    const categoryRepo = container.get<IAssetCategoryRepository>(
      DI_TOKENS.IAssetCategoryRepository,
    );

    // Try to find by code first
    if (data.code) {
      const existing = await categoryRepo.findByCode(data.code);
      if (existing) {
        this.cache.categories.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Try to find by name
    if (data.name) {
      const existing = await categoryRepo.findByName(data.name);
      if (existing) {
        this.cache.categories.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Not found - create new category
    try {
      const code = data.code || generateCodeFromName(data.name || "CATEGORY");
      const name = data.name || code;

      const category = AssetCategory.create({
        code,
        name,
        description: data.description || undefined,
        isConsumable:
          data.isConsumable === true ||
          data.isConsumable === "true" ||
          data.isConsumable === "yes",
      });

      const created = await categoryRepo.create(category);

      this.cache.categories.set(normalizedKey, created.id);
      this.autoCreated.push({
        entityType: "AssetCategory",
        identifier: code,
        action: "created",
        id: created.id,
      });

      this.logger.info("Auto-created category", {
        code,
        name,
        id: created.id,
      });

      return { id: created.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.autoCreated.push({
        entityType: "AssetCategory",
        identifier: String(lookupKey),
        action: "failed",
        error: errorMessage,
      });
      return { id: null, error: `Failed to create category: ${errorMessage}` };
    }
  }

  /**
   * Resolve or create asset model
   * Requires vendorId and categoryId to be resolved first
   */
  async resolveOrCreateModel(
    data: ModelData,
    vendorId: string | undefined,
    categoryId: string | undefined,
  ): Promise<{ id: string | null; error?: string }> {
    const lookupKey = data.code || data.name;
    if (!lookupKey) {
      return { id: null }; // No model data provided
    }

    // Model requires both vendor and category
    if (!vendorId || !categoryId) {
      return {
        id: null,
        error: "Model requires both vendor and category to be resolved first",
      };
    }

    const normalizedKey = String(lookupKey).toLowerCase().trim();

    // Check cache
    if (this.cache.models.has(normalizedKey)) {
      return { id: this.cache.models.get(normalizedKey)! };
    }

    const container = getContainer();
    const modelRepo = container.get<IAssetModelRepository>(
      DI_TOKENS.IAssetModelRepository,
    );

    // Try to find by code first
    if (data.code) {
      const existing = await modelRepo.findByCode(data.code);
      if (existing) {
        this.cache.models.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Not found - create new model
    try {
      const code = data.code || generateCodeFromName(data.name || "MODEL");
      const name = data.name || code;

      const model = AssetModel.create({
        code,
        name,
        description: data.description || undefined,
        vendorId,
        assetCategoryId: categoryId,
        defaultWarrantyMonths: data.defaultWarrantyMonths
          ? Number(data.defaultWarrantyMonths)
          : undefined,
      });

      const created = await modelRepo.create(model);

      this.cache.models.set(normalizedKey, created.id);
      this.autoCreated.push({
        entityType: "AssetModel",
        identifier: code,
        action: "created",
        id: created.id,
      });

      this.logger.info("Auto-created model", { code, name, id: created.id });

      return { id: created.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.autoCreated.push({
        entityType: "AssetModel",
        identifier: String(lookupKey),
        action: "failed",
        error: errorMessage,
      });
      return { id: null, error: `Failed to create model: ${errorMessage}` };
    }
  }

  /**
   * Resolve or create location
   */
  async resolveOrCreateLocation(
    data: LocationData,
  ): Promise<{ id: string | null; error?: string }> {
    const lookupKey = data.code || data.name;
    if (!lookupKey) {
      return { id: null }; // No location data provided
    }

    const normalizedKey = String(lookupKey).toLowerCase().trim();

    // Check cache
    if (this.cache.locations.has(normalizedKey)) {
      return { id: this.cache.locations.get(normalizedKey)! };
    }

    const container = getContainer();
    const locationRepo = container.get<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
    );

    // Try to find by code first
    if (data.code) {
      const existing = await locationRepo.findByCode(data.code);
      if (existing) {
        this.cache.locations.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Not found - create new location
    try {
      const code = data.code || generateCodeFromName(data.name || "LOCATION");
      const name = data.name || code;

      const location = Location.create({
        code,
        name,
        description: data.description || undefined,
        locationType: LocationType.BUILDING,
      });

      const created = await locationRepo.create(location);

      this.cache.locations.set(normalizedKey, created.id);
      this.autoCreated.push({
        entityType: "Location",
        identifier: code,
        action: "created",
        id: created.id,
      });

      this.logger.info("Auto-created location", { code, name, id: created.id });

      return { id: created.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.autoCreated.push({
        entityType: "Location",
        identifier: String(lookupKey),
        action: "failed",
        error: errorMessage,
      });
      return { id: null, error: `Failed to create location: ${errorMessage}` };
    }
  }

  /**
   * Resolve or create stock location
   */
  async resolveOrCreateStockLocation(
    data: StockLocationData,
    locationId?: string,
  ): Promise<{ id: string | null; error?: string }> {
    const lookupKey = data.code || data.name;
    if (!lookupKey) {
      return { id: null }; // No stock location data provided
    }

    const normalizedKey = String(lookupKey).toLowerCase().trim();

    // Check cache
    if (this.cache.stockLocations.has(normalizedKey)) {
      return { id: this.cache.stockLocations.get(normalizedKey)! };
    }

    const container = getContainer();
    const stockLocationRepo = container.get<IStockLocationRepository>(
      DI_TOKENS.IStockLocationRepository,
    );

    // Try to find by code first
    if (data.code) {
      const existing = await stockLocationRepo.findByCode(data.code);
      if (existing) {
        this.cache.stockLocations.set(normalizedKey, existing.id);
        return { id: existing.id };
      }
    }

    // Not found - create new stock location
    try {
      const code =
        data.code || generateCodeFromName(data.name || "STOCK-LOCATION");
      const name = data.name || code;

      const stockLocation = StockLocation.create({
        code,
        name,
        description: data.description || undefined,
        locationId: locationId || undefined,
      });

      const created = await stockLocationRepo.create(stockLocation);

      this.cache.stockLocations.set(normalizedKey, created.id);
      this.autoCreated.push({
        entityType: "StockLocation",
        identifier: code,
        action: "created",
        id: created.id,
      });

      this.logger.info("Auto-created stock location", {
        code,
        name,
        id: created.id,
      });

      return { id: created.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.autoCreated.push({
        entityType: "StockLocation",
        identifier: String(lookupKey),
        action: "failed",
        error: errorMessage,
      });
      return {
        id: null,
        error: `Failed to create stock location: ${errorMessage}`,
      };
    }
  }

  /**
   * Lookup lifecycle state (no auto-create)
   */
  async lookupLifecycleState(
    code: string | undefined,
  ): Promise<{ id: string | null }> {
    if (!code) {
      return { id: null };
    }

    const normalizedCode = String(code).toUpperCase().trim();

    // Check cache
    if (this.cache.lifecycleStates.has(normalizedCode)) {
      return { id: this.cache.lifecycleStates.get(normalizedCode)! };
    }

    const container = getContainer();
    const lifecycleStateRepo = container.get<ILifecycleStateRepository>(
      DI_TOKENS.ILifecycleStateRepository,
    );

    // Lifecycle states are scoped to a model, but for simplicity we search all
    // This might need refinement based on the category's lifecycle model
    const allStates = await lifecycleStateRepo.findAll();
    const matchingState = allStates.find(
      (s) => s.code.toUpperCase() === normalizedCode,
    );

    if (matchingState) {
      this.cache.lifecycleStates.set(normalizedCode, matchingState.id);
      return { id: matchingState.id };
    }

    // Not found - return null (no auto-create for lifecycle states)
    return { id: null };
  }

  /**
   * Get cache for field definitions
   */
  getFieldDefinitionCache(): Map<string, string> {
    return this.cache.fieldDefinitions;
  }

  /**
   * Add to field definition cache
   */
  addToFieldDefinitionCache(name: string, id: string): void {
    this.cache.fieldDefinitions.set(name.toLowerCase(), id);
  }

  /**
   * Get summary of auto-created entities
   */
  getAutoCreateSummary(): {
    vendors: number;
    categories: number;
    models: number;
    locations: number;
    stockLocations: number;
    fieldDefinitions: number;
  } {
    const summary = {
      vendors: 0,
      categories: 0,
      models: 0,
      locations: 0,
      stockLocations: 0,
      fieldDefinitions: 0,
    };

    for (const result of this.autoCreated) {
      if (result.action !== "created") continue;

      switch (result.entityType) {
        case "Vendor":
          summary.vendors++;
          break;
        case "AssetCategory":
          summary.categories++;
          break;
        case "AssetModel":
          summary.models++;
          break;
        case "Location":
          summary.locations++;
          break;
        case "StockLocation":
          summary.stockLocations++;
          break;
        case "FieldDefinition":
          summary.fieldDefinitions++;
          break;
      }
    }

    return summary;
  }
}
