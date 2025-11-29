/**
 * Mock Repository Implementations for Universal Assets Import Tests
 *
 * Each mock uses in-memory Map storage with test helpers (clear, seed, getAll).
 */

import { vi } from "vitest";

// ============================================================================
// Mock Person Repository
// ============================================================================

export interface MockPerson {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function createMockPersonRepository() {
  const store = new Map<string, MockPerson>();

  return {
    store,
    findByEmail: vi.fn(async (email: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      for (const person of store.values()) {
        if (person.email && person.email.toLowerCase() === normalizedEmail) {
          return person;
        }
      }
      return null;
    }),
    findById: vi.fn(async (id: string) => {
      return store.get(id) || null;
    }),
    // Test helpers
    seed: (persons: MockPerson[]) => {
      for (const person of persons) {
        store.set(person.id, person);
      }
    },
    clear: () => store.clear(),
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Vendor Repository
// ============================================================================

export interface MockVendor {
  id: string;
  code: string;
  name: string;
  vendorType?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

export function createMockVendorRepository() {
  const store = new Map<string, MockVendor>();
  let idCounter = 1;

  return {
    store,
    findByCode: vi.fn(async (code: string) => {
      for (const vendor of store.values()) {
        if (vendor.code && vendor.code.toLowerCase() === code.toLowerCase()) {
          return vendor;
        }
      }
      return null;
    }),
    findByName: vi.fn(async (name: string) => {
      for (const vendor of store.values()) {
        if (vendor.name && vendor.name.toLowerCase() === name.toLowerCase()) {
          return vendor;
        }
      }
      return null;
    }),
    create: vi.fn(async (vendor: Omit<MockVendor, "id"> & { id?: string }) => {
      const created = {
        ...vendor,
        id: vendor.id || `vendor-${idCounter++}`,
      };
      store.set(created.id, created);
      return created;
    }),
    // Test helpers
    seed: (vendors: MockVendor[]) => {
      for (const vendor of vendors) {
        store.set(vendor.id, vendor);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Asset Category Repository
// ============================================================================

export interface MockAssetCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export function createMockAssetCategoryRepository() {
  const store = new Map<string, MockAssetCategory>();
  let idCounter = 1;

  return {
    store,
    findByCode: vi.fn(async (code: string) => {
      for (const category of store.values()) {
        if (
          category.code &&
          category.code.toLowerCase() === code.toLowerCase()
        ) {
          return category;
        }
      }
      return null;
    }),
    findByName: vi.fn(async (name: string) => {
      for (const category of store.values()) {
        if (
          category.name &&
          category.name.toLowerCase() === name.toLowerCase()
        ) {
          return category;
        }
      }
      return null;
    }),
    create: vi.fn(
      async (category: Omit<MockAssetCategory, "id"> & { id?: string }) => {
        const created = {
          ...category,
          id: category.id || `category-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (categories: MockAssetCategory[]) => {
      for (const category of categories) {
        store.set(category.id, category);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Asset Model Repository
// ============================================================================

export interface MockAssetModel {
  id: string;
  code: string;
  name: string;
  description?: string;
  vendorId: string;
  assetCategoryId: string;
  defaultWarrantyMonths?: number;
}

export function createMockAssetModelRepository() {
  const store = new Map<string, MockAssetModel>();
  let idCounter = 1;

  return {
    store,
    findByCode: vi.fn(async (code: string) => {
      for (const model of store.values()) {
        if (model.code && model.code.toLowerCase() === code.toLowerCase()) {
          return model;
        }
      }
      return null;
    }),
    create: vi.fn(
      async (model: Omit<MockAssetModel, "id"> & { id?: string }) => {
        const created = {
          ...model,
          id: model.id || `model-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (models: MockAssetModel[]) => {
      for (const model of models) {
        store.set(model.id, model);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Location Repository
// ============================================================================

export interface MockLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  locationType?: string;
}

export function createMockLocationRepository() {
  const store = new Map<string, MockLocation>();
  let idCounter = 1;

  return {
    store,
    findByCode: vi.fn(async (code: string) => {
      for (const location of store.values()) {
        if (
          location.code &&
          location.code.toLowerCase() === code.toLowerCase()
        ) {
          return location;
        }
      }
      return null;
    }),
    create: vi.fn(
      async (location: Omit<MockLocation, "id"> & { id?: string }) => {
        const created = {
          ...location,
          id: location.id || `location-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (locations: MockLocation[]) => {
      for (const location of locations) {
        store.set(location.id, location);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Stock Location Repository
// ============================================================================

export interface MockStockLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  locationId?: string;
}

export function createMockStockLocationRepository() {
  const store = new Map<string, MockStockLocation>();
  let idCounter = 1;

  return {
    store,
    findByCode: vi.fn(async (code: string) => {
      for (const stockLocation of store.values()) {
        if (
          stockLocation.code &&
          stockLocation.code.toLowerCase() === code.toLowerCase()
        ) {
          return stockLocation;
        }
      }
      return null;
    }),
    create: vi.fn(
      async (
        stockLocation: Omit<MockStockLocation, "id"> & { id?: string },
      ) => {
        const created = {
          ...stockLocation,
          id: stockLocation.id || `stock-location-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (stockLocations: MockStockLocation[]) => {
      for (const stockLocation of stockLocations) {
        store.set(stockLocation.id, stockLocation);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Lifecycle State Repository
// ============================================================================

export interface MockLifecycleState {
  id: string;
  code: string;
  name: string;
}

export function createMockLifecycleStateRepository() {
  const store = new Map<string, MockLifecycleState>();

  return {
    store,
    findAll: vi.fn(async () => Array.from(store.values())),
    // Test helpers
    seed: (states: MockLifecycleState[]) => {
      for (const state of states) {
        store.set(state.id, state);
      }
    },
    clear: () => store.clear(),
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Asset Repository
// ============================================================================

export interface MockAsset {
  id: string;
  serialNumber: string;
  assetTag: string;
  assetCategoryId: string;
  assetModelId?: string;
  vendorId?: string;
  currentStockLocationId?: string;
  lifecycleStateId?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currency?: string;
  condition?: string;
  note?: string;
  attributes?: Record<string, unknown>;
}

export function createMockAssetRepository() {
  const store = new Map<string, MockAsset>();
  let idCounter = 1;

  return {
    store,
    findBySerialNumber: vi.fn(async (serialNumber: string) => {
      for (const asset of store.values()) {
        if (asset.serialNumber === serialNumber) {
          return asset;
        }
      }
      return null;
    }),
    create: vi.fn(async (asset: Omit<MockAsset, "id"> & { id?: string }) => {
      const created = {
        ...asset,
        id: asset.id || `asset-${idCounter++}`,
      };
      store.set(created.id, created);
      return created;
    }),
    update: vi.fn(async (asset: MockAsset) => {
      store.set(asset.id, asset);
      return asset;
    }),
    // Test helpers
    seed: (assets: MockAsset[]) => {
      for (const asset of assets) {
        store.set(asset.id, asset);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Asset Assignment Repository
// ============================================================================

export interface MockAssetAssignment {
  id: string;
  assetId: string;
  assigneeType: "PERSON" | "ORGANIZATION_UNIT" | "DEPARTMENT";
  assigneeId: string;
  startDate: Date;
  endDate: Date | null;
  isPrimary: boolean;
  update?: (data: Partial<MockAssetAssignment>) => void;
}

// Helper to create a mock assignment with update method (mimics domain entity)
function createMockAssignmentWithUpdate(
  data: Omit<MockAssetAssignment, "update">,
): MockAssetAssignment {
  const assignment: MockAssetAssignment = {
    ...data,
    update: function (updateData: Partial<MockAssetAssignment>) {
      Object.assign(this, updateData);
    },
  };
  return assignment;
}

export function createMockAssetAssignmentRepository() {
  const store = new Map<string, MockAssetAssignment>();
  let idCounter = 1;

  return {
    store,
    findActiveByAsset: vi.fn(async (assetId: string) => {
      const results: MockAssetAssignment[] = [];
      for (const assignment of store.values()) {
        if (assignment.assetId === assetId && assignment.endDate === null) {
          // Return with update method to mimic domain entity
          results.push(createMockAssignmentWithUpdate(assignment));
        }
      }
      return results;
    }),
    create: vi.fn(
      async (
        assignment: Omit<MockAssetAssignment, "id" | "update"> & {
          id?: string;
        },
      ) => {
        const created = createMockAssignmentWithUpdate({
          ...assignment,
          id: assignment.id || `assignment-${idCounter++}`,
        } as Omit<MockAssetAssignment, "update">);
        store.set(created.id, created);
        return created;
      },
    ),
    update: vi.fn(async (assignment: MockAssetAssignment) => {
      store.set(assignment.id, assignment);
      return assignment;
    }),
    // Test helpers
    seed: (assignments: Array<Omit<MockAssetAssignment, "update">>) => {
      for (const assignment of assignments) {
        const withUpdate = createMockAssignmentWithUpdate(assignment);
        store.set(withUpdate.id, withUpdate);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Field Definition Repository
// ============================================================================

export interface MockFieldDefinition {
  id: string;
  name: string;
  label: string;
  dataType: string;
  entityType: string;
  isGlobal: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
}

export function createMockFieldDefinitionRepository() {
  const store = new Map<string, MockFieldDefinition>();
  let idCounter = 1;

  return {
    store,
    findAll: vi.fn(async () => Array.from(store.values())),
    findByName: vi.fn(async (name: string) => {
      for (const fieldDef of store.values()) {
        if (
          fieldDef.name &&
          fieldDef.name.toLowerCase() === name.toLowerCase()
        ) {
          return fieldDef;
        }
      }
      return null;
    }),
    create: vi.fn(
      async (fieldDef: Omit<MockFieldDefinition, "id"> & { id?: string }) => {
        const created = {
          ...fieldDef,
          id: fieldDef.id || `field-def-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (fieldDefs: MockFieldDefinition[]) => {
      for (const fieldDef of fieldDefs) {
        store.set(fieldDef.id, fieldDef);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// Mock Asset Category Field Repository
// ============================================================================

export interface MockAssetCategoryField {
  id: string;
  assetCategoryId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  uiOrder: number;
}

export function createMockAssetCategoryFieldRepository() {
  const store = new Map<string, MockAssetCategoryField>();
  let idCounter = 1;

  return {
    store,
    findByAssetCategoryAndFieldDefinition: vi.fn(
      async (categoryId: string, fieldDefinitionId: string) => {
        for (const link of store.values()) {
          if (
            link.assetCategoryId === categoryId &&
            link.fieldDefinitionId === fieldDefinitionId
          ) {
            return link;
          }
        }
        return null;
      },
    ),
    create: vi.fn(
      async (
        categoryField: Omit<MockAssetCategoryField, "id"> & { id?: string },
      ) => {
        const created = {
          ...categoryField,
          id: categoryField.id || `cat-field-${idCounter++}`,
        };
        store.set(created.id, created);
        return created;
      },
    ),
    // Test helpers
    seed: (categoryFields: MockAssetCategoryField[]) => {
      for (const categoryField of categoryFields) {
        store.set(categoryField.id, categoryField);
      }
    },
    clear: () => {
      store.clear();
      idCounter = 1;
    },
    getAll: () => Array.from(store.values()),
  };
}

// ============================================================================
// All Repositories Type
// ============================================================================

export interface MockRepositories {
  person: ReturnType<typeof createMockPersonRepository>;
  vendor: ReturnType<typeof createMockVendorRepository>;
  assetCategory: ReturnType<typeof createMockAssetCategoryRepository>;
  assetModel: ReturnType<typeof createMockAssetModelRepository>;
  location: ReturnType<typeof createMockLocationRepository>;
  stockLocation: ReturnType<typeof createMockStockLocationRepository>;
  lifecycleState: ReturnType<typeof createMockLifecycleStateRepository>;
  asset: ReturnType<typeof createMockAssetRepository>;
  assetAssignment: ReturnType<typeof createMockAssetAssignmentRepository>;
  fieldDefinition: ReturnType<typeof createMockFieldDefinitionRepository>;
  assetCategoryField: ReturnType<typeof createMockAssetCategoryFieldRepository>;
}

export function createAllMockRepositories(): MockRepositories {
  return {
    person: createMockPersonRepository(),
    vendor: createMockVendorRepository(),
    assetCategory: createMockAssetCategoryRepository(),
    assetModel: createMockAssetModelRepository(),
    location: createMockLocationRepository(),
    stockLocation: createMockStockLocationRepository(),
    lifecycleState: createMockLifecycleStateRepository(),
    asset: createMockAssetRepository(),
    assetAssignment: createMockAssetAssignmentRepository(),
    fieldDefinition: createMockFieldDefinitionRepository(),
    assetCategoryField: createMockAssetCategoryFieldRepository(),
  };
}

export function clearAllMockRepositories(repos: MockRepositories): void {
  repos.person.clear();
  repos.vendor.clear();
  repos.assetCategory.clear();
  repos.assetModel.clear();
  repos.location.clear();
  repos.stockLocation.clear();
  repos.lifecycleState.clear();
  repos.asset.clear();
  repos.assetAssignment.clear();
  repos.fieldDefinition.clear();
  repos.assetCategoryField.clear();
}
