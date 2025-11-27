/**
 * Universal Assets Importer Configuration
 *
 * Entity configuration for the Universal Assets Import feature.
 * This is a composite importer that handles multiple entity types in a single file.
 */

import type { EntityConfig, EntityFieldConfig } from "../entity-config.types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { STANDARD_SANITIZATION } from "../field-builders";

/**
 * Field definitions for Universal Assets Import
 * Uses prefixed column naming: entity.field
 */
const UNIVERSAL_ASSETS_FIELDS: EntityFieldConfig[] = [
  // ========================================
  // PERSON (Required, no auto-create)
  // ========================================
  {
    name: "person.email",
    label: "Person Email",
    description:
      "Email of the person to assign the asset to. Person must exist in the system.",
    type: "string",
    required: true,
    validations: [{ type: "required" }, { type: "email" }],
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["john.doe@company.com", "ahmed@barq.com"],
    autoMap: [
      "person_email",
      "email",
      "user_email",
      "employee_email",
      "assignee_email",
    ],
  },

  // ========================================
  // ASSET (Required fields)
  // ========================================
  {
    name: "asset.serial_number",
    label: "Serial Number",
    description: "Unique serial number of the asset (required)",
    type: "string",
    required: true,
    unique: true,
    maxLength: 100,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["SN123456", "XYZ-789-ABC"],
    autoMap: ["serial", "serialNumber", "serial_no", "asset_serial"],
  },
  {
    name: "asset.asset_tag",
    label: "Asset Tag",
    description: "Organization asset tag (auto-generated if empty)",
    type: "string",
    required: false,
    unique: true,
    autoGenerate: true,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["LAP-001", "SRV-042"],
    autoMap: ["assetTag", "tag", "asset_id"],
  },
  {
    name: "asset.purchase_date",
    label: "Purchase Date",
    description: "Date when the asset was purchased",
    type: "date",
    required: false,
    examples: ["2024-01-15", "01/15/2024"],
    autoMap: ["purchaseDate", "purchase", "bought_date", "acquired_date"],
  },
  {
    name: "asset.purchase_cost",
    label: "Purchase Cost",
    description: "Original purchase cost of the asset",
    type: "number",
    required: false,
    min: 0,
    examples: ["1299.99", "5000"],
    autoMap: ["purchaseCost", "cost", "price", "purchase_price"],
  },
  {
    name: "asset.currency",
    label: "Currency",
    description: "Currency code for purchase cost (e.g., SAR, USD)",
    type: "string",
    required: false,
    maxLength: 3,
    pattern: /^[A-Z]{3}$/,
    sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
    examples: ["SAR", "USD", "EUR"],
    autoMap: ["currency_code", "curr"],
  },
  {
    name: "asset.warranty_end_date",
    label: "Warranty End Date",
    description: "Date when warranty expires",
    type: "date",
    required: false,
    examples: ["2026-01-15", "01/15/2026"],
    autoMap: ["warrantyEndDate", "warranty_expiry", "warranty_end"],
  },
  {
    name: "asset.condition",
    label: "Condition",
    description: "Physical condition of the asset",
    type: "enum",
    required: false,
    enum: ["NEW", "GOOD", "FAIR", "POOR"],
    examples: ["NEW", "GOOD"],
    autoMap: ["asset_condition", "state"],
  },
  {
    name: "asset.note",
    label: "Notes",
    description: "Additional notes about the asset",
    type: "string",
    required: false,
    maxLength: 2000,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Assigned to IT department", "Secondary monitor"],
    autoMap: ["notes", "comment", "description", "remarks"],
  },

  // ========================================
  // MANUFACTURER (Auto-create enabled)
  // ========================================
  {
    name: "vendor.code",
    label: "Manufacturer Code",
    description:
      "Unique manufacturer/vendor code (auto-generated from name if not provided)",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["DELL", "HP", "LENOVO"],
    autoMap: ["vendorCode", "vendor_id", "manufacturer_code", "mfr_code"],
  },
  {
    name: "vendor.name",
    label: "Manufacturer Name",
    description:
      "Manufacturer name - the company that makes the model (creates vendor if code not found)",
    type: "string",
    required: false,
    maxLength: 100,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Dell Technologies", "HP Inc.", "Lenovo Group"],
    autoMap: ["vendorName", "vendor", "manufacturer", "brand", "mfr", "make"],
  },

  // ========================================
  // CATEGORY (Auto-create enabled)
  // ========================================
  {
    name: "category.code",
    label: "Category Code",
    description:
      "Asset category code (auto-generated from name if not provided)",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["LAPTOP", "DESKTOP", "MONITOR"],
    autoMap: ["categoryCode", "category_id", "asset_type_code"],
  },
  {
    name: "category.name",
    label: "Category Name",
    description: "Asset category name (creates category if code not found)",
    type: "string",
    required: false,
    maxLength: 100,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Laptop Computers", "Desktop Computers", "Monitors"],
    autoMap: ["categoryName", "category", "asset_type", "type"],
  },

  // ========================================
  // MODEL (Auto-create enabled, depends on manufacturer + category)
  // ========================================
  {
    name: "model.code",
    label: "Model Code",
    description: "Asset model code (requires manufacturer to auto-create)",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["DELL-LAT-5520", "HP-ELITEBOOK-850"],
    autoMap: ["modelCode", "model_id", "product_code", "sku"],
  },
  {
    name: "model.name",
    label: "Model Name",
    description:
      "Asset model name (creates model if code not found, requires manufacturer)",
    type: "string",
    required: false,
    maxLength: 150,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Dell Latitude 5520", "HP EliteBook 850 G8"],
    autoMap: ["modelName", "model", "product_name", "product"],
  },

  // ========================================
  // LOCATION (Auto-create enabled)
  // ========================================
  {
    name: "location.code",
    label: "Location Code",
    description:
      "Physical location code (auto-generated from name if not provided)",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["RUH-HQ", "JED-DC1", "DMM-BRANCH"],
    autoMap: ["locationCode", "location_id", "site_code"],
  },
  {
    name: "location.name",
    label: "Location Name",
    description: "Physical location name (creates location if code not found)",
    type: "string",
    required: false,
    maxLength: 100,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Riyadh Headquarters", "Jeddah Data Center"],
    autoMap: ["locationName", "location", "site", "building"],
  },

  // ========================================
  // STOCK LOCATION (Auto-create enabled)
  // ========================================
  {
    name: "stock_location.code",
    label: "Stock Location Code",
    description: "Stock/warehouse location code",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["WH-RIYADH", "STORE-JED", "IT-ROOM-1"],
    autoMap: ["stockLocationCode", "stock_location_id", "warehouse_code"],
  },
  {
    name: "stock_location.name",
    label: "Stock Location Name",
    description: "Stock/warehouse location name",
    type: "string",
    required: false,
    maxLength: 100,
    sanitization: STANDARD_SANITIZATION.TRIM,
    examples: ["Riyadh Main Warehouse", "Jeddah Storage"],
    autoMap: ["stockLocationName", "stock_location", "warehouse", "storage"],
  },

  // ========================================
  // LIFECYCLE STATE (Lookup only, no auto-create)
  // ========================================
  {
    name: "lifecycle.code",
    label: "Lifecycle State Code",
    description: "Asset lifecycle state code (lookup only, must exist)",
    type: "string",
    required: false,
    maxLength: 50,
    sanitization: STANDARD_SANITIZATION.CODE,
    examples: ["IN_USE", "IN_STOCK", "RETIRED", "IN_REPAIR"],
    autoMap: ["lifecycleCode", "lifecycle", "status", "state"],
  },
];

