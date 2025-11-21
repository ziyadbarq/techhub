# Foundation Layer - Entity Reference

Quick reference for all Foundation Layer entities in the Barq Assets CMDB/ITAM system.

---

## Validation Standards

All domain entities follow these validation patterns to ensure data quality and consistency:

### 1. Validation Location

- **Factory methods**: Validate in `Entity.create()` before construction
- **Update methods**: Re-validate in `entity.update()` for modified fields
- **Private static methods**: Extract validation logic to `private static validateXxx()` for reusability

### 2. Common Field Validations

#### Name Fields

- **Length**: 2-200 characters
- **Processing**: Trim whitespace, non-empty check
- **Examples**: `AssetCategory.name`, `Person.firstName`, `Vendor.name`

#### Code Fields

- **Length**: 2-50 characters
- **Format**: Regex `/^[A-Z0-9\-_]+$/i` (alphanumeric + hyphens + underscores)
- **Normalization**: Converted to uppercase
- **Uniqueness**: Enforced at repository/use case layer
- **Examples**: `Asset.assetTag`, `Vendor.code`, `Location.code`, `OrganizationUnit.code`

#### Email Fields

- **Format**: Valid email address
- **Uniqueness**: Enforced (case-insensitive)
- **Examples**: `Person.email`, `VendorContact.email`

#### Currency Fields

- **Format**: Exactly 3 uppercase letters (ISO 4217)
- **Regex**: `/^[A-Z]{3}$/i`
- **Normalization**: Converted to uppercase
- **Examples**: `Asset.currency` (USD, EUR, SAR)

#### Date Range Fields

- **Rule**: End date must be >= start date
- **Examples**: `AssetAssignment.startDate/endDate`, `PersonRoleAssignment.startDate/endDate`

### 3. Validation Levels

#### Level 1: Basic (StockLocation, VendorContact)

- Name and code validation only
- Minimal business rules
- Used for simple lookup/reference entities

#### Level 2: Moderate (AssetCategory, AssetModel, Vendor)

- Name, code, and description validation
- Standard relationship constraints
- Basic business rules (`canBeDeleted()`)
- Used for reference data entities

#### Level 3: Strict (Asset, Person, OrganizationUnit)

- Comprehensive field validation
- Format constraints (regex patterns, length limits)
- Range constraints (min/max values, date ranges)
- Complex business rules (warranty status, hierarchy validation)
- Used for core transactional entities

#### Level 4: Business Logic (AssetAssignment, StockMovement, PersonRoleAssignment)

- Enum validation (constrained types)
- Cross-field validation (date ranges, movement logic)
- State-based validation (overlapping assignments, movement type rules)
- Complex business rules with external dependencies
- Used for workflow/process entities

### 4. Error Handling

- **Descriptive errors**: Include context in error messages (e.g., "Asset tag must be at least 2 characters")
- **Specific exceptions**: Use `ValidationError` for validation failures, `Error` for business rule violations
- **User-friendly**: Error messages suitable for display to end users

### 5. Normalization

- **Uppercase**: All code fields (asset tags, vendor codes, location codes) and currency codes
- **Trim**: All string fields (remove leading/trailing whitespace)
- **Default values**: Applied in factory methods (e.g., `startDate` defaults to `new Date()`)
- **Type safety**: No implicit type coercion - rely on TypeScript types

### 6. Business Rules

- **Separate methods**: Complex checks in dedicated methods (`canBeDeleted()`, `isActive()`, `isUnderWarranty()`)
- **Boolean returns**: State checks return boolean (e.g., `isActive()`, `wasActiveOn(date)`)
- **Throw on violations**: Invariant violations throw errors immediately
- **Documentation**: Business rules documented in entity comments and this guide

### 7. Testing Strategy

- **Unit tests**: Each validation rule has dedicated test case
- **Edge cases**: Test empty strings, whitespace, max length, boundary values
- **Business rules**: Test in use case tests (e.g., overlapping assignments, duplicate tags)
- **Integration tests**: Test unique constraints at repository layer

### 8. Validation Examples

**Strict validation (Asset)**:

```typescript
private static validateAssetTag(assetTag: string): void {
  if (!assetTag || assetTag.trim().length === 0) {
    throw new Error("Asset tag cannot be empty");
  }
  if (assetTag.trim().length < 2) {
    throw new Error("Asset tag must be at least 2 characters");
  }
  if (assetTag.trim().length > 100) {
    throw new Error("Asset tag cannot exceed 100 characters");
  }
  if (!/^[A-Z0-9\-_]+$/i.test(assetTag.trim())) {
    throw new Error(
      "Asset tag can only contain letters, numbers, hyphens, and underscores"
    );
  }
}
```

**Business logic validation (StockMovement)**:

```typescript
private static validateMovementLogic(
  type: StockMovementType,
  fromId: string | null | undefined,
  toId: string | null | undefined
): void {
  switch (type) {
    case "IN":
      if (!toId) throw new Error("IN movement requires destination");
      if (fromId) throw new Error("IN movement should not have source");
      break;
    case "OUT":
      if (!fromId) throw new Error("OUT movement requires source");
      if (toId) throw new Error("OUT movement should not have destination");
      break;
    case "TRANSFER":
      if (!fromId || !toId) throw new Error("TRANSFER requires both locations");
      if (fromId === toId) throw new Error("Cannot transfer to same location");
      break;
  }
}
```

---

## Entity Overview

### Foundation Layer (Layer 1)

