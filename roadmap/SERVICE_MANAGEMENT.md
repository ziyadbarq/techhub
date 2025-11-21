# Service Management System

**Status**: Planned
**Priority**: High
**Complexity**: Large (60-80 files across all layers)
**Estimated Effort**: 5-7 days

## Overview

Implement comprehensive IT Service Management (ITSM) as a Layer 2 entity to track all technology services at Barq (applications, infrastructure, databases, APIs, etc.) with ownership, technical details, lifecycle management, and asset relationships.

## Business Requirements

### Core Requirements

1. **Service Catalog**: Central registry of all IT services (~80 services initially)
2. **Multiple Owners**: Track Technical, Product, and Business owners (multiple per type)
3. **Service Classification**:
   - Type: Application, Server, Network, Database, Endpoint, Cloud Service, API, Middleware, Storage
   - Environment: Production, UAT, DR, Development
   - Data Confidentiality: Public, Internal, Confidential, Restricted
   - Business Impact Level: High, Medium, Low (from BIA)
   - Criticality: Critical, High, Medium, Low (for essential services like Core Banking/Payments)
4. **Technical Details**:
   - GitLab repository links
   - Infrastructure location (On-Prem, OCI Cloud, GCP Cloud, Hybrid)
   - Cloud provider details (Compartment, Project, Region, IP)
5. **Lifecycle Management**:
   - Deployment date, current status, last patch date
   - Planned decommission date
   - Vendor/supplier with SLA details
6. **Business Alignment**:
   - Map to business processes (e.g., "Core Wallet DB" → "Digital Payments")
   - Link to supporting assets (servers, databases, etc.)
7. **Governance**: Inclusion in Central Asset Register, compliance tracking

### Initial Data

Seed system with ~80 existing services including:

- Authentication services (Auth, Active Directory, Keycloak)
- Core banking (Core Wallet, Core Payments, Core Accounting)
- Channels (Mobile iOS/Android, Business Portal, Customer Portal)
- Infrastructure (Airflow, Redis, PostgreSQL, Kafka)
- Third-party integrations (eMcREY, HyperPay, Oracle CRM, Odoo ERP)
- Developer tools (Tyk, Unleash, Retool, Redash)

## Technical Design

### Database Schema Changes

#### 1. Service (Main Entity)

```prisma
model Service {
  id                    String    @id @default(cuid())

  // Core Identity
  name                  String    @unique  // "Core Wallet Service"
  serviceType           ServiceType
  description           String?   @db.Text
  businessPurpose       String?   @db.Text  // What business need it serves

  // Technical Details
  gitlabRepoUrl         String?

  // Classification (NDMO Framework)
  dataConfidentiality   DataConfidentiality @default(INTERNAL)
  businessImpactLevel   BusinessImpactLevel @default(MEDIUM)
  criticality           CriticalityLevel @default(MEDIUM)
  isEssentialService    Boolean   @default(false)  // Core Banking/Payments flag

  // Lifecycle
  deploymentDate        DateTime?
  currentStatus         ServiceStatus @default(PRODUCTION)
  lastPatchDate         DateTime?
  plannedDecommissionDate DateTime?

  // Vendor/Supplier
  vendorId              String?
  vendor                Vendor?   @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  slaDetails            Json?     // SLA terms, support contract details

  // Business Alignment
  businessProcessId     String?
  businessProcess       BusinessProcess? @relation(fields: [businessProcessId], references: [id], onDelete: SetNull)

  // Governance
  isInCentralRegister   Boolean   @default(true)
  complianceNotes       String?   @db.Text

  // Metadata
  metadata              Json?     // Extensible for custom attributes

  // Audit
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdBy             String?
  updatedBy             String?

  // Relations
  owners                ServiceOwnership[]
  infrastructure        ServiceInfrastructure[]
  assets                ServiceAsset[]

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

enum ServiceType {
  APPLICATION
  SERVER
  NETWORK
  DATABASE
  ENDPOINT
  CLOUD_SERVICE
  API
  MIDDLEWARE
  STORAGE
  OTHER
}

enum ServiceStatus {
  PRODUCTION
  UAT
  DR
  DEVELOPMENT
  RETIRED
  PLANNED
}

enum DataConfidentiality {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  RESTRICTED
}

enum BusinessImpactLevel {
  HIGH
  MEDIUM
  LOW
}

enum CriticalityLevel {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}
```

#### 2. ServiceOwnership (Join Table for Multiple Owners)

