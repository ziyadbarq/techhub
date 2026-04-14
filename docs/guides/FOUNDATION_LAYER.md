# Foundation Layer Guide

## Overview

The Foundation Layer provides the core building blocks for the entire TechHub CMDB/ITAM system. These entities are shared across all other modules and establish the organizational, geographical, and lifecycle framework that all other entities reference.

**Purpose**: Pure reference data that should NOT know anything about specific CI types (computers, routers, etc.). Instead, it provides shared concepts that all higher layers reuse.

**Design Principle**: "Define once, reuse everywhere" - Foundation entities are referenced by CMDB, Asset, License, and Service layers, never re-invented.

---

## Architecture Position

```
┌─────────────────────────────────────────┐
│   Foundation Layer (Layer 1)            │ ← You are here
│   - Organization, People, Locations     │
│   - Vendors, Lifecycle, Fields          │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│   CMDB & Asset Layer (Layer 2)          │
│   - ConfigurationItems, Assets          │
│   - Relationships, Contracts            │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│   Service & Topology Layer (Layer 3)    │
│   - Clusters, VMs, Apps, Services       │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│   Process & Governance (Layer 4)        │
│   - Approvals, Audits, Integrations     │
└─────────────────────────────────────────┘
```

---

## Foundation Entities (10 Total)

> **Note**: Person.title (from Intune) is the job title field. Roles are ONLY for RBAC (UserRole table for system permissions).

### 1. Organization Structure

#### 1.1 OrganizationUnit

**Purpose**: Hierarchical organizational structure (Company → Business Unit → Department → Team)

**Use Cases**:

- Define organizational hierarchy
- Assign assets and CIs to departments/teams
- Track cost centers and budgets
- Determine ownership and responsibility

**Schema**:

```prisma
model OrganizationUnit {
  id              BigInt               @id @default(autoincrement())
  name            String
  code            String               @unique
  parentId        BigInt?
  parent          OrganizationUnit?    @relation("OrgUnitHierarchy", fields: [parentId], references: [id])
  children        OrganizationUnit[]   @relation("OrgUnitHierarchy")
  unitType        OrganizationUnitType
  level           Int                  // 1=Company, 2=BU, 3=Dept, 4=Team
  managerId       BigInt?
  manager         Person?              @relation("OrgUnitManager", fields: [managerId], references: [id])
  costCenter      String?
  isActive        Boolean              @default(true)
  note            String?
  metadata        Json?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}
```

**Entity Methods**:

```typescript
class OrganizationUnit {
  static create(props: CreateOrgUnitProps): OrganizationUnit;
  activate(): void;
  deactivate(): void;
  canBeDeleted(): boolean;
  toObject(): OrgUnitData;
}
```

**Common Workflows**:

1. **Create Company** (Top Level):

```typescript
// Create root organization
const company = OrganizationUnit.create({
  name: "Barq Technologies",
  code: "BARQ",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
  isActive: true,
});
await orgUnitRepository.create(company);
```

2. **Create Department** (Child Unit):

```typescript
// Create IT Department under company
const itDept = OrganizationUnit.create({
  name: "IT Department",
  code: "BARQ-IT",
  unitType: OrganizationUnitType.DEPARTMENT,
  level: 2,
  parentId: company.id,
  managerId: managerPerson.id,
  costCenter: "CC-IT-001",
  isActive: true,
});
await orgUnitRepository.create(itDept);
```

3. **Query Hierarchy**:

```typescript
// Get all children of a unit
const children = await orgUnitRepository.findChildren(companyId);

// Get parent unit
const parent = await orgUnitRepository.findParent(deptId);

// Search by name
const results = await orgUnitRepository.search({
  searchTerm: "IT",
  includeInactive: false,
  page: 1,
  limit: 20,
});
```

**Permission Requirements**:

- `ORGANIZATION_UNITS_VIEW` - View org units
- `ORGANIZATION_UNITS_CREATE` - Create new units
- `ORGANIZATION_UNITS_UPDATE` - Modify existing units
- `ORGANIZATION_UNITS_DELETE` - Delete units (if no dependencies)
- `ORGANIZATION_UNITS_MANAGE` - Full access

**UI Routes**:

- [/organization-units](/organization-units) - List all units
- [/organization-units/new](/organization-units/new) - Create new unit
- [/organization-units/:id](/organization-units/:id) - View/edit unit

---

#### 1.2 Person

**Purpose**: Organizational people (employees, contractors, contacts) - different from Better Auth User

**Key Distinction**:

- **Better Auth User**: System login account (email, password, sessions)
- **Person**: Organizational record (employee ID, role, department, contact info)
- **Link**: `Person.userId` → `User.id` (optional - not all persons need system access)

**Use Cases**:

- Track employees and contractors
- Assign assets and CIs to individuals
- Define ownership and responsibility
- Contact management for escalations

**Schema**:

```prisma
model Person {
  id                  BigInt              @id @default(autoincrement())
  userId              String?             @unique // Link to Better Auth User
  user                User?               @relation(fields: [userId], references: [id])
  firstName           String
  middleName          String?
  lastName            String
  email               String              @unique
  mobile              String?
  employeeId          String              @unique
  orgUnitId           BigInt
  orgUnit             OrganizationUnit    @relation(fields: [orgUnitId], references: [id])
  hireDate            DateTime?
  terminationDate     DateTime?
  isActive            Boolean             @default(true)
  metadata            Json?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}
```

**Entity Methods**:

```typescript
class Person {
  static create(props: CreatePersonProps): Person;
  activate(): void;
  deactivate(): void;
  terminate(terminationDate: Date): void;
  rehire(hireDate: Date): void;
  getFullName(): string;
  canBeDeleted(): boolean;
  toObject(): PersonData;
}
```

**Common Workflows**:

1. **Create Employee**:

```typescript
const person = Person.create({
  firstName: "Ahmed",
  lastName: "Al-Sayed",
  email: "ahmed.alsayed@barq.com",
  employeeId: "EMP-2025-001",
  orgUnitId: itDeptId,
  hireDate: new Date("2025-01-15"),
  mobile: "+966501234567",
  isActive: true,
});
await personRepository.create(person);
```

2. **Link to System User** (Optional):

```typescript
// When creating Better Auth user, link to Person
const user = await auth.api.signUpEmail({
  email: person.email,
  password: "secure-password",
  name: person.getFullName(),
});

// Update person with userId
person.userId = user.id;
await personRepository.update(person);
```