| Entity                                        | Purpose                     | Key Fields                             | Routes                   | Permissions                 |
| --------------------------------------------- | --------------------------- | -------------------------------------- | ------------------------ | --------------------------- |
| [OrganizationUnit](#organizationunit)         | Organizational hierarchy    | `code`, `level`, `parent`              | `/organization-units`    | `ORGANIZATION_UNITS_*`      |
| [Person](#person)                             | Employee/contractor records | `employeeId`, `email`, `orgUnit`       | `/persons`               | `PERSONS_*`                 |
| [Role](#role)                                 | RBAC + job roles (merged)   | `name`, `permissions`, `isSystemRole`  | `/admin/roles`           | `ROLES_*`                   |
| [PersonRoleAssignment](#personroleassignment) | Person↔Role with dates     | `personId`, `roleId`, `startDate`      | `/persons/:id` (tab)     | `PERSON_ROLE_ASSIGNMENTS_*` |
| [Location](#location)                         | Geographical hierarchy      | `code`, `locationType`, `parent`       | `/locations`             | `LOCATIONS_*`               |
| [Vendor](#vendor)                             | Suppliers/manufacturers     | `code`, `vendorType`, `isPreferred`    | `/vendors`               | `VENDORS_*`                 |
| [VendorContact](#vendorcontact)               | Vendor representatives      | `vendorId`, `role`, `isPrimary`        | `/vendors/:id/contacts`  | `VENDOR_CONTACTS_*`         |
| [LifecycleModel](#lifecyclemodel)             | State machine definitions   | `name`, `states`, `transitions`        | `/lifecycle-models`      | `LIFECYCLE_MODELS_*`        |
| [LifecycleState](#lifecyclestate)             | Individual states           | `code`, `stateType`, `isTerminal`      | `/lifecycle-states`      | `LIFECYCLE_STATES_*`        |
| [LifecycleTransition](#lifecycletransition)   | Allowed state changes       | `fromState`, `toState`, `requiredRole` | `/lifecycle-transitions` | `LIFECYCLE_TRANSITIONS_*`   |
| [FieldDefinition](#fielddefinition)           | Custom field definitions    | `name`, `dataType`, `validationRules`  | `/field-definitions`     | `FIELD_DEFINITIONS_*`       |

### Asset & Inventory Layer (Layer 2)

| Entity                                      | Purpose                        | Key Fields                                 | Routes                   | Permissions               |
| ------------------------------------------- | ------------------------------ | ------------------------------------------ | ------------------------ | ------------------------- |
| [Asset](#asset)                             | Physical/digital assets        | `assetTag`, `serialNumber`, `purchaseCost` | `/assets`                | `ASSETS_*`                |
| [AssetCategory](#assetcategory)             | Asset type classification      | `name`, `code`, `lifecycleModelId`         | `/asset-categories`      | `ASSET_CATEGORIES_*`      |
| [AssetModel](#assetmodel)                   | Vendor-specific models         | `name`, `code`, `assetCategoryId`          | `/asset-models`          | `ASSET_MODELS_*`          |
| [AssetAssignment](#assetassignment)         | Asset↔Person/OrgUnit/Location | `assetId`, `assigneeType`, `startDate`     | `/asset-assignments`     | `ASSET_ASSIGNMENTS_*`     |
| [Warranty](#warranty)                       | Asset warranty tracking        | `assetId`, `startDate`, `endDate`          | `/warranties`            | `WARRANTIES_*`            |
| [MaintenanceSchedule](#maintenanceschedule) | Preventive maintenance plans   | `assetId`, `scheduleType`, `nextDueDate`   | `/maintenance/schedules` | `MAINTENANCE_SCHEDULES_*` |
| [MaintenanceRecord](#maintenancerecord)     | Maintenance work history       | `assetId`, `status`, `scheduledDate`       | `/maintenance/records`   | `MAINTENANCE_RECORDS_*`   |
| [StockLocation](#stocklocation)             | Physical storage locations     | `code`, `locationId`                       | `/stock-locations`       | `STOCK_LOCATIONS_*`       |
| [StockMovement](#stockmovement)             | Inventory movement tracking    | `movementType`, `quantity`, `occurredAt`   | `/stock-movements`       | `STOCK_MOVEMENTS_*`       |

---

## Entity Details

### OrganizationUnit

**Purpose**: Hierarchical organizational structure (Company → Business Unit → Department → Team)

**Schema**:

```prisma
model OrganizationUnit {
  id              String               @id @default(cuid())
  name            String
  code            String               @unique
  parentId        String?
  parent          OrganizationUnit?    @relation("OrgUnitHierarchy")
  children        OrganizationUnit[]   @relation("OrgUnitHierarchy")
  unitType        OrganizationUnitType // COMPANY, BUSINESS_UNIT, DEPARTMENT, TEAM, etc.
  level           Int                  // 1=Company, 2=BU, 3=Dept, 4=Team
  managerId       String?
  costCenter      String?
  isActive        Boolean              @default(true)
  metadata        Json?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}
```

**Key Methods**:

- `OrganizationUnit.create()` - Factory method with validation
- `activate()` / `deactivate()` - Manage active status
- `updateName()`, `updateManager()` - Update with validation
- `canBeDeleted()` - Business rule check

**Validation Rules**:

- Name: Required, 1-255 characters
- Code: Uppercase alphanumeric with hyphens only, unique
- Level: 1-10
- Parent: Required for level > 1

**Relationships**:

- Self-referencing parent/children hierarchy
- Has many `Person` (employees)
- Has one `Person` as manager
- Referenced by `ConfigurationItem`, `Asset` (Layer 2)

**Use Cases**:

- [CreateOrganizationUnitUseCase](../../src/core/use-cases/foundation/organization/create-organization-unit.use-case.ts)
- [GetOrganizationUnitUseCase](../../src/core/use-cases/foundation/organization/get-organization-unit.use-case.ts)
- [ListOrganizationUnitsUseCase](../../src/core/use-cases/foundation/organization/list-organization-units.use-case.ts)
- [UpdateOrganizationUnitUseCase](../../src/core/use-cases/foundation/organization/update-organization-unit.use-case.ts)
- [DeleteOrganizationUnitUseCase](../../src/core/use-cases/foundation/organization/delete-organization-unit.use-case.ts)

**Controllers**: [organization-unit.controller.ts](../../src/interface-adapters/controllers/organization-unit.controller.ts)
**DTOs**: [organization-unit.dto.ts](../../src/interface-adapters/dtos/generated/organization-unit.dto.ts)
**UI**: [/organization-units](/organization-units)

---

### Person

**Purpose**: Organizational people (employees, contractors) - separate from system User accounts

**Schema**:

```prisma
model Person {
  id                  String              @id @default(cuid())
  userId              String?             @unique // Link to Better Auth User
  firstName           String
  middleName          String?
  lastName            String
  email               String              @unique
  mobile              String?
  employeeId          String              @unique
  orgUnitId           String
  orgUnit             OrganizationUnit    @relation(...)
  primaryRoleId       String
  primaryRole         Role                @relation("PersonPrimaryRole")
  hireDate            DateTime?
  terminationDate     DateTime?
  isActive            Boolean             @default(true)
  metadata            Json?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}
```

**Key Methods**:

- `Person.create()` - Factory with validation
- `activate()` / `deactivate()` - Manage status
- `terminate()`, `rehire()` - Employment lifecycle
- `getFullName()` - Formatted name

**Validation Rules**:

- Email: Valid email format, unique
- EmployeeId: Required, unique
- Names: Required
- OrgUnit: Must exist
- PrimaryRole: Must exist

**Relationships**:

- Belongs to `OrganizationUnit`
- Has one primary `Role`
- Has many `PersonRoleAssignment` (additional roles)
- Optionally linked to Better Auth `User`
- Referenced by `ConfigurationItem` (owner), `Asset` (assignee)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/person/`](../../src/core/use-cases/foundation/person/)
**Controllers**: [person.controller.ts](../../src/interface-adapters/controllers/person.controller.ts)
**DTOs**: [person.dto.ts](../../src/interface-adapters/dtos/generated/person.dto.ts)
**UI**: [/persons](/persons)

---

### Role

**Purpose**: Merged RBAC system role + organizational job role

**Design**: User chose "Option C: Merge concepts" - single entity serves both purposes

**Schema**:

```prisma
model Role {
  id                      String                 @id @default(cuid())
  name                    String                 @unique
  description             String?

  // RBAC fields
  permissions             RolePermission[]       // System permissions
  users                   UserRole[]             // User assignments
  isSystemRole            Boolean                @default(false)

  // Organizational fields
  personsPrimaryRole      Person[]               @relation("PersonPrimaryRole")
  personRoleAssignments   PersonRoleAssignment[] // Additional roles
  lifecycleTransitions    LifecycleTransition[]  // Required for transitions

  createdAt               DateTime               @default(now())
  updatedAt               DateTime               @updatedAt
}
```

**Key Methods**:

- `Role.create()` / `Role.createSystemRole()` - Factory methods
- `addPermission()`, `removePermission()` - Manage RBAC permissions
- `canBeDeleted()` - Check dependencies
- `isAdmin()` - Check if admin role

**Validation Rules**:

- Name: Required, unique, 1-100 characters
- Description: Optional, max 500 characters

**Relationships**:

- Has many `RolePermission` (RBAC)
- Has many `UserRole` (RBAC)
- Has many `Person` as primary role
- Has many `PersonRoleAssignment`
- Referenced by `LifecycleTransition`

**Use Cases**: 5 CRUD use cases + RBAC permission assignment
**Controllers**: [role.controller.ts](../../src/interface-adapters/controllers/role.controller.ts)
**DTOs**: [role.dto.ts](../../src/interface-adapters/dtos/generated/role.dto.ts)
**UI**: [/admin/roles](/admin/roles)

---

### PersonRoleAssignment

**Purpose**: Many-to-many Person↔Role with temporal data (start/end dates)

**Schema**:

```prisma
model PersonRoleAssignment {
  id          String    @id @default(cuid())
  personId    String
  person      Person    @relation(...)
  roleId      String
  role        Role      @relation(...)
  startDate   DateTime
  endDate     DateTime?
  note        String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Key Methods**:

- `PersonRoleAssignment.create()` - Factory with validation
- `end()` - Set end date
- `isActive()` - Check if currently active
- `overlaps()` - Check for date overlap

**Validation Rules**:

- Start date: Required, must be valid date
- End date: Optional, must be after start date if provided
- Person and Role: Must exist

**Relationships**:

- Belongs to `Person`
- Belongs to `Role`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/person-role-assignment/`](../../src/core/use-cases/foundation/person-role-assignment/)
**Controllers**: [person-role-assignment.controller.ts](../../src/interface-adapters/controllers/person-role-assignment.controller.ts)
**DTOs**: [person-role-assignment.dto.ts](../../src/interface-adapters/dtos/generated/person-role-assignment.dto.ts)
**UI**: Managed via Person detail page - [/persons/:id](/persons/:id) (Roles tab)

---

### Location

**Purpose**: Hierarchical geographical and logical locations

**Hierarchy**: Country → City → Campus → Building → Floor → Room → Rack

**Schema**:

```prisma
model Location {
  id              String         @id @default(cuid())
  name            String
  code            String         @unique
  parentId        String?
  parent          Location?      @relation("LocationHierarchy")
  children        Location[]     @relation("LocationHierarchy")
  locationType    LocationType   // COUNTRY, CITY, BUILDING, ROOM, RACK, DATA_CENTER, CLOUD_REGION, etc.
  addressLine1    String?
  addressLine2    String?
  city            String?
  country         String?
  latitude        Decimal?
  longitude       Decimal?
  timeZone        String?
  isActive        Boolean        @default(true)
  metadata        Json?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

**Location Types**:

- Physical: COUNTRY, CITY, CAMPUS, BUILDING, FLOOR, ROOM, RACK, WAREHOUSE, OFFICE, BRANCH
- Logical: DATA_CENTER, CLOUD_REGION, CLOUD_ZONE, VIRTUAL
- Other: OTHER

**Key Methods**:

- `Location.create()` - Factory with validation
- `activate()` / `deactivate()` - Manage status
- `getFullPath()` - Returns full hierarchical path as string
- `canBeDeleted()` - Check dependencies

**Validation Rules**:

- Name: Required, 1-255 characters
- Code: Uppercase alphanumeric with hyphens, unique
- Type: Must be valid LocationType
- Lat/Long: Valid coordinate ranges if provided

**Relationships**:

- Self-referencing parent/children hierarchy
- Referenced by `OrganizationUnit`, `ConfigurationItem`, `Asset`, `StockLocation`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/location/`](../../src/core/use-cases/foundation/location/)
**Controllers**: [location.controller.ts](../../src/interface-adapters/controllers/location.controller.ts)
**DTOs**: [location.dto.ts](../../src/interface-adapters/dtos/generated/location.dto.ts)
**UI**: [/locations](/locations)

---

### Vendor

**Purpose**: Suppliers, manufacturers, service providers, contractors

**Schema**:

```prisma
model Vendor {
  id              String          @id @default(cuid())
  name            String
  code            String          @unique
  vendorType      VendorType      // MANUFACTURER, RESELLER, SERVICE_PROVIDER, etc.
  legalName       String?
  taxId           String?
  website         String?
  phone           String?
  email           String?
  isPreferred     Boolean         @default(false)
  tags            String[]        @default([])
  note            String?
  metadata        Json?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

**Vendor Types**: MANUFACTURER, RESELLER, SERVICE_PROVIDER, CONSULTANT, CONTRACTOR, OTHER

**Key Methods**:

- `Vendor.create()` - Factory with validation
- `addContact()` - Add vendor contact
- `markAsPreferred()` / `unmarkAsPreferred()` - Manage preferred status
- `canBeDeleted()` - Check dependencies
- `hasAssets()`, `hasContracts()` - Dependency checks

**Validation Rules**:

- Name: Required, 1-255 characters
- Code: Uppercase alphanumeric with hyphens, unique
- Email: Valid email format if provided
- Website: Valid URL if provided

**Relationships**:

- Has many `VendorContact`
- Referenced by `Asset`, `AssetModel`, `Contract`, `LicenseProduct`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/vendor/`](../../src/core/use-cases/foundation/vendor/)
**Controllers**: [vendor.controller.ts](../../src/interface-adapters/controllers/vendor.controller.ts)
**DTOs**: [vendor.dto.ts](../../src/interface-adapters/dtos/generated/vendor.dto.ts)
**UI**: [/vendors](/vendors)

---

### VendorContact

**Purpose**: Contact persons at vendor organizations

**Schema**:

```prisma
model VendorContact {
  id          String    @id @default(cuid())
  vendorId    String
  vendor      Vendor    @relation(...)
  fullName    String
  email       String
  phone       String?
  role        String    // "Account Manager", "Technical Support", etc.
  isPrimary   Boolean   @default(false)
  note        String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Key Methods**:

- `VendorContact.create()` - Factory with validation
- `markAsPrimary()` / `unmarkAsPrimary()` - Manage primary status

**Validation Rules**:

- Full name: Required, 1-255 characters
- Email: Valid email format, required
- Phone: Optional, valid format if provided
- Role: Required (e.g., "Account Manager", "Technical Support")

**Relationships**:

- Belongs to `Vendor`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/vendor-contact/`](../../src/core/use-cases/foundation/vendor-contact/)
**Controllers**: [vendor-contact.controller.ts](../../src/interface-adapters/controllers/vendor-contact.controller.ts)
**DTOs**: [vendor-contact.dto.ts](../../src/interface-adapters/dtos/generated/vendor-contact.dto.ts)
**UI**: [/vendors/:id/contacts](/vendors/:id/contacts)

---

### LifecycleModel

**Purpose**: Reusable state machine definitions (e.g., "CI Lifecycle", "Asset Lifecycle")

**Schema**:

```prisma
model LifecycleModel {
  id          String            @id @default(cuid())
  name        String            @unique
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Relations
  states      LifecycleState[]
  transitions LifecycleTransition[]
  ciClasses   CIClass[]         // Layer 2
  assetCategories AssetCategory[] // Layer 2
  licenseProducts LicenseProduct[] // Layer 2
}
```

**Key Methods**:

- `LifecycleModel.create()` - Factory with validation
- `canBeDeleted()` - Check if assigned to any classes

**Validation Rules**:

- Name: Required, unique, 1-255 characters
- Description: Optional, max 500 characters

**Relationships**:

- Has many `LifecycleState`
- Has many `LifecycleTransition`
- Referenced by `CIClass`, `AssetCategory`, `LicenseProduct` (Layer 2)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/lifecycle-model/`](../../src/core/use-cases/foundation/lifecycle-model/)
**Controllers**: [lifecycle-model.controller.ts](../../src/interface-adapters/controllers/lifecycle-model.controller.ts)
**DTOs**: [lifecycle-model.dto.ts](../../src/interface-adapters/dtos/generated/lifecycle-model.dto.ts)
**UI**: [/lifecycle-models](/lifecycle-models)

---

### LifecycleState

**Purpose**: Individual states within a lifecycle model (e.g., "Planned", "In Service", "Retired")

**Schema**:

```prisma
model LifecycleState {
  id                String             @id @default(cuid())
  lifecycleModelId  String
  lifecycleModel    LifecycleModel     @relation(...)
  name              String
  code              String
  stateType         StateType          // INITIAL, ACTIVE, INACTIVE, TERMINAL, TRANSITION
  isActiveState     Boolean            @default(false)
  isTerminalState   Boolean            @default(false)
  sortOrder         Int
  metadata          Json?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}
```

**State Types**: INITIAL, ACTIVE, INACTIVE, TERMINAL, TRANSITION

**Key Methods**:

- `LifecycleState.create()` - Factory with validation
- `canBeDeleted()` - Check if used by CIs/Assets

**Validation Rules**:

- Name: Required, 1-100 characters
- Code: Required, uppercase, unique within model
- StateType: Must be valid enum value
- SortOrder: Integer, unique within model

**Relationships**:

- Belongs to `LifecycleModel`
- Referenced by `LifecycleTransition` (from/to)
- Referenced by `ConfigurationItem`, `Asset` (Layer 2)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/lifecycle-state/`](../../src/core/use-cases/foundation/lifecycle-state/)
**Controllers**: [lifecycle-state.controller.ts](../../src/interface-adapters/controllers/lifecycle-state.controller.ts)
**DTOs**: [lifecycle-state.dto.ts](../../src/interface-adapters/dtos/generated/lifecycle-state.dto.ts)
**UI**: [/lifecycle-states](/lifecycle-states)

---

### LifecycleTransition

**Purpose**: Define allowed state transitions with optional approval rules

**Schema**:

```prisma
model LifecycleTransition {
  id                  String          @id @default(cuid())
  lifecycleModelId    String
  lifecycleModel      LifecycleModel  @relation(...)
  fromStateId         String
  fromState           LifecycleState  @relation("TransitionFromState")
  toStateId           String
  toState             LifecycleState  @relation("TransitionToState")
  requiredRoleId      String?
  requiredRole        Role?           @relation(...)
  requiresApproval    Boolean         @default(false)
  approvalPolicy      Json?           // Approval rules
  isAutomated         Boolean         @default(false)
  conditions          Json?           // Transition conditions
  metadata            Json?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
}
```

**Key Methods**:

- `LifecycleTransition.create()` - Factory with validation
- `validateConditions()` - Check if conditions met
- `requiresRole()` - Check if role required
- `canBeDeleted()` - Check dependencies

**Validation Rules**:

- From/To states: Must exist and belong to same model
- Cannot have duplicate from→to pairs in same model
- Circular transitions allowed (business decision)

**Relationships**:

- Belongs to `LifecycleModel`
- References `LifecycleState` (from and to)
- Optionally references `Role` (required role)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/lifecycle-transition/`](../../src/core/use-cases/foundation/lifecycle-transition/)
**Controllers**: [lifecycle-transition.controller.ts](../../src/interface-adapters/controllers/lifecycle-transition.controller.ts)
**DTOs**: [lifecycle-transition.dto.ts](../../src/interface-adapters/dtos/generated/lifecycle-transition.dto.ts)
**UI**: [/lifecycle-transitions](/lifecycle-transitions)

---

### FieldDefinition

**Purpose**: Define custom fields once, reuse across CIClass, AssetCategory, LicenseProduct

**Concept**: "Define once, use everywhere" meta-model

**Schema**:

```prisma
model FieldDefinition {
  id                String    @id @default(cuid())
  name              String    @unique
  label             String
  dataType          FieldDataTypeEnum
  description       String?
  isGlobal          Boolean   @default(false)
  validationRules   Json?     // Min/max, regex, etc.
  defaultValue      Json?     // Type-specific default
  enumOptions       Json?     // Array of {value, label} for ENUM type
  uiGroup           String?   // Group/tab in UI
  uiOrder           Int?      // Display order
  isSearchable      Boolean   @default(false)
  isFilterable      Boolean   @default(false)
  metadata          Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**Field Data Types**:

- Basic: STRING, TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME
- Complex: ENUM, JSON
- References: CI_REFERENCE, PERSON_REFERENCE, ORG_UNIT_REFERENCE, LOCATION_REFERENCE

**Key Methods**:

- `FieldDefinition.create()` - Factory with validation
- `validate()` - Validate value against rules
- `getEnumOptions()` - Get enum options array
- `canBeDeleted()` - Check if used

**Validation Rules**:

- Name: Required, unique, lowercase_snake_case
- Label: Required, display name
- DataType: Must be valid enum value
- ValidationRules: JSON schema validation
- EnumOptions: Required array if dataType is ENUM

**Relationships**:

- Referenced by `CIClassField` (Layer 2)
- Referenced by `AssetCategoryField` (Layer 2)
- Referenced by `LicenseProductField` (Layer 2)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/foundation/field-definition/`](../../src/core/use-cases/foundation/field-definition/)
**Controllers**: [field-definition.controller.ts](../../src/interface-adapters/controllers/field-definition.controller.ts)
**DTOs**: [field-definition.dto.ts](../../src/interface-adapters/dtos/generated/field-definition.dto.ts)
**UI**: [/field-definitions](/field-definitions)

---

## Layer 2: Asset & Inventory Entities

### Asset

**Purpose**: Physical or digital assets tracked in the system (laptops, servers, monitors, licenses)

**Schema**:

```prisma
model Asset {
  id                      String            @id @default(cuid())
  assetTag                String            @unique
  assetCategoryId         String
  assetCategory           AssetCategory     @relation(...)
  assetModelId            String?
  assetModel              AssetModel?       @relation(...)
  vendorId                String?
  vendor                  Vendor?           @relation(...)
  contractId              String?
  lifecycleStateId        String?
  lifecycleState          LifecycleState?   @relation(...)
  serialNumber            String?           @unique
  purchaseDate            DateTime?
  purchaseCost            Decimal?          @db.Decimal(12, 2)
  currency                String?
  depreciationModel       String?
  depreciationStart       DateTime?
  depreciationEnd         DateTime?
  warrantyEndDate         DateTime?
  currentStockLocationId  String?
  currentStockLocation    StockLocation?    @relation(...)
  attributes              Json?             // Dynamic fields
  note                    String?           @db.Text
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt
}
```

**Key Methods**:

- `Asset.create()` - Factory method with strict validation
- `update()` - Update with re-validation
- `updateAttributes()` - Merge dynamic attributes
- `setLifecycleState()`, `setStockLocation()` - State transitions
- `isUnderWarranty()`, `isDepreciated()`, `isFullyDepreciated()` - Status checks

**Validation Rules** (Level 3: Strict):

- Asset tag: 2-100 characters, regex `/^[A-Z0-9\-_]+$/i`, uppercase normalization, **unique**
- Serial number: Max 200 characters, **unique** if provided
- Purchase cost: 0 to 9,999,999,999.99
- Currency: Exactly 3 letters (ISO 4217), uppercase normalization

**Relationships**:

- Belongs to `AssetCategory` (required)
- Belongs to `AssetModel` (optional)
- Belongs to `Vendor` (optional)
- Belongs to `LifecycleState` (optional)
- Belongs to `StockLocation` (optional - current location)
- Has many `AssetAssignment` (assignment history)
- Has many `StockMovement` (movement history)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/asset/asset/`](../../src/core/use-cases/asset/asset/)
**Controllers**: [asset.controller.ts](../../src/interface-adapters/controllers/asset.controller.ts)
**DTOs**: [asset.dto.ts](../../src/interface-adapters/dtos/generated/asset.dto.ts)
**Presenter**: [asset.presenter.ts](../../src/interface-adapters/presenters/asset.presenter.ts)
**UI**: [/assets](/assets)

---

### AssetCategory

**Purpose**: Define types of assets (Laptop, Desktop, Monitor, Server, License, etc.)

**Schema**:

```prisma
model AssetCategory {
  id                String           @id @default(cuid())
  name              String           @unique
  code              String           @unique
  description       String?          @db.Text
  lifecycleModelId  String?
  lifecycleModel    LifecycleModel?  @relation(...)
  isConsumable      Boolean          @default(false)
  assets            Asset[]
  assetModels       AssetModel[]
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}
```

**Key Methods**:

- `AssetCategory.create()` - Factory with validation
- `update()` - Update with validation
- `canBeDeleted()` - Check if category has assets

**Validation Rules** (Level 2: Moderate):

- Name: 2-200 characters, trim, non-empty, **unique**
- Code: 2-50 characters, regex `/^[A-Z0-9\-_]+$/i`, uppercase normalization, **unique**
- Description: Optional, trim

**Business Rules**:

- Consumable items cannot have lifecycle models
- Cannot delete category with existing assets

**Relationships**:

- Optionally belongs to `LifecycleModel` (for non-consumables)
- Has many `Asset`
- Has many `AssetModel`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/asset/asset-category/`](../../src/core/use-cases/asset/asset-category/)
**Controllers**: [asset-category.controller.ts](../../src/interface-adapters/controllers/asset-category.controller.ts)
**DTOs**: [asset-category.dto.ts](../../src/interface-adapters/dtos/generated/asset-category.dto.ts)
**Presenter**: [asset-category.presenter.ts](../../src/interface-adapters/presenters/asset-category.presenter.ts)
**UI**: [/asset-categories](/asset-categories)

---

### AssetModel

**Purpose**: Vendor-specific asset models (Dell Latitude 7490, HP LaserJet M404dn, etc.)

**Schema**:

```prisma
model AssetModel {
  id                    String         @id @default(cuid())
  assetCategoryId       String
  assetCategory         AssetCategory  @relation(...)
  vendorId              String
  vendor                Vendor         @relation(...)
  name                  String
  code                  String
  description           String?        @db.Text
  defaultWarrantyMonths Int?
  defaultAttributes     Json?          // Default field values for this model
  assets                Asset[]
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
}
```

**Key Methods**:

- `AssetModel.create()` - Factory with validation
- `update()` - Update with validation
- `canBeDeleted()` - Check if model has assets

**Validation Rules** (Level 2: Moderate):

- Name: 2-200 characters, trim, non-empty
- Code: 2-50 characters, regex `/^[A-Z0-9\-_]+$/i`, uppercase normalization
- Warranty months: 0-120 if provided

**Relationships**:

- Belongs to `AssetCategory` (required)
- Belongs to `Vendor` (required)
- Has many `Asset`

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/asset/asset-model/`](../../src/core/use-cases/asset/asset-model/)
**Controllers**: [asset-model.controller.ts](../../src/interface-adapters/controllers/asset-model.controller.ts)
**DTOs**: [asset-model.dto.ts](../../src/interface-adapters/dtos/generated/asset-model.dto.ts)
**Presenter**: [asset-model.presenter.ts](../../src/interface-adapters/presenters/asset-model.presenter.ts)
**UI**: [/asset-models](/asset-models)

---

### AssetAssignment

**Purpose**: Track assignment of assets to persons, organization units, locations, or CIs

**Schema**:

```prisma
model AssetAssignment {
  id            String       @id @default(cuid())
  assetId       String
  asset         Asset        @relation(...)
  assigneeType  AssigneeType // PERSON, ORG_UNIT, LOCATION, CI
  assigneeId    String       // Polymorphic FK
  startDate     DateTime
  endDate       DateTime?
  isPrimary     Boolean      @default(false)
  note          String?      @db.Text
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum AssigneeType {
  PERSON
  ORG_UNIT
  LOCATION
  CI
}
```

**Key Methods**:

- `AssetAssignment.create()` - Factory with validation
- `update()` - Update assignment details
- `endAssignment()` - Set end date
- `setAsPrimary()`, `unsetAsPrimary()` - Manage primary status
- `isActive()` - Check if assignment is current
- `wasActiveOn(date)` - Historical check
- `getDurationInDays()` - Calculate assignment duration

**Validation Rules** (Level 4: Business Logic):

- Assignee type: Must be PERSON, ORG_UNIT, LOCATION, or CI
- Assignee ID: Required, non-empty
- Date range: End date must be >= start date if provided
- Start date: Defaults to now if not provided

**Business Rules**:

- Only one primary assignment per asset at a time
- Cannot create overlapping assignments for same asset
- Active assignment has no end date or end date in future

**Relationships**:

- Belongs to `Asset` (required)
- Polymorphic assignee (Person, OrganizationUnit, Location, or ConfigurationItem)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/asset/asset-assignment/`](../../src/core/use-cases/asset/asset-assignment/)
**Controllers**: [asset-assignment.controller.ts](../../src/interface-adapters/controllers/asset-assignment.controller.ts)
**DTOs**: [asset-assignment.dto.ts](../../src/interface-adapters/dtos/generated/asset-assignment.dto.ts)
**Presenter**: [asset-assignment.presenter.ts](../../src/interface-adapters/presenters/asset-assignment.presenter.ts)
**UI**: [/asset-assignments](/asset-assignments)

---

### StockLocation

**Purpose**: Physical storage locations for inventory management (Warehouse A, Shelf B-3, etc.)

**Schema**:

```prisma
model StockLocation {
  id                String          @id @default(cuid())
  name              String
  code              String          @unique
  locationId        String?
  location          Location?       @relation(...)
  assets            Asset[]         @relation("AssetCurrentStockLocation")
  movementsFrom     StockMovement[] @relation("StockLocationFrom")
  movementsTo       StockMovement[] @relation("StockLocationTo")
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

**Key Methods**:

- `StockLocation.create()` - Factory with validation
- `update()` - Update with validation
- `canBeDeleted()` - Check if location has assets or movements

**Validation Rules** (Level 1: Basic):

- Name: 2-200 characters, trim, non-empty
- Code: 2-50 characters, regex `/^[A-Z0-9\-_]+$/i`, uppercase normalization, **unique**

**Relationships**:

- Optionally belongs to `Location` (geographical location)
- Has many `Asset` (current stock location)
- Has many `StockMovement` (as source or destination)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/inventory/stock-location/`](../../src/core/use-cases/inventory/stock-location/)
**Controllers**: [stock-location.controller.ts](../../src/interface-adapters/controllers/stock-location.controller.ts)
**DTOs**: [stock-location.dto.ts](../../src/interface-adapters/dtos/generated/stock-location.dto.ts)
**Presenter**: [stock-location.presenter.ts](../../src/interface-adapters/presenters/stock-location.presenter.ts)
**UI**: [/stock-locations](/stock-locations)

---

### StockMovement

**Purpose**: Track all inventory movements (receive, issue, transfer, adjustment)

**Schema**:

```prisma
model StockMovement {
  id                    String            @id @default(cuid())
  movementType          StockMovementType
  stockLocationFromId   String?
  stockLocationFrom     StockLocation?    @relation("StockLocationFrom", ...)
  stockLocationToId     String?
  stockLocationTo       StockLocation?    @relation("StockLocationTo", ...)
  assetId               String?
  asset                 Asset?            @relation(...)
  quantity              Int               @default(1)
  reason                String?           @db.Text
  performedById         String
  performedBy           Person            @relation(...)
  occurredAt            DateTime          @default(now())
  createdAt             DateTime          @default(now())
}

enum StockMovementType {
  IN          // Receiving (to location only)
  OUT         // Issuing (from location only)
  TRANSFER    // Between locations (both required)
  ADJUSTMENT  // Inventory correction (flexible)
}
```

**Key Methods**:

- `StockMovement.create()` - Factory with strict business logic validation
- `isReceiving()`, `isIssuing()`, `isTransfer()`, `isAdjustment()` - Type checks

**Validation Rules** (Level 4: Business Logic):

- Movement type: Must be IN, OUT, TRANSFER, or ADJUSTMENT
- Quantity: Must be >= 1, must be integer, defaults to 1
- Performed by: Required, non-empty
- Occurred at: Defaults to now if not provided

**Business Rules** (Movement Type Logic):

- **IN**: Requires destination only (no source)
- **OUT**: Requires source only (no destination)
- **TRANSFER**: Requires both source and destination (must be different)
- **ADJUSTMENT**: Flexible (can have from, to, or both)

**Relationships**:

- Optionally belongs to `StockLocation` (source)
- Optionally belongs to `StockLocation` (destination)
- Optionally belongs to `Asset`
- Belongs to `Person` (performer - required)

**Use Cases**: 5 CRUD use cases in [`src/core/use-cases/inventory/stock-movement/`](../../src/core/use-cases/inventory/stock-movement/)
**Controllers**: [stock-movement.controller.ts](../../src/interface-adapters/controllers/stock-movement.controller.ts)
**DTOs**: [stock-movement.dto.ts](../../src/interface-adapters/dtos/generated/stock-movement.dto.ts)
**Presenter**: [stock-movement.presenter.ts](../../src/interface-adapters/presenters/stock-movement.presenter.ts)
**UI**: [/stock-movements](/stock-movements)

---

## Permission Reference

All entities follow standardized RBAC permission pattern:

### Foundation Layer (Layer 1)

| Entity               | View                           | Create                           | Update                           | Delete                           | Manage                           |
| -------------------- | ------------------------------ | -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| OrganizationUnit     | `ORGANIZATION_UNITS_VIEW`      | `ORGANIZATION_UNITS_CREATE`      | `ORGANIZATION_UNITS_UPDATE`      | `ORGANIZATION_UNITS_DELETE`      | `ORGANIZATION_UNITS_MANAGE`      |
| Person               | `PERSONS_VIEW`                 | `PERSONS_CREATE`                 | `PERSONS_UPDATE`                 | `PERSONS_DELETE`                 | `PERSONS_MANAGE`                 |
| Role                 | `ROLES_VIEW`                   | `ROLES_CREATE`                   | `ROLES_UPDATE`                   | `ROLES_DELETE`                   | `ROLES_MANAGE`                   |
| PersonRoleAssignment | `PERSON_ROLE_ASSIGNMENTS_VIEW` | `PERSON_ROLE_ASSIGNMENTS_CREATE` | `PERSON_ROLE_ASSIGNMENTS_UPDATE` | `PERSON_ROLE_ASSIGNMENTS_DELETE` | `PERSON_ROLE_ASSIGNMENTS_MANAGE` |
| Location             | `LOCATIONS_VIEW`               | `LOCATIONS_CREATE`               | `LOCATIONS_UPDATE`               | `LOCATIONS_DELETE`               | `LOCATIONS_MANAGE`               |
| Vendor               | `VENDORS_VIEW`                 | `VENDORS_CREATE`                 | `VENDORS_UPDATE`                 | `VENDORS_DELETE`                 | `VENDORS_MANAGE`                 |
| VendorContact        | `VENDOR_CONTACTS_VIEW`         | `VENDOR_CONTACTS_CREATE`         | `VENDOR_CONTACTS_UPDATE`         | `VENDOR_CONTACTS_DELETE`         | `VENDOR_CONTACTS_MANAGE`         |
| LifecycleModel       | `LIFECYCLE_MODELS_VIEW`        | `LIFECYCLE_MODELS_CREATE`        | `LIFECYCLE_MODELS_UPDATE`        | `LIFECYCLE_MODELS_DELETE`        | `LIFECYCLE_MODELS_MANAGE`        |
| LifecycleState       | `LIFECYCLE_STATES_VIEW`        | `LIFECYCLE_STATES_CREATE`        | `LIFECYCLE_STATES_UPDATE`        | `LIFECYCLE_STATES_DELETE`        | `LIFECYCLE_STATES_MANAGE`        |
| LifecycleTransition  | `LIFECYCLE_TRANSITIONS_VIEW`   | `LIFECYCLE_TRANSITIONS_CREATE`   | `LIFECYCLE_TRANSITIONS_UPDATE`   | `LIFECYCLE_TRANSITIONS_DELETE`   | `LIFECYCLE_TRANSITIONS_MANAGE`   |
| FieldDefinition      | `FIELD_DEFINITIONS_VIEW`       | `FIELD_DEFINITIONS_CREATE`       | `FIELD_DEFINITIONS_UPDATE`       | `FIELD_DEFINITIONS_DELETE`       | `FIELD_DEFINITIONS_MANAGE`       |

### Asset & Inventory Layer (Layer 2)

| Entity          | View                     | Create                     | Update                     | Delete                     | Manage                     |
| --------------- | ------------------------ | -------------------------- | -------------------------- | -------------------------- | -------------------------- |
| Asset           | `ASSETS_VIEW`            | `ASSETS_CREATE`            | `ASSETS_UPDATE`            | `ASSETS_DELETE`            | `ASSETS_MANAGE`            |
| AssetCategory   | `ASSET_CATEGORIES_VIEW`  | `ASSET_CATEGORIES_CREATE`  | `ASSET_CATEGORIES_UPDATE`  | `ASSET_CATEGORIES_DELETE`  | `ASSET_CATEGORIES_MANAGE`  |
| AssetModel      | `ASSET_MODELS_VIEW`      | `ASSET_MODELS_CREATE`      | `ASSET_MODELS_UPDATE`      | `ASSET_MODELS_DELETE`      | `ASSET_MODELS_MANAGE`      |
| AssetAssignment | `ASSET_ASSIGNMENTS_VIEW` | `ASSET_ASSIGNMENTS_CREATE` | `ASSET_ASSIGNMENTS_UPDATE` | `ASSET_ASSIGNMENTS_DELETE` | `ASSET_ASSIGNMENTS_MANAGE` |
| StockLocation   | `STOCK_LOCATIONS_VIEW`   | `STOCK_LOCATIONS_CREATE`   | `STOCK_LOCATIONS_UPDATE`   | `STOCK_LOCATIONS_DELETE`   | `STOCK_LOCATIONS_MANAGE`   |
| StockMovement   | `STOCK_MOVEMENTS_VIEW`   | `STOCK_MOVEMENTS_CREATE`   | `STOCK_MOVEMENTS_UPDATE`   | `STOCK_MOVEMENTS_DELETE`   | `STOCK_MOVEMENTS_MANAGE`   |

**Permission Definition**: [src/core/domain/value-objects/permission-key.ts](../../src/core/domain/value-objects/permission-key.ts)

**Permission Enforcement**:

1. Server Actions (Controllers) - Primary enforcement
2. Use Cases - Secondary validation
3. UI Components - `<PermissionGuard>` for conditional rendering
4. Routes - Route-level checks

---

## Enums Reference

### OrganizationUnitType

```typescript
enum OrganizationUnitType {
  COMPANY        // Top level
  BUSINESS_UNIT  // Division/BU
  DEPARTMENT     // Department
  TEAM           // Team/Squad
  DIVISION       // Alternative to BU
  OTHER          // Other types
}
```

### LocationType

```typescript
enum LocationType {
  // Physical
  COUNTRY
  CITY
  CAMPUS
  BUILDING
  FLOOR
  ROOM
  RACK
  WAREHOUSE
  OFFICE
  BRANCH

  // Logical
  DATA_CENTER
  CLOUD_REGION   // AWS, Azure, GCP regions
  CLOUD_ZONE     // Availability zones
  VIRTUAL

  OTHER
}
```

### VendorType

```typescript
enum VendorType {
  MANUFACTURER      // Dell, HP, Cisco, etc.
  RESELLER          // VAR, distributors
  SERVICE_PROVIDER  // Cloud providers, MSPs
  CONSULTANT        // Professional services
  CONTRACTOR        // Independent contractors
  OTHER
}
```

### StateType

```typescript
enum StateType {
  INITIAL      // First state (e.g., "Planned")
  ACTIVE       // Normal active state (e.g., "In Service")
  INACTIVE     // Temporarily inactive (e.g., "In Maintenance")
  TERMINAL     // Final state (e.g., "Disposed")
  TRANSITION   // Temporary state (e.g., "In Transit")
}
```

### FieldDataTypeEnum

```typescript
enum FieldDataTypeEnum {
  // Basic types
  STRING              // Short text (max 255)
  TEXT                // Long text
  INTEGER             // Whole number
  DECIMAL             // Decimal number
  BOOLEAN             // True/false
  DATE                // Date only
  DATETIME            // Date and time

  // Complex types
  ENUM                // Dropdown with options
  JSON                // Structured JSON

  // Reference types
  CI_REFERENCE        // Reference to CI (Layer 2)
  PERSON_REFERENCE    // Reference to Person
  ORG_UNIT_REFERENCE  // Reference to OrganizationUnit
  LOCATION_REFERENCE  // Reference to Location
}
```

### AssigneeType (Layer 2)

```typescript
enum AssigneeType {
  PERSON      // Assigned to a Person
  ORG_UNIT    // Assigned to an OrganizationUnit
  LOCATION    // Assigned to a Location
  CI          // Assigned to a ConfigurationItem (Layer 2)
}
```

### StockMovementType (Layer 2)

```typescript
enum StockMovementType {
  IN          // Receiving inventory (requires destination only)
  OUT         // Issuing inventory (requires source only)
  TRANSFER    // Moving between locations (requires both source and destination)
  ADJUSTMENT  // Inventory correction (flexible - can have from, to, or both)
}
```

**Enum Definitions**:

- Foundation Layer: [src/core/domain/value-objects/foundation-enums.ts](../../src/core/domain/value-objects/foundation-enums.ts)
- Asset & Inventory Layer: Defined in entity files ([asset-assignment.entity.ts](../../src/core/domain/entities/asset-assignment.entity.ts), [stock-movement.entity.ts](../../src/core/domain/entities/stock-movement.entity.ts))

---

## Relationship Diagram (Text)

```
OrganizationUnit (Company)
├── children: OrganizationUnit[] (BUs, Depts, Teams)
├── persons: Person[] (employees)
└── manager: Person

Person
├── orgUnit: OrganizationUnit
├── primaryRole: Role
├── roleAssignments: PersonRoleAssignment[]
└── userId?: User (Better Auth link)

Role (RBAC + Organizational)
├── permissions: RolePermission[] (RBAC)
├── users: UserRole[] (RBAC)
├── personsPrimaryRole: Person[]
├── personRoleAssignments: PersonRoleAssignment[]
└── lifecycleTransitions: LifecycleTransition[]

PersonRoleAssignment
├── person: Person
└── role: Role

Location (Country)
├── children: Location[] (Cities, Buildings, Rooms, Racks)
└── parent: Location?

Vendor
├── contacts: VendorContact[]
├── assets: Asset[] (Layer 2)
├── contracts: Contract[] (Layer 2)
├── licenseProducts: LicenseProduct[] (Layer 2)
└── assetModels: AssetModel[] (Layer 2)

VendorContact
└── vendor: Vendor

LifecycleModel
├── states: LifecycleState[]
├── transitions: LifecycleTransition[]
├── ciClasses: CIClass[] (Layer 2)
├── assetCategories: AssetCategory[] (Layer 2)
└── licenseProducts: LicenseProduct[] (Layer 2)

LifecycleState
├── lifecycleModel: LifecycleModel
├── transitionsFrom: LifecycleTransition[]
├── transitionsTo: LifecycleTransition[]
├── configurationItems: ConfigurationItem[] (Layer 2)
└── assets: Asset[] (Layer 2)

LifecycleTransition
├── lifecycleModel: LifecycleModel
├── fromState: LifecycleState
├── toState: LifecycleState
└── requiredRole?: Role

FieldDefinition
├── ciClassFields: CIClassField[] (Layer 2)
├── assetCategoryFields: AssetCategoryField[] (Layer 2)
└── licenseProductFields: LicenseProductField[] (Layer 2)

--- LAYER 2: ASSET & INVENTORY ---

Asset
├── assetCategory: AssetCategory
├── assetModel?: AssetModel
├── vendor?: Vendor
├── lifecycleState?: LifecycleState
├── currentStockLocation?: StockLocation
├── assignments: AssetAssignment[]
└── stockMovements: StockMovement[]

AssetCategory
├── lifecycleModel?: LifecycleModel
├── assets: Asset[]
└── assetModels: AssetModel[]

AssetModel
├── assetCategory: AssetCategory
├── vendor: Vendor
└── assets: Asset[]

AssetAssignment
├── asset: Asset
└── assignee (polymorphic): Person | OrganizationUnit | Location | CI

StockLocation
├── location?: Location
├── assets: Asset[] (current location)
├── movementsFrom: StockMovement[]
└── movementsTo: StockMovement[]

StockMovement
├── stockLocationFrom?: StockLocation
├── stockLocationTo?: StockLocation
├── asset?: Asset
└── performedBy: Person
```

---

## Code Examples

### Create Organization Hierarchy

```typescript
// 1. Create company
const company = await createOrganizationUnitAction({
  name: "Barq Technologies",
  code: "BARQ",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
  userId: currentUserId,
});

// 2. Create department
const itDept = await createOrganizationUnitAction({
  name: "IT Department",
  code: "BARQ-IT",
  unitType: OrganizationUnitType.DEPARTMENT,
  level: 2,
  parentId: company.data.id,
  userId: currentUserId,
});
```

### Create Employee with Role

```typescript
// 1. Create person
const person = await createPersonAction({
  firstName: "Ahmed",
  lastName: "Al-Sayed",
  email: "ahmed@barq.com",
  employeeId: "EMP-001",
  orgUnitId: itDeptId,
  primaryRoleId: engineerRoleId,
  hireDate: new Date("2025-01-15"),
  userId: currentUserId,
});

// 2. Assign additional role
const assignment = await createPersonRoleAssignmentAction({
  personId: person.data.id,
  roleId: teamLeadRoleId,
  startDate: new Date("2025-03-01"),
  userId: currentUserId,
});
```

### Create Location Hierarchy

```typescript
// Country
const country = await createLocationAction({
  name: "Saudi Arabia",
  code: "SA",
  locationType: LocationType.COUNTRY,
  userId: currentUserId,
});

// Building
const building = await createLocationAction({
  name: "HQ Building",
  code: "SA-RUH-HQ",
  locationType: LocationType.BUILDING,
  parentId: country.data.id,
  addressLine1: "King Fahd Road",
  city: "Riyadh",
  country: "Saudi Arabia",
  userId: currentUserId,
});
```

### Setup Lifecycle Model

```typescript
// 1. Create model
const model = await createLifecycleModelAction({
  name: "CI Lifecycle",
  description: "Standard lifecycle for configuration items",
  userId: currentUserId,
});

// 2. Create states
const plannedState = await createLifecycleStateAction({
  lifecycleModelId: model.data.id,
  name: "Planned",
  code: "PLANNED",
  stateType: StateType.INITIAL,
  sortOrder: 1,
  userId: currentUserId,
});

const inServiceState = await createLifecycleStateAction({
  lifecycleModelId: model.data.id,
  name: "In Service",
  code: "IN_SERVICE",
  stateType: StateType.ACTIVE,
  isActiveState: true,
  sortOrder: 2,
  userId: currentUserId,
});

// 3. Create transition
const transition = await createLifecycleTransitionAction({
  lifecycleModelId: model.data.id,
  fromStateId: plannedState.data.id,
  toStateId: inServiceState.data.id,
  userId: currentUserId,
});
```

### Create Custom Field

```typescript
const cpuCoresField = await createFieldDefinitionAction({
  name: "cpu_cores",
  label: "CPU Cores",
  dataType: FieldDataTypeEnum.INTEGER,
  description: "Number of CPU cores",
  isGlobal: true,
  validationRules: { min: 1, max: 256 },
  defaultValue: 4,
  isFilterable: true,
  uiGroup: "Hardware",
  uiOrder: 1,
  userId: currentUserId,
});
```

---

## Quick Links

**Guides**:

- [Foundation Layer Guide](./FOUNDATION_LAYER.md) - Complete user guide
- [Hierarchy Management Guide](./HIERARCHY_MANAGEMENT.md) - Working with hierarchies
- [Lifecycle System Guide](./LIFECYCLE_SYSTEM.md) - Lifecycle management
- [Dynamic Fields Guide](./DYNAMIC_FIELDS.md) - Field definition system

**Architecture**:

- [Layer 1 Implementation](../architecture/LAYER_1_IMPLEMENTATION.md) - Technical details
- [Data Model](../architecture/DATA_MODEL.md) - Complete data model
- [Architecture Overview](../architecture/ARCHITECTURE.md) - System architecture

**API**:

- [Foundation API Reference](../api/FOUNDATION_API.md) - Complete API docs

**Development**:

- [Developer Guide](./DEVELOPER_GUIDE.md) - Development guide
- [RBAC Developer Guide](./RBAC_DEVELOPER_GUIDE.md) - Permission system

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Barq Assets Development Team