```prisma
model ServiceOwnership {
  id            String    @id @default(cuid())

  serviceId     String
  service       Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  personId      String
  person        Person    @relation(fields: [personId], references: [id], onDelete: Cascade)

  ownershipType OwnershipType
  isPrimary     Boolean   @default(false)  // One primary owner per type

  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([serviceId, personId, ownershipType])
  @@index([serviceId])
  @@index([personId])
  @@index([ownershipType])
  @@index([isPrimary])
  @@map("service_ownerships")
}

enum OwnershipType {
  TECHNICAL      // Technical Owner - engineers, architects
  PRODUCT        // Product Owner - product managers
  BUSINESS       // Business Owner - business stakeholders
}
```

#### 3. BusinessProcess (Business Service Mapping)

```prisma
model BusinessProcess {
  id          String    @id @default(cuid())

  code        String    @unique   // "DIGITAL_PAYMENTS"
  name        String                // "Digital Payments"
  description String?   @db.Text
  category    String?               // "Core Banking", "Channels", "Support"

  // Metadata
  metadata    Json?

  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  services    Service[]

  @@index([code])
  @@index([category])
  @@map("business_processes")
}
```

#### 4. ServiceInfrastructure (Cloud/On-Prem Details)

```prisma
model ServiceInfrastructure {
  id                    String    @id @default(cuid())

  serviceId             String
  service               Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  // Location
  location              ServiceLocation

  // Cloud Provider Details
  cloudProvider         String?   // "OCI", "GCP", "AWS"
  compartment           String?   // OCI compartment
  project               String?   // GCP project
  region                String?   // "Riyadh", "Frankfurt", "Mumbai"

  // Network
  ipAddress             String?
  hostname              String?

  // Backup
  backupEnabled         Boolean   @default(false)
  backupSchedule        String?   // "daily", "weekly"
  lastBackupDate        DateTime?

  // Additional Details
  cloudProviderDetails  Json?     // Provider-specific metadata

  // Audit
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

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

#### 5. ServiceAsset (Many-to-Many with Assets)

```prisma
model ServiceAsset {
  id               String    @id @default(cuid())

  serviceId        String
  service          Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  assetId          String?   // Nullable for third-party services
  asset            Asset?    @relation(fields: [assetId], references: [id], onDelete: SetNull)

  relationship     AssetRelationship
  description      String?   @db.Text  // Describe the relationship

  // Audit
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

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

### Architecture Layers

#### 1. Domain Layer

**Location**: `src/core/domain/entities/`

- **service.entity.ts** - Service entity with business rules
  - Validation: name (3-200 chars), unique name
  - Business rules:
    - Cannot retire service with active assets
    - Essential services must have Critical/High criticality
    - Services with Restricted data must have defined SLA
  - Methods: `isActive()`, `isRetired()`, `canBeRetired()`, `retire()`

- **business-process.entity.ts** - BusinessProcess entity
  - Validation: code format (UPPERCASE_UNDERSCORE), unique code
  - Methods: `getServiceCount()`

- **service-infrastructure.entity.ts** - ServiceInfrastructure entity
  - Validation: IP format, hostname format
  - Business rules: Cloud services must have cloudProvider set

**Location**: `src/core/repositories/`

- **service.repository.interface.ts**
- **business-process.repository.interface.ts**
- **service-infrastructure.repository.interface.ts**

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
  findByOwner(
    personId: string,
    ownershipType?: OwnershipType,
  ): Promise<Service[]>;
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

#### 2. Use Cases Layer

**Location**: `src/core/use-cases/service/`

**Service Use Cases** (9 core + specialized):

- `create-service.use-case.ts` - Create new service (validates unique name)
- `get-service.use-case.ts` - Get service by ID with relations
- `list-services.use-case.ts` - List all services with filtering
- `update-service.use-case.ts` - Update service details
- `delete-service.use-case.ts` - Soft delete service (checks dependencies)
- `search-services.use-case.ts` - Advanced search with filters
- `get-essential-services.use-case.ts` - List critical services
- `get-retiring-services.use-case.ts` - Services with upcoming decommission
- `retire-service.use-case.ts` - Mark service as retired (business logic)

**ServiceOwnership Use Cases**:

- `add-service-owner.use-case.ts` - Add owner to service
- `remove-service-owner.use-case.ts` - Remove owner
- `set-primary-owner.use-case.ts` - Set primary owner for type
- `get-service-owners.use-case.ts` - Get all owners grouped by type

**BusinessProcess Use Cases**:

- Standard CRUD (create, get, list, update, delete)

**ServiceInfrastructure Use Cases**:

- `create-service-infrastructure.use-case.ts`
- `update-service-infrastructure.use-case.ts`
- `get-service-infrastructure.use-case.ts`

**ServiceAsset Use Cases**:

- `link-service-to-asset.use-case.ts`
- `unlink-service-from-asset.use-case.ts`
- `get-service-assets.use-case.ts`
- `get-asset-services.use-case.ts`

**CRITICAL**: Create `index.ts` barrel export for all use cases!

#### 3. Infrastructure Layer

**Location**: `src/infrastructure/repositories/`

- `prisma-service.repository.ts` - Implements IServiceRepository
- `prisma-business-process.repository.ts`
- `prisma-service-infrastructure.repository.ts`

Key patterns:

- Use Prisma singleton from `@/infrastructure/database/prisma/client`
- Import types from `@/generated/prisma`
- Structured logging with `createRepositoryLogger()`
- Include relations in queries: `owners.person`, `infrastructure`, `assets.asset`

**DI Registration**: `src/di/modules/service.module.ts`

```typescript
export function bindServiceDependencies(container: Container): void {
  // Repositories (Singleton)
  container
    .bind<IServiceRepository>(DI_TOKENS.IServiceRepository)
    .to(PrismaServiceRepository)
    .inSingletonScope();

  container
    .bind<IBusinessProcessRepository>(DI_TOKENS.IBusinessProcessRepository)
    .to(PrismaBusinessProcessRepository)
    .inSingletonScope();

  // Use Cases (Transient)
  container
    .bind<CreateServiceUseCase>(DI_TOKENS.CreateServiceUseCase)
    .to(CreateServiceUseCase)
    .inTransientScope();
  // ... all use cases
}
```

**Add to `src/di/types.ts`**:

```typescript
// Service
IServiceRepository: Symbol.for("IServiceRepository"),
IBusinessProcessRepository: Symbol.for("IBusinessProcessRepository"),
IServiceInfrastructureRepository: Symbol.for("IServiceInfrastructureRepository"),

CreateServiceUseCase: Symbol.for("CreateServiceUseCase"),
GetServiceUseCase: Symbol.for("GetServiceUseCase"),
// ... all use case tokens
```

**Register in `src/di/container.ts`**:

```typescript
import { bindServiceDependencies } from "./modules/service.module";

export function createContainer(): Container {
  // ... existing modules
  bindServiceDependencies(container);
  return container;
}
```

#### 4. Interface Adapters

**DTOs**: `src/interface-adapters/dtos/generated/service.dto.ts`

```typescript
import { z } from "zod";
import {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
  OwnershipType,
  ServiceLocation,
  AssetRelationship,
} from "@/generated/prisma";

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

  deploymentDate: z.coerce.date().optional().nullable(),
  currentStatus: z.nativeEnum(ServiceStatus).default("PRODUCTION"),
  lastPatchDate: z.coerce.date().optional().nullable(),
  plannedDecommissionDate: z.coerce.date().optional().nullable(),

  vendorId: z.string().optional().nullable(),
  slaDetails: z.record(z.string(), z.unknown()).optional().nullable(),

  businessProcessId: z.string().optional().nullable(),

  isInCentralRegister: z.boolean().default(true),
  complianceNotes: z.string().max(2000).optional().nullable(),

  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export const AddServiceOwnerSchema = z.object({
  serviceId: z.string(),
  personId: z.string(),
  ownershipType: z.nativeEnum(OwnershipType),
  isPrimary: z.boolean().default(false),
});

export const CreateServiceInfrastructureSchema = z.object({
  serviceId: z.string(),
  location: z.nativeEnum(ServiceLocation),
  cloudProvider: z.string().optional().nullable(),
  compartment: z.string().optional().nullable(),
  project: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  ipAddress: z.string().ip().optional().nullable(),
  hostname: z.string().optional().nullable(),
  backupEnabled: z.boolean().default(false),
  backupSchedule: z.string().optional().nullable(),
  cloudProviderDetails: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const LinkServiceToAssetSchema = z.object({
  serviceId: z.string(),
  assetId: z.string().optional().nullable(),
  relationship: z.nativeEnum(AssetRelationship),
  description: z.string().max(500).optional().nullable(),
});

export type CreateServiceDTO = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDTO = z.infer<typeof UpdateServiceSchema>;
export type AddServiceOwnerDTO = z.infer<typeof AddServiceOwnerSchema>;
export type CreateServiceInfrastructureDTO = z.infer<
  typeof CreateServiceInfrastructureSchema
>;
export type LinkServiceToAssetDTO = z.infer<typeof LinkServiceToAssetSchema>;
```

**Presenters**: `src/interface-adapters/presenters/service.presenter.ts`

```typescript
export interface ServiceDTO {
  id: string;
  name: string;
  serviceType: ServiceType;
  description: string | null;
  businessPurpose: string | null;
  gitlabRepoUrl: string | null;

  dataConfidentiality: DataConfidentiality;
  businessImpactLevel: BusinessImpactLevel;
  criticality: CriticalityLevel;
  isEssentialService: boolean;

  deploymentDate: string | null;
  currentStatus: ServiceStatus;
  lastPatchDate: string | null;
  plannedDecommissionDate: string | null;

  vendorId: string | null;
  slaDetails: Record<string, unknown> | null;

  businessProcessId: string | null;

  isInCentralRegister: boolean;
  complianceNotes: string | null;

  metadata: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;

  // Computed
  isActive: boolean;
  isRetired: boolean;
  daysUntilDecommission: number | null;

  // Enriched (from relations)
  vendorName?: string | null;
  businessProcessName?: string | null;
  owners?: ServiceOwnerDTO[];
  infrastructure?: ServiceInfrastructureDTO[];
  assets?: ServiceAssetDTO[];
}

export interface ServiceOwnerDTO {
  id: string;
  personId: string;
  personName: string;
  ownershipType: OwnershipType;
  isPrimary: boolean;
}

export function presentService(
  service: Service,
  enrichment?: {
    vendorName?: string | null;
    businessProcessName?: string | null;
    owners?: ServiceOwnerDTO[];
    infrastructure?: ServiceInfrastructureDTO[];
    assets?: ServiceAssetDTO[];
  },
): ServiceDTO {
  const daysUntilDecommission = service.plannedDecommissionDate
    ? Math.ceil(
        (service.plannedDecommissionDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return {
    id: service.id,
    name: service.name,
    // ... all fields

    isActive: service.isActive(),
    isRetired: service.isRetired(),
    daysUntilDecommission,

    // Enrichment
    vendorName: enrichment?.vendorName,
    businessProcessName: enrichment?.businessProcessName,
    owners: enrichment?.owners,
    infrastructure: enrichment?.infrastructure,
    assets: enrichment?.assets,
  };
}
```

**Controllers**: `src/interface-adapters/controllers/service.controller.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateServiceSchema,
  type CreateServiceDTO,
} from "../dtos/generated/service.dto";
import {
  presentService,
  type ServiceDTO,
} from "../presenters/service.presenter";
import type {
  CreateServiceUseCase,
  GetServiceUseCase,
} from "@/core/use-cases/service";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createServiceAction(
  data: CreateServiceDTO,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_CREATE);

    const validated = CreateServiceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateServiceUseCase>(
      DI_TOKENS.CreateServiceUseCase,
    );

    const service = await useCase.execute({
      name: validated.name,
      serviceType: validated.serviceType,
      // ... map all fields
    });

    revalidatePath("/services");

    return {
      success: true,
      data: presentService(service),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createServiceAction" },
      "Failed to create service",
    );
  }
}

export async function getServiceAction(
  id: string,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetServiceUseCase>(
      DI_TOKENS.GetServiceUseCase,
    );

    const service = await useCase.execute(id);

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    return {
      success: true,
      data: presentService(service, {
        // Fetch enrichment data
      }),
    };
  } catch (error) {
    return handleControllerError(error, { id }, "Failed to get service");
  }
}

// Additional actions:
// - listServicesAction
// - updateServiceAction
// - deleteServiceAction
// - addServiceOwnerAction
// - removeServiceOwnerAction
// - createServiceInfrastructureAction
// - linkServiceToAssetAction
// - searchServicesAction
```

#### 5. Presentation Layer

**Components**: `src/components/services/`

1. **ServiceForm.tsx** - Create/Edit service form
   - Multi-step wizard: Basic Info → Classification → Lifecycle → Infrastructure
   - Dropdowns: Service type, status, criticality, vendor, business process
   - Date pickers: Deployment, last patch, planned decommission
   - GitLab URL input with validation
   - JSON editor for SLA details and metadata
   - Owner management (add/remove multiple owners by type)

2. **ServicesTable.tsx** - List view with filtering
   - Columns: Name, Type, Status, Criticality, Owners, Vendor, Last Patch
   - Filters: Type, Status, Criticality, Vendor, Owner, Business Process
   - Sorting: All columns
   - Actions: View, Edit, Delete, Manage Owners
   - Badges: Essential Service badge, criticality color coding
   - Status indicators: Active (green), Retired (gray), Retiring Soon (orange)

3. **ServiceDetailView.tsx** - Comprehensive service view
   - Tabs: Overview, Owners, Infrastructure, Assets, History
   - Overview: All classification fields, lifecycle dates, vendor SLA
   - Owners: Grouped by type (Technical, Product, Business) with primary indicator
   - Infrastructure: Location, cloud details, IP/hostname, backup status
   - Assets: Linked assets with relationship type
   - History: Audit trail of changes

4. **ServiceOwnersManager.tsx** - Manage multiple owners
   - Grouped by ownership type
   - Add owner: Person selector + Type selector + Primary checkbox
   - Remove owner button
   - Validation: At least one primary owner per type

5. **ServiceInfrastructureForm.tsx** - Infrastructure details
   - Location dropdown (On-Prem, OCI, GCP, Hybrid)
   - Conditional fields based on location:
     - Cloud: Compartment, Project, Region
     - On-Prem: Data center, rack location
   - Network: IP address, hostname
   - Backup: Enable toggle, schedule dropdown, last backup date

6. **ServiceAssetLinker.tsx** - Link services to assets
   - Asset search/selector
   - Relationship type dropdown
   - Description text area
   - Supports null asset (for third-party services)

**Pages**: `src/app/(dashboard)/services/`

1. **page.tsx** - Services list page

   ```typescript
   export const dynamic = "force-dynamic";

   export default async function ServicesPage({
     searchParams,
   }: {
     searchParams: Promise<{ type?: string; status?: string; criticality?: string }>;
   }) {
     const params = await searchParams;
     const result = await listServicesAction({
       serviceType: params.type,
       status: params.status,
       criticality: params.criticality,
     });

     return (
       <div className="container">
         <ServicesPageHeader />
         <ServicesFilters />
         {result.success ? (
           <ServicesTable services={result.data} />
         ) : (
           <ErrorDisplay message={result.error} />
         )}
       </div>
     );
   }
   ```

2. **[id]/page.tsx** - Service detail page

   ```typescript
   export default async function ServiceDetailPage({
     params,
   }: {
     params: Promise<{ id: string }>;
   }) {
     const { id } = await params;
     const result = await getServiceAction(id);

     if (!result.success) {
       notFound();
     }

     return <ServiceDetailView service={result.data} />;
   }
   ```

3. **new/page.tsx** - Create service page
   ```typescript
   export default function NewServicePage() {
     return (
       <div className="container max-w-4xl">
         <h1>Create New Service</h1>
         <ServiceForm mode="create" />
       </div>
     );
   }
   ```

### RBAC Permissions

**Location**: `src/core/domain/value-objects/permission-key.ts`

```typescript
export const PERMISSIONS = {
  // ... existing permissions

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

**Seed Permissions**: `src/infrastructure/database/prisma/seed-rbac.ts`

```typescript
const servicePermissions = [
  {
    name: "services:view",
    displayName: "View Services",
    description: "View service catalog and details",
    resource: "services",
    action: "view",
  },
  {
    name: "services:create",
    displayName: "Create Services",
    description: "Create new services in catalog",
    resource: "services",
    action: "create",
  },
  {
    name: "services:update",
    displayName: "Update Services",
    description: "Update service details",
    resource: "services",
    action: "update",
  },
  {
    name: "services:delete",
    displayName: "Delete Services",
    description: "Delete services from catalog",
    resource: "services",
    action: "delete",
  },
  {
    name: "services:manage",
    displayName: "Manage Services",
    description: "Full service management including owners and infrastructure",
    resource: "services",
    action: "manage",
  },
];
```

**Assign to Roles**:

- System Administrator: Full access (all permissions)
- IT Manager: View, Create, Update, Manage
- IT Staff: View, Create
- Developer: View
- Business User: View (for their owned services)

### Navigation

**Location**: Add to sidebar navigation

```typescript
{
  title: "Services",
  href: "/services",
  icon: Server,
  permissions: [PERMISSIONS.SERVICES_VIEW],
  badge: "Layer 2",
}
```

### Database Seeding

**Location**: `src/infrastructure/database/prisma/seed-services.ts`

Create comprehensive seed script with ~80 services:

```typescript
interface ServiceSeedData {
  name: string;
  serviceType: ServiceType;
  description: string;
  businessPurpose?: string;
  gitlabRepoUrl?: string;
  dataConfidentiality: DataConfidentiality;
  businessImpactLevel: BusinessImpactLevel;
  criticality: CriticalityLevel;
  isEssentialService: boolean;
  currentStatus: ServiceStatus;
  vendorCode?: string; // Lookup vendor by code
  owners: {
    type: OwnershipType;
    personName: string; // Lookup person by name
    isPrimary: boolean;
  }[];
  infrastructure?: {
    location: ServiceLocation;
    cloudProvider?: string;
    region?: string;
    ipAddress?: string;
  };
  businessProcessCode?: string; // Lookup by code
}

const SERVICES: ServiceSeedData[] = [
  {
    name: "Active Directory",
    serviceType: "APPLICATION",
    description:
      "Microsoft directory service for managing permissions and access to networked resources",
    businessPurpose: "Enterprise authentication and authorization",
    dataConfidentiality: "CONFIDENTIAL",
    businessImpactLevel: "HIGH",
    criticality: "CRITICAL",
    isEssentialService: true,
    currentStatus: "PRODUCTION",
    vendorCode: "MSFT",
    owners: [
      { type: "TECHNICAL", personName: "System Admin", isPrimary: true },
      { type: "BUSINESS", personName: "IT Director", isPrimary: true },
    ],
    infrastructure: {
      location: "ON_PREM",
      region: "Riyadh",
      ipAddress: "10.0.1.10",
    },
    businessProcessCode: "IDENTITY_MGMT",
  },
  {
    name: "Core Wallet Service",
    serviceType: "APPLICATION",
    description:
      "Primary digital wallet service enabling users to store, manage, and use digital assets",
    businessPurpose: "Core digital wallet functionality for customers",
    gitlabRepoUrl: "https://gitlab.barq.com/backend/core-wallet-service",
    dataConfidentiality: "RESTRICTED",
    businessImpactLevel: "HIGH",
    criticality: "CRITICAL",
    isEssentialService: true,
    currentStatus: "PRODUCTION",
    owners: [
      {
        type: "TECHNICAL",
        personName: "Lead Backend Engineer",
        isPrimary: true,
      },
      {
        type: "PRODUCT",
        personName: "Product Manager - Wallet",
        isPrimary: true,
      },
      {
        type: "BUSINESS",
        personName: "Head of Digital Banking",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD",
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-wallet",
    },
    businessProcessCode: "DIGITAL_WALLET",
  },
  // ... add all 80 services
];

export async function seedServices(prisma: PrismaClient): Promise<void> {
  console.log("Seeding services...");

  // Create business processes first
  const businessProcesses = [
    {
      code: "IDENTITY_MGMT",
      name: "Identity Management",
      category: "Infrastructure",
    },
    {
      code: "DIGITAL_WALLET",
      name: "Digital Wallet",
      category: "Core Banking",
    },
    {
      code: "DIGITAL_PAYMENTS",
      name: "Digital Payments",
      category: "Core Banking",
    },
    // ... more processes
  ];

  for (const bp of businessProcesses) {
    await prisma.businessProcess.upsert({
      where: { code: bp.code },
      update: {},
      create: bp,
    });
  }

  // Create lookup maps
  const persons = await prisma.person.findMany();
  const personMap = new Map(
    persons.map((p) => [p.firstName + " " + p.lastName, p.id]),
  );

  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map((v) => [v.code, v.id]));

  const processes = await prisma.businessProcess.findMany();
  const processMap = new Map(processes.map((p) => [p.code, p.id]));

  // Create services
  let created = 0;
  for (const serviceData of SERVICES) {
    const service = await prisma.service.create({
      data: {
        name: serviceData.name,
        serviceType: serviceData.serviceType,
        description: serviceData.description,
        businessPurpose: serviceData.businessPurpose,
        gitlabRepoUrl: serviceData.gitlabRepoUrl,
        dataConfidentiality: serviceData.dataConfidentiality,
        businessImpactLevel: serviceData.businessImpactLevel,
        criticality: serviceData.criticality,
        isEssentialService: serviceData.isEssentialService,
        currentStatus: serviceData.currentStatus,
        vendorId: serviceData.vendorCode
          ? vendorMap.get(serviceData.vendorCode)
          : null,
        businessProcessId: serviceData.businessProcessCode
          ? processMap.get(serviceData.businessProcessCode)
          : null,
        owners: {
          create: serviceData.owners.map((owner) => ({
            personId: personMap.get(owner.personName)!,
            ownershipType: owner.type,
            isPrimary: owner.isPrimary,
          })),
        },
        infrastructure: serviceData.infrastructure
          ? {
              create: {
                location: serviceData.infrastructure.location,
                cloudProvider: serviceData.infrastructure.cloudProvider,
                region: serviceData.infrastructure.region,
                ipAddress: serviceData.infrastructure.ipAddress,
              },
            }
          : undefined,
      },
    });

    created++;
    if (created % 10 === 0) {
      console.log(`  Created ${created} services...`);
    }
  }

  console.log(`✓ Seeded ${created} services`);
}
```

**Update main seed file**: `src/infrastructure/database/prisma/seed.ts`

```typescript
import { seedServices } from "./seed-services";

async function main() {
  // ... existing seeds
  await seedServices(prisma);
}
```

## Implementation Checklist

### Phase 1: Database & Schema (1 day)

- [ ] Add Service model to schema.prisma
- [ ] Add ServiceOwnership model
- [ ] Add BusinessProcess model
- [ ] Add ServiceInfrastructure model
- [ ] Add ServiceAsset model
- [ ] Add all enums (ServiceType, ServiceStatus, etc.)
- [ ] Add indexes for performance
- [ ] Generate and run migration: `npx prisma migrate dev --name add-service-management`
- [ ] Verify Prisma client regeneration

### Phase 2: Domain Layer (1 day)

- [ ] Create service.entity.ts with business rules
- [ ] Create business-process.entity.ts
- [ ] Create service-infrastructure.entity.ts
- [ ] Create service.repository.interface.ts
- [ ] Create business-process.repository.interface.ts
- [ ] Create service-infrastructure.repository.interface.ts

### Phase 3: Infrastructure Layer (1 day)

- [ ] Create prisma-service.repository.ts (all methods)
- [ ] Create prisma-business-process.repository.ts
- [ ] Create prisma-service-infrastructure.repository.ts
- [ ] Test repositories with simple queries
- [ ] Add DI tokens to types.ts
- [ ] Create service.module.ts
- [ ] Register module in container.ts

### Phase 4: Use Cases Layer (1.5 days)

- [ ] Create Service CRUD use cases (5)
- [ ] Create Service specialized use cases (4)
- [ ] Create ServiceOwnership use cases (4)
- [ ] Create BusinessProcess CRUD use cases (5)
- [ ] Create ServiceInfrastructure use cases (3)
- [ ] Create ServiceAsset use cases (4)
- [ ] **CRITICAL**: Create index.ts barrel export
- [ ] Run pre-commit hook test: `npm run lint`

### Phase 5: Interface Adapters (1 day)

- [ ] Create service.dto.ts with Zod schemas (5 schemas)
- [ ] Create service.presenter.ts
- [ ] Create business-process.dto.ts and presenter
- [ ] Create service-infrastructure.dto.ts and presenter
- [ ] Create service.controller.ts with server actions (10 actions)

### Phase 6: UI Components (1.5 days)

- [ ] Create ServiceForm.tsx (multi-step wizard)
- [ ] Create ServicesTable.tsx (with filters, sorting)
- [ ] Create ServiceDetailView.tsx (tabs layout)
- [ ] Create ServiceOwnersManager.tsx
- [ ] Create ServiceInfrastructureForm.tsx
- [ ] Create ServiceAssetLinker.tsx
- [ ] Create supporting components (filters, badges, status indicators)

### Phase 7: Pages & Routes (0.5 days)

- [ ] Create app/(dashboard)/services/page.tsx
- [ ] Create app/(dashboard)/services/[id]/page.tsx
- [ ] Create app/(dashboard)/services/new/page.tsx
- [ ] Add navigation sidebar entry
- [ ] Test routing and permissions

### Phase 8: RBAC & Permissions (0.5 days)

- [ ] Add permissions to permission-key.ts
- [ ] Seed permissions in seed-rbac.ts
- [ ] Assign permissions to roles (Admin, IT Manager, etc.)
- [ ] Test permission checks in controllers

### Phase 9: Database Seeding (1 day)

- [ ] Create business processes seed data
- [ ] Map ~80 services to seed data structure
- [ ] Create seed-services.ts with lookup logic
- [ ] Update main seed.ts
- [ ] Run full seed: `npm run reset`
- [ ] Verify data in UI

### Phase 10: Testing & Documentation (0.5 days)

- [ ] Test service CRUD operations
- [ ] Test multi-owner assignment
- [ ] Test asset linking
- [ ] Test filtering and search
- [ ] Test permissions
- [ ] Run validation: `npm run validate`
- [ ] Create SERVICE_MANAGEMENT.md in docs/
- [ ] Add MDX page in src/content/docs/
- [ ] Update README.md and CLAUDE.md

## Testing Strategy

### Unit Tests (Optional)

- Service entity business rules (canBeRetired, essential service validation)
- Use case logic (unique name validation, dependency checks)
- DTO validation schemas

### Integration Tests

- Repository queries (findByOwner, findEssentialServices)
- Service creation with multiple owners
- Asset linking relationships

### Manual Testing Checklist

- [ ] Create service with all fields populated
- [ ] Add multiple owners of different types
- [ ] Set primary owner for each type
- [ ] Add infrastructure details for cloud service
- [ ] Link service to multiple assets
- [ ] Filter services by type, status, criticality
- [ ] Search services by name
- [ ] View service detail with all tabs
- [ ] Update service details
- [ ] Retire service (check dependency validation)
- [ ] Verify permissions (different roles)
- [ ] Test third-party service (null asset)
- [ ] Verify essential services list

## Documentation

After implementation, create comprehensive documentation:

### 1. Technical Documentation

**File**: `docs/SERVICE_MANAGEMENT.md`

Contents:

- System overview and business value
- Entity relationship diagrams
- Field descriptions and validation rules
- API reference (controllers and use cases)
- RBAC permissions matrix
- Database schema details

### 2. User Guide (MDX)

**File**: `src/content/docs/service-management.mdx`

Contents:

- Introduction to Service Management
- Creating and managing services
- Adding owners and infrastructure details
- Linking services to assets
- Understanding service classification
- Reports and analytics
- Best practices

### 3. Update Project Documentation

- [ ] Update `CLAUDE.md`:
  - Add Service entity to Layer 2 entities list
  - Add ServiceOwnership, BusinessProcess to entity list
  - Add /services route to navigation
  - Add critical patterns for multi-owner management
- [ ] Update `README.md`:
  - Add Service Management to features list
  - Update entity count (Layer 2: 14 entities)
- [ ] Update `docs/guides/ENTITY_REFERENCE.md`:
  - Add Service entity reference
  - Add BusinessProcess entity reference

## Key Design Decisions

| Decision                                        | Rationale                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Multiple owners via join table                  | Flexible ownership model supporting multiple Technical/Product/Business owners     |
| Closed ServiceType enum                         | Type-safe, predictable service categorization (can extend later)                   |
| BusinessProcess entity                          | Future-proof for process management, better than free-text field                   |
| ServiceInfrastructure separate entity           | Normalized schema, supports history tracking, handles cloud vs on-prem differences |
| ServiceAsset many-to-many with nullable asset   | Supports third-party services without physical assets                              |
| JSON fields for SLA/metadata                    | Flexible schema for varying vendor SLA structures                                  |
| Essential Service flag                          | Quick identification of critical services (Core Banking/Payments)                  |
| Criticality + Business Impact + Confidentiality | Comprehensive NDMO framework compliance                                            |
| Seed script vs CSV import                       | Seed script for initial 80 services (controlled, repeatable)                       |

## Risk & Considerations

1. **Data Migration**: No existing service data to migrate, clean slate
2. **Service Count Growth**: Schema designed for 100s-1000s of services with proper indexing
3. **Owner Management Complexity**: UI must clearly show ownership types and prevent orphaned services
4. **Asset Relationships**: Nullable assets for third-party services, validation to prevent dangling references
5. **Performance**: Include relations in queries (owners, infrastructure, assets) - may need pagination
6. **Validation**:
   - Unique service names (case-insensitive)
   - Essential services must have Critical/High criticality
   - At least one primary owner per ownership type
7. **Seed Data Quality**: Manual mapping of 80 services to owners/vendors - review carefully
8. **GitLab URL Validation**: Services may not have repos (infrastructure services)
9. **Cloud Provider Variations**: JSON fields handle OCI vs GCP differences, but UI should guide users

## Future Enhancements (Post-MVP)

- **Service Dashboard**: Analytics on service distribution, criticality, ownership, vendor concentration
- **Service Health Monitoring**: Integration with monitoring tools (Prometheus, DataDog)
- **Dependency Mapping**: Service-to-service dependencies (microservices architecture)
- **Change Management**: Track service changes, deployments, incidents
- **Compliance Automation**: Auto-generate compliance reports (SAMA, ISO 27001)
- **Service Catalog Portal**: Self-service catalog for business users
- **Cost Tracking**: Link services to financial costs (cloud spend, licensing)
- **SLA Monitoring**: Track vendor SLA compliance with alerts
- **Lifecycle Automation**: Auto-retire services past decommission date
- **API Integration**: Sync with GitLab, Jira, ServiceNow
- **Bulk Operations**: CSV import wizard, bulk update, bulk owner assignment
- **Advanced Search**: Elasticsearch integration for full-text search
- **Service Templates**: Templates for common service types
- **Approval Workflows**: Multi-stage approval for service creation/retirement

## Performance Optimizations

1. **Database Indexes**: All foreign keys, enum fields, and date fields indexed
2. **Query Optimization**: Use Prisma `include` strategically, avoid N+1 queries
3. **Pagination**: Implement for services list (default 50 per page)
4. **Caching**: Consider Redis cache for frequently accessed services list
5. **Lazy Loading**: Load infrastructure and assets on-demand in detail view
6. **Search Optimization**: Consider full-text search index for large catalogs

## Success Metrics

- [ ] All 80 services seeded successfully
- [ ] Service catalog accessible to all authorized users
- [ ] CRUD operations complete in <1 second
- [ ] Search returns results in <500ms
- [ ] Zero permission bypass vulnerabilities
- [ ] 100% test coverage for business rules
- [ ] Documentation complete and accessible

---

**Last Updated**: 2025-11-21
**Author**: Planning Session with Claude
**Related Docs**:

- `docs/guides/DEVELOPER_GUIDE.md` - Feature implementation guide
- `docs/guides/ENTITY_REFERENCE.md` - Entity patterns
- `docs/architecture/DATABASE_SCHEMA.md` - Schema conventions
- `docs/WARRANTY_SYSTEM.md` - Reference Layer 2 implementation
