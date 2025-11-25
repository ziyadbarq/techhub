/**
 * Entity Configurations for Universal Data Importer
 *
 * Defines import configurations for all entities in the system.
 * Each configuration includes field definitions, validation rules,
 * lookup mappings, and bulk import actions.
 *
 * **Refactored with DRY field builders** - 60-70% line reduction per entity
 */

import type { EntityConfig } from "./entity-config.types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { bulkCreateAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { bulkCreatePersonsAction } from "@/interface-adapters/controllers/person.controller";
import { bulkCreateOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { bulkCreateLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { bulkCreateVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { bulkCreateAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { bulkCreateAssetModelsAction } from "@/interface-adapters/controllers/asset-model.controller";
import { bulkCreateStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { bulkCreateConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { bulkCreateContractsAction } from "@/interface-adapters/controllers/contract.controller";
import { bulkCreateServicesAction } from "@/interface-adapters/controllers/service.controller";
import { bulkCreateLicenseProductsAction } from "@/interface-adapters/controllers/license-product.controller";
import { bulkCreateRolesAction } from "@/interface-adapters/controllers/role.controller";
import { bulkCreateLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { bulkCreateFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";
import { bulkCreateExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { bulkCreateAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { bulkCreateWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";
import { bulkCreateMaintenanceSchedulesAction } from "@/interface-adapters/controllers/maintenance-schedule.controller";
import { bulkCreateMaintenanceRecordsAction } from "@/interface-adapters/controllers/maintenance-record.controller";
import { bulkCreateStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { bulkCreateCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { bulkCreateRelationshipTypesAction } from "@/interface-adapters/controllers/relationship-type.controller";
import { bulkCreateCIClassesAction } from "@/interface-adapters/controllers/ci-class.controller";
import { bulkCreateCIClassFieldsAction } from "@/interface-adapters/controllers/ci-class-field.controller";
import { bulkCreateRelationshipTypeScopesAction } from "@/interface-adapters/controllers/relationship-type-scope.controller";
import { bulkCreateContractTypesAction } from "@/interface-adapters/controllers/contract-type.controller";
import { bulkCreateContractLinkedObjectsAction } from "@/interface-adapters/controllers/contract-linked-object.controller";
import { bulkCreateLicenseProductFieldsAction } from "@/interface-adapters/controllers/license-product-field.controller";
import { bulkCreateLicenseEntitlementsAction } from "@/interface-adapters/controllers/license-entitlement.controller";
import { bulkCreateLicenseAllocationsAction } from "@/interface-adapters/controllers/license-allocation.controller";
import {
  lookupField,
  nameField,
  pastDateField,
  dateField,
  currencyField,
  currencyCodeField,
  emailField,
  phoneField,
  notesField,
  serialNumberField,
  booleanField,
  codeField,
  descriptionField,
  addressField,
  cityField,
  countryField,
  urlField,
  enumField,
  STANDARD_SANITIZATION,
} from "./field-builders";
import {
  OrganizationUnitType,
  VendorType,
  LocationType,
} from "@/core/domain/value-objects/foundation-enums";

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
      // Unique identifier
      {
        name: "assetTag",
        label: "Asset Tag",
        type: "string",
        required: true,
        unique: true,
        maxLength: 50,
        pattern: /^[A-Z0-9-]+$/,
        sanitization: STANDARD_SANITIZATION.CODE,
        examples: ["LAP-001", "SRV-042", "MON-123"],
        description: "Unique asset identifier",
        autoMap: ["asset_tag", "tag", "asset_id", "assetId"],
      },
      // Lookups
      lookupField({
        name: "assetCategoryId",
        label: "Asset Category Code",
        required: true,
        lookupTarget: "AssetCategory",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["LAPTOP", "SERVER", "MONITOR"],
        description: "Asset category code from system",
        autoMap: ["category", "category_code", "assetCategory"],
      }),
      lookupField({
        name: "assetModelId",
        label: "Asset Model Code",
        required: false,
        lookupTarget: "AssetModel",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DELL-LAT-7490", "HP-ELITE-G8"],
        description: "Asset model code from system",
        autoMap: ["model", "model_code", "assetModel"],
      }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: false,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DELL", "HP", "LENOVO"],
        description: "Vendor code from system",
        autoMap: ["vendor", "vendor_code", "supplier"],
      }),
      // Asset details
      serialNumberField({ required: false, maxLength: 100 }),
      pastDateField({
        name: "purchaseDate",
        label: "Purchase Date",
        autoMap: ["purchase_date", "date_purchased", "bought_date"],
      }),
      currencyField({
        name: "purchaseCost",
        label: "Purchase Price",
      }),
      currencyCodeField(),
      dateField({
        name: "warrantyEndDate",
        label: "Warranty End Date",
        autoMap: ["warranty_end", "warranty_expiry", "warranty_expires"],
      }),
      // Location and state
      lookupField({
        name: "currentStockLocationId",
        label: "Stock Location Code",
        required: false,
        lookupTarget: "StockLocation",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["WH-01", "DC-MAIN"],
        description: "Current stock location code",
        autoMap: [
          "location",
          "stock_location",
          "warehouse",
          "currentStockLocation",
        ],
      }),
      lookupField({
        name: "lifecycleStateId",
        label: "Lifecycle State Code",
        required: false,
        lookupTarget: "LifecycleState",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["IN_STOCK", "IN_USE", "RETIRED"],
        description: "Current lifecycle state code",
        autoMap: ["state", "status", "lifecycle_state", "lifecycleState"],
      }),
      notesField(),
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
    requiredFields: [
      "firstName",
      "lastName",
      "email",
      "organizationUnitId",
      "primaryRoleId",
    ],
    lookupFields: [
      "organizationUnitId",
      "primaryRoleId",
      "managerId",
      "locationId",
    ],
    maxBatchSize: 200,
    bulkCreateAction: bulkCreatePersonsAction,
    icon: "Users",
    color: "#8b5cf6",
    fields: [
      // Basic info
      nameField({
        fieldName: "firstName",
        label: "First Name",
        required: true,
        examples: ["Kareem", "Nawaf"],
      }),
      nameField({
        fieldName: "lastName",
        label: "Last Name",
        required: true,
        examples: ["Shah", "Alotabi"],
      }),
      emailField({
        required: true,
        unique: true,
        domain: "barq.com",
      }),
      {
        name: "employeeId",
        label: "Employee ID",
        type: "string",
        required: false,
        unique: true,
        maxLength: 50,
        sanitization: STANDARD_SANITIZATION.CODE,
        examples: ["EMP-101", "EMP-102"],
        description: "Unique employee identifier",
        autoMap: ["employee_id", "employeeId", "emp_id", "badge_number"],
      },
      phoneField({
        required: false,
        countryCode: "+966",
      }),
      // Work info
      {
        name: "jobTitle",
        label: "Job Title",
        type: "string",
        required: false,
        maxLength: 200,
        sanitization: STANDARD_SANITIZATION.TEXT,
        examples: ["Security Analyst", "Field Engineer"],
        description: "Person's job title",
        autoMap: ["job_title", "title", "position", "role"],
      },
      {
        name: "department",
        label: "Department",
        type: "string",
        required: false,
        maxLength: 200,
        sanitization: STANDARD_SANITIZATION.TEXT,
        examples: ["Technology", "Operations"],
        description: "Department name",
        autoMap: ["department", "dept", "division"],
      },
      // Organizational linkages
      lookupField({
        name: "organizationUnitId",
        label: "Organization Unit Code",
        required: true,
        lookupTarget: "OrganizationUnit",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SEC", "OPS"],
        description: "Organization unit code",
        autoMap: ["org_unit", "organization_unit", "ou", "organizationUnit"],
      }),
      {
        name: "managerId",
        label: "Manager Email",
        type: "lookup",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        sanitization: STANDARD_SANITIZATION.EMAIL,
        examples: ["kareem.shah@barq.com"],
        description: "Manager's email address",
        autoMap: ["manager", "manager_email", "reports_to"],
      },
      lookupField({
        name: "primaryRoleId",
        label: "Primary Role Code",
        required: true,
        lookupTarget: "Role",
        lookupField: "name",
        lookupDisplayField: "displayName",
        examples: ["asset-coordinator", "auditor", "data-steward"],
        description: "Role code assigned to person",
        autoMap: ["role", "role_code", "primary_role", "primaryRole"],
      }),
      lookupField({
        name: "locationId",
        label: "Location Code",
        required: false,
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["RYD-HQ", "JED-01"],
        description: "Primary location code",
        autoMap: ["location", "location_code", "office", "site"],
      }),
      // Employment details
      pastDateField({
        name: "hireDate",
        label: "Hire Date",
        autoMap: ["hire_date", "start_date", "join_date", "employment_start"],
      }),
      booleanField({
        name: "isActive",
        label: "Active Status",
        defaultValue: true,
        description: "Whether person is currently active",
      }),
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
  // VENDOR
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
    requiredFields: ["name", "vendorType"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateVendorsAction,
    icon: "Building2",
    color: "#10b981",
    fields: [
      codeField({
        entityName: "Vendor",
        examples: ["DELL", "HP", "LENOVO", "CISCO"],
      }),
      nameField({
        fieldName: "name",
        label: "Vendor Name",
        required: true,
        examples: ["Dell Technologies", "HP Inc.", "Cisco Systems"],
      }),
      nameField({
        fieldName: "legalName",
        label: "Legal Name",
        required: false,
        examples: ["Dell Technologies Inc.", "HP Inc."],
      }),
      descriptionField({ maxLength: 1000 }),
      enumField({
        name: "vendorType",
        label: "Vendor Type",
        required: true,
        enum: Object.values(VendorType),
        description: "Type of vendor",
      }),
      urlField({
        name: "website",
        label: "Website",
        required: false,
      }),
      emailField({
        required: false,
        unique: false,
      }),
      phoneField({
        required: false,
        countryCode: "+966",
      }),
      addressField({ maxLength: 500 }),
      cityField(),
      {
        name: "state",
        label: "State/Province",
        type: "string",
        required: false,
        maxLength: 100,
        sanitization: STANDARD_SANITIZATION.TEXT,
        examples: ["Riyadh Province", "Eastern Province"],
        description: "State or province",
        autoMap: ["state", "province", "region"],
      },
      countryField({ defaultValue: "Saudi Arabia" }),
      {
        name: "postalCode",
        label: "Postal Code",
        type: "string",
        required: false,
        maxLength: 20,
        sanitization: [{ operation: "trim" }],
        examples: ["12345", "11564"],
        description: "Postal or ZIP code",
        autoMap: ["postal_code", "zip", "zip_code", "postcode"],
      },
      {
        name: "taxId",
        label: "Tax ID",
        type: "string",
        required: false,
        maxLength: 100,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["123456789", "VAT-12345"],
        description: "Tax identification number",
        autoMap: ["tax_id", "vat_number", "tax_registration"],
      },
      booleanField({
        name: "isPreferred",
        label: "Preferred Vendor",
        defaultValue: false,
        description: "Whether this is a preferred vendor",
      }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether vendor is currently active",
      }),
      notesField({ maxLength: 2000 }),
    ],
    templateInstructions: `
**Important Notes:**
- Vendor Code must be unique (auto-generated if not provided)
- Vendor Type is required: MANUFACTURER, RESELLER, SERVICE_PROVIDER, DISTRIBUTOR, CONSULTANT, OTHER
- Email and website should be valid formats
- Phone numbers should include country code
    `.trim(),
  },

  // ========================================
  // LOCATION
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
    requiredFields: ["name", "locationType"],
    lookupFields: ["parentId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLocationsAction,
    icon: "MapPin",
    color: "#f59e0b",
    fields: [
      codeField({
        entityName: "Location",
        examples: ["RYD-HQ", "JED-01", "DMM-DC"],
      }),
      nameField({
        fieldName: "name",
        label: "Location Name",
        required: true,
        examples: [
          "Riyadh Headquarters",
          "Jeddah Office",
          "Dammam Data Center",
        ],
      }),
      descriptionField({ maxLength: 1000 }),
      enumField({
        name: "locationType",
        label: "Location Type",
        required: true,
        enum: Object.values(LocationType),
        description: "Type of location",
      }),
      lookupField({
        name: "parentId",
        label: "Parent Location Code",
        required: false,
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["RYD-HQ", "JED-01"],
        description: "Parent location in hierarchy",
        autoMap: ["parent", "parent_location", "parent_code"],
      }),
      addressField({ maxLength: 500 }),
      cityField(),
      {
        name: "state",
        label: "State/Province",
        type: "string",
        required: false,
        maxLength: 100,
        sanitization: STANDARD_SANITIZATION.TEXT,
        examples: ["Riyadh Province", "Makkah Province"],
        description: "State or province",
        autoMap: ["state", "province", "region"],
      },
      countryField({ defaultValue: "Saudi Arabia" }),
      {
        name: "postalCode",
        label: "Postal Code",
        type: "string",
        required: false,
        maxLength: 20,
        sanitization: [{ operation: "trim" }],
        examples: ["12345", "11564"],
        description: "Postal or ZIP code",
        autoMap: ["postal_code", "zip", "zip_code", "postcode"],
      },
      {
        name: "latitude",
        label: "Latitude",
        type: "number",
        required: false,
        min: -90,
        max: 90,
        examples: ["24.7136", "21.4858"],
        description: "GPS latitude coordinate",
        autoMap: ["latitude", "lat", "gps_lat"],
      },
      {
        name: "longitude",
        label: "Longitude",
        type: "number",
        required: false,
        min: -180,
        max: 180,
        examples: ["46.6753", "39.1925"],
        description: "GPS longitude coordinate",
        autoMap: ["longitude", "long", "lon", "gps_long"],
      },
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether location is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Location Code must be unique (auto-generated if not provided)
- Location Type is required: COUNTRY, CITY, CAMPUS, BUILDING, FLOOR, ROOM, OFFICE, DATACENTER, WAREHOUSE, STORAGE_UNIT, REMOTE
- Parent Location must exist in the system (use parent's code)
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
    `.trim(),
  },

  // ========================================
  // ASSET_CATEGORY
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
    requiredFields: ["name"],
    lookupFields: ["parentCategoryId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateAssetCategoriesAction,
    icon: "FolderTree",
    color: "#6366f1",
    fields: [
      codeField({
        entityName: "Asset Category",
        examples: ["LAPTOP", "SERVER", "MONITOR", "NETWORK"],
      }),
      nameField({
        fieldName: "name",
        label: "Category Name",
        required: true,
        examples: ["Laptop Computers", "Server Hardware", "Network Equipment"],
      }),
      descriptionField({ maxLength: 1000 }),
      lookupField({
        name: "parentCategoryId",
        label: "Parent Category Code",
        required: false,
        lookupTarget: "AssetCategory",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["COMPUTER", "HARDWARE"],
        description: "Parent category in hierarchy",
        autoMap: ["parent", "parent_category", "parent_code"],
      }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether category is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Category Code must be unique (auto-generated if not provided)
- Parent Category must exist in the system (use parent's code)
- Categories can be hierarchical (e.g., HARDWARE > COMPUTER > LAPTOP)
    `.trim(),
  },

  // ========================================
  // ORGANIZATION_UNIT
  // ========================================
  ORGANIZATION_UNIT: {
    key: "ORGANIZATION_UNIT",
    name: "Organization Units",
    tableName: "OrganizationUnit",
    description: "Organizational hierarchy and departments",
    category: "FOUNDATION",
    permission: PERMISSIONS.ORGANIZATION_UNITS_CREATE,
    viewPermission: PERMISSIONS.ORGANIZATION_UNITS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name", "unitType"],
    lookupFields: ["parentId", "managerId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateOrganizationUnitsAction,
    icon: "Building",
    color: "#8b5cf6",
    fields: [
      codeField({
        entityName: "Organization Unit",
        examples: ["IT-OPS", "ENG-DEV", "FIN-ACC"],
      }),
      nameField({
        fieldName: "name",
        label: "Unit Name",
        required: true,
        examples: [
          "IT Operations",
          "Engineering Development",
          "Finance Accounting",
        ],
      }),
      descriptionField({ maxLength: 1000 }),
      enumField({
        name: "unitType",
        label: "Unit Type",
        required: true,
        enum: Object.values(OrganizationUnitType),
        description: "Type of organizational unit",
      }),
      {
        name: "level",
        label: "Hierarchy Level",
        type: "number",
        required: false,
        min: 0,
        defaultValue: 0,
        examples: ["0", "1", "2"],
        description: "Level in organizational hierarchy (0 = top)",
        autoMap: ["level", "hierarchy_level", "org_level"],
      },
      lookupField({
        name: "parentId",
        label: "Parent Unit Code",
        required: false,
        lookupTarget: "OrganizationUnit",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["IT", "ENG"],
        description: "Parent organizational unit code",
        autoMap: ["parent", "parent_unit", "parent_code"],
      }),
      lookupField({
        name: "managerId",
        label: "Manager Email",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        examples: ["manager@barq.com"],
        description: "Unit manager's email address",
        autoMap: ["manager", "manager_email", "head"],
      }),
      {
        name: "costCenter",
        label: "Cost Center",
        type: "string",
        required: false,
        maxLength: 50,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["CC-1001", "IT-OPS-2024"],
        description: "Cost center code for accounting",
        autoMap: ["cost_center", "cc", "cost_centre"],
      },
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether unit is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Unit Code must be unique (auto-generated if not provided)
- Unit Type is required: COMPANY, BUSINESS_UNIT, DEPARTMENT, DIVISION, TEAM, OTHER
- Parent Unit must exist in the system (use parent's code)
- Manager must exist in the system (use manager's email)
    `.trim(),
  },

  // ========================================
  // ASSET_MODEL
  // ========================================
  ASSET_MODEL: {
    key: "ASSET_MODEL",
    name: "Asset Models",
    tableName: "AssetModel",
    description: "Specific models and SKUs of assets",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.ASSET_MODELS_CREATE,
    viewPermission: PERMISSIONS.ASSET_MODELS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name", "assetCategoryId", "vendorId"],
    lookupFields: ["assetCategoryId", "vendorId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateAssetModelsAction,
    icon: "Box",
    color: "#3b82f6",
    fields: [
      codeField({
        entityName: "Asset Model",
        examples: ["DELL-LAT-7490", "HP-ELITE-G8", "CISCO-2960X"],
      }),
      nameField({
        fieldName: "name",
        label: "Model Name",
        required: true,
        examples: ["Dell Latitude 7490", "HP EliteBook 840 G8"],
      }),
      descriptionField({ maxLength: 1000 }),
      lookupField({
        name: "assetCategoryId",
        label: "Asset Category Code",
        required: true,
        lookupTarget: "AssetCategory",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["LAPTOP", "SERVER"],
        description: "Asset category this model belongs to",
      }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: true,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DELL", "HP", "CISCO"],
        description: "Manufacturer/vendor of this model",
      }),
      {
        name: "defaultWarrantyMonths",
        label: "Default Warranty (Months)",
        type: "number",
        required: false,
        min: 0,
        max: 120,
        examples: ["12", "24", "36"],
        description: "Standard warranty period in months",
        autoMap: ["warranty", "warranty_months", "default_warranty"],
      },
    ],
    templateInstructions: `
**Important Notes:**
- Model Code must be unique (auto-generated if not provided)
- Asset Category and Vendor must exist in the system
- Warranty months should be between 0 and 120
    `.trim(),
  },

  // ========================================
  // STOCK_LOCATION
  // ========================================
  STOCK_LOCATION: {
    key: "STOCK_LOCATION",
    name: "Stock Locations",
    tableName: "StockLocation",
    description: "Inventory storage locations",
    category: "INVENTORY",
    permission: PERMISSIONS.STOCK_LOCATIONS_CREATE,
    viewPermission: PERMISSIONS.STOCK_LOCATIONS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name"],
    lookupFields: ["locationId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateStockLocationsAction,
    icon: "Warehouse",
    color: "#f59e0b",
    fields: [
      codeField({
        entityName: "Stock Location",
        examples: ["WH-01", "DC-MAIN", "STORE-RYD"],
      }),
      nameField({
        fieldName: "name",
        label: "Stock Location Name",
        required: true,
        examples: ["Main Warehouse", "Data Center Storage", "Riyadh Store"],
      }),
      descriptionField({ maxLength: 1000 }),
      lookupField({
        name: "locationId",
        label: "Physical Location Code",
        required: false,
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["RYD-HQ", "JED-01"],
        description: "Physical location where stock is stored",
        autoMap: ["location", "location_code", "site"],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Stock Location Code must be unique (auto-generated if not provided)
- Physical Location must exist in the system (use location's code)
    `.trim(),
  },

  // ========================================
  // CONFIGURATION_ITEM
  // ========================================
  CONFIGURATION_ITEM: {
    key: "CONFIGURATION_ITEM",
    name: "Configuration Items",
    tableName: "ConfigurationItem",
    description: "CMDB configuration items",
    category: "CMDB",
    permission: PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
    viewPermission: PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
    uniqueFields: ["ciKey"],
    requiredFields: ["name", "ciClassId"],
    lookupFields: [
      "ciClassId",
      "lifecycleStateId",
      "primaryOwnerPersonId",
      "primaryOwnerOrgUnitId",
      "locationId",
      "linkedAssetId",
    ],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateConfigurationItemsAction,
    icon: "Server",
    color: "#8b5cf6",
    fields: [
      nameField({
        fieldName: "name",
        label: "CI Name",
        required: true,
        examples: ["Production Database Server", "CRM Application"],
      }),
      {
        name: "ciKey",
        label: "CI Key",
        type: "string",
        required: false,
        unique: true,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9._-]+$/,
        sanitization: [{ operation: "trim" }, { operation: "lowercase" }],
        examples: ["prod.db.primary", "app.crm.main"],
        description: "Unique CI identifier key",
        autoMap: ["ci_key", "key", "identifier"],
      },
      lookupField({
        name: "ciClassId",
        label: "CI Class Name",
        required: true,
        lookupTarget: "CIClass",
        lookupField: "name",
        lookupDisplayField: "name",
        examples: ["Database", "Application", "Server"],
        description: "CI class/type",
      }),
      descriptionField({ maxLength: 2000 }),
      enumField({
        name: "criticality",
        label: "Criticality",
        required: false,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        description: "Business criticality level",
      }),
      enumField({
        name: "environment",
        label: "Environment",
        required: false,
        enum: ["PROD", "UAT", "DEV", "DR", "TEST", "OTHER"],
        description: "Deployment environment",
      }),
      lookupField({
        name: "lifecycleStateId",
        label: "Lifecycle State Code",
        required: false,
        lookupTarget: "LifecycleState",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["ACTIVE", "RETIRED"],
        description: "Current lifecycle state",
      }),
      lookupField({
        name: "primaryOwnerPersonId",
        label: "Primary Owner Email",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        examples: ["owner@barq.com"],
        description: "Primary owner person (email)",
        autoMap: ["owner", "owner_email", "primary_owner"],
      }),
      lookupField({
        name: "primaryOwnerOrgUnitId",
        label: "Owning Org Unit Code",
        required: false,
        lookupTarget: "OrganizationUnit",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["IT-OPS"],
        description: "Owning organizational unit",
        autoMap: ["org_unit", "department", "owning_unit"],
      }),
      lookupField({
        name: "locationId",
        label: "Location Code",
        required: false,
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["RYD-HQ", "JED-01"],
        description: "Physical location",
      }),
      lookupField({
        name: "linkedAssetId",
        label: "Linked Asset Tag",
        required: false,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["SRV-001", "LAP-042"],
        description: "Linked physical asset (asset tag)",
        autoMap: ["asset", "asset_tag", "linked_asset"],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- CI Key must be unique if provided
- CI Class, Lifecycle State, Owners, Location must exist in the system
- Criticality: LOW, MEDIUM, HIGH, CRITICAL
- Environment: PROD, UAT, DEV, DR, TEST, OTHER
    `.trim(),
  },

  // ========================================
  // CONTRACT
  // ========================================
  CONTRACT: {
    key: "CONTRACT",
    name: "Contracts",
    tableName: "Contract",
    description: "Vendor contracts and agreements",
    category: "CONTRACTS",
    permission: PERMISSIONS.CONTRACTS_CREATE,
    viewPermission: PERMISSIONS.CONTRACTS_VIEW,
    uniqueFields: ["contractNumber"],
    requiredFields: ["name", "contractTypeId", "vendorId", "startDate"],
    lookupFields: ["contractTypeId", "vendorId"],
    maxBatchSize: 50,
    bulkCreateAction: bulkCreateContractsAction,
    icon: "FileText",
    color: "#10b981",
    fields: [
      nameField({
        fieldName: "name",
        label: "Contract Name",
        required: true,
        examples: [
          "Dell Hardware Support Agreement",
          "Microsoft Enterprise License",
        ],
      }),
      {
        name: "contractNumber",
        label: "Contract Number",
        type: "string",
        required: false,
        unique: true,
        maxLength: 100,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["CNT-2024-001", "AGMT-12345"],
        description: "Unique contract reference number",
        autoMap: ["contract_number", "contract_id", "reference", "number"],
      },
      lookupField({
        name: "contractTypeId",
        label: "Contract Type Name",
        required: true,
        lookupTarget: "ContractType",
        lookupField: "name",
        lookupDisplayField: "name",
        examples: ["Support Agreement", "Software License"],
        description: "Type of contract",
      }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: true,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DELL", "MSFT", "IBM"],
        description: "Vendor/supplier for this contract",
      }),
      dateField({
        name: "startDate",
        label: "Start Date",
        required: true,
        autoMap: ["start_date", "effective_date", "begin_date"],
      }),
      dateField({
        name: "endDate",
        label: "End Date",
        required: false,
        autoMap: ["end_date", "expiry_date", "termination_date"],
      }),
      currencyField({
        name: "totalValue",
        label: "Contract Value",
        required: false,
      }),
      currencyCodeField(),
      booleanField({
        name: "autoRenew",
        label: "Auto-Renew",
        defaultValue: false,
        description: "Whether contract auto-renews",
      }),
      notesField({ name: "note", maxLength: 2000 }),
    ],
    businessRules: [
      {
        name: "endDateAfterStart",
        description: "End date must be after start date",
        validate: (row) => {
          if (row.startDate && row.endDate) {
            return new Date(row.endDate) > new Date(row.startDate);
          }
          return true;
        },
        message: "End date must be after start date",
        severity: "error",
      },
    ],
    templateInstructions: `
**Important Notes:**
- Contract Number must be unique if provided
- Contract Type and Vendor must exist in the system
- Start Date is required; End Date is optional
- If both dates provided, End Date must be after Start Date
- Currency defaults to SAR if not specified
    `.trim(),
  },

  // ========================================
  // SERVICE
  // ========================================
  SERVICE: {
    key: "SERVICE",
    name: "Services",
    tableName: "Service",
    description: "IT services and applications",
    category: "SERVICES",
    permission: PERMISSIONS.SERVICES_CREATE,
    viewPermission: PERMISSIONS.SERVICES_VIEW,
    uniqueFields: ["name"],
    requiredFields: ["name", "serviceType"],
    lookupFields: ["vendorId", "businessProcessId"],
    maxBatchSize: 50,
    bulkCreateAction: bulkCreateServicesAction,
    icon: "Cloud",
    color: "#06b6d4",
    fields: [
      nameField({
        fieldName: "name",
        label: "Service Name",
        required: true,
        maxLength: 200,
        examples: [
          "Customer Relationship Management",
          "Employee Portal",
          "Payment Gateway",
        ],
      }),
      enumField({
        name: "serviceType",
        label: "Service Type",
        required: true,
        enum: [
          "BUSINESS_APPLICATION",
          "INFRASTRUCTURE",
          "PLATFORM",
          "DATA_SERVICE",
          "OTHER",
        ],
        description: "Type of service",
      }),
      descriptionField({ maxLength: 2000 }),
      {
        name: "businessPurpose",
        label: "Business Purpose",
        type: "string",
        required: false,
        maxLength: 1000,
        sanitization: [{ operation: "trim" }],
        examples: ["Manages customer relationships and sales pipeline"],
        description: "Business purpose and value",
        autoMap: ["business_purpose", "purpose", "business_value"],
      },
      urlField({
        name: "gitlabRepoUrl",
        label: "GitLab Repository URL",
        required: false,
      }),
      enumField({
        name: "dataConfidentiality",
        label: "Data Confidentiality",
        required: false,
        enum: ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"],
        defaultValue: "INTERNAL",
        description: "Data classification level",
      }),
      enumField({
        name: "businessImpactLevel",
        label: "Business Impact",
        required: false,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        defaultValue: "MEDIUM",
        description: "Business impact if unavailable",
      }),
      enumField({
        name: "criticality",
        label: "Criticality",
        required: false,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        defaultValue: "MEDIUM",
        description: "Service criticality level",
      }),
      booleanField({
        name: "isEssentialService",
        label: "Essential Service",
        defaultValue: false,
        description: "Whether this is an essential service",
      }),
      dateField({
        name: "deploymentDate",
        label: "Deployment Date",
        required: false,
        autoMap: ["deployment_date", "go_live_date", "launch_date"],
      }),
      enumField({
        name: "currentStatus",
        label: "Status",
        required: false,
        enum: [
          "DEVELOPMENT",
          "TESTING",
          "PRODUCTION",
          "RETIRED",
          "DECOMMISSIONED",
        ],
        defaultValue: "PRODUCTION",
        description: "Current service status",
      }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: false,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["MSFT", "AWS", "ORACLE"],
        description: "Service vendor/provider",
      }),
      lookupField({
        name: "businessProcessId",
        label: "Business Process Name",
        required: false,
        lookupTarget: "BusinessProcess",
        lookupField: "name",
        lookupDisplayField: "name",
        examples: ["Order to Cash", "Procure to Pay"],
        description: "Supported business process",
        autoMap: ["business_process", "process", "process_name"],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Service Name must be unique
- Service Type is required: BUSINESS_APPLICATION, INFRASTRUCTURE, PLATFORM, DATA_SERVICE, OTHER
- Data Confidentiality: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
- Business Impact: LOW, MEDIUM, HIGH, CRITICAL
- Status: DEVELOPMENT, TESTING, PRODUCTION, RETIRED, DECOMMISSIONED
- Vendor and Business Process must exist if provided
    `.trim(),
  },

  // ========================================
  // LICENSE_PRODUCT
  // ========================================
  LICENSE_PRODUCT: {
    key: "LICENSE_PRODUCT",
    name: "License Products",
    tableName: "LicenseProduct",
    description: "Software license products",
    category: "LICENSES",
    permission: PERMISSIONS.LICENSE_PRODUCTS_CREATE,
    viewPermission: PERMISSIONS.LICENSE_PRODUCTS_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name", "vendorId", "metricType"],
    lookupFields: ["vendorId", "lifecycleModelId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLicenseProductsAction,
    icon: "Key",
    color: "#f59e0b",
    fields: [
      codeField({
        entityName: "License Product",
        examples: ["MSFT-365-E3", "ADOBE-CC-PRO", "VMWARE-VSPHERE"],
      }),
      nameField({
        fieldName: "name",
        label: "Product Name",
        required: true,
        examples: [
          "Microsoft 365 E3",
          "Adobe Creative Cloud Pro",
          "VMware vSphere",
        ],
      }),
      descriptionField({ maxLength: 2000 }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: true,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["MSFT", "ADOBE", "VMWARE"],
        description: "License vendor/publisher",
      }),
      enumField({
        name: "metricType",
        label: "License Metric",
        required: true,
        enum: [
          "USER",
          "DEVICE",
          "PROCESSOR",
          "CORE",
          "CONCURRENT",
          "NAMED_USER",
          "ENTERPRISE",
          "OTHER",
        ],
        description: "How licenses are counted/measured",
      }),
      lookupField({
        name: "lifecycleModelId",
        label: "Lifecycle Model Code",
        required: false,
        lookupTarget: "LifecycleModel",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SOFTWARE-STD"],
        description: "Lifecycle management model",
        autoMap: ["lifecycle", "lifecycle_model", "lifecycle_code"],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Product Code must be unique (auto-generated if not provided)
- Vendor must exist in the system
- Metric Type is required: USER, DEVICE, PROCESSOR, CORE, CONCURRENT, NAMED_USER, ENTERPRISE, OTHER
- Lifecycle Model must exist if provided
    `.trim(),
  },

  // ========================================
  // ROLE
  // ========================================
  ROLE: {
    key: "ROLE",
    name: "Roles",
    tableName: "Role",
    description: "System roles for RBAC",
    category: "FOUNDATION",
    permission: PERMISSIONS.ROLES_CREATE,
    viewPermission: PERMISSIONS.ROLES_VIEW,
    uniqueFields: ["name"],
    requiredFields: ["name", "displayName"],
    lookupFields: [],
    maxBatchSize: 50,
    bulkCreateAction: bulkCreateRolesAction,
    icon: "Shield",
    color: "#8b5cf6",
    fields: [
      {
        name: "name",
        label: "Role Name",
        type: "string",
        required: true,
        unique: true,
        maxLength: 100,
        pattern: /^[a-z0-9-]+$/,
        sanitization: [
          { operation: "trim" },
          { operation: "lowercase" },
          { operation: "normalizeWhitespace" },
        ],
        examples: ["asset-manager", "it-administrator", "viewer"],
        description:
          "System role name (lowercase alphanumeric with hyphens only)",
        autoMap: ["name", "role_name", "role"],
      },
      nameField({
        fieldName: "displayName",
        label: "Display Name",
        required: true,
        maxLength: 200,
        examples: ["Asset Manager", "IT Administrator", "Viewer"],
      }),
      descriptionField({ maxLength: 1000 }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether role is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Role Name must be unique and lowercase alphanumeric with hyphens only (e.g., asset-manager)
- Display Name is the human-readable name shown in UI
- System roles (like system-administrator, viewer) cannot be created via import
    `.trim(),
  },

  // ========================================
  // LIFECYCLE_STATE
  // ========================================
  LIFECYCLE_STATE: {
    key: "LIFECYCLE_STATE",
    name: "Lifecycle States",
    tableName: "LifecycleState",
    description: "States in lifecycle workflows",
    category: "FOUNDATION",
    permission: PERMISSIONS.LIFECYCLE_STATES_CREATE,
    viewPermission: PERMISSIONS.LIFECYCLE_STATES_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name", "modelId", "stateType"],
    lookupFields: ["modelId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLifecycleStatesAction,
    icon: "GitBranch",
    color: "#10b981",
    fields: [
      codeField({
        entityName: "Lifecycle State",
        examples: ["ACTIVE", "DECOMMISSIONED", "IN_STORAGE"],
      }),
      nameField({
        fieldName: "name",
        label: "State Name",
        required: true,
        maxLength: 100,
        examples: ["Active", "In Storage", "Decommissioned"],
      }),
      descriptionField({ maxLength: 500 }),
      lookupField({
        name: "modelId",
        label: "Lifecycle Model Code",
        required: true,
        lookupTarget: "LifecycleModel",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["ASSET-STANDARD", "SOFTWARE-STD"],
        description: "Lifecycle model this state belongs to",
      }),
      enumField({
        name: "stateType",
        label: "State Type",
        required: true,
        enum: ["INITIAL", "ACTIVE", "INACTIVE", "TERMINAL", "TRANSITION"],
        description: "Type of state in workflow",
      }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether state is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- State Code must be unique within the lifecycle model
- Lifecycle Model must exist in the system
- State Type: INITIAL (starting state), ACTIVE (normal operation), INACTIVE (paused), TERMINAL (end state), TRANSITION (temporary)
    `.trim(),
  },

  // ========================================
  // FIELD_DEFINITION
  // ========================================
  FIELD_DEFINITION: {
    key: "FIELD_DEFINITION",
    name: "Field Definitions",
    tableName: "FieldDefinition",
    description: "Custom field definitions for entities",
    category: "FOUNDATION",
    permission: PERMISSIONS.FIELD_DEFINITIONS_CREATE,
    viewPermission: PERMISSIONS.FIELD_DEFINITIONS_VIEW,
    uniqueFields: ["name", "entityType"],
    requiredFields: ["name", "label", "dataType", "entityType"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateFieldDefinitionsAction,
    icon: "DatabaseZap",
    color: "#f59e0b",
    fields: [
      nameField({
        fieldName: "name",
        label: "Field Name",
        required: true,
        maxLength: 100,
        examples: ["customField1", "departmentCode", "projectId"],
      }),
      nameField({
        fieldName: "label",
        label: "Field Label",
        required: true,
        maxLength: 200,
        examples: ["Custom Field 1", "Department Code", "Project ID"],
      }),
      descriptionField({ maxLength: 1000 }),
      enumField({
        name: "dataType",
        label: "Data Type",
        required: true,
        enum: [
          "STRING",
          "TEXT",
          "INTEGER",
          "DECIMAL",
          "BOOLEAN",
          "DATE",
          "DATETIME",
          "ENUM",
          "JSON",
          "CI_REFERENCE",
          "PERSON_REFERENCE",
          "ORG_UNIT_REFERENCE",
          "LOCATION_REFERENCE",
        ],
        description: "Data type of the field",
      }),
      {
        name: "entityType",
        label: "Entity Type",
        type: "string",
        required: true,
        maxLength: 100,
        sanitization: [
          { operation: "trim" },
          { operation: "uppercase" },
          { operation: "normalizeWhitespace" },
        ],
        examples: ["ASSET", "CI", "PERSON", "CONTRACT"],
        description: "Which entity this field applies to",
        autoMap: ["entity_type", "entity", "applies_to"],
      },
      booleanField({
        name: "isRequired",
        label: "Required",
        defaultValue: false,
        description: "Whether field is required",
      }),
      booleanField({
        name: "isUnique",
        label: "Unique",
        defaultValue: false,
        description: "Whether field values must be unique",
      }),
      {
        name: "displayOrder",
        label: "Display Order",
        type: "number",
        required: false,
        min: 0,
        defaultValue: 0,
        examples: ["0", "1", "10"],
        description: "Order in which field appears in UI",
        autoMap: ["display_order", "order", "position"],
      },
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether field is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Field Name + Entity Type combination must be unique
- Data Type options: STRING, TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, ENUM, JSON, CI_REFERENCE, PERSON_REFERENCE, ORG_UNIT_REFERENCE, LOCATION_REFERENCE
- Entity Type must be a valid entity in the system (e.g., ASSET, CI, PERSON)
    `.trim(),
  },

  // ========================================
  // EXCHANGE_RATE
  // ========================================
  EXCHANGE_RATE: {
    key: "EXCHANGE_RATE",
    name: "Exchange Rates",
    tableName: "ExchangeRate",
    description: "Currency exchange rates to SAR",
    category: "FOUNDATION",
    permission: PERMISSIONS.FX_RATES_CREATE,
    viewPermission: PERMISSIONS.FX_RATES_VIEW,
    uniqueFields: ["currency"],
    requiredFields: ["currency", "rateToSAR"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateExchangeRatesAction,
    icon: "DollarSign",
    color: "#10b981",
    fields: [
      {
        ...currencyCodeField(),
        required: true,
      },
      {
        name: "rateToSAR",
        label: "Rate to SAR",
        type: "number",
        required: true,
        min: 0.000001,
        max: 999999,
        sanitization: [],
        examples: ["3.75", "0.27", "1.00"],
        description:
          "Exchange rate from this currency to SAR (max 6 decimal places)",
        autoMap: ["rate_to_sar", "rate", "exchange_rate", "sar_rate"],
        validations: [
          {
            type: "custom",
            message: "Exchange rate cannot have more than 6 decimal places",
          },
        ],
      },
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether exchange rate is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Currency must be a valid 3-letter ISO code (USD, EUR, GBP, etc.)
- Rate to SAR must be a positive number with maximum 6 decimal places
- SAR to SAR rate is always 1.00 and managed by the system
    `.trim(),
  },

  // ========================================
  // ASSET_ASSIGNMENT
  // ========================================
  ASSET_ASSIGNMENT: {
    key: "ASSET_ASSIGNMENT",
    name: "Asset Assignments",
    tableName: "AssetAssignment",
    description: "Asset assignments to persons/units/locations",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
    viewPermission: PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
    uniqueFields: [],
    requiredFields: ["assetId", "assigneeType", "assigneeId"],
    lookupFields: ["assetId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateAssetAssignmentsAction,
    icon: "UserCheck",
    color: "#6366f1",
    fields: [
      lookupField({
        name: "assetId",
        label: "Asset Tag",
        required: true,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["LAP-001", "SRV-042"],
        description: "Asset to assign",
      }),
      enumField({
        name: "assigneeType",
        label: "Assignee Type",
        required: true,
        enum: ["PERSON", "ORG_UNIT", "LOCATION", "CI"],
        description: "Type of assignee",
      }),
      {
        name: "assigneeId",
        label: "Assignee Identifier",
        type: "string",
        required: true,
        maxLength: 255,
        sanitization: [{ operation: "trim" }],
        examples: ["user@barq.com", "IT-OPS", "RYD-HQ", "prod.db.primary"],
        description:
          "Email (for PERSON), Code (for ORG_UNIT/LOCATION), or CI Key (for CI)",
        autoMap: ["assignee_id", "assignee", "assigned_to"],
      },
      dateField({
        name: "startDate",
        label: "Start Date",
        required: false,
        autoMap: ["start_date", "assigned_date", "from_date"],
      }),
      dateField({
        name: "endDate",
        label: "End Date",
        required: false,
        autoMap: ["end_date", "return_date", "to_date"],
      }),
      booleanField({
        name: "isPrimary",
        label: "Primary Assignment",
        defaultValue: false,
        description: "Whether this is the primary assignment for the asset",
      }),
      notesField({ name: "note", maxLength: 5000 }),
    ],
    businessRules: [
      {
        name: "endDateAfterStart",
        description: "End date must be after start date if both provided",
        validate: (row) => {
          if (row.startDate && row.endDate) {
            return new Date(row.endDate) > new Date(row.startDate);
          }
          return true;
        },
        message: "End date must be after start date",
        severity: "error",
      },
    ],
    templateInstructions: `
**Important Notes:**
- Asset must exist in the system (use asset tag)
- Assignee Type: PERSON (email), ORG_UNIT (code), LOCATION (code), CI (ciKey)
- Assignee ID format depends on type:
  - PERSON: email address (e.g., user@barq.com)
  - ORG_UNIT: unit code (e.g., IT-OPS)
  - LOCATION: location code (e.g., RYD-HQ)
  - CI: configuration item key (e.g., prod.db.primary)
- End Date must be after Start Date if both provided
    `.trim(),
  },

  // ========================================
  // WARRANTY
  // ========================================
  WARRANTY: {
    key: "WARRANTY",
    name: "Warranties",
    tableName: "Warranty",
    description: "Asset warranty records",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.WARRANTIES_CREATE,
    viewPermission: PERMISSIONS.WARRANTIES_VIEW,
    uniqueFields: [],
    requiredFields: ["assetId", "startDate", "endDate"],
    lookupFields: ["assetId", "vendorId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateWarrantiesAction,
    icon: "ShieldCheck",
    color: "#10b981",
    fields: [
      lookupField({
        name: "assetId",
        label: "Asset Tag",
        required: true,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["LAP-001", "SRV-042"],
        description: "Asset covered by warranty",
      }),
      lookupField({
        name: "vendorId",
        label: "Vendor Code",
        required: false,
        lookupTarget: "Vendor",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DELL", "HP", "LENOVO"],
        description: "Warranty provider vendor",
      }),
      enumField({
        name: "coverageType",
        label: "Coverage Type",
        required: false,
        enum: [
          "STANDARD",
          "EXTENDED",
          "ENHANCED",
          "PREMIUM",
          "BASIC",
          "THIRD_PARTY",
          "MANUFACTURER",
          "DEPOT",
          "ONSITE",
          "NEXT_BUSINESS_DAY",
        ],
        description: "Type of warranty coverage",
      }),
      {
        name: "policyReference",
        label: "Policy Reference",
        type: "string",
        required: false,
        maxLength: 200,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        examples: ["POL-12345", "WRT-2024-001"],
        description: "Warranty policy or contract reference number",
        autoMap: [
          "policy_reference",
          "policy_number",
          "contract_number",
          "reference",
        ],
      },
      dateField({
        name: "startDate",
        label: "Start Date",
        required: true,
        autoMap: ["start_date", "warranty_start", "begin_date"],
      }),
      dateField({
        name: "endDate",
        label: "End Date",
        required: true,
        autoMap: ["end_date", "warranty_end", "expiry_date"],
      }),
      currencyField({
        name: "cost",
        label: "Warranty Cost",
        required: false,
      }),
      currencyCodeField(),
      notesField({ name: "note", maxLength: 5000 }),
    ],
    businessRules: [
      {
        name: "endDateAfterStart",
        description: "End date must be after start date",
        validate: (row) => {
          if (row.startDate && row.endDate) {
            return new Date(row.endDate) > new Date(row.startDate);
          }
          return true;
        },
        message: "End date must be after start date",
        severity: "error",
      },
    ],
    templateInstructions: `
**Important Notes:**
- Asset must exist in the system (use asset tag)
- Start Date and End Date are required
- End Date must be after Start Date
- Coverage Type options: STANDARD, EXTENDED, ENHANCED, PREMIUM, BASIC, THIRD_PARTY, MANUFACTURER, DEPOT, ONSITE, NEXT_BUSINESS_DAY
- Currency defaults to SAR if not specified
    `.trim(),
  },

  // ========================================
  // MAINTENANCE_SCHEDULE
  // ========================================
  MAINTENANCE_SCHEDULE: {
    key: "MAINTENANCE_SCHEDULE",
    name: "Maintenance Schedules",
    tableName: "MaintenanceSchedule",
    description: "Recurring maintenance schedules for assets",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.MAINTENANCE_SCHEDULES_CREATE,
    viewPermission: PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
    uniqueFields: [],
    requiredFields: ["assetId", "title", "scheduleType"],
    lookupFields: ["assetId", "assignedToId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateMaintenanceSchedulesAction,
    icon: "Calendar",
    color: "#3b82f6",
    fields: [
      lookupField({
        name: "assetId",
        label: "Asset Tag",
        required: true,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["LAP-001", "SRV-042"],
        description: "Asset requiring maintenance",
      }),
      nameField({
        fieldName: "title",
        label: "Schedule Title",
        required: true,
        maxLength: 200,
        examples: [
          "Monthly Server Patching",
          "Quarterly Firewall Review",
          "Annual UPS Battery Replacement",
        ],
      }),
      descriptionField({ maxLength: 5000 }),
      enumField({
        name: "scheduleType",
        label: "Schedule Type",
        required: true,
        enum: ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"],
        description: "Recurrence pattern",
      }),
      {
        name: "intervalValue",
        label: "Interval Value",
        type: "number",
        required: false,
        min: 1,
        max: 1000,
        examples: ["1", "2", "3", "7", "30"],
        description: "Number of periods for recurrence (e.g., every 2 weeks)",
        autoMap: ["interval_value", "interval", "frequency"],
      },
      dateField({
        name: "startDate",
        label: "Start Date",
        required: false,
        autoMap: ["start_date", "first_due_date", "begin_date"],
      }),
      dateField({
        name: "nextDueDate",
        label: "Next Due Date",
        required: false,
        autoMap: ["next_due_date", "due_date", "next_date"],
      }),
      enumField({
        name: "priority",
        label: "Priority",
        required: false,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        defaultValue: "MEDIUM",
        description: "Maintenance priority level",
      }),
      {
        name: "estimatedDurationMinutes",
        label: "Estimated Duration (Minutes)",
        type: "number",
        required: false,
        min: 0,
        max: 43200,
        examples: ["30", "60", "120", "480"],
        description: "Expected time to complete (max 30 days)",
        autoMap: ["estimated_duration_minutes", "duration", "duration_minutes"],
      },
      lookupField({
        name: "assignedToId",
        label: "Assigned To Email",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        examples: ["tech@barq.com", "admin@barq.com"],
        description: "Person responsible for the maintenance",
        autoMap: ["assigned_to", "assignee", "technician"],
      }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Whether schedule is currently active",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Asset must exist in the system (use asset tag)
- Schedule Type: WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
- Interval Value: Number of periods (e.g., 2 for "every 2 weeks")
- Priority: LOW, MEDIUM, HIGH, CRITICAL
- Estimated Duration in minutes (max 43200 = 30 days)
- Assigned To must be a valid user email if provided
    `.trim(),
  },

  // ========================================
  // MAINTENANCE_RECORD
  // ========================================
  MAINTENANCE_RECORD: {
    key: "MAINTENANCE_RECORD",
    name: "Maintenance Records",
    tableName: "MaintenanceRecord",
    description: "Maintenance work records and history",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
    viewPermission: PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
    uniqueFields: [],
    requiredFields: ["assetId", "title"],
    lookupFields: ["assetId", "maintenanceScheduleId", "performedById"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateMaintenanceRecordsAction,
    icon: "Wrench",
    color: "#f59e0b",
    fields: [
      lookupField({
        name: "assetId",
        label: "Asset Tag",
        required: true,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["LAP-001", "SRV-042"],
        description: "Asset that was maintained",
      }),
      lookupField({
        name: "maintenanceScheduleId",
        label: "Schedule ID",
        required: false,
        lookupTarget: "MaintenanceSchedule",
        lookupField: "id",
        lookupDisplayField: "title",
        examples: [],
        description: "Associated maintenance schedule (if applicable)",
        autoMap: ["maintenance_schedule_id", "schedule_id", "schedule"],
      }),
      nameField({
        fieldName: "title",
        label: "Work Title",
        required: true,
        maxLength: 200,
        examples: ["Server Patching", "Disk Replacement", "Software Update"],
      }),
      descriptionField({ maxLength: 5000 }),
      dateField({
        name: "scheduledDate",
        label: "Scheduled Date",
        required: false,
        autoMap: ["scheduled_date", "planned_date", "due_date"],
      }),
      dateField({
        name: "completedDate",
        label: "Completed Date",
        required: false,
        autoMap: ["completed_date", "completion_date", "done_date"],
      }),
      lookupField({
        name: "performedById",
        label: "Performed By Email",
        required: false,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        examples: ["tech@barq.com", "admin@barq.com"],
        description: "Person who performed the maintenance",
        autoMap: ["performed_by", "technician", "completed_by"],
      }),
      enumField({
        name: "status",
        label: "Status",
        required: false,
        enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"],
        defaultValue: "SCHEDULED",
        description: "Current status of maintenance",
      }),
      notesField({ maxLength: 10000 }),
      currencyField({
        name: "cost",
        label: "Maintenance Cost",
        required: false,
      }),
      currencyCodeField(),
      dateField({
        name: "nextMaintenanceDate",
        label: "Next Maintenance Date",
        required: false,
        autoMap: [
          "next_maintenance_date",
          "next_service_date",
          "follow_up_date",
        ],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Asset must exist in the system (use asset tag)
- Status options: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
- Performed By must be a valid user email if provided
- Currency defaults to SAR if not specified
    `.trim(),
  },

  // ========================================
  // STOCK_MOVEMENT
  // ========================================
  STOCK_MOVEMENT: {
    key: "STOCK_MOVEMENT",
    name: "Stock Movements",
    tableName: "StockMovement",
    description: "Inventory stock movements and transfers",
    category: "INVENTORY",
    permission: PERMISSIONS.STOCK_MOVEMENTS_CREATE,
    viewPermission: PERMISSIONS.STOCK_MOVEMENTS_VIEW,
    uniqueFields: [],
    requiredFields: ["movementType", "performedById"],
    lookupFields: [
      "stockLocationFromId",
      "stockLocationToId",
      "assetId",
      "performedById",
    ],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateStockMovementsAction,
    icon: "PackagePlus",
    color: "#8b5cf6",
    fields: [
      enumField({
        name: "movementType",
        label: "Movement Type",
        required: true,
        enum: ["IN", "OUT", "TRANSFER", "ADJUSTMENT"],
        description: "Type of stock movement",
      }),
      lookupField({
        name: "stockLocationFromId",
        label: "From Stock Location Code",
        required: false,
        lookupTarget: "StockLocation",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["WH-01", "DC-MAIN"],
        description: "Source stock location (for OUT/TRANSFER)",
        autoMap: ["from_location", "source_location", "from"],
      }),
      lookupField({
        name: "stockLocationToId",
        label: "To Stock Location Code",
        required: false,
        lookupTarget: "StockLocation",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["WH-02", "STORE-RYD"],
        description: "Destination stock location (for IN/TRANSFER)",
        autoMap: ["to_location", "destination_location", "to"],
      }),
      lookupField({
        name: "assetId",
        label: "Asset Tag",
        required: false,
        lookupTarget: "Asset",
        lookupField: "assetTag",
        lookupDisplayField: "assetTag",
        examples: ["LAP-001", "SRV-042"],
        description: "Asset being moved (if applicable)",
      }),
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        required: false,
        min: 1,
        examples: ["1", "5", "10", "100"],
        description: "Number of items moved",
        autoMap: ["quantity", "qty", "count", "amount"],
      },
      {
        name: "reason",
        label: "Reason",
        type: "string",
        required: false,
        maxLength: 5000,
        sanitization: [{ operation: "trim" }],
        examples: [
          "New stock arrival",
          "Asset deployment",
          "Inventory correction",
        ],
        description: "Reason for the movement",
        autoMap: ["reason", "notes", "comments", "description"],
      },
      lookupField({
        name: "performedById",
        label: "Performed By Email",
        required: true,
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "email",
        examples: ["admin@barq.com", "warehouse@barq.com"],
        description: "Person who performed the movement",
        autoMap: ["performed_by", "created_by", "user"],
      }),
      dateField({
        name: "occurredAt",
        label: "Occurred At",
        required: false,
        autoMap: ["occurred_at", "movement_date", "date", "timestamp"],
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Movement Type: IN (receiving), OUT (issuing), TRANSFER (between locations), ADJUSTMENT (inventory correction)
- For IN: Provide To Stock Location
- For OUT: Provide From Stock Location
- For TRANSFER: Provide both From and To Stock Locations
- For ADJUSTMENT: Provide relevant location and reason
- Performed By must be a valid user email
    `.trim(),
  },

  // ========================================
  // CI_RELATIONSHIP
  // ========================================
  CI_RELATIONSHIP: {
    key: "CI_RELATIONSHIP",
    name: "CI Relationships",
    tableName: "CIRelationship",
    description: "Relationships between Configuration Items",
    category: "CMDB",
    permission: PERMISSIONS.CI_RELATIONSHIPS_CREATE,
    viewPermission: PERMISSIONS.CI_RELATIONSHIPS_VIEW,
    uniqueFields: [],
    requiredFields: ["fromCiId", "toCiId", "relationshipTypeId"],
    lookupFields: ["fromCiId", "toCiId", "relationshipTypeId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateCIRelationshipsAction,
    icon: "Network",
    color: "#8b5cf6",
    fields: [
      lookupField({
        name: "fromCiId",
        label: "From CI Code",
        required: true,
        lookupTarget: "ConfigurationItem",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SRV-WEB-01", "DB-PROD-01"],
        description: "Source Configuration Item",
      }),
      lookupField({
        name: "toCiId",
        label: "To CI Code",
        required: true,
        lookupTarget: "ConfigurationItem",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SRV-APP-01", "STORAGE-01"],
        description: "Target Configuration Item",
      }),
      lookupField({
        name: "relationshipTypeId",
        label: "Relationship Type Code",
        required: true,
        lookupTarget: "RelationshipType",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DEPENDS_ON", "HOSTS", "CONNECTED_TO"],
        description: "Type of relationship",
      }),
      dateField({
        name: "validFrom",
        label: "Valid From",
        required: false,
        autoMap: ["valid_from", "start_date", "effective_from"],
      }),
      dateField({
        name: "validTo",
        label: "Valid To",
        required: false,
        autoMap: ["valid_to", "end_date", "effective_to"],
      }),
      notesField({ maxLength: 1000 }),
    ],
    templateInstructions: `
**Important Notes:**
- From CI and To CI must exist in the ConfigurationItem table
- Relationship Type must be defined and valid for the CI classes
- Valid From/To dates define the relationship timeframe
- Leave Valid To empty for ongoing relationships
    `.trim(),
  },

  // ========================================
  // RELATIONSHIP_TYPE
  // ========================================
  RELATIONSHIP_TYPE: {
    key: "RELATIONSHIP_TYPE",
    name: "Relationship Types",
    tableName: "RelationshipType",
    description: "Types of relationships between CIs",
    category: "CMDB",
    permission: PERMISSIONS.RELATIONSHIP_TYPES_CREATE,
    viewPermission: PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateRelationshipTypesAction,
    icon: "GitBranch",
    color: "#10b981",
    fields: [
      nameField({
        fieldName: "name",
        label: "Name",
        maxLength: 100,
        examples: ["Depends On", "Hosts", "Connected To"],
      }),
      codeField({
        entityName: "Relationship Type",
        examples: ["DEPENDS_ON", "HOSTS", "CONNECTED_TO"],
      }),
      descriptionField({ maxLength: 500 }),
      enumField({
        name: "direction",
        label: "Direction",
        required: true,
        enum: ["UNIDIRECTIONAL", "BIDIRECTIONAL"],
        defaultValue: "UNIDIRECTIONAL",
        description: "Relationship directionality",
      }),
      booleanField({
        name: "isImpacting",
        label: "Is Impacting",
        defaultValue: false,
        description: "Does this relationship affect CI availability?",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Code is auto-generated from name if not provided (uppercase with underscores)
- UNIDIRECTIONAL: One-way relationship (A → B)
- BIDIRECTIONAL: Two-way relationship (A ↔ B)
- Is Impacting: Mark true if failure of one CI affects the other
    `.trim(),
  },

  // ========================================
  // CI_CLASS
  // ========================================
  CI_CLASS: {
    key: "CI_CLASS",
    name: "CI Classes",
    tableName: "CIClass",
    description: "Configuration Item class definitions",
    category: "CMDB",
    permission: PERMISSIONS.CI_CLASSES_CREATE,
    viewPermission: PERMISSIONS.CI_CLASSES_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name"],
    lookupFields: ["parentClassId", "lifecycleModelId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateCIClassesAction,
    icon: "Boxes",
    color: "#3b82f6",
    fields: [
      nameField({
        fieldName: "name",
        label: "Name",
        maxLength: 200,
        examples: ["Server", "Database", "Network Device"],
      }),
      codeField({
        entityName: "CI Class",
        examples: ["SERVER", "DATABASE", "NETWORK-DEVICE"],
      }),
      lookupField({
        name: "parentClassId",
        label: "Parent Class Code",
        required: false,
        lookupTarget: "CIClass",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["HARDWARE", "SOFTWARE"],
        description: "Parent class for inheritance",
      }),
      descriptionField({ maxLength: 5000 }),
      lookupField({
        name: "lifecycleModelId",
        label: "Lifecycle Model Code",
        required: false,
        lookupTarget: "LifecycleModel",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["HARDWARE-STD", "SOFTWARE-STD"],
        description: "Lifecycle model for CIs of this class",
      }),
      enumField({
        name: "defaultCriticality",
        label: "Default Criticality",
        required: false,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        description: "Default criticality level for CIs",
      }),
      enumField({
        name: "defaultEnvironment",
        label: "Default Environment",
        required: false,
        enum: ["PROD", "UAT", "DEV", "DR", "TEST", "OTHER"],
        description: "Default environment type",
      }),
      booleanField({
        name: "isDiscoverable",
        label: "Is Discoverable",
        defaultValue: false,
        description: "Can CIs be auto-discovered?",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Code is auto-generated from name if not provided
- Parent Class enables inheritance of fields and behavior
- Lifecycle Model defines valid states for CIs of this class
- Criticality: LOW (minimal impact) to CRITICAL (business-critical)
- Environment: PROD (production), UAT (user acceptance), DEV (development), DR (disaster recovery), TEST, OTHER
    `.trim(),
  },

  // ========================================
  // CI_CLASS_FIELD
  // ========================================
  CI_CLASS_FIELD: {
    key: "CI_CLASS_FIELD",
    name: "CI Class Fields",
    tableName: "CIClassField",
    description: "Custom fields for CI classes",
    category: "CMDB",
    permission: PERMISSIONS.CI_CLASS_FIELDS_CREATE,
    viewPermission: PERMISSIONS.CI_CLASS_FIELDS_VIEW,
    uniqueFields: [],
    requiredFields: ["ciClassId", "fieldDefinitionId"],
    lookupFields: ["ciClassId", "fieldDefinitionId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateCIClassFieldsAction,
    icon: "ListTree",
    color: "#f59e0b",
    fields: [
      lookupField({
        name: "ciClassId",
        label: "CI Class Code",
        required: true,
        lookupTarget: "CIClass",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SERVER", "DATABASE"],
        description: "CI class to add field to",
      }),
      lookupField({
        name: "fieldDefinitionId",
        label: "Field Definition Name",
        required: true,
        lookupTarget: "CustomFieldDefinition",
        lookupField: "name",
        lookupDisplayField: "label",
        examples: ["cpu_cores", "memory_gb"],
        description: "Custom field definition",
      }),
      booleanField({
        name: "isRequired",
        label: "Is Required",
        defaultValue: false,
        description: "Is field required for CIs of this class?",
      }),
      booleanField({
        name: "isUnique",
        label: "Is Unique",
        defaultValue: false,
        description: "Must field value be unique?",
      }),
      booleanField({
        name: "isVisible",
        label: "Is Visible",
        defaultValue: true,
        description: "Show field in UI?",
      }),
      {
        name: "uiOrder",
        label: "UI Order",
        type: "number",
        required: false,
        min: 0,
        defaultValue: 0,
        examples: ["0", "10", "100"],
        description: "Display order in UI (lower = first)",
        autoMap: ["ui_order", "display_order", "sort_order"],
      },
      notesField({ maxLength: 5000 }),
    ],
    templateInstructions: `
**Important Notes:**
- CI Class and Field Definition must exist
- UI Order determines field display sequence (0 = first)
- Default Value is JSON format
- Leave Default Value empty if not needed
    `.trim(),
  },

  // ========================================
  // RELATIONSHIP_TYPE_SCOPE
  // ========================================
  RELATIONSHIP_TYPE_SCOPE: {
    key: "RELATIONSHIP_TYPE_SCOPE",
    name: "Relationship Type Scopes",
    tableName: "RelationshipTypeScope",
    description: "Valid relationship type scopes between CI classes",
    category: "CMDB",
    permission: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_CREATE,
    viewPermission: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW,
    uniqueFields: [],
    requiredFields: ["relationshipTypeId", "fromCiClassId", "toCiClassId"],
    lookupFields: ["relationshipTypeId", "fromCiClassId", "toCiClassId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateRelationshipTypeScopesAction,
    icon: "Filter",
    color: "#8b5cf6",
    fields: [
      lookupField({
        name: "relationshipTypeId",
        label: "Relationship Type Code",
        required: true,
        lookupTarget: "RelationshipType",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DEPENDS_ON", "HOSTS"],
        description: "Relationship type",
      }),
      lookupField({
        name: "fromCiClassId",
        label: "From CI Class Code",
        required: true,
        lookupTarget: "CIClass",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["SERVER", "APPLICATION"],
        description: "Source CI class",
      }),
      lookupField({
        name: "toCiClassId",
        label: "To CI Class Code",
        required: true,
        lookupTarget: "CIClass",
        lookupField: "code",
        lookupDisplayField: "name",
        examples: ["DATABASE", "SERVER"],
        description: "Target CI class",
      }),
      notesField({ maxLength: 5000 }),
    ],
    templateInstructions: `
**Important Notes:**
- Defines which CI classes can have specific relationship types
- Example: "HOSTS" relationship from SERVER to APPLICATION
- All referenced CI classes and relationship types must exist
    `.trim(),
  },

  // ========================================
  // CONTRACT_TYPE
  // ========================================
  CONTRACT_TYPE: {
    key: "CONTRACT_TYPE",
    name: "Contract Types",
    tableName: "ContractType",
    description: "Types of contracts",
    category: "CONTRACTS",
    permission: PERMISSIONS.CONTRACT_TYPES_CREATE,
    viewPermission: PERMISSIONS.CONTRACT_TYPES_VIEW,
    uniqueFields: ["code"],
    requiredFields: ["name"],
    lookupFields: [],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateContractTypesAction,
    icon: "FileText",
    color: "#3b82f6",
    fields: [
      nameField({
        fieldName: "name",
        label: "Name",
        maxLength: 100,
        examples: ["Software License", "Support Agreement", "Lease Agreement"],
      }),
      codeField({
        entityName: "Contract Type",
        examples: ["SW-LICENSE", "SUPPORT", "LEASE"],
      }),
      descriptionField({ maxLength: 500 }),
      booleanField({
        name: "isActive",
        label: "Active",
        defaultValue: true,
        description: "Is contract type currently active?",
      }),
    ],
    templateInstructions: `
**Important Notes:**
- Code is auto-generated from name if not provided
- Examples: Software License, Support Agreement, Maintenance Contract, Lease Agreement
    `.trim(),
  },

  // ========================================
  // CONTRACT_LINKED_OBJECT
  // ========================================
  CONTRACT_LINKED_OBJECT: {
    key: "CONTRACT_LINKED_OBJECT",
    name: "Contract Linked Objects",
    tableName: "ContractLinkedObject",
    description: "Objects linked to contracts",
    category: "CONTRACTS",
    permission: PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE,
    viewPermission: PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW,
    uniqueFields: [],
    requiredFields: ["contractId", "targetType", "targetId"],
    lookupFields: ["contractId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateContractLinkedObjectsAction,
    icon: "Link",
    color: "#10b981",
    fields: [
      lookupField({
        name: "contractId",
        label: "Contract Reference",
        required: true,
        lookupTarget: "Contract",
        lookupField: "referenceNumber",
        lookupDisplayField: "title",
        examples: ["CONT-2024-001", "SW-LIC-123"],
        description: "Contract to link to",
      }),
      enumField({
        name: "targetType",
        label: "Target Type",
        required: true,
        enum: ["CONFIGURATION_ITEM", "ASSET", "LICENSE_ENTITLEMENT"],
        description: "Type of linked object",
      }),
      {
        name: "targetId",
        label: "Target ID",
        type: "string",
        required: true,
        examples: [
          "12345678-1234-1234-1234-123456789012",
          "ci-uuid",
          "asset-uuid",
        ],
        description:
          "UUID of the target object (CI, Asset, or License Entitlement)",
        autoMap: ["target_id", "object_id", "linked_id"],
      },
      notesField({ maxLength: 2000 }),
    ],
    templateInstructions: `
**Important Notes:**
- Contract must exist in system
- Target Type: CONFIGURATION_ITEM, ASSET, or LICENSE_ENTITLEMENT
- Target ID must be a valid UUID of the target object
- Links contracts to CIs, Assets, or License Entitlements
    `.trim(),
  },

  // ========================================
  // LICENSE_PRODUCT_FIELD
  // ========================================
  LICENSE_PRODUCT_FIELD: {
    key: "LICENSE_PRODUCT_FIELD",
    name: "License Product Fields",
    tableName: "LicenseProductField",
    description: "Custom fields for license products",
    category: "LICENSES",
    permission: PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE,
    viewPermission: PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW,
    uniqueFields: [],
    requiredFields: ["licenseProductId", "fieldDefinitionId"],
    lookupFields: ["licenseProductId", "fieldDefinitionId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLicenseProductFieldsAction,
    icon: "ListTree",
    color: "#f59e0b",
    fields: [
      lookupField({
        name: "licenseProductId",
        label: "License Product Code",
        required: true,
        lookupTarget: "LicenseProduct",
        lookupField: "productCode",
        lookupDisplayField: "productName",
        examples: ["MSFT-SQL-STD", "ADOBE-CC"],
        description: "License product to add field to",
      }),
      lookupField({
        name: "fieldDefinitionId",
        label: "Field Definition Name",
        required: true,
        lookupTarget: "CustomFieldDefinition",
        lookupField: "name",
        lookupDisplayField: "label",
        examples: ["activation_key", "license_server"],
        description: "Custom field definition",
      }),
      booleanField({
        name: "isRequired",
        label: "Is Required",
        defaultValue: false,
        description: "Is field required for this product?",
      }),
      booleanField({
        name: "isVisible",
        label: "Is Visible",
        defaultValue: true,
        description: "Show field in UI?",
      }),
      {
        name: "uiOrder",
        label: "UI Order",
        type: "number",
        required: false,
        min: 0,
        defaultValue: 0,
        examples: ["0", "10", "100"],
        description: "Display order in UI",
        autoMap: ["ui_order", "display_order", "sort_order"],
      },
    ],
    templateInstructions: `
**Important Notes:**
- License Product and Field Definition must exist
- UI Order determines field display sequence (0 = first)
- Default Value is JSON format
    `.trim(),
  },

  // ========================================
  // LICENSE_ENTITLEMENT
  // ========================================
  LICENSE_ENTITLEMENT: {
    key: "LICENSE_ENTITLEMENT",
    name: "License Entitlements",
    tableName: "LicenseEntitlement",
    description: "Purchased license entitlements",
    category: "LICENSES",
    permission: PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE,
    viewPermission: PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
    uniqueFields: [],
    requiredFields: ["licenseProductId", "purchasedQuantity", "effectiveStart"],
    lookupFields: ["licenseProductId", "contractId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLicenseEntitlementsAction,
    icon: "Key",
    color: "#8b5cf6",
    fields: [
      lookupField({
        name: "licenseProductId",
        label: "License Product Code",
        required: true,
        lookupTarget: "LicenseProduct",
        lookupField: "productCode",
        lookupDisplayField: "productName",
        examples: ["MSFT-SQL-STD", "ADOBE-CC"],
        description: "Licensed product",
      }),
      lookupField({
        name: "contractId",
        label: "Contract Reference",
        required: false,
        lookupTarget: "Contract",
        lookupField: "referenceNumber",
        lookupDisplayField: "title",
        examples: ["CONT-2024-001"],
        description: "Associated contract (optional)",
      }),
      {
        name: "purchasedQuantity",
        label: "Purchased Quantity",
        type: "number",
        required: true,
        min: 1,
        examples: ["10", "100", "1000"],
        description: "Number of licenses purchased",
        autoMap: ["purchased_quantity", "quantity", "count", "licenses"],
      },
      dateField({
        name: "effectiveStart",
        label: "Effective Start",
        required: true,
        autoMap: ["effective_start", "start_date", "valid_from"],
      }),
      dateField({
        name: "effectiveEnd",
        label: "Effective End",
        required: false,
        autoMap: ["effective_end", "end_date", "valid_to", "expiry_date"],
      }),
      notesField({ maxLength: 5000 }),
    ],
    businessRules: [
      {
        name: "effectiveEndAfterStart",
        description: "Effective end must be after start",
        validate: (row: Record<string, unknown>) => {
          if (row.effectiveEnd && row.effectiveStart) {
            const start = new Date(row.effectiveStart as string);
            const end = new Date(row.effectiveEnd as string);
            return end > start;
          }
          return true;
        },
        message: "Effective end date must be after effective start date",
        severity: "error",
      },
    ],
    templateInstructions: `
**Important Notes:**
- License Product must exist in system
- Purchased Quantity must be a positive integer
- Effective Start is the license activation date
- Leave Effective End empty for perpetual licenses
- Effective End must be after Effective Start
    `.trim(),
  },

  // ========================================
  // LICENSE_ALLOCATION
  // ========================================
  LICENSE_ALLOCATION: {
    key: "LICENSE_ALLOCATION",
    name: "License Allocations",
    tableName: "LicenseAllocation",
    description: "License allocations to persons/CIs/assets",
    category: "LICENSES",
    permission: PERMISSIONS.LICENSE_ALLOCATIONS_CREATE,
    viewPermission: PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
    uniqueFields: [],
    requiredFields: [
      "licenseEntitlementId",
      "targetType",
      "targetId",
      "allocatedQuantity",
    ],
    lookupFields: ["licenseEntitlementId"],
    maxBatchSize: 100,
    bulkCreateAction: bulkCreateLicenseAllocationsAction,
    icon: "UserCheck",
    color: "#10b981",
    fields: [
      {
        name: "licenseEntitlementId",
        label: "License Entitlement ID",
        type: "string",
        required: true,
        examples: ["12345678-1234-1234-1234-123456789012"],
        description:
          "License entitlement ID (UUID) - lookup not supported, use UUID directly",
        autoMap: ["license_entitlement_id", "entitlement_id", "license_id"],
      },
      enumField({
        name: "targetType",
        label: "Target Type",
        required: true,
        enum: ["PERSON", "CI", "ASSET"],
        description: "Type of allocation target",
      }),
      {
        name: "targetId",
        label: "Target ID",
        type: "string",
        required: true,
        examples: ["12345678-1234-1234-1234-123456789012"],
        description: "UUID of target (Person, CI, or Asset)",
        autoMap: ["target_id", "allocated_to", "user_id"],
      },
      {
        name: "allocatedQuantity",
        label: "Allocated Quantity",
        type: "number",
        required: true,
        min: 1,
        examples: ["1", "5", "10"],
        description: "Number of licenses allocated",
        autoMap: ["allocated_quantity", "quantity", "count"],
      },
      notesField({ maxLength: 5000 }),
    ],
    templateInstructions: `
**Important Notes:**
- License Entitlement ID must be a valid UUID
- Target Type: PERSON (user), CI (configuration item), or ASSET (hardware/software)
- Target ID must be a valid UUID of the target object
- Allocated Quantity cannot exceed available entitlement
- Examples:
  - PERSON: Allocate Microsoft Office to john.doe@barq.com
  - CI: Allocate SQL Server to database server CI
  - ASSET: Allocate Adobe CC to laptop asset
    `.trim(),
  },
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
