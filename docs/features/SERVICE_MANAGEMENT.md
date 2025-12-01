# Service Management System

**Status**: ✅ Implemented (Layer 2 Entity)
**Version**: 1.2.0
**Last Updated**: 2024-12-01

## Table of Contents

- [Overview](#overview)
- [Business Context](#business-context)
- [Database Schema](#database-schema)
  - [ServiceRelationship Model](#servicerelationship-model)
- [Domain Entities](#domain-entities)
- [Use Cases](#use-cases)
  - [ServiceRelationship Use Cases](#servicerelationship-use-cases)
- [Interface Adapters](#interface-adapters)
- [UI Components](#ui-components)
  - [ServiceDependenciesTab](#servicedependenciestab)
- [Permissions (RBAC)](#permissions-rbac)
- [Seed Data](#seed-data)
- [API Reference](#api-reference)
- [Common Workflows](#common-workflows)
- [Best Practices](#best-practices)

## Overview

The Service Management system provides comprehensive IT Service Management (ITSM) capabilities for tracking all technology services at Barq, including applications, infrastructure, databases, APIs, and more. This is a **Layer 2 entity** providing service catalog management with ownership tracking, technical details, lifecycle management, and asset relationships.

### Key Features

- **Service Catalog**: Central registry of all IT services (~80 services seeded initially)
- **Multiple Owners**: Track Technical, Product, and Business owners (multiple per type)
- **Service Classification**: Type, environment, data confidentiality, business impact, criticality
- **Technical Details**: GitLab repository links, infrastructure location, cloud provider details
- **Lifecycle Management**: Deployment dates, status tracking, patch management, decommission planning
- **Business Alignment**: Map services to business processes
- **Asset Relationships**: Link services to supporting assets (servers, databases, etc.)
- **Service Dependencies**: Track service-to-service relationships with impact analysis
- **Governance**: Compliance tracking and central asset register inclusion

### Entities

The Service Management system consists of 6 main entities:

1. **Service** - Main service catalog entity
2. **ServiceOwnership** - Join table for multiple owners per service
3. **BusinessProcess** - Business process mapping for service alignment
4. **ServiceInfrastructure** - Cloud/on-prem infrastructure details
5. **ServiceAsset** - Many-to-many relationship between services and assets
6. **ServiceRelationship** - Service-to-service dependencies with impact analysis

### Statistics

- **Entities**: 6 models
- **Use Cases**: 33+ use cases across all modules
- **Permissions**: 7 permissions (SERVICES_VIEW, CREATE, UPDATE, DELETE, MANAGE, BUSINESS_PROCESSES_VIEW, MANAGE)
- **Seeded Data**: 25 business processes, 80+ services with full metadata

## Business Context

### About Barq

Barq is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. The Service Management system serves as an internal CMDB and ITAM tool for Barq's Technology operations.

### Regulatory Context

- **SAMA Compliance**: Saudi Central Bank regulatory requirements
- **Data Confidentiality Levels**: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
- **Business Impact Assessment**: Tracks high/medium/low impact services
- **Essential Services**: Flags critical services like Core Banking/Payments

### NDMO Framework

The system implements the NDMO (Network, Data, Monitoring, Operations) framework with three classification dimensions:

1. **Data Confidentiality**: Data sensitivity classification
2. **Business Impact Level**: Impact of service unavailability on business operations
3. **Criticality Level**: Service criticality for essential operations

## Database Schema

### Service Model

Primary entity representing an IT service.

```prisma
model Service {
  id                      String                   @id @default(cuid())

  // Core Identity
  name                    String                   @unique
  serviceType             ServiceType
  description             String?                  @db.Text
  businessPurpose         String?                  @db.Text

  // Technical Details
  gitlabRepoUrl           String?

  // Classification (NDMO Framework)
  dataConfidentiality     DataConfidentiality      @default(INTERNAL)
  businessImpactLevel     BusinessImpactLevel      @default(MEDIUM)
  criticality             CriticalityLevel         @default(MEDIUM)
  isEssentialService      Boolean                  @default(false)

  // Lifecycle
  deploymentDate          DateTime?
  currentStatus           ServiceStatus            @default(PRODUCTION)
  lastPatchDate           DateTime?
  plannedDecommissionDate DateTime?

  // Vendor/Supplier
  vendorId                String?
  vendor                  Vendor?                  @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  slaDetails              Json?

  // Business Alignment
  businessProcessId       String?
  businessProcess         BusinessProcess?         @relation(fields: [businessProcessId], references: [id], onDelete: SetNull)

  // Governance
  isInCentralRegister     Boolean                  @default(true)
  complianceNotes         String?                  @db.Text

  // Metadata
  metadata                Json?

  // Audit
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime                 @updatedAt
  createdBy               String?
  updatedBy               String?

  // Relations
  owners                  ServiceOwnership[]
  infrastructure          ServiceInfrastructure[]
  assets                  ServiceAsset[]

  @@index([serviceType])
  @@index([currentStatus])
  @@index([criticality])
  @@index([businessImpactLevel])
  @@index([vendorId])
  @@index([businessProcessId])
  @@index([isEssentialService])
  @@index([plannedDecommissionDate])
  @@map("services")
}
```

### ServiceType Enum

Classifies services by their technical type.

```prisma
enum ServiceType {
  APPLICATION      // Software applications (Core Wallet, Mobile iOS)
  SERVER           // Physical/virtual servers
  NETWORK          // Network infrastructure
  DATABASE         // Database systems (PostgreSQL, Redis)
  ENDPOINT         // End-user devices
  CLOUD_SERVICE    // Cloud-based services
  API              // API services
  MIDDLEWARE       // Integration middleware
  STORAGE          // Storage systems
  OTHER            // Other service types
}
```

### ServiceStatus Enum

Tracks the current operational status of a service.

```prisma
enum ServiceStatus {
  PRODUCTION       // Live in production
  UAT              // User acceptance testing
  DR               // Disaster recovery
  DEVELOPMENT      // Development environment
  RETIRED          // Decommissioned
  PLANNED          // Not yet deployed
}
```

### ServiceOwnership Model

Join table supporting multiple owners per service across three ownership types.

```prisma
model ServiceOwnership {
  id            String        @id @default(cuid())
  serviceId     String
  service       Service       @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  personId      String
  person        Person        @relation(fields: [personId], references: [id], onDelete: Cascade)
  ownershipType OwnershipType
  isPrimary     Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([serviceId, personId, ownershipType])
  @@index([serviceId])
  @@index([personId])
  @@index([ownershipType])
  @@index([isPrimary])
  @@map("service_ownerships")
}

enum OwnershipType {
  TECHNICAL      // Technical Owner (engineers, architects)
  PRODUCT        // Product Owner (product managers)
  BUSINESS       // Business Owner (business stakeholders)
}
```

### BusinessProcess Model

Maps services to business processes for business-IT alignment.

```prisma
model BusinessProcess {
  id          String    @id @default(cuid())
  code        String    @unique
  name        String
  description String?   @db.Text
  category    String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  services    Service[]

  @@index([code])
  @@index([category])
  @@map("business_processes")
}
```

### ServiceInfrastructure Model

Stores cloud/on-prem infrastructure details for services.

```prisma
model ServiceInfrastructure {
  id                   String          @id @default(cuid())
  serviceId            String
  service              Service         @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  location             ServiceLocation
  cloudProvider        String?
  compartment          String?
  project              String?
  region               String?
  ipAddress            String?
  hostname             String?
  backupEnabled        Boolean         @default(false)
  backupSchedule       String?
  lastBackupDate       DateTime?
  cloudProviderDetails Json?
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@index([serviceId])
  @@index([location])
  @@index([cloudProvider])
  @@index([region])
  @@map("service_infrastructure")
}

enum ServiceLocation {
  ON_PREM
  OCI_CLOUD
  GCP_CLOUD
  AWS_CLOUD
  HYBRID
}
```

### ServiceAsset Model

Many-to-many relationship linking services to supporting assets.

```prisma
model ServiceAsset {
  id           String            @id @default(cuid())
  serviceId    String
  service      Service           @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  assetId      String?
  asset        Asset?            @relation(fields: [assetId], references: [id], onDelete: SetNull)
  relationship AssetRelationship
  description  String?           @db.Text
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([serviceId])
  @@index([assetId])
  @@index([relationship])
  @@map("service_assets")
}

enum AssetRelationship {
  HOSTS          // Asset hosts the service (server runs application)
  SUPPORTS       // Asset supports the service (database for app)
  DEPENDS_ON     // Service depends on asset
  MONITORS       // Asset monitors the service
  BACKS_UP       // Asset backs up the service
}
```

### ServiceRelationship Model

Tracks dependencies between services for impact analysis.

```prisma
model ServiceRelationship {
  id               String                  @id @default(cuid())
  fromServiceId    String
  toServiceId      String
  relationshipType ServiceRelationshipType
  isCritical       Boolean                 @default(false)
  description      String?                 @db.Text
  metadata         Json?
  isActive         Boolean                 @default(true)
  validFrom        DateTime                @default(now())
  validTo          DateTime?
  createdAt        DateTime                @default(now())
  updatedAt        DateTime                @updatedAt

  fromService Service @relation("ServiceRelationshipFrom", fields: [fromServiceId], references: [id], onDelete: Cascade)
  toService   Service @relation("ServiceRelationshipTo", fields: [toServiceId], references: [id], onDelete: Cascade)

  @@unique([fromServiceId, toServiceId, relationshipType])
  @@index([fromServiceId])
  @@index([toServiceId])
  @@index([relationshipType])
  @@index([isCritical])
  @@index([isActive])
  @@map("service_relationships")
}

enum ServiceRelationshipType {
  DEPENDS_ON            // Service requires target to function
  CALLS                 // Service makes API/network calls to target
  PUBLISHES_EVENTS_TO   // Service publishes events to target
  CONSUMES_EVENTS_FROM  // Service consumes events from target
  BACKUP_FOR            // Service is a backup/failover for target
}
```

#### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `DEPENDS_ON` | Hard dependency - service fails without target | Mobile App → Auth Service |
| `CALLS` | API/network communication | Customer Portal → Core API |
| `PUBLISHES_EVENTS_TO` | Event producer relationship | Payment Service → Kafka |
| `CONSUMES_EVENTS_FROM` | Event consumer relationship | Notification Service → Kafka |
| `BACKUP_FOR` | Failover/DR relationship | DR Site Service → Prod Service |

#### Impact Analysis

The ServiceRelationship entity enables recursive impact analysis using PostgreSQL's WITH RECURSIVE CTE. When a service fails, the system can identify all affected services up to 3 levels deep (configurable).

## Domain Entities

### Service Entity

**Location**: `src/core/domain/entities/service.entity.ts`

#### Business Rules

1. **Name Validation**: 3-200 characters, unique across all services
2. **Essential Service Rule**: Essential services MUST have Critical or High criticality
3. **Restricted Data Rule**: Services with Restricted data should have SLA details (warning, not blocking)
4. **Retirement Rule**: Cannot retire essential services in PRODUCTION status

#### Key Methods

```typescript
class Service {
  // Factory methods
  static create(props: CreateServiceProps): Service
  static reconstitute(props: ServiceProps): Service

  // Business logic
  update(updates: Partial<ServiceProps>, updatedBy?: string): void
  retire(reason?: string): void
  canBeRetired(): boolean

  // Status checks
  isActive(): boolean
  isRetired(): boolean
  getDaysUntilDecommission(): number | null
  isRetiringSoon(daysThreshold?: number): boolean

  // Validation
  static validateName(name: string): void
  static validateServiceType(serviceType: ServiceType): void
}
```

#### Computed Properties

- **isActive()**: Returns true if status is PRODUCTION, UAT, DR, or DEVELOPMENT
- **isRetired()**: Returns true if status is RETIRED
- **getDaysUntilDecommission()**: Calculates days until planned decommission date
- **isRetiringSoon()**: Returns true if decommission is within threshold (default 90 days)

### BusinessProcess Entity

**Location**: `src/core/domain/entities/business-process.entity.ts`

#### Business Rules

1. **Code Format**: UPPERCASE_UNDERSCORE format (e.g., "DIGITAL_PAYMENTS")
2. **Code Length**: 2-100 characters
3. **Name Length**: 2-200 characters
4. **Code Uniqueness**: Enforced at database level

#### Key Methods

```typescript
class BusinessProcess {
  static create(props: CreateBusinessProcessProps): BusinessProcess
  static reconstitute(props: BusinessProcessProps): BusinessProcess
  update(updates: {...}): void
  static validateCode(code: string): void
  static validateName(name: string): void
}
```

### ServiceInfrastructure Entity

**Location**: `src/core/domain/entities/service-infrastructure.entity.ts`

#### Business Rules

1. **Cloud Provider Rule**: Cloud services (OCI/GCP/AWS) MUST have cloudProvider specified
2. **IP Address Validation**: IPv4 format with octets 0-255
3. **Hostname Validation**: Standard hostname format (max 253 chars)

#### Key Methods

```typescript
class ServiceInfrastructure {
  static create(props: CreateServiceInfrastructureProps): ServiceInfrastructure
  static reconstitute(props: ServiceInfrastructureProps): ServiceInfrastructure
  update(updates: Partial<ServiceInfrastructureProps>): void
  enableBackup(schedule: string): void
  disableBackup(): void
  recordBackup(date?: Date): void
  isCloudBased(): boolean
}
```

## Use Cases

### Service Use Cases

**Location**: `src/core/use-cases/service/`

All use cases follow Clean Architecture patterns with dependency injection.

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `CreateServiceUseCase` | Create new service with validation | SERVICES_CREATE |
| `GetServiceUseCase` | Retrieve service by ID with relations | SERVICES_VIEW |
| `ListServicesUseCase` | List all services with pagination | SERVICES_VIEW |
| `UpdateServiceUseCase` | Update service details | SERVICES_UPDATE |
| `DeleteServiceUseCase` | Delete service (checks dependencies) | SERVICES_DELETE |
| `SearchServicesUseCase` | Advanced search with filters | SERVICES_VIEW |
| `GetEssentialServicesUseCase` | List critical services | SERVICES_VIEW |
| `GetRetiringServicesUseCase` | Services with upcoming decommission | SERVICES_VIEW |
| `RetireServiceUseCase` | Mark service as retired | SERVICES_MANAGE |

### ServiceOwnership Use Cases

**Location**: `src/core/use-cases/service-ownership/`

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `AddServiceOwnerUseCase` | Add owner to service | SERVICES_MANAGE |
| `RemoveServiceOwnerUseCase` | Remove owner from service | SERVICES_MANAGE |
| `GetServiceOwnersUseCase` | Get all owners grouped by type | SERVICES_VIEW |

### BusinessProcess Use Cases

**Location**: `src/core/use-cases/business-process/`

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `CreateBusinessProcessUseCase` | Create business process | BUSINESS_PROCESSES_MANAGE |
| `GetBusinessProcessUseCase` | Get process by ID | BUSINESS_PROCESSES_VIEW |
| `ListBusinessProcessesUseCase` | List all processes | BUSINESS_PROCESSES_VIEW |
| `UpdateBusinessProcessUseCase` | Update process | BUSINESS_PROCESSES_MANAGE |
| `DeleteBusinessProcessUseCase` | Delete process | BUSINESS_PROCESSES_MANAGE |

### ServiceInfrastructure Use Cases

**Location**: `src/core/use-cases/service-infrastructure/`

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `CreateServiceInfrastructureUseCase` | Add infrastructure details | SERVICES_MANAGE |
| `UpdateServiceInfrastructureUseCase` | Update infrastructure | SERVICES_MANAGE |
| `GetServiceInfrastructureUseCase` | Get infrastructure details | SERVICES_VIEW |

### ServiceAsset Use Cases

**Location**: `src/core/use-cases/service-asset/`

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `LinkServiceToAssetUseCase` | Link service to asset | SERVICES_MANAGE |
| `UnlinkServiceFromAssetUseCase` | Unlink asset | SERVICES_MANAGE |
| `GetServiceAssetsUseCase` | Get assets for service | SERVICES_VIEW |
| `GetAssetServicesUseCase` | Get services for asset | SERVICES_VIEW |

### ServiceRelationship Use Cases

**Location**: `src/core/use-cases/service-relationship/`

| Use Case | Description | Permission Required |
|----------|-------------|---------------------|
| `CreateServiceRelationshipUseCase` | Create dependency between services | SERVICES_MANAGE |
| `GetServiceRelationshipUseCase` | Get relationship by ID | SERVICES_VIEW |
| `UpdateServiceRelationshipUseCase` | Update relationship details | SERVICES_MANAGE |
| `DeleteServiceRelationshipUseCase` | Delete relationship | SERVICES_MANAGE |
| `ListServiceRelationshipsUseCase` | List relationships with filters | SERVICES_VIEW |
| `GetServiceDependenciesUseCase` | Get services this service depends on | SERVICES_VIEW |
| `GetServiceDependentsUseCase` | Get services that depend on this service | SERVICES_VIEW |
| `GetImpactedServicesUseCase` | Recursive impact analysis (3 levels) | SERVICES_VIEW |

## Interface Adapters

### DTOs (Data Transfer Objects)

**Location**: `src/interface-adapters/dtos/generated/service.dto.ts`

All DTOs use Zod for runtime validation.

```typescript
// Create Service DTO
export const CreateServiceSchema = z.object({
  name: z.string().min(3).max(200),
  serviceType: z.nativeEnum(ServiceType),
  description: z.string().max(5000).optional().nullable(),
  businessPurpose: z.string().max(2000).optional().nullable(),
  gitlabRepoUrl: z.string().url().optional().nullable(),
  dataConfidentiality: z.nativeEnum(DataConfidentiality).default("INTERNAL"),
  businessImpactLevel: z.nativeEnum(BusinessImpactLevel).default("MEDIUM"),
  criticality: z.nativeEnum(CriticalityLevel).default("MEDIUM"),
  isEssentialService: z.boolean().default(false),
  // ... additional fields
});

export type CreateServiceDTO = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDTO = Partial<CreateServiceDTO>;
```

### Presenters

**Location**: `src/interface-adapters/presenters/service.presenter.ts`

Transforms domain entities to presentation DTOs with computed fields.

```typescript
export interface ServiceDTO {
  // All entity fields
  id: string;
  name: string;
  // ... other fields

  // Computed fields
  isActive: boolean;
  isRetired: boolean;
  daysUntilDecommission: number | null;
  isRetiringSoon: boolean;

  // Enriched data (optional)
  vendorName?: string;
  businessProcessName?: string;
}

export function presentService(service: Service, enrichment?: {...}): ServiceDTO
```

### Controllers (Server Actions)

All controllers are server actions with permission checks, organized by domain responsibility following SOLID principles.

#### Service Controller
**Location**: `src/interface-adapters/controllers/service.controller.ts`

Core CRUD operations for services.

```typescript
export async function createServiceAction(data: CreateServiceDTO): Promise<ActionResponse<ServiceDTO>>
export async function getServiceAction(id: string): Promise<ActionResponse<ServiceDTO>>
export async function listServicesAction(): Promise<ActionResponse<ServiceDTO[]>>
export async function updateServiceAction(id: string, data: UpdateServiceDTO): Promise<ActionResponse<ServiceDTO>>
export async function deleteServiceAction(id: string): Promise<ActionResponse<void>>
export async function searchServicesAction(query: string): Promise<ActionResponse<ServiceDTO[]>>
export async function getEssentialServicesAction(): Promise<ActionResponse<ServiceDTO[]>>
export async function getRetiringServicesAction(daysThreshold?: number): Promise<ActionResponse<ServiceDTO[]>>
export async function retireServiceAction(id: string, reason?: string): Promise<ActionResponse<ServiceDTO>>
```

#### Service Ownership Controller
**Location**: `src/interface-adapters/controllers/service-ownership.controller.ts`

Manages service ownership relationships.

```typescript
export async function addServiceOwnerAction(data: AddServiceOwnerDTO): Promise<ActionResponse<void>>
export async function removeServiceOwnerAction(serviceId: string, personId: string, ownershipType: OwnershipType): Promise<ActionResponse<void>>
export async function setServicePrimaryOwnerAction(data: SetPrimaryOwnerDTO): Promise<ActionResponse<void>>
export async function getServiceOwnersAction(serviceId: string): Promise<ActionResponse<ServiceOwnerDTO[]>>
```

#### Service Infrastructure Controller
**Location**: `src/interface-adapters/controllers/service-infrastructure.controller.ts`

Manages service infrastructure details.

```typescript
export async function createServiceInfrastructureAction(data: CreateServiceInfrastructureDTO): Promise<ActionResponse<ServiceInfrastructureDTO>>
export async function updateServiceInfrastructureAction(id: string, data: UpdateServiceInfrastructureDTO): Promise<ActionResponse<ServiceInfrastructureDTO>>
export async function getServiceInfrastructureAction(serviceId: string): Promise<ActionResponse<ServiceInfrastructureDTO | null>>
```

#### Service Asset Controller
**Location**: `src/interface-adapters/controllers/service-asset.controller.ts`

Manages service-to-asset relationships.

```typescript
export async function linkServiceToAssetAction(data: LinkServiceToAssetDTO): Promise<ActionResponse<void>>
export async function unlinkServiceFromAssetAction(id: string): Promise<ActionResponse<void>>
export async function getServiceAssetsAction(serviceId: string): Promise<ActionResponse<ServiceAssetDTO[]>>
export async function getAssetServicesAction(assetId: string): Promise<ActionResponse<ServiceAssetDTO[]>>
```

### Asset Detail Integration

The Asset detail page includes a **Services tab** (permission-gated) that displays all services linked to that asset:

- **Component**: `src/components/assets/asset-services-tab.tsx`
- **Controller Action**: `getAssetServicesAction(assetId)`
- **Permission Required**: `SERVICES_VIEW`
- Shows: Service name (linked to service detail page), relationship type badge, description
- Relationship badges: HOSTS (default), DEPENDS_ON (secondary), USES (outline), SUPPORTS (outline)

#### Service Relationship Controller
**Location**: `src/interface-adapters/controllers/service-relationship.controller.ts`

Manages service-to-service dependencies and impact analysis.

```typescript
export async function createServiceRelationshipAction(data: CreateServiceRelationshipDTO): Promise<ActionResponse<ServiceRelationshipDTO>>
export async function getServiceRelationshipAction(id: string): Promise<ActionResponse<ServiceRelationshipDTO>>
export async function updateServiceRelationshipAction(id: string, data: UpdateServiceRelationshipDTO): Promise<ActionResponse<ServiceRelationshipDTO>>
export async function deleteServiceRelationshipAction(id: string): Promise<ActionResponse<void>>
export async function listServiceRelationshipsAction(serviceId?: string, relationshipType?: ServiceRelationshipType): Promise<ActionResponse<ServiceRelationshipDTO[]>>
export async function getServiceDependenciesAction(serviceId: string): Promise<ActionResponse<ServiceRelationshipDTO[]>>
export async function getServiceDependentsAction(serviceId: string): Promise<ActionResponse<ServiceRelationshipDTO[]>>
export async function getImpactedServicesAction(serviceId: string, maxDepth?: number): Promise<ActionResponse<ImpactedServiceDTO[]>>
```

## UI Components

### Core Components

#### ServicesTable

**Location**: `src/components/services/services-table.tsx`

**Features**:
- List view with sorting and filtering
- Columns: Name, Type, Status, Criticality, Owners, Vendor, Last Patch
- Status badges with color coding
- Essential Service indicator
- Actions: View, Edit, Delete, Manage Owners

#### ServiceForm

**Location**: `src/components/services/service-form.tsx`

**Features**:
- Multi-step wizard: Basic Info → Classification → Lifecycle → Infrastructure
- Dropdowns: Service type, status, criticality, vendor, business process
- Date pickers: Deployment, last patch, planned decommission
- GitLab URL validation
- JSON editors for SLA details and metadata

**Reusable components available** (see [service-form-fields.tsx](../../src/components/services/service-form-fields.tsx)):
- `EnumSelectField` - Select with enum values and auto-formatting
- `DateField` - Date input with proper value handling
- `CheckboxField` - Checkbox with label and description
- `TextareaField` - Textarea with null/undefined handling
- `TextField` - Text input with type support (email, URL, number)

#### ServiceDetailView

**Location**: `src/components/services/service-detail-view.tsx`

**Architecture**: Refactored using DRY/SOLID principles (see [REFACTORING_PATTERNS.md](../guides/REFACTORING_PATTERNS.md#pattern-7-reusable-component-library))

**Features**:
- Tabs: Overview, Owners, Infrastructure, Assets, Dependencies, Health & SLA (conditional), History
- **Overview Tab**:
  - Basic Information: Service type, classification (data confidentiality, business impact, criticality), deployment date
  - **Service Ownership Card** (✅ v1.2.0): Visual display of service owners
    - Primary Business Owner with blue badge and contact info
    - Primary Technical Owner with purple badge and contact info
    - Additional Owners list with role badges
    - Empty state when no owners assigned
  - Technical Details: GitLab repository, health check URL, SLA contacts
  - Lifecycle Information: Current status, planned decommission, vendor, business process
- Owners: Full ownership management with add/remove/primary designation
- Infrastructure: Location, cloud details, IP/hostname, backup status
- Assets: Linked assets with relationship type
- Dependencies: Service-to-service relationships with impact analysis

**Extracted Components**:
- **[service-detail-fields.tsx](../../src/components/services/service-detail-fields.tsx)** - Reusable display components:
  - `DetailField` - Standard key-value display
  - `DetailDateField` - Formatted date display
  - `DetailLinkField` - Clickable links with fallback
  - `ConditionalDetailField` - Only renders if value exists
- **[service-action-dialogs.tsx](../../src/components/services/service-action-dialogs.tsx)** - Unified dialog:
  - `ServiceActionDialog` - Configuration-driven delete/retire dialogs

**Extracted Hooks**:
- **[use-service-actions.ts](../../src/hooks/use-service-actions.ts)** - State management for service actions (delete, retire)

**Extracted Utilities**:
- **[service-display-utils.ts](../../src/lib/services/service-display-utils.ts)** - Pure utility functions:
  - `getStatusBadgeVariant()` - Badge variant for service status
  - `getCriticalityBadgeVariant()` - Badge variant for criticality level
  - `groupOwnersByType()` - Group owners by ownership type
  - `formatServiceDate()` - Format date strings
  - `formatServiceDateTime()` - Format datetime strings
  - `formatEnumValue()` - Format SCREAMING_SNAKE_CASE to readable text

**Metrics**: Reduced from 617 lines to 443 lines (28% reduction) through component extraction

### ServiceOwnersManager

**Location**: `src/components/services/service-owners-manager.tsx`

**Features**:
- Grouped by ownership type (Technical, Product, Business)
- Add owner: Person selector + Type selector + Primary checkbox
- Remove owner button
- Primary owner indicator

### ServiceInfrastructureForm

**Location**: `src/components/services/service-infrastructure-form.tsx`

**Features**:
- Location dropdown (On-Prem, OCI, GCP, AWS, Hybrid)
- Conditional fields based on location
- Cloud: Compartment, Project, Region
- Network: IP address, hostname
- Backup: Enable toggle, schedule dropdown, last backup date

### ServiceAssetLinker

**Location**: `src/components/services/service-asset-linker.tsx`

**Features**:
- Asset search/selector
- Relationship type dropdown (HOSTS, SUPPORTS, DEPENDS_ON, MONITORS, BACKS_UP)
- Description text area
- Supports null asset for third-party services

### ServiceDependenciesTab

**Location**: `src/components/services/dependencies/service-dependencies-tab.tsx`

**Features**:
- **Impact Analysis Card**: Shows services that would be affected if this service goes down (3 levels deep)
- **Dependencies Table**: Services this service depends on (outgoing)
- **Dependents Table**: Services that depend on this service (incoming)
- Add/Delete dependency relationships
- Relationship type badges (DEPENDS_ON, CALLS, PUBLISHES_EVENTS_TO, etc.)
- Critical dependency indicators

### ServiceRelationshipForm

**Location**: `src/components/services/dependencies/service-relationship-form.tsx`

**Features**:
- Target service selector (excludes current service)
- Relationship type dropdown with descriptions
- Critical dependency checkbox
- Description text area
- Dialog-based form with validation

## Permissions (RBAC)

### Permission Keys

**Location**: `src/core/domain/value-objects/permission-key.ts`

```typescript
export const PERMISSIONS = {
  // Services
  SERVICES_VIEW: "services:view",
  SERVICES_CREATE: "services:create",
  SERVICES_UPDATE: "services:update",
  SERVICES_DELETE: "services:delete",
  SERVICES_MANAGE: "services:manage",

  // Business Processes
  BUSINESS_PROCESSES_VIEW: "business_processes:view",
  BUSINESS_PROCESSES_MANAGE: "business_processes:manage",
} as const;
```

### Permission Matrix

| Role | VIEW | CREATE | UPDATE | DELETE | MANAGE |
|------|------|--------|--------|--------|--------|
| System Administrator | ✅ | ✅ | ✅ | ✅ | ✅ |
| IT Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| IT Staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Developer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Business User | ✅* | ❌ | ❌ | ❌ | ❌ |

*Business User can only view services they own

### Permission Checks

All server actions enforce permission checks:

```typescript
export async function createServiceAction(data: CreateServiceDTO) {
  await requirePermission(PERMISSIONS.SERVICES_CREATE);
  // ... action logic
}
```

## Seed Data

### Business Processes

**Location**: `src/infrastructure/database/prisma/seed-config.ts`

25 business processes are seeded covering all business domains:

- Core Banking: DIGITAL_WALLET, DIGITAL_PAYMENTS, CORE_ACCOUNTING
- Channels: MOBILE_BANKING, BUSINESS_PORTAL, CUSTOMER_PORTAL
- Infrastructure: IDENTITY_MGMT, NETWORK_MGMT, DATA_MGMT
- Support: INCIDENT_MGMT, CHANGE_MGMT, PROBLEM_MGMT

### Services

**Location**: `src/infrastructure/database/prisma/seed-config.ts`

80+ services are seeded with full metadata:

- **Authentication**: Active Directory, Keycloak, Auth Service
- **Core Banking**: Core Wallet, Core Payments, Core Accounting
- **Channels**: Mobile iOS, Mobile Android, Business Portal
- **Infrastructure**: Airflow, Redis, PostgreSQL, Kafka
- **Third-party**: eMcREY, HyperPay, Oracle CRM, Odoo ERP
- **Developer Tools**: Tyk, Unleash, Retool, Redash

Each service includes:
- Full classification (type, status, criticality, confidentiality)
- Multiple owners (Technical, Product, Business)
- Infrastructure details (location, cloud provider, region)
- Business process mapping
- Vendor linkage (where applicable)

## API Reference

### Service Repository Interface

**Location**: `src/core/repositories/service.repository.interface.ts`

```typescript
export interface IServiceRepository {
  // CRUD
  create(service: Service): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findAll(limit?: number, offset?: number): Promise<Service[]>;
  update(service: Service): Promise<Service>;
  delete(id: string): Promise<void>;

  // Specialized queries
  findByType(serviceType: ServiceType): Promise<Service[]>;
  findByStatus(status: ServiceStatus): Promise<Service[]>;
  findByCriticality(criticality: CriticalityLevel): Promise<Service[]>;
  findEssentialServices(): Promise<Service[]>;
  findByOwner(personId: string, ownershipType?: OwnershipType): Promise<Service[]>;
  findByVendor(vendorId: string): Promise<Service[]>;
  findByBusinessProcess(processId: string): Promise<Service[]>;
  findRetiringSoon(daysAhead: number): Promise<Service[]>;

  // Search
  search(options: ServiceSearchOptions): Promise<Service[]>;

  // Counting
  count(): Promise<number>;
  countByType(): Promise<Map<ServiceType, number>>;
  countByCriticality(): Promise<Map<CriticalityLevel, number>>;

  // Validation
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}
```

## Common Workflows

### Creating a New Service

```typescript
// 1. User fills out ServiceForm
// 2. Form submission calls createServiceAction
const result = await createServiceAction({
  name: "Customer Portal API",
  serviceType: "API",
  description: "REST API for customer portal",
  dataConfidentiality: "CONFIDENTIAL",
  businessImpactLevel: "HIGH",
  criticality: "HIGH",
  isEssentialService: true,
  currentStatus: "PRODUCTION",
  businessProcessId: "...",
});

// 3. Add owners
await addServiceOwnerAction({
  serviceId: result.data.id,
  personId: "...",
  ownershipType: "TECHNICAL",
  isPrimary: true,
});

// 4. Add infrastructure details
await createServiceInfrastructureAction({
  serviceId: result.data.id,
  location: "OCI_CLOUD",
  cloudProvider: "OCI",
  region: "Riyadh",
  compartment: "prod-api",
});

// 5. Link to assets
await linkServiceToAssetAction({
  serviceId: result.data.id,
  assetId: "...",
  relationship: "HOSTS",
  description: "Hosted on production API server",
});
```

### Retiring a Service

```typescript
// 1. Check if service can be retired
const service = await getServiceAction(serviceId);
if (!service.data.isActive) {
  // Service is already retired or planned
  return;
}

// 2. Set planned decommission date
await updateServiceAction(serviceId, {
  plannedDecommissionDate: new Date("2025-12-31"),
});

// 3. When ready to retire
await retireServiceAction(serviceId, "Service migrated to new platform");
```

### Searching Services

```typescript
// Search by multiple criteria
const result = await searchServicesAction({
  serviceType: "APPLICATION",
  currentStatus: "PRODUCTION",
  criticality: "CRITICAL",
  isEssentialService: true,
});
```

## Best Practices

### Service Naming

- Use descriptive names: "Core Wallet Service" not "CWS"
- Include environment if multiple instances: "Customer Portal API (Prod)"
- Avoid abbreviations unless standard (e.g., "API", "DB")

### Ownership Management

- Always assign at least one primary owner per type
- Technical owners should be engineers/architects responsible for maintenance
- Product owners should be product managers defining features
- Business owners should be stakeholders with budget/decision authority

### Classification Guidelines

**Essential Services**:
- Mark as essential ONLY if critical for core business (banking/payments)
- Essential services MUST have Critical or High criticality

**Data Confidentiality**:
- RESTRICTED: PII, financial data, authentication credentials
- CONFIDENTIAL: Internal business data, customer info
- INTERNAL: Internal-only, non-sensitive
- PUBLIC: Publicly accessible information

**Business Impact**:
- HIGH: Service outage causes immediate business disruption
- MEDIUM: Service outage causes inconvenience but not critical
- LOW: Service outage has minimal business impact

### Infrastructure Details

- Always specify location (On-Prem vs Cloud)
- For cloud services, populate compartment/project and region
- Track IP addresses and hostnames for on-prem services
- Enable backup tracking for critical services

### Lifecycle Management

- Set deployment date when service goes live
- Track last patch date for security compliance
- Set planned decommission date when retiring services
- Use RETIRED status only after full decommissioning

### Asset Linking

- Link services to all supporting assets:
  - HOSTS: Servers running the application
  - SUPPORTS: Databases, storage, etc.
  - DEPENDS_ON: External dependencies
  - MONITORS: Monitoring tools
  - BACKS_UP: Backup systems

### Performance Considerations

- Use pagination for large service lists (default 50 per page)
- Include relations strategically (avoid N+1 queries)
- Use search filters to narrow results
- Consider caching for frequently accessed service lists

## Future Enhancements

### Planned Features (Post-MVP)

- **Service Dashboard**: Analytics on service distribution, criticality, ownership
- **Service Health Monitoring**: Integration with monitoring tools (Prometheus, DataDog)
- ~~**Dependency Mapping**: Service-to-service dependencies (microservices)~~ ✅ **Implemented** (ServiceRelationship)
- **Change Management**: Track service changes, deployments, incidents
- **Compliance Automation**: Auto-generate compliance reports (SAMA, ISO 27001)
- **Cost Tracking**: Link services to financial costs (cloud spend, licensing)
- **SLA Monitoring**: Track vendor SLA compliance with alerts
- **Lifecycle Automation**: Auto-retire services past decommission date

### Architecture Improvements

- Full-text search with Elasticsearch
- Service templates for common service types
- Approval workflows for service creation/retirement
- Bulk operations (CSV import, bulk update)
- API integration (GitLab, Jira, ServiceNow)

## Recent Updates

### Version 1.2.0 (December 1, 2024)

**✅ Service Ownership Display Enhancement**

- Added dedicated **Service Ownership Card** in the Overview tab
- Visual distinction between ownership types:
  - Primary Business Owner: Blue badge with user icon
  - Primary Technical Owner: Purple badge with user icon
  - Additional Owners: Listed with role badges
- Displays contact information (name and email) for each owner
- Empty state with icon when no owners are assigned
- Complements the existing Owners tab (which provides full CRUD management)

**Purpose**: Improve service ownership visibility without navigating to the Owners tab. This helps stakeholders quickly identify who to contact for service-related questions.

**Impact**: Better governance and faster incident response by making ownership information immediately visible.

**✅ Enhanced Service Domain Model**

- Added three new fields to the Service entity:
  - `url`: Primary service URL (web interface, API endpoint, etc.)
  - `supportContact`: General support contact information (email or phone)
  - `supportHours`: Support availability (e.g., "24/7", "Mon-Fri 9AM-5PM SAT", "Business Hours")
- Full stack implementation across all layers:
  - Database schema and migration
  - Domain entity with validation and getters
  - DTOs with Zod validation
  - Presenter mapping
  - UI display in service detail Overview tab
- Fields are optional and displayed using `ConditionalDetailField` component

**Purpose**: Provide more complete service information for operations teams to quickly access support details and service URLs without needing external documentation.

**Impact**: Improved operational efficiency by consolidating essential service contact and access information in the central service catalog.

## Related Documentation

- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Feature implementation guide
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Clean Architecture patterns
- [ENTITY_REGISTRY.md](./ENTITY_REGISTRY.md) - Business entity registry
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) - Schema conventions
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission implementation
- [SERVICE_SLA_HEALTH_MONITORING.md](./SERVICE_SLA_HEALTH_MONITORING.md) - Health & SLA features

## Support

For questions or issues:
- Check existing documentation first
- Review seed data examples in `seed-config.ts`
- Examine use case implementations for patterns
- Refer to similar Layer 2 entities (Assets, Warranties, Maintenance)
