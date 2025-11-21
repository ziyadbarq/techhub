# Foundation Layer - Entity Reference

Quick reference for all Foundation Layer entities in the Barq Assets CMDB/ITAM system.

---

## Entity Overview

| Entity | Purpose | Key Fields | Routes | Permissions |
|--------|---------|------------|--------|-------------|
| [OrganizationUnit](#organizationunit) | Organizational hierarchy | `code`, `level`, `parent` | `/organization-units` | `ORGANIZATION_UNITS_*` |
| [Person](#person) | Employee/contractor records | `employeeId`, `email`, `orgUnit` | `/persons` | `PERSONS_*` |
| [Role](#role) | RBAC + job roles (merged) | `name`, `permissions`, `isSystemRole` | `/admin/roles` | `ROLES_*` |
| [PersonRoleAssignment](#personroleassignment) | Person↔Role with dates | `personId`, `roleId`, `startDate` | `/persons/:id` (tab) | `PERSON_ROLE_ASSIGNMENTS_*` |
| [Location](#location) | Geographical hierarchy | `code`, `locationType`, `parent` | `/locations` | `LOCATIONS_*` |
| [Vendor](#vendor) | Suppliers/manufacturers | `code`, `vendorType`, `isPreferred` | `/vendors` | `VENDORS_*` |
| [VendorContact](#vendorcontact) | Vendor representatives | `vendorId`, `role`, `isPrimary` | `/vendors/:id/contacts` | `VENDOR_CONTACTS_*` |
| [LifecycleModel](#lifecyclemodel) | State machine definitions | `name`, `states`, `transitions` | `/lifecycle-models` | `LIFECYCLE_MODELS_*` |
| [LifecycleState](#lifecyclestate) | Individual states | `code`, `stateType`, `isTerminal` | `/lifecycle-states` | `LIFECYCLE_STATES_*` |
| [LifecycleTransition](#lifecycletransition) | Allowed state changes | `fromState`, `toState`, `requiredRole` | `/lifecycle-transitions` | `LIFECYCLE_TRANSITIONS_*` |
| [FieldDefinition](#fielddefinition) | Custom field definitions | `name`, `dataType`, `validationRules` | `/field-definitions` | `FIELD_DEFINITIONS_*` |

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

## Permission Reference

All Foundation entities follow standardized RBAC permission pattern:

| Entity | View | Create | Update | Delete | Manage |
|--------|------|--------|--------|--------|--------|
| OrganizationUnit | `ORGANIZATION_UNITS_VIEW` | `ORGANIZATION_UNITS_CREATE` | `ORGANIZATION_UNITS_UPDATE` | `ORGANIZATION_UNITS_DELETE` | `ORGANIZATION_UNITS_MANAGE` |
| Person | `PERSONS_VIEW` | `PERSONS_CREATE` | `PERSONS_UPDATE` | `PERSONS_DELETE` | `PERSONS_MANAGE` |
| Role | `ROLES_VIEW` | `ROLES_CREATE` | `ROLES_UPDATE` | `ROLES_DELETE` | `ROLES_MANAGE` |
| PersonRoleAssignment | `PERSON_ROLE_ASSIGNMENTS_VIEW` | `PERSON_ROLE_ASSIGNMENTS_CREATE` | `PERSON_ROLE_ASSIGNMENTS_UPDATE` | `PERSON_ROLE_ASSIGNMENTS_DELETE` | `PERSON_ROLE_ASSIGNMENTS_MANAGE` |
| Location | `LOCATIONS_VIEW` | `LOCATIONS_CREATE` | `LOCATIONS_UPDATE` | `LOCATIONS_DELETE` | `LOCATIONS_MANAGE` |
| Vendor | `VENDORS_VIEW` | `VENDORS_CREATE` | `VENDORS_UPDATE` | `VENDORS_DELETE` | `VENDORS_MANAGE` |
| VendorContact | `VENDOR_CONTACTS_VIEW` | `VENDOR_CONTACTS_CREATE` | `VENDOR_CONTACTS_UPDATE` | `VENDOR_CONTACTS_DELETE` | `VENDOR_CONTACTS_MANAGE` |
| LifecycleModel | `LIFECYCLE_MODELS_VIEW` | `LIFECYCLE_MODELS_CREATE` | `LIFECYCLE_MODELS_UPDATE` | `LIFECYCLE_MODELS_DELETE` | `LIFECYCLE_MODELS_MANAGE` |
| LifecycleState | `LIFECYCLE_STATES_VIEW` | `LIFECYCLE_STATES_CREATE` | `LIFECYCLE_STATES_UPDATE` | `LIFECYCLE_STATES_DELETE` | `LIFECYCLE_STATES_MANAGE` |
| LifecycleTransition | `LIFECYCLE_TRANSITIONS_VIEW` | `LIFECYCLE_TRANSITIONS_CREATE` | `LIFECYCLE_TRANSITIONS_UPDATE` | `LIFECYCLE_TRANSITIONS_DELETE` | `LIFECYCLE_TRANSITIONS_MANAGE` |
| FieldDefinition | `FIELD_DEFINITIONS_VIEW` | `FIELD_DEFINITIONS_CREATE` | `FIELD_DEFINITIONS_UPDATE` | `FIELD_DEFINITIONS_DELETE` | `FIELD_DEFINITIONS_MANAGE` |

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

**Enum Definitions**: [src/core/domain/value-objects/foundation-enums.ts](../../src/core/domain/value-objects/foundation-enums.ts)

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
  userId: currentUserId
});

// 2. Create department
const itDept = await createOrganizationUnitAction({
  name: "IT Department",
  code: "BARQ-IT",
  unitType: OrganizationUnitType.DEPARTMENT,
  level: 2,
  parentId: company.data.id,
  userId: currentUserId
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
  userId: currentUserId
});

// 2. Assign additional role
const assignment = await createPersonRoleAssignmentAction({
  personId: person.data.id,
  roleId: teamLeadRoleId,
  startDate: new Date("2025-03-01"),
  userId: currentUserId
});
```

### Create Location Hierarchy

```typescript
// Country
const country = await createLocationAction({
  name: "Saudi Arabia",
  code: "SA",
  locationType: LocationType.COUNTRY,
  userId: currentUserId
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
  userId: currentUserId
});
```

### Setup Lifecycle Model

```typescript
// 1. Create model
const model = await createLifecycleModelAction({
  name: "CI Lifecycle",
  description: "Standard lifecycle for configuration items",
  userId: currentUserId
});

// 2. Create states
const plannedState = await createLifecycleStateAction({
  lifecycleModelId: model.data.id,
  name: "Planned",
  code: "PLANNED",
  stateType: StateType.INITIAL,
  sortOrder: 1,
  userId: currentUserId
});

const inServiceState = await createLifecycleStateAction({
  lifecycleModelId: model.data.id,
  name: "In Service",
  code: "IN_SERVICE",
  stateType: StateType.ACTIVE,
  isActiveState: true,
  sortOrder: 2,
  userId: currentUserId
});

// 3. Create transition
const transition = await createLifecycleTransitionAction({
  lifecycleModelId: model.data.id,
  fromStateId: plannedState.data.id,
  toStateId: inServiceState.data.id,
  userId: currentUserId
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
  userId: currentUserId
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
