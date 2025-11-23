/**
 * Entity Configurations for Universal Data Importer
 *
 * Defines import configurations for all entities in the system.
 * Each configuration includes field definitions, validation rules,
 * lookup mappings, and bulk import actions.
 */

import type { EntityConfig } from "./entity-config.types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { bulkCreateAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";

/**
 * Complete entity configurations registry
 */
export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  // ========================================
  // ASSET
  // ========================================
  ASSET: {
    key: "ASSET",
    name: "Assets",
    tableName: "Asset",
    description: "IT assets, hardware, and equipment",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.ASSETS_CREATE,
    viewPermission: PERMISSIONS.ASSETS_VIEW,
    uniqueFields: ["assetTag"],
    requiredFields: ["assetTag", "assetCategoryId"],
    lookupFields: [
      "assetCategoryId",
      "assetModelId",
      "vendorId",
      "currentStockLocationId",
      "lifecycleStateId",
    ],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateAssetsAction,
    icon: "Package",
    color: "#3b82f6",
    fields: [
      {
        name: "assetTag",
        label: "Asset Tag",
        type: "string",
        required: true,
        unique: true,
        maxLength: 50,
        pattern: /^[A-Z0-9-]+$/,
        sanitization: [
          { operation: "trim" },
          { operation: "uppercase" },
          { operation: "normalizeWhitespace" },
        ],
        examples: ["LAP-001", "SRV-042", "MON-123"],
        description: "Unique asset identifier",
        autoMap: ["asset_tag", "tag", "asset_id", "assetId"],
      },
      {
        name: "assetCategoryId",
        label: "Asset Category Code",
        type: "lookup",
        required: true,
        lookupTarget: "AssetCategory",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["LAPTOP", "SERVER", "MONITOR"],
        description: "Asset category code from system",
        autoMap: ["category", "category_code", "assetCategory"],
      },
      {
        name: "assetModelId",
        label: "Asset Model Code",
        type: "lookup",
        required: false,
        lookupTarget: "AssetModel",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["DELL-LAT-7490", "HP-ELITE-G8"],
        description: "Asset model code from system",
        autoMap: ["model", "model_code", "assetModel"],
      },
      {
        name: "vendorId",
        label: "Vendor Code",
        type: "lookup",
        required: false,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["DELL", "HP", "LENOVO"],
        description: "Vendor code from system",
        autoMap: ["vendor", "vendor_code", "supplier"],
      },
      {
        name: "serialNumber",
        label: "Serial Number",
        type: "string",
        required: false,
        maxLength: 100,
        sanitization: [
          { operation: "trim" },
          { operation: "normalizeWhitespace" },
        ],
        examples: ["SN123456789", "ABC-123-XYZ"],
        description: "Manufacturer serial number",
        autoMap: ["serial", "serial_number", "sn"],
      },
      {
        name: "purchaseDate",
        label: "Purchase Date",
        type: "date",
        required: false,
        validations: [
          { type: "pastDate", message: "Purchase date must be in the past" },
        ],
        examples: ["2024-01-15", "01/15/2024"],
        description: "Date asset was purchased",
        autoMap: ["purchase_date", "date_purchased", "bought_date"],
      },
      {
        name: "purchaseCost",
        label: "Purchase Price",
        type: "number",
        required: false,
        min: 0,
        validations: [
          { type: "positive", message: "Purchase price must be positive" },
        ],
        examples: ["1299.99", "2500"],
        description: "Purchase price amount",
        autoMap: ["purchase_cost", "price", "cost", "purchase_price"],
      },
      {
        name: "currency",
        label: "Currency",
        type: "enum",
        required: false,
        enum: SUPPORTED_CURRENCIES.map((c) => c.code),
        defaultValue: "SAR",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["SAR", "USD", "EUR"],
        description: "Currency code (ISO 4217)",
        autoMap: ["currency", "currency_code"],
      },
      {
        name: "warrantyEndDate",
        label: "Warranty End Date",
        type: "date",
        required: false,
        examples: ["2026-01-15", "01/15/2026"],
        description: "Date warranty expires",
        autoMap: ["warranty_end", "warranty_expiry", "warranty_expires"],
      },
      {
        name: "currentStockLocationId",
        label: "Stock Location Code",
        type: "lookup",
        required: false,
        lookupTarget: "StockLocation",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["WH-01", "DC-MAIN"],
        description: "Current stock location code",
        autoMap: [
          "location",
          "stock_location",
          "warehouse",
          "currentStockLocation",
        ],
      },
      {
        name: "lifecycleStateId",
        label: "Lifecycle State Code",
        type: "lookup",
        required: false,
        lookupTarget: "LifecycleState",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["IN_STOCK", "IN_USE", "RETIRED"],
        description: "Current lifecycle state code",
        autoMap: ["state", "status", "lifecycle_state", "lifecycleState"],
      },
      {
        name: "note",
        label: "Notes",
        type: "string",
        required: false,
        maxLength: 1000,
        sanitization: [{ operation: "trim" }],
        examples: ["Additional notes about this asset"],
        description: "Optional notes",
        autoMap: ["notes", "note", "comments", "description"],
      },
    ],
    businessRules: [
      {
        name: "warrantyDateConsistency",
        description: "Warranty end date must be after purchase date",
        validate: (row) => {
          if (row.purchaseDate && row.warrantyEndDate) {
            return new Date(row.warrantyEndDate) > new Date(row.purchaseDate);
          }
          return true;
        },
        message: "Warranty end date must be after purchase date",
        severity: "error",
      },
    ],
    templateInstructions: `
**Important Notes:**
- Asset Tag must be unique across all assets
- Asset Category Code must exist in the system (e.g., LAPTOP, SERVER, MONITOR)
- All lookup codes (Category, Model, Vendor, Location, State) must match existing records
- Dates should be in YYYY-MM-DD format
- Purchase price should be a positive number
- Currency defaults to SAR if not specified
    `.trim(),
  },

  // ========================================
  // PERSON
  // ========================================
  PERSON: {
    key: "PERSON",
    name: "Persons",
    tableName: "Person",
    description: "Employees and contacts",
    category: "FOUNDATION",
    permission: PERMISSIONS.PERSONS_CREATE,
    viewPermission: PERMISSIONS.PERSONS_VIEW,
    uniqueFields: ["email", "employeeId"],
    requiredFields: ["firstName", "lastName", "email"],
    lookupFields: ["organizationUnitId", "managerId", "locationId"],
    maxBatchSize: 200,
    bulkCreateAction: async () => {
      // TODO: Implement bulk create persons action
      throw new Error("Bulk create persons not yet implemented");
    },
    icon: "Users",
    color: "#8b5cf6",
    fields: [
      {
        name: "firstName",
        label: "First Name",
        type: "string",
        required: true,
        maxLength: 100,
        sanitization: [{ operation: "trim" }, { operation: "titleCase" }],
        examples: ["John", "Sarah"],
        description: "Person's first name",
        autoMap: ["first_name", "firstname", "given_name"],
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "string",
        required: true,
        maxLength: 100,
        sanitization: [{ operation: "trim" }, { operation: "titleCase" }],
        examples: ["Smith", "Johnson"],
        description: "Person's last name",
        autoMap: ["last_name", "lastname", "surname", "family_name"],
      },
      {
        name: "email",
        label: "Email",
        type: "string",
        required: true,
        unique: true,
        maxLength: 255,
        validations: [
          { type: "email", message: "Must be a valid email address" },
        ],
        sanitization: [{ operation: "trim" }, { operation: "lowercase" }],
        examples: ["john.smith@barq.com", "sarah.johnson@barq.com"],
        description: "Person's email address",
        autoMap: ["email", "email_address", "work_email"],
      },
      {
        name: "employeeId",
        label: "Employee ID",
        type: "string",
        required: false,
        unique: true,
        maxLength: 50,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["EMP001", "E-12345"],
        description: "Unique employee identifier",
        autoMap: ["employee_id", "employeeId", "emp_id", "badge_number"],
      },
      {
        name: "phoneNumber",
        label: "Phone Number",
        type: "string",
        required: false,
        maxLength: 30,
        validations: [
          { type: "phone", message: "Must be a valid phone number" },
        ],
        sanitization: [{ operation: "trim" }],
        examples: ["+966501234567", "0501234567"],
        description: "Contact phone number",
        autoMap: ["phone", "phone_number", "mobile", "contact_number"],
      },
      {
        name: "jobTitle",
        label: "Job Title",
        type: "string",
        required: false,
        maxLength: 200,
        sanitization: [{ operation: "trim" }],
        examples: ["Software Engineer", "Senior Developer"],
        description: "Person's job title",
        autoMap: ["job_title", "title", "position", "role"],
      },
      {
        name: "department",
        label: "Department",
        type: "string",
        required: false,
        maxLength: 200,
        sanitization: [{ operation: "trim" }],
        examples: ["Engineering", "IT Operations"],
        description: "Department name",
        autoMap: ["department", "dept", "division"],
      },
      {
        name: "organizationUnitId",
        label: "Organization Unit Code",
        type: "lookup",
        required: false,
        lookupTarget: "OrganizationUnit",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["IT-OPS", "ENG-DEV"],
        description: "Organization unit code",
        autoMap: ["org_unit", "organization_unit", "ou", "organizationUnit"],
      },
      {
        name: "managerId",
        label: "Manager Email",
        type: "lookup",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        sanitization: [{ operation: "trim" }, { operation: "lowercase" }],
        examples: ["manager@barq.com"],
        description: "Manager's email address",
        autoMap: ["manager", "manager_email", "reports_to"],
      },
      {
        name: "locationId",
        label: "Location Code",
        type: "lookup",
        required: false,
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["RYD-HQ", "JED-01"],
        description: "Primary location code",
        autoMap: ["location", "location_code", "office", "site"],
      },
      {
        name: "hireDate",
        label: "Hire Date",
        type: "date",
        required: false,
        validations: [
          { type: "pastDate", message: "Hire date must be in the past" },
        ],
        examples: ["2024-01-15", "01/15/2024"],
        description: "Date person was hired",
        autoMap: ["hire_date", "start_date", "join_date", "employment_start"],
      },
      {
        name: "isActive",
        label: "Active Status",
        type: "boolean",
        required: false,
        defaultValue: true,
        sanitization: [{ operation: "trim" }, { operation: "lowercase" }],
        examples: ["true", "yes", "1"],
        description: "Whether person is currently active",
        autoMap: ["active", "is_active", "status", "enabled"],
      },
    ],
    businessRules: [
      {
        name: "emailDomain",
        description: "Email must be from company domain",
        validate: (row) => {
          if (row.email) {
            // This is just a validation example - adjust for your organization
            return String(row.email).endsWith("@barq.com");
          }
          return true;
        },
        message: "Email must be from @barq.com domain",
        severity: "warning",
      },
    ],
    templateInstructions: `
**Important Notes:**
- Email and Employee ID must be unique
- Email must be from @barq.com domain
- Phone numbers should include country code
- Manager must exist in the system (use manager's email)
- All lookup codes must match existing records
- Dates should be in YYYY-MM-DD format
    `.trim(),
  },

  // ========================================
  // VENDOR (Placeholder - to be implemented)
  // ========================================
  VENDOR: {
    key: "VENDOR",
    name: "Vendors",
    tableName: "Vendor",
    description: "Suppliers and service providers",
    category: "FOUNDATION",
    permission: PERMISSIONS.VENDORS_CREATE,
    viewPermission: PERMISSIONS.VENDORS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["code", "name"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: async () => {
      throw new Error("Bulk create vendors not yet implemented");
    },
    icon: "Building2",
    color: "#10b981",
    fields: [
      // TODO: Define vendor fields
      {
        name: "code",
        label: "Vendor Code",
        type: "string",
        required: true,
        unique: true,
        maxLength: 50,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["DELL", "HP", "LENOVO"],
        description: "Unique vendor code",
      },
      {
        name: "name",
        label: "Vendor Name",
        type: "string",
        required: true,
        maxLength: 200,
        sanitization: [{ operation: "trim" }],
        examples: ["Dell Technologies", "HP Inc."],
        description: "Vendor company name",
      },
      // ... more fields
    ],
  },

  // ========================================
  // LOCATION (Placeholder - to be implemented)
  // ========================================
  LOCATION: {
    key: "LOCATION",
    name: "Locations",
    tableName: "Location",
    description: "Physical locations and sites",
    category: "FOUNDATION",
    permission: PERMISSIONS.LOCATIONS_CREATE,
    viewPermission: PERMISSIONS.LOCATIONS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["code", "name"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: async () => {
      throw new Error("Bulk create locations not yet implemented");
    },
    icon: "MapPin",
    color: "#f59e0b",
    fields: [
      // TODO: Define location fields
      {
        name: "code",
        label: "Location Code",
        type: "string",
        required: true,
        unique: true,
        maxLength: 50,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["RYD-HQ", "JED-01"],
        description: "Unique location code",
      },
      {
        name: "name",
        label: "Location Name",
        type: "string",
        required: true,
        maxLength: 200,
        sanitization: [{ operation: "trim" }],
        examples: ["Riyadh Headquarters", "Jeddah Office"],
        description: "Location name",
      },
      // ... more fields
    ],
  },

  // ========================================
  // ASSET_CATEGORY (Placeholder - to be implemented)
  // ========================================
  ASSET_CATEGORY: {
    key: "ASSET_CATEGORY",
    name: "Asset Categories",
    tableName: "AssetCategory",
    description: "Asset classification categories",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.ASSET_CATEGORIES_CREATE,
    viewPermission: PERMISSIONS.ASSET_CATEGORIES_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["code", "name"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: async () => {
      throw new Error("Bulk create asset categories not yet implemented");
    },
    icon: "FolderTree",
    color: "#6366f1",
    fields: [
      // TODO: Define asset category fields
      {
        name: "code",
        label: "Category Code",
        type: "string",
        required: true,
        unique: true,
        maxLength: 50,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["LAPTOP", "SERVER", "MONITOR"],
        description: "Unique category code",
      },
      {
        name: "name",
        label: "Category Name",
        type: "string",
        required: true,
        maxLength: 200,
        sanitization: [{ operation: "trim" }],
        examples: ["Laptop Computers", "Server Hardware"],
        description: "Category name",
      },
      // ... more fields
    ],
  },

  // Remaining priority entities (placeholders):
  // - ASSET_MODEL
  // - CONFIGURATION_ITEM
  // - CONTRACT
  // - LICENSE_PRODUCT
  // - SERVICE
};

/**
 * Get entity configuration by key
 */
export function getEntityConfig(key: string): EntityConfig | undefined {
  return ENTITY_CONFIGS[key];
}

/**
 * Get all entity configurations
 */
export function getAllEntityConfigs(): EntityConfig[] {
  return Object.values(ENTITY_CONFIGS);
}

/**
 * Get importable entities for a user based on permissions
 */
export function getImportableEntities(
  userPermissions: string[],
): EntityConfig[] {
  return getAllEntityConfigs().filter((config) =>
    userPermissions.includes(config.permission),
  );
}

/**
 * Get entity configurations by category
 */
export function getEntitiesByCategory(category: string): EntityConfig[] {
  return getAllEntityConfigs().filter((config) => config.category === category);
}

/**
 * Get required fields for an entity
 */
export function getRequiredFields(entityKey: string) {
  const config = getEntityConfig(entityKey);
  return config ? config.fields.filter((f) => f.required) : [];
}

/**
 * Get optional fields for an entity
 */
export function getOptionalFields(entityKey: string) {
  const config = getEntityConfig(entityKey);
  return config ? config.fields.filter((f) => !f.required) : [];
}

/**
 * Get lookup fields for an entity
 */
export function getLookupFields(entityKey: string) {
  const config = getEntityConfig(entityKey);
  return config ? config.fields.filter((f) => f.type === "lookup") : [];
}
