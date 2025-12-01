/**
 * Test Entity Fixtures for Universal Assets Import Tests
 *
 * Pre-seeded test data for all entity types.
 */

import type {
  MockPerson,
  MockVendor,
  MockAssetCategory,
  MockAssetModel,
  MockLocation,
  MockStockLocation,
  MockLifecycleState,
  MockAsset,
  MockAssetAssignment,
} from "../mocks/repositories.mock";

// ============================================================================
// Person Fixtures
// ============================================================================

export const PERSON_FIXTURES: MockPerson[] = [
  {
    id: "person-1",
    email: "john.doe@barq.com",
    firstName: "John",
    lastName: "Doe",
  },
  {
    id: "person-2",
    email: "jane.smith@barq.com",
    firstName: "Jane",
    lastName: "Smith",
  },
  {
    id: "person-3",
    email: "new.owner@barq.com",
    firstName: "New",
    lastName: "Owner",
  },
];

// ============================================================================
// Vendor Fixtures
// ============================================================================

export const VENDOR_FIXTURES: MockVendor[] = [
  {
    id: "vendor-dell",
    code: "DELL",
    name: "Dell Technologies",
    vendorType: "OTHER",
  },
  {
    id: "vendor-hp",
    code: "HP",
    name: "HP Inc.",
    vendorType: "OTHER",
  },
];

// ============================================================================
// Asset Category Fixtures
// ============================================================================

export const CATEGORY_FIXTURES: MockAssetCategory[] = [
  {
    id: "cat-laptop",
    code: "LAPTOP",
    name: "Laptop Computers",
  },
  {
    id: "cat-desktop",
    code: "DESKTOP",
    name: "Desktop Computers",
  },
];

// ============================================================================
// Asset Model Fixtures
// ============================================================================

export const MODEL_FIXTURES: MockAssetModel[] = [
  {
    id: "model-lat5520",
    code: "DELL-LAT-5520",
    name: "Dell Latitude 5520",
    vendorId: "vendor-dell",
    assetCategoryId: "cat-laptop",
    defaultWarrantyMonths: 36,
  },
];

// ============================================================================
// Location Fixtures
// ============================================================================

export const LOCATION_FIXTURES: MockLocation[] = [
  {
    id: "loc-ruh",
    code: "RUH-HQ",
    name: "Riyadh Headquarters",
    locationType: "BUILDING",
  },
];

// ============================================================================
// Stock Location Fixtures
// ============================================================================

export const STOCK_LOCATION_FIXTURES: MockStockLocation[] = [
  {
    id: "stock-ruh",
    code: "WH-RIYADH",
    name: "Riyadh IT Store",
    locationId: "loc-ruh",
  },
];

// ============================================================================
// Lifecycle State Fixtures
// ============================================================================

export const LIFECYCLE_STATE_FIXTURES: MockLifecycleState[] = [
  { id: "lc-inuse", code: "IN_USE", name: "In Use" },
  { id: "lc-instock", code: "IN_STOCK", name: "In Stock" },
  { id: "lc-retired", code: "RETIRED", name: "Retired" },
];

// ============================================================================
// Asset Fixtures
// ============================================================================

export const ASSET_FIXTURES: MockAsset[] = [
  {
    id: "asset-existing-1",
    serialNumber: "SN-EXISTING-001",
    assetTag: "EXIST-001",
    assetCategoryId: "cat-laptop",
    attributes: { ram_gb: 8 },
  },
];

// ============================================================================
// Assignment Fixtures
// ============================================================================

export const ASSIGNMENT_FIXTURES: MockAssetAssignment[] = [
  {
    id: "assign-1",
    assetId: "asset-existing-1",
    assigneeType: "PERSON",
    assigneeId: "person-1",
    startDate: new Date("2024-01-01"),
    endDate: null,
    isPrimary: true,
  },
];

// ============================================================================
// Seed All Fixtures Helper
// ============================================================================

import type { MockRepositories } from "../mocks/repositories.mock";

export function seedAllFixtures(repos: MockRepositories): void {
  repos.person.seed(PERSON_FIXTURES);
  repos.vendor.seed(VENDOR_FIXTURES);
  repos.assetCategory.seed(CATEGORY_FIXTURES);
  repos.assetModel.seed(MODEL_FIXTURES);
  repos.location.seed(LOCATION_FIXTURES);
  repos.stockLocation.seed(STOCK_LOCATION_FIXTURES);
  repos.lifecycleState.seed(LIFECYCLE_STATE_FIXTURES);
  repos.asset.seed(ASSET_FIXTURES);
  repos.assetAssignment.seed(ASSIGNMENT_FIXTURES);
}