3. **Terminate Employee**:

```typescript
person.terminate(new Date("2025-12-31"));
person.deactivate();
await personRepository.update(person);
```

**Permission Requirements**:

- `PERSONS_VIEW` - View persons
- `PERSONS_CREATE` - Create new persons
- `PERSONS_UPDATE` - Modify existing persons
- `PERSONS_DELETE` - Delete persons (if no dependencies)
- `PERSONS_MANAGE` - Full access

**UI Routes**:

- [/persons](/persons) - List all persons with table, card, and org chart views
- [/persons/new](/persons/new) - Create new person
- [/persons/:id](/persons/:id) - **Person Details Page** - 360-degree view

**Person Details Page** (`/persons/:id`):

The Person Details page provides a comprehensive view of all information related to a person:

| Tab | Content |
|-----|---------|
| **Overview** | Personal info, employment, organization, location, status |
| **Organization** | Reporting chain, direct reports (lazy loaded), role assignments |
| **Assets & Licenses** | Intune devices, reservations, kit checkouts, maintenance schedules |
| **Services & CMDB** | Service ownerships, configuration items, data ownerships |
| **Governance** | Verification campaigns, items, attachments, disposal activities |
| **Activity** | Audit log timeline (placeholder) |

Quick stats cards show: Role & Org, Team info, Assets & Devices count, Activity count.

See [Person Details Page](../features/PERSON_DETAILS.md) for complete implementation details.

---

### 2. Location Hierarchy

#### 1.3 Location

**Purpose**: Hierarchical geographical and logical locations (Country → City → Campus → Building → Floor → Room → Rack)

**Use Cases**:

- Track physical location of assets and CIs
- Support both physical (Building, Room, Rack) and logical (Data Center, Cloud Region) locations
- Enable location-based reporting and impact analysis
- Support multi-site organizations

**Schema**:

```prisma
model Location {
  id              BigInt         @id @default(autoincrement())
  name            String
  code            String         @unique
  parentId        BigInt?
  parent          Location?      @relation("LocationHierarchy", fields: [parentId], references: [id])
  children        Location[]     @relation("LocationHierarchy")
  locationType    LocationType
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

```typescript
enum LocationType {
  COUNTRY        // Top level
  CITY
  CAMPUS
  BUILDING
  FLOOR
  ROOM
  RACK
  DATA_CENTER    // Logical location
  CLOUD_REGION   // Logical location (AWS us-east-1, Azure westeurope, etc.)
  CLOUD_ZONE     // Availability zone
  VIRTUAL        // Virtual/logical location
  WAREHOUSE      // Storage facility
  OFFICE         // Office location
  BRANCH         // Branch office
  OTHER
}
```

**Entity Methods**:

```typescript
class Location {
  static create(props: CreateLocationProps): Location;
  activate(): void;
  deactivate(): void;
  canBeDeleted(): boolean;
  getFullPath(): string; // "Saudi Arabia / Riyadh / HQ Building / Floor 3 / Room 301"
  toObject(): LocationData;
}
```

**Common Workflows**:

1. **Create Country** (Top Level):

```typescript
const country = Location.create({
  name: "Saudi Arabia",
  code: "SA",
  locationType: LocationType.COUNTRY,
  isActive: true,
});
await locationRepository.create(country);
```

2. **Create Building Hierarchy**:

```typescript
// City
const riyadh = Location.create({
  name: "Riyadh",
  code: "SA-RUH",
  locationType: LocationType.CITY,
  parentId: saudiArabiaId,
  country: "Saudi Arabia",
  city: "Riyadh",
  latitude: 24.7136,
  longitude: 46.6753,
});

// Building
const hqBuilding = Location.create({
  name: "HQ Building",
  code: "SA-RUH-HQ",
  locationType: LocationType.BUILDING,
  parentId: riyadhId,
  addressLine1: "King Fahd Road",
  addressLine2: "Al Olaya District",
  city: "Riyadh",
  country: "Saudi Arabia",
});

// Floor
const floor3 = Location.create({
  name: "Floor 3",
  code: "SA-RUH-HQ-F3",
  locationType: LocationType.FLOOR,
  parentId: hqBuildingId,
});

// Room
const serverRoom = Location.create({
  name: "Server Room 301",
  code: "SA-RUH-HQ-F3-SR301",
  locationType: LocationType.ROOM,
  parentId: floor3Id,
});

// Rack
const rack01 = Location.create({
  name: "Rack A01",
  code: "SA-RUH-HQ-F3-SR301-A01",
  locationType: LocationType.RACK,
  parentId: serverRoomId,
});
```

3. **Create Cloud Regions**:

```typescript
const awsUsEast1 = Location.create({
  name: "AWS US East 1 (N. Virginia)",
  code: "AWS-US-EAST-1",
  locationType: LocationType.CLOUD_REGION,
  country: "United States",
  city: "Ashburn, VA",
  metadata: { provider: "AWS", region: "us-east-1" },
});

const azureWestEu = Location.create({
  name: "Azure West Europe",
  code: "AZURE-WEST-EU",
  locationType: LocationType.CLOUD_REGION,
  country: "Netherlands",
  city: "Amsterdam",
  metadata: { provider: "Azure", region: "westeurope" },
});
```

4. **Query Hierarchy**:

```typescript
// Get all children of a location
const children = await locationRepository.findChildren(buildingId);

// Get parent location
const parent = await locationRepository.findParent(roomId);

// Search locations
const results = await locationRepository.search({
  searchTerm: "Server Room",
  includeInactive: false,
  page: 1,
  limit: 20,
});