/**
 * Universal Assets Entity Configuration
 *
 * This is a special composite importer configuration that:
 * 1. Uses prefixed columns (entity.field) for multi-entity import
 * 2. Auto-creates missing entities (Manufacturer/Vendor, Category, Model, Location, StockLocation)
 * 3. Infers and creates custom field definitions from custom.* columns
 * 4. Handles asset assignments with re-assignment support
 */
export const UNIVERSAL_ASSETS_CONFIG: EntityConfig = {
  key: "UNIVERSAL_ASSETS",
  name: "Universal Assets Import",
  tableName: "Asset", // Primary entity
  description:
    "Import assets with all related data in a single file. Auto-creates manufacturers, categories, models, locations, and custom fields as needed.",
  category: "ASSET_MANAGEMENT",

  // Permissions
  permission: PERMISSIONS.ASSETS_CREATE,
  viewPermission: PERMISSIONS.ASSETS_VIEW,

  // Field configuration
  fields: UNIVERSAL_ASSETS_FIELDS,
  requiredFields: ["person.email", "asset.serial_number"],
  uniqueFields: ["asset.serial_number"],
  lookupFields: [], // Handled internally by the processor

  // Import behavior - uses custom processor
  bulkCreateAction: async () => {
    // This is a placeholder - actual import uses processUniversalAssetsImport
    throw new Error("Use processUniversalAssetsImport instead of bulk actions");
  },
  maxBatchSize: 100,

  // UI customization
  icon: "FileUp",
  color: "#10b981", // Emerald green for prominence
  templateInstructions: `
# Universal Assets Import Template

This template allows you to import assets with all related entities in a single file.
The system will automatically create missing manufacturers, categories, models, and locations.

## Column Naming Convention

Columns use a prefix.field format to identify which entity the data belongs to:
- person.email - Assignee (must exist, no auto-create)
- asset.* - Asset fields (serial_number required)
- vendor.* - Manufacturer (auto-created if not found)
- category.* - Category (auto-created if not found)
- model.* - Model (auto-created, requires manufacturer)
- location.* - Location (auto-created if not found)
- stock_location.* - Stock Location (auto-created if not found)
- lifecycle.* - Lifecycle State (lookup only, no auto-create)
- custom.* - Custom fields (auto-created as FieldDefinitions)

## Important Notes

1. **Person must exist**: The person.email must match an existing person in the system
2. **Serial number required**: Each row must have a unique asset.serial_number
3. **Auto-creation**: Missing manufacturers, categories, models, and locations are created automatically
4. **Custom fields**: Any column starting with custom. will create a new field definition
5. **Updates**: If an asset with the same serial number exists, it will be updated

## Example Data

person.email,asset.serial_number,asset.purchase_date,vendor.code,vendor.name,category.code,category.name,model.name,lifecycle.code,custom.cpu_cores,custom.ram_gb
john@company.com,SN123456,2024-01-15,DELL,Dell Technologies,LAPTOP,Laptops,Latitude 5520,IN_USE,8,16
jane@company.com,SN789012,2024-02-20,HP,HP Inc.,DESKTOP,Desktops,EliteDesk 800 G6,IN_STOCK,4,8
`,

  // Default settings for universal import
  defaultSettings: {
    duplicateStrategy: "overwrite",
    autoTrimWhitespace: true,
    normalizeText: true,
    skipEmptyRows: true,
    autoFixCommonErrors: true,
    dryRun: false,
    strictValidation: false,
    batchSize: 50,
    maxParallelBatches: 1, // Sequential for dependency resolution
    stopOnFirstError: false,
    maxErrorsBeforeAbort: 100,
    autoDetectDateFormat: true,
  },

  // Composite import features
  isCompositeImport: true,
  isProminent: true,
};

