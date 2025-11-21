-- CreateEnum
CREATE TYPE "EnvironmentEnum" AS ENUM ('PROD', 'UAT', 'DEV', 'DR', 'TEST', 'OTHER');

-- CreateEnum
CREATE TYPE "CriticalityEnum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssigneeTypeEnum" AS ENUM ('PERSON', 'ORG_UNIT', 'LOCATION', 'CI');

-- CreateEnum
CREATE TYPE "AllocationTargetTypeEnum" AS ENUM ('PERSON', 'CI', 'ASSET');

-- CreateEnum
CREATE TYPE "TargetObjectTypeEnum" AS ENUM ('CI', 'ASSET', 'LICENSE_ENTITLEMENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "StockMovementTypeEnum" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FieldDataTypeEnum" AS ENUM ('STRING', 'TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'ENUM', 'JSON', 'CI_REFERENCE', 'PERSON_REFERENCE', 'ORG_UNIT_REFERENCE', 'LOCATION_REFERENCE');

-- CreateEnum
CREATE TYPE "RelationshipDirectionEnum" AS ENUM ('UNIDIRECTIONAL', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "VerificationStatusEnum" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "OrganizationUnitType" AS ENUM ('COMPANY', 'BUSINESS_UNIT', 'DEPARTMENT', 'TEAM', 'DIVISION', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('MANUFACTURER', 'RESELLER', 'SERVICE_PROVIDER', 'CONSULTANT', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('COUNTRY', 'CITY', 'CAMPUS', 'BUILDING', 'FLOOR', 'ROOM', 'RACK', 'DATA_CENTER', 'CLOUD_REGION', 'PHYSICAL', 'LOGICAL', 'ZONE', 'AREA');

-- CreateEnum
CREATE TYPE "StateType" AS ENUM ('INITIAL', 'ACTIVE', 'INACTIVE', 'TERMINAL', 'TRANSITION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PromptBlockCategory" AS ENUM ('CORE_SYNTAX', 'CONTENT_GUIDELINES', 'VALIDATION', 'ADVANCED_FEATURES');

-- CreateEnum
CREATE TYPE "PromptPurpose" AS ENUM ('OUTLINE', 'CONTENT', 'THEME', 'REVIEW', 'REFINEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginMethod" TEXT,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'oauth',
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_units" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "unitType" "OrganizationUnitType" NOT NULL DEFAULT 'OTHER',
    "managerId" TEXT,
    "costCenter" TEXT,
    "level" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "employeeId" TEXT,
    "orgUnitId" TEXT NOT NULL,
    "primaryRoleId" TEXT NOT NULL,
    "managerId" TEXT,
    "title" TEXT,
    "locationId" TEXT,
    "department" TEXT,
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_role_assignments" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scope" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "locationType" "LocationType" NOT NULL,
    "address" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "timeZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "vendorType" "VendorType" NOT NULL DEFAULT 'OTHER',
    "taxId" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "paymentTerms" TEXT,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contacts" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_states" (
    "id" TEXT NOT NULL,
    "lifecycleModelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "stateType" "StateType" NOT NULL DEFAULT 'ACTIVE',
    "isActiveState" BOOLEAN NOT NULL DEFAULT false,
    "isTerminalState" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_transitions" (
    "id" TEXT NOT NULL,
    "lifecycleModelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "requiredRoleId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalPolicy" JSONB,
    "conditions" JSONB,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" "FieldDataTypeEnum" NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "defaultValue" JSONB,
    "enumOptions" JSONB,
    "uiGroup" TEXT,
    "uiOrder" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSearchable" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ci_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentClassId" TEXT,
    "description" TEXT,
    "lifecycleModelId" TEXT,
    "defaultCriticality" "CriticalityEnum",
    "defaultEnvironment" "EnvironmentEnum",
    "isDiscoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ci_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ci_class_fields" (
    "id" TEXT NOT NULL,
    "ciClassId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" JSONB,
    "uiOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ci_class_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ciClassId" TEXT NOT NULL,
    "lifecycleStateId" TEXT,
    "criticality" "CriticalityEnum",
    "environment" "EnvironmentEnum",
    "primaryOwnerPersonId" TEXT,
    "primaryOwnerOrgUnitId" TEXT,
    "locationId" TEXT,
    "linkedAssetId" TEXT,
    "ciKey" TEXT,
    "description" TEXT,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuration_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "direction" "RelationshipDirectionEnum" NOT NULL,
    "isImpacting" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_type_scopes" (
    "id" TEXT NOT NULL,
    "relationshipTypeId" TEXT NOT NULL,
    "fromCiClassId" TEXT NOT NULL,
    "toCiClassId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_type_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ci_relationships" (
    "id" TEXT NOT NULL,
    "fromCiId" TEXT NOT NULL,
    "toCiId" TEXT NOT NULL,
    "relationshipTypeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ci_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "lifecycleModelId" TEXT,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_category_fields" (
    "id" TEXT NOT NULL,
    "assetCategoryId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "uiOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_category_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_models" (
    "id" TEXT NOT NULL,
    "assetCategoryId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "defaultWarrantyMonths" INTEGER,
    "defaultAttributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "locationId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "movementType" "StockMovementTypeEnum" NOT NULL,
    "stockLocationFromId" TEXT,
    "stockLocationToId" TEXT,
    "assetId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT,
    "performedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "assetCategoryId" TEXT NOT NULL,
    "assetModelId" TEXT,
    "vendorId" TEXT,
    "contractId" TEXT,
    "lifecycleStateId" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "currency" TEXT,
    "depreciationModel" TEXT,
    "depreciationStart" TIMESTAMP(3),
    "depreciationEnd" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "currentStockLocationId" TEXT,
    "attributes" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assigneeType" "AssigneeTypeEnum" NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractTypeId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalTerms" TEXT,
    "slaDefinition" JSONB,
    "totalValue" DECIMAL(12,2),
    "currency" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_linked_objects" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "targetType" "TargetObjectTypeEnum" NOT NULL,
    "targetId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_linked_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "description" TEXT,
    "lifecycleModelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_product_fields" (
    "id" TEXT NOT NULL,
    "licenseProductId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "uiOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_product_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_entitlements" (
    "id" TEXT NOT NULL,
    "licenseProductId" TEXT NOT NULL,
    "contractId" TEXT,
    "purchasedQuantity" INTEGER NOT NULL,
    "effectiveStart" TIMESTAMP(3) NOT NULL,
    "effectiveEnd" TIMESTAMP(3),
    "allowedScope" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_allocations" (
    "id" TEXT NOT NULL,
    "licenseEntitlementId" TEXT NOT NULL,
    "targetType" "AllocationTargetTypeEnum" NOT NULL,
    "targetId" TEXT NOT NULL,
    "allocatedQuantity" INTEGER NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deallocatedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "license_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_domains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_ownerships" (
    "id" TEXT NOT NULL,
    "dataDomainId" TEXT NOT NULL,
    "ciClassId" TEXT,
    "assetCategoryId" TEXT,
    "ownerPersonId" TEXT,
    "ownerOrgUnitId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "TargetObjectTypeEnum" NOT NULL,
    "filterDefinition" JSONB,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_items" (
    "id" TEXT NOT NULL,
    "verificationCampaignId" TEXT NOT NULL,
    "targetType" "TargetObjectTypeEnum" NOT NULL,
    "targetId" TEXT NOT NULL,
    "verifierPersonId" TEXT,
    "status" "VerificationStatusEnum" NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL,
    "targetType" "TargetObjectTypeEnum" NOT NULL,
    "targetId" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceSystem" TEXT,
    "note" TEXT,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "attachmentTypeId" TEXT NOT NULL,
    "targetType" "TargetObjectTypeEnum" NOT NULL,
    "targetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_blocks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PromptBlockCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentBlockId" TEXT,

    CONSTRAINT "prompt_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_compositions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" "PromptPurpose" NOT NULL,
    "description" TEXT,
    "variables" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_compositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_composition_blocks" (
    "id" TEXT NOT NULL,
    "compositionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "overrides" JSONB,

    CONSTRAINT "prompt_composition_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_key" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "permissions"("isActive");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_code_key" ON "organization_units"("code");

-- CreateIndex
CREATE INDEX "organization_units_parentId_idx" ON "organization_units"("parentId");

-- CreateIndex
CREATE INDEX "organization_units_code_idx" ON "organization_units"("code");

-- CreateIndex
CREATE INDEX "organization_units_managerId_idx" ON "organization_units"("managerId");

-- CreateIndex
CREATE INDEX "organization_units_isActive_idx" ON "organization_units"("isActive");

-- CreateIndex
CREATE INDEX "organization_units_level_idx" ON "organization_units"("level");

-- CreateIndex
CREATE INDEX "organization_units_unitType_idx" ON "organization_units"("unitType");

-- CreateIndex
CREATE UNIQUE INDEX "persons_userId_key" ON "persons"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "persons_employeeId_key" ON "persons"("employeeId");

-- CreateIndex
CREATE INDEX "persons_userId_idx" ON "persons"("userId");

-- CreateIndex
CREATE INDEX "persons_email_idx" ON "persons"("email");

-- CreateIndex
CREATE INDEX "persons_employeeId_idx" ON "persons"("employeeId");

-- CreateIndex
CREATE INDEX "persons_orgUnitId_idx" ON "persons"("orgUnitId");

-- CreateIndex
CREATE INDEX "persons_primaryRoleId_idx" ON "persons"("primaryRoleId");

-- CreateIndex
CREATE INDEX "persons_managerId_idx" ON "persons"("managerId");

-- CreateIndex
CREATE INDEX "persons_locationId_idx" ON "persons"("locationId");

-- CreateIndex
CREATE INDEX "persons_isActive_idx" ON "persons"("isActive");

-- CreateIndex
CREATE INDEX "person_role_assignments_personId_idx" ON "person_role_assignments"("personId");

-- CreateIndex
CREATE INDEX "person_role_assignments_roleId_idx" ON "person_role_assignments"("roleId");

-- CreateIndex
CREATE INDEX "person_role_assignments_isPrimary_idx" ON "person_role_assignments"("isPrimary");

-- CreateIndex
CREATE INDEX "person_role_assignments_startDate_endDate_idx" ON "person_role_assignments"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE INDEX "locations_code_idx" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_locationType_idx" ON "locations"("locationType");

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE INDEX "locations_country_idx" ON "locations"("country");

-- CreateIndex
CREATE INDEX "locations_isActive_idx" ON "locations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_code_key" ON "vendors"("code");

-- CreateIndex
CREATE INDEX "vendors_name_idx" ON "vendors"("name");

-- CreateIndex
CREATE INDEX "vendors_code_idx" ON "vendors"("code");

-- CreateIndex
CREATE INDEX "vendors_email_idx" ON "vendors"("email");

-- CreateIndex
CREATE INDEX "vendors_vendorType_idx" ON "vendors"("vendorType");

-- CreateIndex
CREATE INDEX "vendors_isActive_idx" ON "vendors"("isActive");

-- CreateIndex
CREATE INDEX "vendors_isPreferred_idx" ON "vendors"("isPreferred");

-- CreateIndex
CREATE INDEX "vendor_contacts_vendorId_idx" ON "vendor_contacts"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_contacts_email_idx" ON "vendor_contacts"("email");

-- CreateIndex
CREATE INDEX "vendor_contacts_isPrimary_idx" ON "vendor_contacts"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_models_name_key" ON "lifecycle_models"("name");

-- CreateIndex
CREATE INDEX "lifecycle_models_name_idx" ON "lifecycle_models"("name");

-- CreateIndex
CREATE INDEX "lifecycle_states_lifecycleModelId_idx" ON "lifecycle_states"("lifecycleModelId");

-- CreateIndex
CREATE INDEX "lifecycle_states_code_idx" ON "lifecycle_states"("code");

-- CreateIndex
CREATE INDEX "lifecycle_states_sortOrder_idx" ON "lifecycle_states"("sortOrder");

-- CreateIndex
CREATE INDEX "lifecycle_states_stateType_idx" ON "lifecycle_states"("stateType");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_states_lifecycleModelId_code_key" ON "lifecycle_states"("lifecycleModelId", "code");

-- CreateIndex
CREATE INDEX "lifecycle_transitions_lifecycleModelId_idx" ON "lifecycle_transitions"("lifecycleModelId");

-- CreateIndex
CREATE INDEX "lifecycle_transitions_fromStateId_idx" ON "lifecycle_transitions"("fromStateId");

-- CreateIndex
CREATE INDEX "lifecycle_transitions_toStateId_idx" ON "lifecycle_transitions"("toStateId");

-- CreateIndex
CREATE INDEX "lifecycle_transitions_requiredRoleId_idx" ON "lifecycle_transitions"("requiredRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_transitions_lifecycleModelId_fromStateId_toStateI_key" ON "lifecycle_transitions"("lifecycleModelId", "fromStateId", "toStateId");

-- CreateIndex
CREATE UNIQUE INDEX "field_definitions_name_key" ON "field_definitions"("name");

-- CreateIndex
CREATE INDEX "field_definitions_name_idx" ON "field_definitions"("name");

-- CreateIndex
CREATE INDEX "field_definitions_dataType_idx" ON "field_definitions"("dataType");

-- CreateIndex
CREATE INDEX "field_definitions_entityType_idx" ON "field_definitions"("entityType");

-- CreateIndex
CREATE INDEX "field_definitions_isGlobal_idx" ON "field_definitions"("isGlobal");

-- CreateIndex
CREATE INDEX "field_definitions_isActive_idx" ON "field_definitions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ci_classes_name_key" ON "ci_classes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ci_classes_code_key" ON "ci_classes"("code");

-- CreateIndex
CREATE INDEX "ci_classes_parentClassId_idx" ON "ci_classes"("parentClassId");

-- CreateIndex
CREATE INDEX "ci_classes_code_idx" ON "ci_classes"("code");

-- CreateIndex
CREATE INDEX "ci_classes_lifecycleModelId_idx" ON "ci_classes"("lifecycleModelId");

-- CreateIndex
CREATE INDEX "ci_class_fields_ciClassId_idx" ON "ci_class_fields"("ciClassId");

-- CreateIndex
CREATE INDEX "ci_class_fields_fieldDefinitionId_idx" ON "ci_class_fields"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ci_class_fields_ciClassId_fieldDefinitionId_key" ON "ci_class_fields"("ciClassId", "fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "configuration_items_ciKey_key" ON "configuration_items"("ciKey");

-- CreateIndex
CREATE INDEX "configuration_items_ciClassId_idx" ON "configuration_items"("ciClassId");

-- CreateIndex
CREATE INDEX "configuration_items_lifecycleStateId_idx" ON "configuration_items"("lifecycleStateId");

-- CreateIndex
CREATE INDEX "configuration_items_primaryOwnerPersonId_idx" ON "configuration_items"("primaryOwnerPersonId");

-- CreateIndex
CREATE INDEX "configuration_items_primaryOwnerOrgUnitId_idx" ON "configuration_items"("primaryOwnerOrgUnitId");

-- CreateIndex
CREATE INDEX "configuration_items_locationId_idx" ON "configuration_items"("locationId");

-- CreateIndex
CREATE INDEX "configuration_items_ciKey_idx" ON "configuration_items"("ciKey");

-- CreateIndex
CREATE INDEX "configuration_items_name_idx" ON "configuration_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_types_name_key" ON "relationship_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_types_code_key" ON "relationship_types"("code");

-- CreateIndex
CREATE INDEX "relationship_types_code_idx" ON "relationship_types"("code");

-- CreateIndex
CREATE INDEX "relationship_type_scopes_relationshipTypeId_idx" ON "relationship_type_scopes"("relationshipTypeId");

-- CreateIndex
CREATE INDEX "relationship_type_scopes_fromCiClassId_idx" ON "relationship_type_scopes"("fromCiClassId");

-- CreateIndex
CREATE INDEX "relationship_type_scopes_toCiClassId_idx" ON "relationship_type_scopes"("toCiClassId");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_type_scopes_relationshipTypeId_fromCiClassId_t_key" ON "relationship_type_scopes"("relationshipTypeId", "fromCiClassId", "toCiClassId");

-- CreateIndex
CREATE INDEX "ci_relationships_fromCiId_idx" ON "ci_relationships"("fromCiId");

-- CreateIndex
CREATE INDEX "ci_relationships_toCiId_idx" ON "ci_relationships"("toCiId");

-- CreateIndex
CREATE INDEX "ci_relationships_relationshipTypeId_idx" ON "ci_relationships"("relationshipTypeId");

-- CreateIndex
CREATE INDEX "ci_relationships_isActive_idx" ON "ci_relationships"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ci_relationships_fromCiId_toCiId_relationshipTypeId_key" ON "ci_relationships"("fromCiId", "toCiId", "relationshipTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_code_key" ON "asset_categories"("code");

-- CreateIndex
CREATE INDEX "asset_categories_code_idx" ON "asset_categories"("code");

-- CreateIndex
CREATE INDEX "asset_categories_lifecycleModelId_idx" ON "asset_categories"("lifecycleModelId");

-- CreateIndex
CREATE INDEX "asset_category_fields_assetCategoryId_idx" ON "asset_category_fields"("assetCategoryId");

-- CreateIndex
CREATE INDEX "asset_category_fields_fieldDefinitionId_idx" ON "asset_category_fields"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_category_fields_assetCategoryId_fieldDefinitionId_key" ON "asset_category_fields"("assetCategoryId", "fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_models_code_key" ON "asset_models"("code");

-- CreateIndex
CREATE INDEX "asset_models_code_idx" ON "asset_models"("code");

-- CreateIndex
CREATE INDEX "asset_models_assetCategoryId_idx" ON "asset_models"("assetCategoryId");

-- CreateIndex
CREATE INDEX "asset_models_vendorId_idx" ON "asset_models"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_code_key" ON "stock_locations"("code");

-- CreateIndex
CREATE INDEX "stock_locations_code_idx" ON "stock_locations"("code");

-- CreateIndex
CREATE INDEX "stock_locations_locationId_idx" ON "stock_locations"("locationId");

-- CreateIndex
CREATE INDEX "stock_movements_movementType_idx" ON "stock_movements"("movementType");

-- CreateIndex
CREATE INDEX "stock_movements_stockLocationFromId_idx" ON "stock_movements"("stockLocationFromId");

-- CreateIndex
CREATE INDEX "stock_movements_stockLocationToId_idx" ON "stock_movements"("stockLocationToId");

-- CreateIndex
CREATE INDEX "stock_movements_assetId_idx" ON "stock_movements"("assetId");

-- CreateIndex
CREATE INDEX "stock_movements_performedById_idx" ON "stock_movements"("performedById");

-- CreateIndex
CREATE INDEX "stock_movements_occurredAt_idx" ON "stock_movements"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serialNumber_key" ON "assets"("serialNumber");

-- CreateIndex
CREATE INDEX "assets_assetTag_idx" ON "assets"("assetTag");

-- CreateIndex
CREATE INDEX "assets_assetCategoryId_idx" ON "assets"("assetCategoryId");

-- CreateIndex
CREATE INDEX "assets_assetModelId_idx" ON "assets"("assetModelId");

-- CreateIndex
CREATE INDEX "assets_vendorId_idx" ON "assets"("vendorId");

-- CreateIndex
CREATE INDEX "assets_contractId_idx" ON "assets"("contractId");

-- CreateIndex
CREATE INDEX "assets_lifecycleStateId_idx" ON "assets"("lifecycleStateId");

-- CreateIndex
CREATE INDEX "assets_serialNumber_idx" ON "assets"("serialNumber");

-- CreateIndex
CREATE INDEX "assets_currentStockLocationId_idx" ON "assets"("currentStockLocationId");

-- CreateIndex
CREATE INDEX "asset_assignments_assetId_idx" ON "asset_assignments"("assetId");

-- CreateIndex
CREATE INDEX "asset_assignments_assigneeType_assigneeId_idx" ON "asset_assignments"("assigneeType", "assigneeId");

-- CreateIndex
CREATE INDEX "asset_assignments_startDate_endDate_idx" ON "asset_assignments"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_name_key" ON "contract_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_code_key" ON "contract_types"("code");

-- CreateIndex
CREATE INDEX "contract_types_code_idx" ON "contract_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_contractTypeId_idx" ON "contracts"("contractTypeId");

-- CreateIndex
CREATE INDEX "contracts_vendorId_idx" ON "contracts"("vendorId");

-- CreateIndex
CREATE INDEX "contracts_contractNumber_idx" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_startDate_endDate_idx" ON "contracts"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "contract_linked_objects_contractId_idx" ON "contract_linked_objects"("contractId");

-- CreateIndex
CREATE INDEX "contract_linked_objects_targetType_targetId_idx" ON "contract_linked_objects"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "license_products_name_key" ON "license_products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "license_products_code_key" ON "license_products"("code");

-- CreateIndex
CREATE INDEX "license_products_code_idx" ON "license_products"("code");

-- CreateIndex
CREATE INDEX "license_products_vendorId_idx" ON "license_products"("vendorId");

-- CreateIndex
CREATE INDEX "license_products_lifecycleModelId_idx" ON "license_products"("lifecycleModelId");

-- CreateIndex
CREATE INDEX "license_product_fields_licenseProductId_idx" ON "license_product_fields"("licenseProductId");

-- CreateIndex
CREATE INDEX "license_product_fields_fieldDefinitionId_idx" ON "license_product_fields"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "license_product_fields_licenseProductId_fieldDefinitionId_key" ON "license_product_fields"("licenseProductId", "fieldDefinitionId");

-- CreateIndex
CREATE INDEX "license_entitlements_licenseProductId_idx" ON "license_entitlements"("licenseProductId");

-- CreateIndex
CREATE INDEX "license_entitlements_contractId_idx" ON "license_entitlements"("contractId");

-- CreateIndex
CREATE INDEX "license_entitlements_effectiveStart_effectiveEnd_idx" ON "license_entitlements"("effectiveStart", "effectiveEnd");

-- CreateIndex
CREATE INDEX "license_allocations_licenseEntitlementId_idx" ON "license_allocations"("licenseEntitlementId");

-- CreateIndex
CREATE INDEX "license_allocations_targetType_targetId_idx" ON "license_allocations"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "license_allocations_allocatedAt_idx" ON "license_allocations"("allocatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "data_domains_name_key" ON "data_domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_domains_code_key" ON "data_domains"("code");

-- CreateIndex
CREATE INDEX "data_domains_code_idx" ON "data_domains"("code");

-- CreateIndex
CREATE INDEX "data_ownerships_dataDomainId_idx" ON "data_ownerships"("dataDomainId");

-- CreateIndex
CREATE INDEX "data_ownerships_ciClassId_idx" ON "data_ownerships"("ciClassId");

-- CreateIndex
CREATE INDEX "data_ownerships_assetCategoryId_idx" ON "data_ownerships"("assetCategoryId");

-- CreateIndex
CREATE INDEX "data_ownerships_ownerPersonId_idx" ON "data_ownerships"("ownerPersonId");

-- CreateIndex
CREATE INDEX "data_ownerships_ownerOrgUnitId_idx" ON "data_ownerships"("ownerOrgUnitId");

-- CreateIndex
CREATE INDEX "verification_campaigns_targetType_idx" ON "verification_campaigns"("targetType");

-- CreateIndex
CREATE INDEX "verification_campaigns_createdById_idx" ON "verification_campaigns"("createdById");

-- CreateIndex
CREATE INDEX "verification_campaigns_scheduledStart_scheduledEnd_idx" ON "verification_campaigns"("scheduledStart", "scheduledEnd");

-- CreateIndex
CREATE INDEX "verification_items_verificationCampaignId_idx" ON "verification_items"("verificationCampaignId");

-- CreateIndex
CREATE INDEX "verification_items_targetType_targetId_idx" ON "verification_items"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "verification_items_verifierPersonId_idx" ON "verification_items"("verifierPersonId");

-- CreateIndex
CREATE INDEX "verification_items_status_idx" ON "verification_items"("status");

-- CreateIndex
CREATE INDEX "audit_log_entries_targetType_targetId_idx" ON "audit_log_entries"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_log_entries_changedById_idx" ON "audit_log_entries"("changedById");

-- CreateIndex
CREATE INDEX "audit_log_entries_changedAt_idx" ON "audit_log_entries"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_types_name_key" ON "attachment_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_types_code_key" ON "attachment_types"("code");

-- CreateIndex
CREATE INDEX "attachment_types_code_idx" ON "attachment_types"("code");

-- CreateIndex
CREATE INDEX "attachments_attachmentTypeId_idx" ON "attachments"("attachmentTypeId");

-- CreateIndex
CREATE INDEX "attachments_targetType_targetId_idx" ON "attachments"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "attachments_uploadedById_idx" ON "attachments"("uploadedById");

-- CreateIndex
CREATE INDEX "attachments_uploadedAt_idx" ON "attachments"("uploadedAt");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt");

-- CreateIndex
CREATE INDEX "tasks_createdBy_idx" ON "tasks"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_blocks_name_key" ON "prompt_blocks"("name");

-- CreateIndex
CREATE INDEX "prompt_blocks_category_isActive_idx" ON "prompt_blocks"("category", "isActive");

-- CreateIndex
CREATE INDEX "prompt_blocks_name_idx" ON "prompt_blocks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_compositions_name_key" ON "prompt_compositions"("name");

-- CreateIndex
CREATE INDEX "prompt_compositions_purpose_isActive_idx" ON "prompt_compositions"("purpose", "isActive");

-- CreateIndex
CREATE INDEX "prompt_composition_blocks_compositionId_order_idx" ON "prompt_composition_blocks"("compositionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_composition_blocks_compositionId_blockId_key" ON "prompt_composition_blocks"("compositionId", "blockId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_primaryRoleId_fkey" FOREIGN KEY ("primaryRoleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_role_assignments" ADD CONSTRAINT "person_role_assignments_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_role_assignments" ADD CONSTRAINT "person_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_states" ADD CONSTRAINT "lifecycle_states_lifecycleModelId_fkey" FOREIGN KEY ("lifecycleModelId") REFERENCES "lifecycle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_lifecycleModelId_fkey" FOREIGN KEY ("lifecycleModelId") REFERENCES "lifecycle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "lifecycle_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "lifecycle_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_requiredRoleId_fkey" FOREIGN KEY ("requiredRoleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_classes" ADD CONSTRAINT "ci_classes_parentClassId_fkey" FOREIGN KEY ("parentClassId") REFERENCES "ci_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_classes" ADD CONSTRAINT "ci_classes_lifecycleModelId_fkey" FOREIGN KEY ("lifecycleModelId") REFERENCES "lifecycle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_class_fields" ADD CONSTRAINT "ci_class_fields_ciClassId_fkey" FOREIGN KEY ("ciClassId") REFERENCES "ci_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_class_fields" ADD CONSTRAINT "ci_class_fields_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "field_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_ciClassId_fkey" FOREIGN KEY ("ciClassId") REFERENCES "ci_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_lifecycleStateId_fkey" FOREIGN KEY ("lifecycleStateId") REFERENCES "lifecycle_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_primaryOwnerPersonId_fkey" FOREIGN KEY ("primaryOwnerPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_primaryOwnerOrgUnitId_fkey" FOREIGN KEY ("primaryOwnerOrgUnitId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_type_scopes" ADD CONSTRAINT "relationship_type_scopes_relationshipTypeId_fkey" FOREIGN KEY ("relationshipTypeId") REFERENCES "relationship_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_type_scopes" ADD CONSTRAINT "relationship_type_scopes_fromCiClassId_fkey" FOREIGN KEY ("fromCiClassId") REFERENCES "ci_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_type_scopes" ADD CONSTRAINT "relationship_type_scopes_toCiClassId_fkey" FOREIGN KEY ("toCiClassId") REFERENCES "ci_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_relationships" ADD CONSTRAINT "ci_relationships_fromCiId_fkey" FOREIGN KEY ("fromCiId") REFERENCES "configuration_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_relationships" ADD CONSTRAINT "ci_relationships_toCiId_fkey" FOREIGN KEY ("toCiId") REFERENCES "configuration_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ci_relationships" ADD CONSTRAINT "ci_relationships_relationshipTypeId_fkey" FOREIGN KEY ("relationshipTypeId") REFERENCES "relationship_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_lifecycleModelId_fkey" FOREIGN KEY ("lifecycleModelId") REFERENCES "lifecycle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_category_fields" ADD CONSTRAINT "asset_category_fields_assetCategoryId_fkey" FOREIGN KEY ("assetCategoryId") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_category_fields" ADD CONSTRAINT "asset_category_fields_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "field_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_assetCategoryId_fkey" FOREIGN KEY ("assetCategoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stockLocationFromId_fkey" FOREIGN KEY ("stockLocationFromId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stockLocationToId_fkey" FOREIGN KEY ("stockLocationToId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assetCategoryId_fkey" FOREIGN KEY ("assetCategoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assetModelId_fkey" FOREIGN KEY ("assetModelId") REFERENCES "asset_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_lifecycleStateId_fkey" FOREIGN KEY ("lifecycleStateId") REFERENCES "lifecycle_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_currentStockLocationId_fkey" FOREIGN KEY ("currentStockLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "contract_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_linked_objects" ADD CONSTRAINT "contract_linked_objects_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_products" ADD CONSTRAINT "license_products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_products" ADD CONSTRAINT "license_products_lifecycleModelId_fkey" FOREIGN KEY ("lifecycleModelId") REFERENCES "lifecycle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_product_fields" ADD CONSTRAINT "license_product_fields_licenseProductId_fkey" FOREIGN KEY ("licenseProductId") REFERENCES "license_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_product_fields" ADD CONSTRAINT "license_product_fields_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "field_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_entitlements" ADD CONSTRAINT "license_entitlements_licenseProductId_fkey" FOREIGN KEY ("licenseProductId") REFERENCES "license_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_entitlements" ADD CONSTRAINT "license_entitlements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_licenseEntitlementId_fkey" FOREIGN KEY ("licenseEntitlementId") REFERENCES "license_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ownerships" ADD CONSTRAINT "data_ownerships_dataDomainId_fkey" FOREIGN KEY ("dataDomainId") REFERENCES "data_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ownerships" ADD CONSTRAINT "data_ownerships_ciClassId_fkey" FOREIGN KEY ("ciClassId") REFERENCES "ci_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ownerships" ADD CONSTRAINT "data_ownerships_assetCategoryId_fkey" FOREIGN KEY ("assetCategoryId") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ownerships" ADD CONSTRAINT "data_ownerships_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ownerships" ADD CONSTRAINT "data_ownerships_ownerOrgUnitId_fkey" FOREIGN KEY ("ownerOrgUnitId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_campaigns" ADD CONSTRAINT "verification_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_items" ADD CONSTRAINT "verification_items_verificationCampaignId_fkey" FOREIGN KEY ("verificationCampaignId") REFERENCES "verification_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_items" ADD CONSTRAINT "verification_items_verifierPersonId_fkey" FOREIGN KEY ("verifierPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_attachmentTypeId_fkey" FOREIGN KEY ("attachmentTypeId") REFERENCES "attachment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_blocks" ADD CONSTRAINT "prompt_blocks_parentBlockId_fkey" FOREIGN KEY ("parentBlockId") REFERENCES "prompt_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_composition_blocks" ADD CONSTRAINT "prompt_composition_blocks_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "prompt_compositions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_composition_blocks" ADD CONSTRAINT "prompt_composition_blocks_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "prompt_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