// Get full path
const location = await locationRepository.findById(rackId);
const path = location.getFullPath();
// Returns: "Saudi Arabia / Riyadh / HQ Building / Floor 3 / Server Room 301 / Rack A01"
```

**Permission Requirements**:

- `LOCATIONS_VIEW` - View locations
- `LOCATIONS_CREATE` - Create new locations
- `LOCATIONS_UPDATE` - Modify existing locations
- `LOCATIONS_DELETE` - Delete locations (if no dependencies)
- `LOCATIONS_MANAGE` - Full access

**UI Routes**:

- [/locations](/locations) - List all locations (tree view)
- [/locations/new](/locations/new) - Create new location
- [/locations/:id](/locations/:id) - View/edit location

---

### 3. Vendor Management

#### 3.1 Vendor

**Purpose**: Track suppliers, manufacturers, service providers, and contractors

**Use Cases**:

- Manage vendor relationships
- Link assets and contracts to vendors
- Track preferred vendors
- Store vendor contact information and SLAs

**Schema**:

```prisma
model Vendor {
  id              BigInt          @id @default(autoincrement())
  name            String
  code            String          @unique
  vendorType      VendorType
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

  // Relations
  contacts        VendorContact[]
  assets          Asset[]
  contracts       Contract[]
  licenseProducts LicenseProduct[]
  assetModels     AssetModel[]
}
```

**Vendor Types**:

```typescript
enum VendorType {
  MANUFACTURER   // Dell, HP, Cisco, etc.
  RESELLER       // Value-added resellers
  SERVICE_PROVIDER // Managed services, cloud providers
  CONSULTANT     // Professional services
  CONTRACTOR     // Independent contractors
  OTHER
}
```

**Entity Methods**:

```typescript
class Vendor {
  static create(props: CreateVendorProps): Vendor;
  addContact(contact: VendorContact): void;
  markAsPreferred(): void;
  unmarkAsPreferred(): void;
  canBeDeleted(): Promise<boolean>;
  hasAssets(): Promise<boolean>;
  hasContracts(): Promise<boolean>;
  toObject(): VendorData;
}
```

**Common Workflows**:

1. **Create Vendor**:

```typescript
const vendor = Vendor.create({
  name: "Dell Technologies",
  code: "DELL",
  vendorType: VendorType.MANUFACTURER,
  legalName: "Dell Inc.",
  website: "https://www.dell.com",
  email: "support@dell.com",
  phone: "+1-800-624-9896",
  isPreferred: true,
  tags: ["hardware", "enterprise", "preferred"],
});
await vendorRepository.create(vendor);
```

2. **Add Vendor Contact**:

```typescript
const contact = VendorContact.create({
  vendorId: vendor.id,
  fullName: "Ahmed Al Saud",
  email: "ahmed.alsaud@dell.com",
  phone: "+1-555-0123",
  role: "Account Manager",
  isPrimary: true,
});
await vendorContactRepository.create(contact);
```

3. **Search Vendors**:

```typescript
// Search by name
const results = await vendorRepository.search({
  searchTerm: "Dell",
  page: 1,
  limit: 20,
});