/**
 * Get all supported prefixes for the Universal Assets Importer
 */
export function getSupportedPrefixes(): string[] {
  return [
    "person.",
    "asset.",
    "vendor.",
    "category.",
    "model.",
    "location.",
    "stock_location.",
    "lifecycle.",
    "custom.",
  ];
}

/**
 * Get template columns in the recommended order
 */
export function getTemplateColumns(): string[] {
  return [
    // Required fields first
    "person.email",
    "asset.serial_number",
    // Asset optional fields
    "asset.asset_tag",
    "asset.purchase_date",
    "asset.purchase_cost",
    "asset.currency",
    "asset.warranty_end_date",
    "asset.condition",
    "asset.note",
    // Related entities
    "vendor.code",
    "vendor.name",
    "category.code",
    "category.name",
    "model.code",
    "model.name",
    "location.code",
    "location.name",
    "stock_location.code",
    "stock_location.name",
    "lifecycle.code",
    // Custom field examples
    "custom.cpu_cores",
    "custom.ram_gb",
    "custom.storage_type",
  ];
}

/**
 * Generate a sample CSV template for Universal Assets Import
 */
export function generateSampleTemplate(): string {
  const headers = getTemplateColumns();
  const sampleRows = [
    [
      "john.doe@company.com",
      "SN-LAP-001",
      "LAP-001",
      "2024-01-15",
      "1299.99",
      "SAR",
      "2027-01-15",
      "NEW",
      "Work laptop for development",
      "DELL",
      "Dell Technologies",
      "LAPTOP",
      "Laptop Computers",
      "DELL-LAT-5520",
      "Dell Latitude 5520",
      "RUH-HQ",
      "Riyadh Headquarters",
      "WH-RIYADH",
      "Riyadh IT Store",
      "IN_USE",
      "8",
      "16",
      "SSD",
    ],
    [
      "jane.smith@company.com",
      "SN-MON-001",
      "MON-001",
      "2024-02-01",
      "450.00",
      "SAR",
      "2027-02-01",
      "NEW",
      "Secondary monitor",
      "DELL",
      "Dell Technologies",
      "MONITOR",
      "Monitors",
      "DELL-U2722D",
      "Dell UltraSharp U2722D",
      "RUH-HQ",
      "Riyadh Headquarters",
      "WH-RIYADH",
      "Riyadh IT Store",
      "IN_USE",
      "",
      "",
      "",
    ],
  ];

  const csvLines = [
    headers.join(","),
    ...sampleRows.map((row) =>
      row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(","),
    ),
  ];

  return csvLines.join("\n");
}