// Filter by type
const manufacturers = await vendorRepository.findAll({
  vendorType: VendorType.MANUFACTURER,
  preferredOnly: true,
});
```

**Permission Requirements**:

- `VENDORS_VIEW` - View vendors
- `VENDORS_CREATE` - Create new vendors
- `VENDORS_UPDATE` - Modify existing vendors
- `VENDORS_DELETE` - Delete vendors (if no dependencies)
- `VENDORS_MANAGE` - Full access

**UI Routes**:

- [/vendors](/vendors) - List all vendors
- [/vendors/new](/vendors/new) - Create new vendor
- [/vendors/:id](/vendors/:id) - View/edit vendor
- [/vendors/:id/contacts](/vendors/:id/contacts) - Manage vendor contacts

---

#### 3.2 VendorContact

**Purpose**: Contact persons at vendor organizations

**Use Cases**:

- Track vendor representatives
- Escalation contacts for issues
- Account managers and technical contacts
- Support and sales contacts

**Schema**:

```prisma
model VendorContact {
  id          BigInt    @id @default(autoincrement())
  vendorId    BigInt
  vendor      Vendor    @relation(fields: [vendorId], references: [id])
  fullName    String
  email       String
  phone       String?
  role        String    // "Account Manager", "Technical Support", "Sales Rep", etc.
  isPrimary   Boolean   @default(false)
  note        String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Entity Methods**:

```typescript
class VendorContact {
  static create(props: CreateContactProps): VendorContact;
  markAsPrimary(): void;
  unmarkAsPrimary(): void;
  toObject(): ContactData;
}
```

**Common Workflows**:

1. **Create Primary Contact**:

```typescript
const primaryContact = VendorContact.create({
  vendorId: dellVendorId,
  fullName: "Fatimah AlHarbi",
  email: "fatimah.alharbi@dell.com",
  phone: "+1-555-0456",
  role: "Senior Account Manager",
  isPrimary: true,
  note: "Primary contact for all enterprise accounts",
});
await vendorContactRepository.create(primaryContact);
```

2. **Add Technical Contact**:

```typescript
const techContact = VendorContact.create({
  vendorId: dellVendorId,
  fullName: "Yousef Alqahtani",
  email: "yousef.alqahtani@dell.com",
  phone: "+1-555-0789",
  role: "Technical Support Lead",
  isPrimary: false,
});
await vendorContactRepository.create(techContact);
```

3. **Query Contacts**:

```typescript
// Get all contacts for a vendor
const contacts = await vendorContactRepository.findByVendor(vendorId);

// Get primary contact only
const primaryContact = await vendorContactRepository.findPrimary(vendorId);
```

**Permission Requirements**:

- `VENDOR_CONTACTS_VIEW` - View vendor contacts
- `VENDOR_CONTACTS_CREATE` - Create new contacts
- `VENDOR_CONTACTS_UPDATE` - Modify existing contacts
- `VENDOR_CONTACTS_DELETE` - Delete contacts
- `VENDOR_CONTACTS_MANAGE` - Full access

**UI Routes**:

- Managed via Vendor detail page: [/vendors/:id/contacts](/vendors/:id/contacts)

---

### 4. Lifecycle Management System

The Lifecycle System provides reusable state machine definitions that can be applied to CIs, Assets, Licenses, and other entities. This is a "define once, reuse everywhere" pattern.

#### 4.1 LifecycleModel

**Purpose**: Define reusable lifecycle models (state machines) for different entity types

**Use Cases**:

- Define "CI Lifecycle" (Planned → In Service → Retired → Disposed)
- Define "Asset Lifecycle" (Ordered → In Stock → Deployed → Maintenance → Retired)
- Define "License Lifecycle" (Active → Expiring → Expired → Renewed)
- Reuse across multiple CIClass, AssetCategory, LicenseProduct entities

**Schema**:

```prisma
model LifecycleModel {
  id          BigInt            @id @default(autoincrement())
  name        String            @unique
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Relations
  states      LifecycleState[]
  transitions LifecycleTransition[]
  ciClasses   CIClass[]
  assetCategories AssetCategory[]
  licenseProducts LicenseProduct[]
}
```

**Entity Methods**:

```typescript
class LifecycleModel {
  static create(props: CreateModelProps): LifecycleModel;
  canBeDeleted(): Promise<boolean>;
  toObject(): ModelData;
}
```

**Common Workflows**:

1. **Create CI Lifecycle Model**:

```typescript
const ciLifecycle = LifecycleModel.create({
  name: "CI Lifecycle",
  description: "Standard lifecycle for configuration items",
});
await lifecycleModelRepository.create(ciLifecycle);

// Add states
const states = [
  LifecycleState.create({
    lifecycleModelId: ciLifecycle.id,
    name: "Planned",
    code: "PLANNED",
    stateType: StateType.INITIAL,
    isActiveState: false,
    isTerminalState: false,
    sortOrder: 1,
  }),
  LifecycleState.create({
    lifecycleModelId: ciLifecycle.id,
    name: "In Service",
    code: "IN_SERVICE",
    stateType: StateType.ACTIVE,
    isActiveState: true,
    isTerminalState: false,
    sortOrder: 2,
  }),
  LifecycleState.create({
    lifecycleModelId: ciLifecycle.id,
    name: "Retired",
    code: "RETIRED",
    stateType: StateType.TERMINAL,
    isActiveState: false,
    isTerminalState: true,
    sortOrder: 3,
  }),
];

for (const state of states) {
  await lifecycleStateRepository.create(state);
}
```

2. **Create Asset Lifecycle Model**:

```typescript
const assetLifecycle = LifecycleModel.create({
  name: "IT Asset Lifecycle",
  description: "Lifecycle for physical IT assets from procurement to disposal",
});
await lifecycleModelRepository.create(assetLifecycle);

// Add detailed states for asset management
const assetStates = [
  "Ordered",
  "In Transit",
  "Received",
  "In Stock",
  "Deployed",
  "In Use",
  "In Maintenance",
  "In Repair",
  "Lost",
  "Stolen",
  "Retired",
  "Disposed",
];
// ... create states
```

**Permission Requirements**:

- `LIFECYCLE_MODELS_VIEW` - View lifecycle models
- `LIFECYCLE_MODELS_CREATE` - Create new models
- `LIFECYCLE_MODELS_UPDATE` - Modify existing models
- `LIFECYCLE_MODELS_DELETE` - Delete models (if no dependencies)
- `LIFECYCLE_MODELS_MANAGE` - Full access

**UI Routes**:

- [/lifecycle-models](/lifecycle-models) - List all lifecycle models
- [/lifecycle-models/new](/lifecycle-models/new) - Create new model
- [/lifecycle-models/:id](/lifecycle-models/:id) - View/edit model

---

#### 4.2 LifecycleState

**Purpose**: Individual states within a lifecycle model

**Use Cases**:

- Define allowed states for a lifecycle
- Mark states as active/terminal
- Control state ordering
- Define state properties (color, icon for UI)

**Schema**:

```prisma
model LifecycleState {
  id                BigInt             @id @default(autoincrement())
  lifecycleModelId  BigInt
  lifecycleModel    LifecycleModel     @relation(fields: [lifecycleModelId], references: [id])
  name              String
  code              String
  stateType         StateType
  isActiveState     Boolean            @default(false)
  isTerminalState   Boolean            @default(false)
  sortOrder         Int
  metadata          Json?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  // Relations
  transitionsFrom   LifecycleTransition[] @relation("TransitionFromState")
  transitionsTo     LifecycleTransition[] @relation("TransitionToState")
  configurationItems ConfigurationItem[]
  assets            Asset[]
}
```

**State Types**:

```typescript
enum StateType {
  INITIAL      // First state (e.g., "Planned")
  ACTIVE       // Normal active state (e.g., "In Service")
  INACTIVE     // Temporarily inactive (e.g., "In Maintenance")
  TERMINAL     // Final state (e.g., "Disposed")
  TRANSITION   // Temporary transition state (e.g., "In Transit")
}
```

**Entity Methods**:

```typescript
class LifecycleState {
  static create(props: CreateStateProps): LifecycleState;
  canBeDeleted(): Promise<boolean>;
  toObject(): StateData;
}
```

**Common Workflows**:

1. **Create State with Properties**:

```typescript
const inServiceState = LifecycleState.create({
  lifecycleModelId: ciLifecycleId,
  name: "In Service",
  code: "IN_SERVICE",
  stateType: StateType.ACTIVE,
  isActiveState: true,
  isTerminalState: false,
  sortOrder: 10,
  metadata: {
    color: "#10b981", // green
    icon: "check-circle",
    description: "CI is actively providing service",
  },
});
await lifecycleStateRepository.create(inServiceState);
```

2. **Query States by Model**:

```typescript
// Get all states for a lifecycle model
const states = await lifecycleStateRepository.findByModel(lifecycleModelId);

// Get only active states
const activeStates = states.filter((s) => s.isActiveState);

// Get terminal states
const terminalStates = states.filter((s) => s.isTerminalState);
```

**Permission Requirements**:

- `LIFECYCLE_STATES_VIEW` - View lifecycle states
- `LIFECYCLE_STATES_CREATE` - Create new states
- `LIFECYCLE_STATES_UPDATE` - Modify existing states
- `LIFECYCLE_STATES_DELETE` - Delete states (if no dependencies)
- `LIFECYCLE_STATES_MANAGE` - Full access

**UI Routes**:

- [/lifecycle-states](/lifecycle-states) - List all states
- [/lifecycle-states/new](/lifecycle-states/new) - Create new state
- [/lifecycle-states/:id](/lifecycle-states/:id) - View/edit state

---

#### 4.3 LifecycleTransition

**Purpose**: Define allowed state transitions with optional approval rules

**Use Cases**:

- Control which states can transition to which (e.g., "Planned" → "In Service")
- Require approvals for certain transitions (e.g., "In Service" → "Retired")
- Restrict transitions by role (e.g., only Admins can retire CIs)
- Support automated transitions (e.g., auto-expire licenses after date)

**Schema**:

```prisma
model LifecycleTransition {
  id                  BigInt          @id @default(autoincrement())
  lifecycleModelId    BigInt
  lifecycleModel      LifecycleModel  @relation(fields: [lifecycleModelId], references: [id])
  fromStateId         BigInt
  fromState           LifecycleState  @relation("TransitionFromState", fields: [fromStateId], references: [id])
  toStateId           BigInt
  toState             LifecycleState  @relation("TransitionToState", fields: [toStateId], references: [id])
  requiredRoleId      String?
  requiredRole        Role?           @relation("TransitionRequiredRole", fields: [requiredRoleId], references: [id])
  requiresApproval    Boolean         @default(false)
  approvalPolicy      Json?
  isAutomated         Boolean         @default(false)
  conditions          Json?
  metadata            Json?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
}
```

**Entity Methods**:

```typescript
class LifecycleTransition {
  static create(props: CreateTransitionProps): LifecycleTransition;
  validateConditions(context: TransitionContext): boolean;
  requiresRole(roleId: string): boolean;
  canBeDeleted(): Promise<boolean>;
  toObject(): TransitionData;
}
```

**Common Workflows**:

1. **Create Simple Transition**:

```typescript
const transition = LifecycleTransition.create({
  lifecycleModelId: ciLifecycleId,
  fromStateId: plannedStateId,
  toStateId: inServiceStateId,
  requiresApproval: false,
  isAutomated: false,
});
await lifecycleTransitionRepository.create(transition);
```

2. **Create Transition with Role Requirement**:

```typescript
const retireTransition = LifecycleTransition.create({
  lifecycleModelId: ciLifecycleId,
  fromStateId: inServiceStateId,
  toStateId: retiredStateId,
  requiredRoleId: adminRoleId,
  requiresApproval: true,
  approvalPolicy: {
    approverRoles: ["Admin", "IT Manager"],
    minimumApprovals: 1,
  },
});
await lifecycleTransitionRepository.create(retireTransition);
```

3. **Create Automated Transition**:

```typescript
const expireTransition = LifecycleTransition.create({
  lifecycleModelId: licenseLifecycleId,
  fromStateId: activeStateId,
  toStateId: expiredStateId,
  isAutomated: true,
  conditions: {
    type: "date_based",
    field: "expiryDate",
    operator: "lte",
    value: "current_date",
  },
});
await lifecycleTransitionRepository.create(expireTransition);
```

4. **Query Transitions**:

```typescript
// Get all transitions for a model
const transitions =
  await lifecycleTransitionRepository.findByModel(lifecycleModelId);

// Get valid transitions from a specific state
const validTransitions = await lifecycleTransitionRepository.findByStates({
  lifecycleModelId,
  fromStateId: currentStateId,
});

// Check if transition is allowed
const canTransition = validTransitions.some(
  (t) => t.toStateId === targetStateId,
);
```

**Permission Requirements**:

- `LIFECYCLE_TRANSITIONS_VIEW` - View lifecycle transitions
- `LIFECYCLE_TRANSITIONS_CREATE` - Create new transitions
- `LIFECYCLE_TRANSITIONS_UPDATE` - Modify existing transitions
- `LIFECYCLE_TRANSITIONS_DELETE` - Delete transitions
- `LIFECYCLE_TRANSITIONS_MANAGE` - Full access

**UI Routes**:

- [/lifecycle-transitions](/lifecycle-transitions) - List all transitions
- [/lifecycle-transitions/new](/lifecycle-transitions/new) - Create new transition
- [/lifecycle-transitions/:id](/lifecycle-transitions/:id) - View/edit transition

---

### 5. Meta-Model System

#### 5.1 FieldDefinition

**Purpose**: Define custom fields once and reuse across CIClass, AssetCategory, LicenseProduct, and other entities

**Key Concept**: "Define once, use everywhere" - Instead of hard-coding fields in database schema, define them dynamically and attach to entity types as needed.

**Use Cases**:

- Define custom attributes for CI classes (e.g., "CPU Cores" for Computer class)
- Define custom attributes for asset categories (e.g., "Screen Size" for Monitor category)
- Generate forms and validation rules dynamically from field definitions
- Support different data types (string, number, date, enum, references)
- Enable search and filtering on custom fields

**Schema**:

```prisma
model FieldDefinition {
  id                BigInt    @id @default(autoincrement())
  name              String    @unique
  label             String
  dataType          FieldDataTypeEnum
  description       String?
  isGlobal          Boolean   @default(false)
  validationRules   Json?
  defaultValue      Json?
  enumOptions       Json?
  uiGroup           String?
  uiOrder           Int?
  isSearchable      Boolean   @default(false)
  isFilterable      Boolean   @default(false)
  metadata          Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  ciClassFields           CIClassField[]
  assetCategoryFields     AssetCategoryField[]
  licenseProductFields    LicenseProductField[]
}
```

**Field Data Types**:

```typescript
enum FieldDataTypeEnum {
  STRING              // Short text (max 255 chars)
  TEXT                // Long text (unlimited)
  INTEGER             // Whole number
  DECIMAL             // Decimal number
  BOOLEAN             // True/false
  DATE                // Date only
  DATETIME            // Date and time
  ENUM                // Dropdown with predefined options
  JSON                // Structured JSON data
  CI_REFERENCE        // Reference to another CI
  PERSON_REFERENCE    // Reference to Person
  ORG_UNIT_REFERENCE  // Reference to OrganizationUnit
  LOCATION_REFERENCE  // Reference to Location
}
```

**Entity Methods**:

```typescript
class FieldDefinition {
  static create(props: CreateFieldProps): FieldDefinition;
  validate(value: any): boolean;
  getEnumOptions(): string[];
  canBeDeleted(): Promise<boolean>;
  toObject(): FieldData;
}
```

**Common Workflows**:

1. **Create Simple String Field**:

```typescript
const hostnameField = FieldDefinition.create({
  name: "hostname",
  label: "Hostname",
  dataType: FieldDataTypeEnum.STRING,
  description: "DNS hostname of the server",
  isGlobal: true,
  validationRules: {
    minLength: 3,
    maxLength: 63,
    pattern: "^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$",
  },
  isSearchable: true,
  isFilterable: true,
  uiGroup: "Network",
  uiOrder: 1,
});
await fieldDefinitionRepository.create(hostnameField);
```

2. **Create Integer Field with Range**:

```typescript
const cpuCoresField = FieldDefinition.create({
  name: "cpu_cores",
  label: "CPU Cores",
  dataType: FieldDataTypeEnum.INTEGER,
  description: "Number of CPU cores",
  isGlobal: true,
  validationRules: {
    min: 1,
    max: 256,
  },
  defaultValue: 4,
  isFilterable: true,
  uiGroup: "Hardware",
  uiOrder: 2,
});
await fieldDefinitionRepository.create(cpuCoresField);
```

3. **Create Enum Field (Dropdown)**:

```typescript
const osTypeField = FieldDefinition.create({
  name: "os_type",
  label: "Operating System Type",
  dataType: FieldDataTypeEnum.ENUM,
  description: "Type of operating system",
  isGlobal: true,
  enumOptions: [
    { value: "windows", label: "Windows" },
    { value: "linux", label: "Linux" },
    { value: "macos", label: "macOS" },
    { value: "unix", label: "Unix" },
    { value: "other", label: "Other" },
  ],
  isFilterable: true,
  uiGroup: "Software",
  uiOrder: 1,
});
await fieldDefinitionRepository.create(osTypeField);
```

4. **Create Reference Field**:

```typescript
const primaryOwnerField = FieldDefinition.create({
  name: "primary_owner",
  label: "Primary Owner",
  dataType: FieldDataTypeEnum.PERSON_REFERENCE,
  description: "Person responsible for this CI",
  isGlobal: true,
  isFilterable: true,
  uiGroup: "Ownership",
  uiOrder: 1,
});
await fieldDefinitionRepository.create(primaryOwnerField);
```

5. **Create JSON Field for Complex Data**:

```typescript
const networkConfigField = FieldDefinition.create({
  name: "network_config",
  label: "Network Configuration",
  dataType: FieldDataTypeEnum.JSON,
  description: "Network interface configurations",
  isGlobal: false,
  validationRules: {
    schema: {
      type: "object",
      properties: {
        interfaces: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              ipAddress: { type: "string" },
              macAddress: { type: "string" },
            },
          },
        },
      },
    },
  },
  uiGroup: "Network",
  uiOrder: 10,
});
await fieldDefinitionRepository.create(networkConfigField);
```

6. **Attach Field to CI Class** (Layer 2 - Preview):

```typescript
// This is done in Layer 2 when CIClass exists
const ciClassField = CIClassField.create({
  ciClassId: computerCIClassId,
  fieldDefinitionId: cpuCoresField.id,
  isRequired: true,
  isVisible: true,
  uiOrder: 1,
});
await ciClassFieldRepository.create(ciClassField);
```

7. **Query Fields**:

```typescript
// Search fields
const results = await fieldDefinitionRepository.search({
  searchTerm: "cpu",
  dataType: FieldDataTypeEnum.INTEGER,
});

// Get all global fields
const globalFields = await fieldDefinitionRepository.findAll({
  isGlobal: true,
});

// Get fields by entity type (Layer 2)
const computerFields = await fieldDefinitionRepository.findByEntity({
  entityType: "CIClass",
  entityId: computerCIClassId,
});
```

**Validation Rules Format**:

```typescript
// String validation
{
  minLength: 3,
  maxLength: 255,
  pattern: "^[a-zA-Z0-9-_]+$",
  trim: true,
  lowercase: false
}

// Number validation
{
  min: 0,
  max: 100,
  integer: true, // No decimals
  multipleOf: 5  // Must be multiple of 5
}

// Date validation
{
  min: "2020-01-01",
  max: "2030-12-31",
  notPast: true,
  notFuture: false
}

// Enum validation
{
  allowedValues: ["value1", "value2", "value3"]
}

// JSON schema validation
{
  schema: { /* JSON Schema definition */ }
}
```

**Permission Requirements**:

- `FIELD_DEFINITIONS_VIEW` - View field definitions
- `FIELD_DEFINITIONS_CREATE` - Create new fields
- `FIELD_DEFINITIONS_UPDATE` - Modify existing fields
- `FIELD_DEFINITIONS_DELETE` - Delete fields (if no dependencies)
- `FIELD_DEFINITIONS_MANAGE` - Full access

**UI Routes**:

- [/field-definitions](/field-definitions) - List all field definitions
- [/field-definitions/new](/field-definitions/new) - Create new field
- [/field-definitions/:id](/field-definitions/:id) - View/edit field

---

## Relationships Between Foundation Entities

### Organizational Hierarchy

```
OrganizationUnit (Company)
├── OrganizationUnit (Business Unit)
│   ├── OrganizationUnit (Department)
│   │   ├── OrganizationUnit (Team)
│   │   └── Person (Employee)
│   └── OrganizationUnit (Department)
│       └── Person (Employee)
└── OrganizationUnit (Business Unit)
```

### Person-User Relationships

```
Person
├── userId → User (Optional link to system account)
├── title (Job title from Intune)
├── office (Office location from MS Graph)
└── orgUnit → OrganizationUnit
```

### Location Hierarchy

```
Location (Country: Saudi Arabia)
├── Location (City: Riyadh)
│   ├── Location (Building: HQ)
│   │   ├── Location (Floor: 3)
│   │   │   ├── Location (Room: Server Room)
│   │   │   │   ├── Location (Rack: A01)
│   │   │   │   └── Location (Rack: A02)
│   │   │   └── Location (Room: Office 302)
│   │   └── Location (Floor: 4)
│   └── Location (Building: Branch Office)
└── Location (City: Jeddah)
```

### Lifecycle System

```
LifecycleModel ("CI Lifecycle")
├── LifecycleState ("Planned")
├── LifecycleState ("In Service")
└── LifecycleState ("Retired")

LifecycleTransition
├── from: "Planned" → to: "In Service"
├── from: "In Service" → to: "Retired" (requires Admin role)
└── ...
```

### Vendor-Contact Relationship

```
Vendor
├── VendorContact (Primary: Account Manager)
├── VendorContact (Technical Support)
└── VendorContact (Sales Representative)
```

---

## Common Integration Patterns

### Pattern 1: Create Complete Organization

```typescript
// 1. Create company
const company = await createOrganizationUnitUseCase.execute({
  name: "Barq Technologies",
  code: "BARQ",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
});

// 2. Create IT department
const itDept = await createOrganizationUnitUseCase.execute({
  name: "IT Department",
  code: "BARQ-IT",
  unitType: OrganizationUnitType.DEPARTMENT,
  level: 2,
  parentId: company.id,
  costCenter: "CC-IT-001",
});

// 3. Create role
const engineerRole = await createRoleUseCase.execute({
  name: "Software Engineer",
  description: "Develops software applications",
});

// 4. Create person
const person = await createPersonUseCase.execute({
  firstName: "Ahmed",
  lastName: "Al-Sayed",
  email: "ahmed.alsayed@barq.com",
  employeeId: "EMP-001",
  orgUnitId: itDept.id,
  hireDate: new Date("2025-01-15"),
});
```

### Pattern 2: Create Location Hierarchy

```typescript
// 1. Create country
const country = await createLocationUseCase.execute({
  name: "Saudi Arabia",
  code: "SA",
  locationType: LocationType.COUNTRY,
});

// 2. Create city
const city = await createLocationUseCase.execute({
  name: "Riyadh",
  code: "SA-RUH",
  locationType: LocationType.CITY,
  parentId: country.id,
  latitude: 24.7136,
  longitude: 46.6753,
});

// 3. Create building
const building = await createLocationUseCase.execute({
  name: "HQ Building",
  code: "SA-RUH-HQ",
  locationType: LocationType.BUILDING,
  parentId: city.id,
  addressLine1: "King Fahd Road",
});

// 4. Create server room
const serverRoom = await createLocationUseCase.execute({
  name: "Server Room 301",
  code: "SA-RUH-HQ-SR301",
  locationType: LocationType.ROOM,
  parentId: building.id,
});

// 5. Query full path
const location = await getLocationUseCase.execute({ id: serverRoom.id });
console.log(location.getFullPath());
// "Saudi Arabia / Riyadh / HQ Building / Server Room 301"
```

### Pattern 3: Setup Lifecycle Model

```typescript
// 1. Create lifecycle model
const model = await createLifecycleModelUseCase.execute({
  name: "CI Lifecycle",
  description: "Standard lifecycle for configuration items",
});

// 2. Create states
const states = [
  await createLifecycleStateUseCase.execute({
    lifecycleModelId: model.id,
    name: "Planned",
    code: "PLANNED",
    stateType: StateType.INITIAL,
    sortOrder: 1,
  }),
  await createLifecycleStateUseCase.execute({
    lifecycleModelId: model.id,
    name: "In Service",
    code: "IN_SERVICE",
    stateType: StateType.ACTIVE,
    isActiveState: true,
    sortOrder: 2,
  }),
  await createLifecycleStateUseCase.execute({
    lifecycleModelId: model.id,
    name: "Retired",
    code: "RETIRED",
    stateType: StateType.TERMINAL,
    isTerminalState: true,
    sortOrder: 3,
  }),
];

// 3. Create transitions
await createLifecycleTransitionUseCase.execute({
  lifecycleModelId: model.id,
  fromStateId: states[0].id,
  toStateId: states[1].id,
});

await createLifecycleTransitionUseCase.execute({
  lifecycleModelId: model.id,
  fromStateId: states[1].id,
  toStateId: states[2].id,
  requiredRoleId: adminRoleId,
  requiresApproval: true,
});

// 4. Assign to CI Class (Layer 2)
// await updateCIClassUseCase.execute({
//   id: computerCIClassId,
//   lifecycleModelId: model.id
// });
```

### Pattern 4: Define Custom Fields for CI Class

```typescript
// 1. Create field definitions
const cpuCoresField = await createFieldDefinitionUseCase.execute({
  name: "cpu_cores",
  label: "CPU Cores",
  dataType: FieldDataTypeEnum.INTEGER,
  validationRules: { min: 1, max: 256 },
  isGlobal: true,
});

const ramGbField = await createFieldDefinitionUseCase.execute({
  name: "ram_gb",
  label: "RAM (GB)",
  dataType: FieldDataTypeEnum.INTEGER,
  validationRules: { min: 1, max: 2048 },
  isGlobal: true,
});

const osTypeField = await createFieldDefinitionUseCase.execute({
  name: "os_type",
  label: "OS Type",
  dataType: FieldDataTypeEnum.ENUM,
  enumOptions: [
    { value: "windows", label: "Windows" },
    { value: "linux", label: "Linux" },
    { value: "macos", label: "macOS" },
  ],
  isGlobal: true,
});

// 2. Attach to CI Class (Layer 2 - Preview)
// const computerClass = await getCIClassUseCase.execute({ code: "COMPUTER" });
//
// await createCIClassFieldUseCase.execute({
//   ciClassId: computerClass.id,
//   fieldDefinitionId: cpuCoresField.id,
//   isRequired: true,
//   uiOrder: 1
// });
//
// await createCIClassFieldUseCase.execute({
//   ciClassId: computerClass.id,
//   fieldDefinitionId: ramGbField.id,
//   isRequired: true,
//   uiOrder: 2
// });
//
// await createCIClassFieldUseCase.execute({
//   ciClassId: computerClass.id,
//   fieldDefinitionId: osTypeField.id,
//   isRequired: true,
//   uiOrder: 3
// });
```

---

## Permission Summary

All Foundation entities follow RBAC permission model with standardized permission keys:

| Entity               | View                         | Create                         | Update                         | Delete                         | Manage                         |
| -------------------- | ---------------------------- | ------------------------------ | ------------------------------ | ------------------------------ | ------------------------------ |
| OrganizationUnit     | ORGANIZATION_UNITS_VIEW      | ORGANIZATION_UNITS_CREATE      | ORGANIZATION_UNITS_UPDATE      | ORGANIZATION_UNITS_DELETE      | ORGANIZATION_UNITS_MANAGE      |
| Person               | PERSONS_VIEW                 | PERSONS_CREATE                 | PERSONS_UPDATE                 | PERSONS_DELETE                 | PERSONS_MANAGE                 |
| Location             | LOCATIONS_VIEW               | LOCATIONS_CREATE               | LOCATIONS_UPDATE               | LOCATIONS_DELETE               | LOCATIONS_MANAGE               |
| Vendor               | VENDORS_VIEW                 | VENDORS_CREATE                 | VENDORS_UPDATE                 | VENDORS_DELETE                 | VENDORS_MANAGE                 |
| VendorContact        | VENDOR_CONTACTS_VIEW         | VENDOR_CONTACTS_CREATE         | VENDOR_CONTACTS_UPDATE         | VENDOR_CONTACTS_DELETE         | VENDOR_CONTACTS_MANAGE         |
| LifecycleModel       | LIFECYCLE_MODELS_VIEW        | LIFECYCLE_MODELS_CREATE        | LIFECYCLE_MODELS_UPDATE        | LIFECYCLE_MODELS_DELETE        | LIFECYCLE_MODELS_MANAGE        |
| LifecycleState       | LIFECYCLE_STATES_VIEW        | LIFECYCLE_STATES_CREATE        | LIFECYCLE_STATES_UPDATE        | LIFECYCLE_STATES_DELETE        | LIFECYCLE_STATES_MANAGE        |
| LifecycleTransition  | LIFECYCLE_TRANSITIONS_VIEW   | LIFECYCLE_TRANSITIONS_CREATE   | LIFECYCLE_TRANSITIONS_UPDATE   | LIFECYCLE_TRANSITIONS_DELETE   | LIFECYCLE_TRANSITIONS_MANAGE   |
| FieldDefinition      | FIELD_DEFINITIONS_VIEW       | FIELD_DEFINITIONS_CREATE       | FIELD_DEFINITIONS_UPDATE       | FIELD_DEFINITIONS_DELETE       | FIELD_DEFINITIONS_MANAGE       |

**Permission Enforcement Layers**:

1. **Server Actions** (Controllers) - Primary enforcement
2. **Use Cases** - Secondary validation via CheckPermissionUseCase
3. **UI Components** - `<PermissionGuard>` for conditional rendering
4. **Routes** - Route-level permission checks

**See Also**: [RBAC Developer Guide](./RBAC_DEVELOPER_GUIDE.md) for complete permission system documentation.

---

## API Reference

All Foundation entities expose server actions following the pattern:

```typescript
// Create
createXAction(data: CreateXDTO): Promise<ActionResponse<XDTO>>

// Read
getXAction(id: bigint): Promise<ActionResponse<XDTO>>
listXsAction(filters: ListXDTO): Promise<ActionResponse<PaginatedXDTO>>

// Update
updateXAction(id: bigint, data: UpdateXDTO): Promise<ActionResponse<XDTO>>

// Delete
deleteXAction(id: bigint): Promise<ActionResponse<void>>
```

For complete API documentation, see [Foundation API Reference](../api/FOUNDATION_API.md).

---

## Testing Foundation Entities

### Unit Testing Domain Entities

```typescript
import { describe, it, expect } from "vitest";
import { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

describe("OrganizationUnit Entity", () => {
  it("should create a valid organization unit", () => {
    const orgUnit = OrganizationUnit.create({
      name: "IT Department",
      code: "IT",
      unitType: OrganizationUnitType.DEPARTMENT,
      level: 2,
      isActive: true,
    });

    expect(orgUnit.name).toBe("IT Department");
    expect(orgUnit.code).toBe("IT");
    expect(orgUnit.isActive).toBe(true);
  });

  it("should validate code format", () => {
    expect(() => {
      OrganizationUnit.create({
        name: "IT Department",
        code: "invalid code!", // Invalid format
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        isActive: true,
      });
    }).toThrow();
  });
});
```

### Integration Testing Use Cases

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CreateOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization";

describe("CreateOrganizationUnitUseCase", () => {
  let useCase: CreateOrganizationUnitUseCase;

  beforeEach(() => {
    const container = getContainer();
    useCase = container.get(DI_TOKENS.CreateOrganizationUnitUseCase);
  });

  it("should create organization unit successfully", async () => {
    const result = await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: "DEPARTMENT",
      level: 2,
      userId: testUserId,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Engineering");
  });

  it("should prevent duplicate codes", async () => {
    await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: "DEPARTMENT",
      level: 2,
      userId: testUserId,
    });

    await expect(
      useCase.execute({
        name: "Engineering 2",
        code: "ENG", // Duplicate
        unitType: "DEPARTMENT",
        level: 2,
        userId: testUserId,
      }),
    ).rejects.toThrow();
  });
});
```

---

## Next Steps

After completing the Foundation Layer, you're ready to implement Layer 2 (CMDB & Asset Management):

1. **CIClass** - Define CI classes (Computer, Router, VM, Database, etc.)
2. **ConfigurationItem** - Create actual CIs using Foundation entities
3. **CIRelationship** - Build topology graph (depends_on, runs_on, etc.)
4. **Asset** - Financial asset records linked to CIs
5. **AssetModel** - Asset models from vendors
6. **Contract** - Contracts and warranties linked to vendors

**See Also**:

- [Layer 2 Implementation Guide](./LAYER_2_IMPLEMENTATION.md) (Coming Soon)
- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Data Model](../architecture/DATA_MODEL.md)

---

## Troubleshooting

### Common Issues

**Q: OrganizationUnit hierarchy not loading**
A: Check that `parentId` is correctly set and foreign key constraint exists.

**Q: Person creation fails with "email already exists"**
A: Email must be unique across all persons. Check for existing person with same email.

**Q: Cannot delete vendor - "has dependencies"**
A: Vendor cannot be deleted if referenced by assets, contracts, or license products. Remove dependencies first.

**Q: Lifecycle transition not allowed**
A: Check that transition exists in LifecycleTransition table and user has required role.

**Q: Custom field validation fails**
A: Verify `validationRules` JSON matches expected format for the data type.

### Debug Logging

Enable Foundation layer logging:

```typescript
// In .env.local
LOG_LEVEL = debug;
```

Foundation use cases log structured events:

```typescript
logger.info("Creating organization unit", {
  context: "CreateOrganizationUnitUseCase",
  data: { name, code, unitType },
});
```

See [Logging Guide](./LOGGING.md) for complete logging documentation.

---

## Glossary

- **Foundation Layer**: Core reference data shared across all modules (Layer 1)
- **Organization Unit**: Hierarchical organizational structure (Company > BU > Dept > Team)
- **Person**: Organizational employee/contractor record (separate from system User)
- **Role**: Merged RBAC + organizational role entity
- **Location**: Hierarchical geographical/logical location
- **Vendor**: Supplier, manufacturer, or service provider
- **Lifecycle Model**: Reusable state machine definition
- **Lifecycle State**: Individual state within a lifecycle
- **Lifecycle Transition**: Allowed state change with optional approval
- **Field Definition**: Custom attribute definition for dynamic schema
- **Meta-Model**: System for defining structure of other entities

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: TechHub Development Team
