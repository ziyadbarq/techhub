# Layer 1 (Foundation) - Technical Implementation

## Overview

This document provides technical implementation details for the Foundation Layer (Layer 1) of the Barq Assets CMDB/ITAM system. It covers database schema design, domain entity patterns, repository implementations, use case orchestration, DI container configuration, and testing strategies.

**Audience**: Developers implementing or maintaining the Foundation layer.

**Related Documents**:

- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md) - User-facing guide
- [Architecture Overview](./ARCHITECTURE.md) - Complete system architecture
- [Data Model](./DATA_MODEL.md) - Complete data model documentation

---

## Clean Architecture Layers

Foundation entities are implemented across all architectural layers:

```
┌─────────────────────────────────────────────────────┐
│  Presentation Layer                                  │
│  - UI Components (React)                             │
│  - Routes (Next.js App Router)                       │
│  src/app/, src/components/                           │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Interface Adapters Layer                            │
│  - Controllers (Server Actions)                      │
│  - DTOs (Zod Schemas)                                │
│  src/interface-adapters/                             │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Use Case Layer                                      │
│  - Application Logic                                 │
│  - Permission Checks                                 │
│  src/core/use-cases/foundation/                      │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Domain Layer                                        │
│  - Entities (Business Rules)                         │
│  - Value Objects (Enums)                             │
│  - Repository Interfaces                             │
│  src/core/domain/, src/core/repositories/            │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Infrastructure Layer                                │
│  - Prisma Repositories                               │
│  - Database (PostgreSQL)                             │
│  src/infrastructure/repositories/                    │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema Implementation

### Prisma Schema Design

**Location**: [`src/infrastructure/database/prisma/schema.prisma`](../../src/infrastructure/database/prisma/schema.prisma)

#### Enums

All Foundation enums defined as Prisma enums for type safety:

```prisma
enum OrganizationUnitType {
  COMPANY
  BUSINESS_UNIT
  DEPARTMENT
  TEAM
  DIVISION
  OTHER
}

enum LocationType {
  COUNTRY
  CITY
  CAMPUS
  BUILDING
  FLOOR
  ROOM
  RACK
  DATA_CENTER
  CLOUD_REGION
  CLOUD_ZONE
  VIRTUAL
  WAREHOUSE
  OFFICE
  BRANCH
  OTHER
}

enum VendorType {
  MANUFACTURER
  RESELLER
  SERVICE_PROVIDER
  CONSULTANT
  CONTRACTOR
  OTHER
}

enum StateType {
  INITIAL
  ACTIVE
  INACTIVE
  TERMINAL
  TRANSITION
}

enum FieldDataTypeEnum {
  STRING
  TEXT
  INTEGER
  DECIMAL
  BOOLEAN
  DATE
  DATETIME
  ENUM
  JSON
  CI_REFERENCE
  PERSON_REFERENCE
  ORG_UNIT_REFERENCE
  LOCATION_REFERENCE
}
```

#### Self-Referencing Hierarchies

**Pattern**: Use self-referencing foreign key with named relations

```prisma
model OrganizationUnit {
  id        String              @id @default(cuid())
  parentId  String?
  parent    OrganizationUnit?   @relation("OrgUnitHierarchy", fields: [parentId], references: [id])
  children  OrganizationUnit[]  @relation("OrgUnitHierarchy")
  // ... other fields
}

model Location {
  id        String      @id @default(cuid())
  parentId  String?
  parent    Location?   @relation("LocationHierarchy", fields: [parentId], references: [id])
  children  Location[]  @relation("LocationHierarchy")
  // ... other fields
}
```

**Migration Considerations**:

- Self-referencing foreign keys require careful ordering in seed scripts
- Deletion requires cascade handling or explicit child deletion
- Circular references prevented at application level, not database level

#### Many-to-Many with Temporal Data

**Pattern**: Explicit junction table with additional fields

```prisma
model Person {
  id                  String                 @id @default(cuid())
  primaryRoleId       String
  primaryRole         Role                   @relation("PersonPrimaryRole", fields: [primaryRoleId], references: [id])
  roleAssignments     PersonRoleAssignment[] @relation("PersonRoleAssignments")
  // ... other fields
}

model Role {
  id                  String                 @id @default(cuid())
  personsPrimaryRole  Person[]               @relation("PersonPrimaryRole")
  personRoleAssignments PersonRoleAssignment[] @relation("PersonRoleAssignments")
  // ... other fields
}

model PersonRoleAssignment {
  id          String    @id @default(cuid())
  personId    String
  person      Person    @relation("PersonRoleAssignments", fields: [personId], references: [id])
  roleId      String
  role        Role      @relation("PersonRoleAssignments", fields: [roleId], references: [id])
  startDate   DateTime
  endDate     DateTime?
  note        String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([personId])
  @@index([roleId])
  @@index([startDate, endDate])
}
```

**Key Points**:

- Primary role vs. additional roles (one-to-many vs. many-to-many)
- Temporal data (start/end dates) for historical tracking
- Named relations prevent Prisma ambiguity errors

#### JSON Fields for Dynamic Data

**Pattern**: Use `Json` type for flexible metadata and validation rules

```prisma
model FieldDefinition {
  id                String    @id @default(cuid())
  validationRules   Json?     // Dynamic validation config
  defaultValue      Json?     // Type-specific default
  enumOptions       Json?     // Array of {value, label}
  metadata          Json?     // Additional metadata
  // ... other fields
}

model LifecycleTransition {
  id              String   @id @default(cuid())
  approvalPolicy  Json?    // Approval rules
  conditions      Json?    // Transition conditions
  metadata        Json?
  // ... other fields
}
```

**JSON Structure Examples**:

```typescript
// validationRules
{
  minLength: 3,
  maxLength: 255,
  pattern: "^[a-zA-Z0-9-_]+$"
}

// enumOptions
[
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
  { value: "macos", label: "macOS" }
]

// approvalPolicy
{
  approverRoles: ["Admin", "Manager"],
  minimumApprovals: 1,
  autoApproveAfterDays: 3
}

// conditions
{
  type: "date_based",
  field: "expiryDate",
  operator: "lte",
  value: "current_date"
}
```

**Validation**: JSON schema validation done in domain entities, not database

#### Indexing Strategy

**Performance-Critical Indexes**:

```prisma
model OrganizationUnit {
  // ...
  @@index([parentId])
  @@index([code])
  @@index([isActive])
  @@index([unitType])
}

model Location {
  // ...
  @@index([parentId])
  @@index([code])
  @@index([locationType])
  @@index([isActive])
}

model Person {
  // ...
  @@index([orgUnitId])
  @@index([primaryRoleId])
  @@index([employeeId])
  @@index([isActive])
}

model VendorContact {
  // ...
  @@index([vendorId])
  @@index([isPrimary])
}

model LifecycleState {
  // ...
  @@index([lifecycleModelId])
  @@index([code])
}

model LifecycleTransition {
  // ...
  @@index([lifecycleModelId])
  @@index([fromStateId])
  @@index([toStateId])
}

model FieldDefinition {
  // ...
  @@index([name])
  @@index([dataType])
  @@index([isGlobal])
}
```

**Rationale**:

- Foreign keys indexed for join performance
- Unique codes indexed for lookup queries
- Boolean flags indexed for filtered lists
- Enum types indexed for category filtering

---

## Domain Entity Implementation

### Entity Pattern

**Location**: [`src/core/domain/entities/`](../../src/core/domain/entities/)

All Foundation entities follow this pattern:

```typescript
export class EntityName {
  private _id?: string;
  private _field1: string;
  private _field2: number;
  // ... private fields

  private constructor(props: EntityProps) {
    this._field1 = props.field1;
    this._field2 = props.field2;
    // Validation in constructor
  }

  // Factory method (static)
  static create(props: CreateProps): EntityName {
    // Business rule validation
    validateField1(props.field1);
    validateField2(props.field2);

    return new EntityName({
      field1: props.field1,
      field2: props.field2,
    });
  }

  // Getters (no setters - immutability)
  get id(): string | undefined {
    return this._id;
  }

  get field1(): string {
    return this._field1;
  }

  // Setters only via methods with validation
  updateField1(newValue: string): void {
    validateField1(newValue);
    this._field1 = newValue;
  }

  // Business rule methods
  canBeDeleted(): boolean {
    // Check business rules
    return true;
  }

  // Persistence method
  toObject(): EntityData {
    return {
      id: this._id,
      field1: this._field1,
      field2: this._field2,
    };
  }

  // Comparison
  equals(other: EntityName): boolean {
    return this._id === other._id;
  }

  // ID setter (called only by repository after persistence)
  setId(id: string): void {
    if (this._id !== undefined) {
      throw new Error("Cannot change entity ID");
    }
    this._id = id;
  }
}
```

**Key Design Decisions**:

1. **Private Constructor**: Force use of factory method for validation
2. **Factory Method**: `static create()` validates before instantiation
3. **Immutable ID**: Set once via `setId()`, never changed
4. **Getters Only**: No direct property access (encapsulation)
5. **Validation in Entity**: Business rules enforced in domain layer
6. **Business Methods**: `canBeDeleted()`, `activate()`, etc.
7. **Persistence Method**: `toObject()` for repository serialization
8. **Type Safety**: TypeScript interfaces for props

### Example: OrganizationUnit Entity

```typescript
export class OrganizationUnit {
  private _id?: string;
  private _name: string;
  private _code: string;
  private _parentId?: string;
  private _unitType: OrganizationUnitType;
  private _level: number;
  private _managerId?: string;
  private _costCenter?: string;
  private _isActive: boolean;
  private _note?: string;
  private _metadata?: Record<string, unknown>;

  private constructor(props: OrgUnitProps) {
    this._name = props.name;
    this._code = props.code;
    this._parentId = props.parentId;
    this._unitType = props.unitType;
    this._level = props.level;
    this._managerId = props.managerId;
    this._costCenter = props.costCenter;
    this._isActive = props.isActive ?? true;
    this._note = props.note;
    this._metadata = props.metadata;
  }

  static create(props: CreateOrgUnitProps): OrganizationUnit {
    // Validation
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Organization unit name is required");
    }

    if (!props.code || !/^[A-Z0-9-]+$/.test(props.code)) {
      throw new Error("Code must be uppercase alphanumeric with hyphens");
    }

    if (props.level < 1 || props.level > 10) {
      throw new Error("Level must be between 1 and 10");
    }

    if (props.parentId && props.level === 1) {
      throw new Error("Top-level unit (level 1) cannot have a parent");
    }

    return new OrganizationUnit({
      name: props.name.trim(),
      code: props.code.toUpperCase(),
      parentId: props.parentId,
      unitType: props.unitType,
      level: props.level,
      managerId: props.managerId,
      costCenter: props.costCenter,
      isActive: props.isActive ?? true,
      note: props.note,
      metadata: props.metadata,
    });
  }

  // Business rules
  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  canBeDeleted(): boolean {
    // Cannot delete if has children (checked at repository level)
    // Cannot delete if has assigned persons (checked at repository level)
    return true;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }
    this._name = name.trim();
  }

  updateManager(managerId: string | undefined): void {
    this._managerId = managerId;
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get code(): string {
    return this._code;
  }
  get parentId(): string | undefined {
    return this._parentId;
  }
  get unitType(): OrganizationUnitType {
    return this._unitType;
  }
  get level(): number {
    return this._level;
  }
  get managerId(): string | undefined {
    return this._managerId;
  }
  get costCenter(): string | undefined {
    return this._costCenter;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get note(): string | undefined {
    return this._note;
  }
  get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  // Persistence
  toObject(): OrgUnitData {
    return {
      id: this._id,
      name: this._name,
      code: this._code,
      parentId: this._parentId,
      unitType: this._unitType,
      level: this._level,
      managerId: this._managerId,
      costCenter: this._costCenter,
      isActive: this._isActive,
      note: this._note,
      metadata: this._metadata,
    };
  }

  setId(id: string): void {
    if (this._id !== undefined) {
      throw new Error("Cannot change organization unit ID");
    }
    this._id = id;
  }

  equals(other: OrganizationUnit): boolean {
    return this._id !== undefined && this._id === other._id;
  }
}
```

---

## Repository Interface Pattern

**Location**: [`src/core/repositories/`](../../src/core/repositories/)

### Standard Interface

All Foundation repositories follow this pattern:

```typescript
export interface IEntityRepository {
  // Create
  create(entity: Entity): Promise<Entity>;

  // Read
  findById(id: string): Promise<Entity | null>;
  findByCode(code: string): Promise<Entity | null>;
  findAll(options?: FindAllOptions): Promise<Entity[]>;

  // Update
  update(entity: Entity): Promise<Entity>;

  // Delete
  delete(id: string): Promise<void>;

  // Query methods
  search(options: SearchOptions): Promise<PaginatedResult<Entity>>;

  // Validation methods
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  // Domain-specific methods
  // ... entity-specific queries
}

// Common types
export interface FindAllOptions {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchOptions {
  searchTerm?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Example: IOrganizationUnitRepository

```typescript
export interface IOrganizationUnitRepository {
  // CRUD
  create(orgUnit: OrganizationUnit): Promise<OrganizationUnit>;
  findById(id: string): Promise<OrganizationUnit | null>;
  findByCode(code: string): Promise<OrganizationUnit | null>;
  findAll(options?: FindAllOptions): Promise<OrganizationUnit[]>;
  update(orgUnit: OrganizationUnit): Promise<OrganizationUnit>;
  delete(id: string): Promise<void>;

  // Query
  search(options: SearchOptions): Promise<PaginatedResult<OrganizationUnit>>;

  // Hierarchy
  findChildren(parentId: string): Promise<OrganizationUnit[]>;
  findParent(id: string): Promise<OrganizationUnit | null>;
  hasChildren(id: string): Promise<boolean>;

  // Validation
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  hasPersons(id: string): Promise<boolean>;
}
```

---

## Prisma Repository Implementation

**Location**: [`src/infrastructure/repositories/`](../../src/infrastructure/repositories/)

### Implementation Pattern

All Prisma repositories follow this pattern:

```typescript
import { injectable, inject } from "inversify";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";
import { createRepositoryLogger } from "@/infrastructure/repositories/repository-logger";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IEntityRepository } from "@/core/repositories/entity.repository.interface";
import { Entity } from "@/core/domain/entities/entity.entity";
import { DI_TOKENS } from "@/di/types";

@injectable()
export class PrismaEntityRepository implements IEntityRepository {
  private readonly logger;

  constructor(@inject(DI_TOKENS.ILoggerService) baseLogger: ILoggerService) {
    this.logger = createRepositoryLogger(baseLogger, "PrismaEntityRepository");
  }

  async create(entity: Entity): Promise<Entity> {
    const timer = this.logger.startTimer();

    try {
      const data = entity.toObject();

      const created = await prisma.entityModel.create({
        data: {
          name: data.name,
          code: data.code,
          // ... map entity to Prisma model
        },
      });

      entity.setId(created.id);

      this.logger.endTimer(timer, "create", {
        entityId: created.id,
        code: data.code,
      });

      return entity;
    } catch (error) {
      this.logger.error("Failed to create entity", { error });
      throw error;
    }
  }

  async findById(id: string): Promise<Entity | null> {
    const timer = this.logger.startTimer();

    try {
      const found = await prisma.entityModel.findUnique({
        where: { id },
        include: {
          // Include relations if needed
        },
      });

      if (!found) {
        this.logger.endTimer(timer, "findById", { id, found: false });
        return null;
      }

      const entity = this.mapToEntity(found);

      this.logger.endTimer(timer, "findById", { id, found: true });

      return entity;
    } catch (error) {
      this.logger.error("Failed to find entity by ID", { id, error });
      throw error;
    }
  }

  // ... other CRUD methods

  private mapToEntity(model: PrismaModel): Entity {
    const entity = Entity.create({
      name: model.name,
      code: model.code,
      // ... map Prisma model to entity
    });

    entity.setId(model.id);

    return entity;
  }
}
```

**Key Patterns**:

1. **Prisma Singleton**: Import from `@/infrastructure/database/prisma/client`
2. **Repository Logger**: Use `createRepositoryLogger()` for structured logging
3. **Timer Tracking**: `startTimer()` / `endTimer()` for performance monitoring
4. **Error Handling**: Try-catch with error logging
5. **Entity Mapping**: `mapToEntity()` private method
6. **Include Relations**: Use Prisma `include` for related entities
7. **DI Constructor**: Inject logger via InversifyJS

### Example: Hierarchy Query Implementation

```typescript
@injectable()
export class PrismaOrganizationUnitRepository
  implements IOrganizationUnitRepository
{
  // ...

  async findChildren(parentId: string): Promise<OrganizationUnit[]> {
    const timer = this.logger.startTimer();

    try {
      const children = await prisma.organizationUnit.findMany({
        where: { parentId },
        orderBy: { name: "asc" },
      });

      const entities = children.map((child) => this.mapToEntity(child));

      this.logger.endTimer(timer, "findChildren", {
        parentId,
        count: entities.length,
      });

      return entities;
    } catch (error) {
      this.logger.error("Failed to find children", { parentId, error });
      throw error;
    }
  }

  async findParent(id: string): Promise<OrganizationUnit | null> {
    const timer = this.logger.startTimer();

    try {
      const unit = await prisma.organizationUnit.findUnique({
        where: { id },
        include: { parent: true },
      });

      if (!unit || !unit.parent) {
        this.logger.endTimer(timer, "findParent", { id, found: false });
        return null;
      }

      const parentEntity = this.mapToEntity(unit.parent);

      this.logger.endTimer(timer, "findParent", { id, found: true });

      return parentEntity;
    } catch (error) {
      this.logger.error("Failed to find parent", { id, error });
      throw error;
    }
  }

  async hasChildren(id: string): Promise<boolean> {
    const timer = this.logger.startTimer();

    try {
      const count = await prisma.organizationUnit.count({
        where: { parentId: id },
      });

      const hasChildren = count > 0;

      this.logger.endTimer(timer, "hasChildren", { id, hasChildren });

      return hasChildren;
    } catch (error) {
      this.logger.error("Failed to check for children", { id, error });
      throw error;
    }
  }
}
```

### JSON Field Handling

```typescript
// FieldDefinition repository - JSON field handling
private mapToEntity(model: PrismaFieldDefinition): FieldDefinition {
  const entity = FieldDefinition.create({
    name: model.name,
    label: model.label,
    dataType: model.dataType as FieldDataTypeEnum,
    description: model.description ?? undefined,
    isGlobal: model.isGlobal,
    validationRules: model.validationRules
      ? (model.validationRules as Record<string, unknown>)
      : undefined,
    defaultValue: model.defaultValue
      ? (model.defaultValue as unknown)
      : undefined,
    enumOptions: model.enumOptions
      ? (model.enumOptions as Array<{ value: string; label: string }>)
      : undefined,
    uiGroup: model.uiGroup ?? undefined,
    uiOrder: model.uiOrder ?? undefined,
    isSearchable: model.isSearchable,
    isFilterable: model.isFilterable,
    metadata: model.metadata
      ? (model.metadata as Record<string, unknown>)
      : undefined
  });

  entity.setId(model.id);

  return entity;
}

async create(fieldDef: FieldDefinition): Promise<FieldDefinition> {
  const data = fieldDef.toObject();

  const created = await prisma.fieldDefinition.create({
    data: {
      name: data.name,
      label: data.label,
      dataType: data.dataType,
      description: data.description ?? null,
      isGlobal: data.isGlobal,
      validationRules: data.validationRules
        ? (data.validationRules as Prisma.JsonValue)
        : Prisma.JsonNull,
      defaultValue: data.defaultValue
        ? (data.defaultValue as Prisma.JsonValue)
        : Prisma.JsonNull,
      enumOptions: data.enumOptions
        ? (data.enumOptions as Prisma.JsonValue)
        : Prisma.JsonNull,
      uiGroup: data.uiGroup ?? null,
      uiOrder: data.uiOrder ?? null,
      isSearchable: data.isSearchable,
      isFilterable: data.isFilterable,
      metadata: data.metadata
        ? (data.metadata as Prisma.JsonValue)
        : Prisma.JsonNull
    }
  });

  fieldDef.setId(created.id);

  return fieldDef;
}
```

**JSON Handling Rules**:

1. Use `Prisma.JsonValue` type for create/update
2. Use `Prisma.JsonNull` for explicit null values
3. Cast to appropriate TypeScript types when mapping to entity
4. Validate JSON structure in domain entity, not repository

---

## Use Case Implementation

**Location**: [`src/core/use-cases/foundation/`](../../src/core/use-cases/foundation/)

### Use Case Pattern

All use cases follow this pattern:

```typescript
import { injectable, inject } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IEntityRepository } from "@/core/repositories/entity.repository.interface";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { Entity } from "@/core/domain/entities/entity.entity";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export interface ExecuteInput {
  // Input parameters
  userId: string;
}

@injectable()
export class ExecuteUseCase {
  constructor(
    @inject(DI_TOKENS.IEntityRepository)
    private readonly repository: IEntityRepository,

    @inject(DI_TOKENS.CheckPermissionUseCase)
    private readonly checkPermission: CheckPermissionUseCase,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: ExecuteInput): Promise<Entity> {
    this.logger.info("Executing use case", {
      context: "ExecuteUseCase",
      userId: input.userId,
    });

    // 1. Permission check
    const hasPermission = await this.checkPermission.execute({
      userId: input.userId,
      permission: PERMISSIONS.ENTITY_ACTION,
    });

    if (!hasPermission) {
      this.logger.warn("Permission denied", {
        context: "ExecuteUseCase",
        userId: input.userId,
        permission: PERMISSIONS.ENTITY_ACTION,
      });
      throw new Error("Permission denied");
    }

    // 2. Business logic validation
    // ... validate input

    // 3. Domain entity creation
    const entity = Entity.create({
      // ... entity props
    });

    // 4. Repository persistence
    const saved = await this.repository.create(entity);

    this.logger.info("Use case executed successfully", {
      context: "ExecuteUseCase",
      entityId: saved.id,
    });

    return saved;
  }
}
```

**Key Patterns**:

1. **DI Constructor**: Inject repository, permission checker, logger
2. **Permission Check First**: Before any business logic
3. **Structured Logging**: Context and relevant data
4. **Domain Entity Creation**: Use factory methods
5. **Error Handling**: Descriptive errors with context
6. **Return Domain Entity**: Not DTOs (conversion in controller)

### Example: CreateOrganizationUnitUseCase

```typescript
@injectable()
export class CreateOrganizationUnitUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly orgUnitRepository: IOrganizationUnitRepository,

    @inject(DI_TOKENS.CheckPermissionUseCase)
    private readonly checkPermission: CheckPermissionUseCase,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: CreateOrgUnitInput): Promise<OrganizationUnit> {
    this.logger.info("Creating organization unit", {
      context: "CreateOrganizationUnitUseCase",
      userId: input.userId,
      name: input.name,
      code: input.code,
    });

    // Permission check
    const hasPermission = await this.checkPermission.execute({
      userId: input.userId,
      permission: PERMISSIONS.ORGANIZATION_UNITS_CREATE,
    });

    if (!hasPermission) {
      throw new Error("Permission denied: ORGANIZATION_UNITS_CREATE required");
    }

    // Duplicate code check
    const codeExists = await this.orgUnitRepository.existsByCode(input.code);
    if (codeExists) {
      throw new Error(
        `Organization unit with code '${input.code}' already exists`,
      );
    }

    // If has parent, validate parent exists
    if (input.parentId) {
      const parent = await this.orgUnitRepository.findById(input.parentId);
      if (!parent) {
        throw new Error(
          `Parent organization unit with ID ${input.parentId} not found`,
        );
      }

      // Validate level consistency
      if (input.level !== parent.level + 1) {
        throw new Error(`Level must be ${parent.level + 1} (parent level + 1)`);
      }
    }

    // Create entity
    const orgUnit = OrganizationUnit.create({
      name: input.name,
      code: input.code,
      parentId: input.parentId,
      unitType: input.unitType,
      level: input.level,
      managerId: input.managerId,
      costCenter: input.costCenter,
      isActive: input.isActive ?? true,
      note: input.note,
      metadata: input.metadata,
    });

    // Persist
    const saved = await this.orgUnitRepository.create(orgUnit);

    this.logger.info("Organization unit created successfully", {
      context: "CreateOrganizationUnitUseCase",
      orgUnitId: saved.id,
      code: saved.code,
    });

    return saved;
  }
}
```

---

## DI Container Configuration

**Location**: [`src/di/`](../../src/di/)

### Token Definition

**File**: [`src/di/types.ts`](../../src/di/types.ts)

```typescript
export const DI_TOKENS = {
  // Repositories
  IOrganizationUnitRepository: Symbol.for("IOrganizationUnitRepository"),
  IPersonRepository: Symbol.for("IPersonRepository"),
  IRoleRepository: Symbol.for("IRoleRepository"),
  IPersonRoleAssignmentRepository: Symbol.for(
    "IPersonRoleAssignmentRepository",
  ),
  ILocationRepository: Symbol.for("ILocationRepository"),
  IVendorRepository: Symbol.for("IVendorRepository"),
  IVendorContactRepository: Symbol.for("IVendorContactRepository"),
  ILifecycleModelRepository: Symbol.for("ILifecycleModelRepository"),
  ILifecycleStateRepository: Symbol.for("ILifecycleStateRepository"),
  ILifecycleTransitionRepository: Symbol.for("ILifecycleTransitionRepository"),
  IFieldDefinitionRepository: Symbol.for("IFieldDefinitionRepository"),

  // Use Cases - Organization
  CreateOrganizationUnitUseCase: Symbol.for("CreateOrganizationUnitUseCase"),
  GetOrganizationUnitUseCase: Symbol.for("GetOrganizationUnitUseCase"),
  ListOrganizationUnitsUseCase: Symbol.for("ListOrganizationUnitsUseCase"),
  UpdateOrganizationUnitUseCase: Symbol.for("UpdateOrganizationUnitUseCase"),
  DeleteOrganizationUnitUseCase: Symbol.for("DeleteOrganizationUnitUseCase"),

  // Use Cases - Person
  CreatePersonUseCase: Symbol.for("CreatePersonUseCase"),
  GetPersonUseCase: Symbol.for("GetPersonUseCase"),
  // ... all other use cases

  // Use Cases - Location
  // ... location use cases

  // Use Cases - Vendor
  // ... vendor use cases

  // Use Cases - Lifecycle
  // ... lifecycle use cases

  // Use Cases - Field Definition
  // ... field definition use cases
};
```

### Module Binding

**File**: [`src/di/modules/foundation.module.ts`](../../src/di/modules/foundation.module.ts)

```typescript
import { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repositories
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import { PrismaOrganizationUnitRepository } from "@/infrastructure/repositories/prisma-organization-unit.repository";
// ... all other repository imports

// Use Cases
import { CreateOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization/create-organization-unit.use-case";
// ... all other use case imports

export function bindFoundationDependencies(container: Container): void {
  // Bind Repositories (Singleton)
  container
    .bind<IOrganizationUnitRepository>(DI_TOKENS.IOrganizationUnitRepository)
    .to(PrismaOrganizationUnitRepository)
    .inSingletonScope();

  container
    .bind<IPersonRepository>(DI_TOKENS.IPersonRepository)
    .to(PrismaPersonRepository)
    .inSingletonScope();

  // ... all other repository bindings

  // Bind Use Cases (Transient - new instance per request)
  container
    .bind<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    )
    .to(CreateOrganizationUnitUseCase)
    .inTransientScope();

  container
    .bind<GetOrganizationUnitUseCase>(DI_TOKENS.GetOrganizationUnitUseCase)
    .to(GetOrganizationUnitUseCase)
    .inTransientScope();

  // ... all other use case bindings
}
```

**Scope Rules**:

- **Repositories**: `inSingletonScope()` - one instance shared across app
- **Use Cases**: `inTransientScope()` - new instance per request (default)
- **Services**: `inSingletonScope()` - shared instance (e.g., logger)

### Container Initialization

**File**: [`src/di/container.ts`](../../src/di/container.ts)

```typescript
import { Container } from "inversify";
import { bindDatabaseDependencies } from "./modules/database.module";
import { bindLoggerDependencies } from "./modules/logger.module";
import { bindFoundationDependencies } from "./modules/foundation.module";
// ... other module imports

let container: Container | null = null;

export function getContainer(): Container {
  if (!container) {
    container = new Container({ defaultScope: "Transient" });

    // Order matters: dependencies first
    bindLoggerDependencies(container);
    bindDatabaseDependencies(container);
    bindFoundationDependencies(container); // Foundation after database
    // ... other modules
  }

  return container;
}

export function resetContainer(): void {
  container = null;
}
```

**Initialization Order**:

1. Logger (required by all)
2. Database (Prisma client)
3. Foundation (depends on database)
4. RBAC (depends on foundation Role)
5. CMDB/Asset (depends on foundation - Layer 2)

---

## Controller Layer (Server Actions)

**Location**: [`src/interface-adapters/controllers/`](../../src/interface-adapters/controllers/)

### Controller Pattern

```typescript
"use server";

import { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./errors";
import type { CreateEntityUseCase } from "@/core/use-cases/...";
import {
  CreateEntityDTO,
  type EntityDTO,
} from "@/interface-adapters/dtos/entity.dto";
import { toEntityDTO } from "@/interface-adapters/dtos/entity.dto";
import type { ActionResponse } from "./types";

export async function createEntityAction(
  data: unknown,
): Promise<ActionResponse<EntityDTO>> {
  try {
    // 1. Validate input with Zod
    const validated = CreateEntityDTO.parse(data);

    // 2. Resolve use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateEntityUseCase>(
      DI_TOKENS.CreateEntityUseCase,
    );

    // 3. Execute use case
    const entity = await useCase.execute(validated);

    // 4. Convert domain entity to DTO
    const dto = toEntityDTO(entity);

    // 5. Return success response
    return { success: true, data: dto };
  } catch (error) {
    // 6. Handle errors
    return handleControllerError(error, "createEntityAction");
  }
}
```

**Key Patterns**:

1. **"use server" Directive**: Mark as server action
2. **Zod Validation**: Input validation with runtime type safety
3. **DI Container**: Resolve use case, never instantiate directly
4. **Domain → DTO**: Convert entity to DTO for client
5. **ActionResponse**: Discriminated union `{ success: true, data } | { success: false, error }`
6. **Error Handling**: Centralized via `handleControllerError()`

### Example: Organization Unit Controller

```typescript
"use server";

import { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./errors";
import {
  CreateOrganizationUnitDTO,
  UpdateOrganizationUnitDTO,
  ListOrganizationUnitsDTO,
  type OrganizationUnitDTO,
  toOrganizationUnitDTO,
} from "@/interface-adapters/dtos/generated/organization-unit.dto";
import type { ActionResponse, PaginatedResponse } from "./types";

export async function createOrganizationUnitAction(
  data: unknown,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    const validated = CreateOrganizationUnitDTO.parse(data);

    const container = getContainer();
    const useCase = container.get(DI_TOKENS.CreateOrganizationUnitUseCase);

    const orgUnit = await useCase.execute(validated);

    return { success: true, data: toOrganizationUnitDTO(orgUnit) };
  } catch (error) {
    return handleControllerError(error, "createOrganizationUnitAction");
  }
}

export async function getOrganizationUnitAction(
  id: string,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get(DI_TOKENS.GetOrganizationUnitUseCase);

    const orgUnit = await useCase.execute({ id });

    if (!orgUnit) {
      return {
        success: false,
        error: `Organization unit with ID ${id} not found`,
      };
    }

    return { success: true, data: toOrganizationUnitDTO(orgUnit) };
  } catch (error) {
    return handleControllerError(error, "getOrganizationUnitAction");
  }
}

export async function listOrganizationUnitsAction(
  filters: unknown,
): Promise<ActionResponse<PaginatedResponse<OrganizationUnitDTO>>> {
  try {
    const validated = ListOrganizationUnitsDTO.parse(filters);

    const container = getContainer();
    const useCase = container.get(DI_TOKENS.ListOrganizationUnitsUseCase);

    const result = await useCase.execute(validated);

    return {
      success: true,
      data: {
        items: result.items.map(toOrganizationUnitDTO),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    return handleControllerError(error, "listOrganizationUnitsAction");
  }
}

export async function updateOrganizationUnitAction(
  id: string,
  data: unknown,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    const validated = UpdateOrganizationUnitDTO.parse(data);

    const container = getContainer();
    const useCase = container.get(DI_TOKENS.UpdateOrganizationUnitUseCase);

    const orgUnit = await useCase.execute({ id, ...validated });

    return { success: true, data: toOrganizationUnitDTO(orgUnit) };
  } catch (error) {
    return handleControllerError(error, "updateOrganizationUnitAction");
  }
}

export async function deleteOrganizationUnitAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    const container = getContainer();
    const useCase = container.get(DI_TOKENS.DeleteOrganizationUnitUseCase);

    await useCase.execute({ id });

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(error, "deleteOrganizationUnitAction");
  }
}
```

---

## DTO Layer

**Location**: [`src/interface-adapters/dtos/generated/`](../../src/interface-adapters/dtos/generated/)

### DTO Pattern

```typescript
import { z } from "zod";
import type { Entity } from "@/core/domain/entities/entity.entity";

// ========================================
// Zod Schemas (Input Validation)
// ========================================

export const CreateEntityDTO = z.object({
  name: z.string().min(1).max(255),
  code: z.string().regex(/^[A-Z0-9-]+$/),
  isActive: z.boolean().optional(),
  userId: z.string(), // Required for permission check
});

export const UpdateEntityDTO = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  userId: z.string(),
});

export const ListEntityDTO = z.object({
  searchTerm: z.string().optional(),
  includeInactive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  userId: z.string(),
});

// ========================================
// TypeScript Types (Inferred from Zod)
// ========================================

export type CreateEntityDTO = z.infer<typeof CreateEntityDTO>;
export type UpdateEntityDTO = z.infer<typeof UpdateEntityDTO>;
export type ListEntityDTO = z.infer<typeof ListEntityDTO>;

// ========================================
// Output DTO (Response)
// ========================================

export interface EntityDTO {
  id: string; // bigint serialized to string for JSON
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ========================================
// Mapping Functions (Entity → DTO)
// ========================================

export function toEntityDTO(entity: Entity): EntityDTO {
  return {
    id: entity.id?.toString() ?? "",
    name: entity.name,
    code: entity.code,
    isActive: entity.isActive,
    createdAt: entity.createdAt?.toISOString() ?? "",
    updatedAt: entity.updatedAt?.toISOString() ?? "",
  };
}
```

**Key Patterns**:

1. **Zod Schemas**: Runtime validation + TypeScript type inference
2. **Separate Input/Output**: Create/Update DTOs vs. Output DTO
3. **Date Serialization**: Convert `Date` to ISO string
4. **Optional Fields**: `.optional()` for nullable fields
5. **Default Values**: `.default()` for pagination
6. **Validation Rules**: `.min()`, `.max()`, `.regex()`, etc.

---

## Testing Strategy

### Unit Testing Domain Entities

**Location**: [`src/core/domain/entities/__tests__/`](../../src/core/domain/entities/__tests__/)

```typescript
import { describe, it, expect } from "vitest";
import { OrganizationUnit } from "../organization-unit.entity";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

describe("OrganizationUnit Entity", () => {
  describe("create", () => {
    it("should create valid organization unit", () => {
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

    it("should trim name", () => {
      const orgUnit = OrganizationUnit.create({
        name: "  IT Department  ",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      expect(orgUnit.name).toBe("IT Department");
    });

    it("should uppercase code", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "it-dept",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      expect(orgUnit.code).toBe("IT-DEPT");
    });

    it("should reject empty name", () => {
      expect(() => {
        OrganizationUnit.create({
          name: "",
          code: "IT",
          unitType: OrganizationUnitType.DEPARTMENT,
          level: 2,
        });
      }).toThrow("Organization unit name is required");
    });

    it("should reject invalid code format", () => {
      expect(() => {
        OrganizationUnit.create({
          name: "IT Department",
          code: "invalid code!",
          unitType: OrganizationUnitType.DEPARTMENT,
          level: 2,
        });
      }).toThrow("Code must be uppercase alphanumeric with hyphens");
    });

    it("should reject level < 1", () => {
      expect(() => {
        OrganizationUnit.create({
          name: "IT Department",
          code: "IT",
          unitType: OrganizationUnitType.DEPARTMENT,
          level: 0,
        });
      }).toThrow("Level must be between 1 and 10");
    });

    it("should reject parent for level 1 unit", () => {
      expect(() => {
        OrganizationUnit.create({
          name: "Company",
          code: "COMPANY",
          unitType: OrganizationUnitType.COMPANY,
          level: 1,
          parentId: "parent-unit-id",
        });
      }).toThrow("Top-level unit (level 1) cannot have a parent");
    });
  });

  describe("business methods", () => {
    it("should activate unit", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        isActive: false,
      });

      orgUnit.activate();

      expect(orgUnit.isActive).toBe(true);
    });

    it("should deactivate unit", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        isActive: true,
      });

      orgUnit.deactivate();

      expect(orgUnit.isActive).toBe(false);
    });

    it("should update name with validation", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      orgUnit.updateName("Engineering Department");

      expect(orgUnit.name).toBe("Engineering Department");
    });

    it("should reject empty name update", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      expect(() => {
        orgUnit.updateName("");
      }).toThrow("Name cannot be empty");
    });
  });

  describe("persistence", () => {
    it("should convert to object", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        costCenter: "CC-IT-001",
      });

      orgUnit.setId("test-org-unit-123");

      const obj = orgUnit.toObject();

      expect(obj).toEqual({
        id: "test-org-unit-123",
        name: "IT Department",
        code: "IT",
        parentId: undefined,
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        managerId: undefined,
        costCenter: "CC-IT-001",
        isActive: true,
        note: undefined,
        metadata: undefined,
      });
    });

    it("should set ID only once", () => {
      const orgUnit = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      orgUnit.setId("test-org-unit-123");

      expect(() => {
        orgUnit.setId("test-org-unit-456");
      }).toThrow("Cannot change organization unit ID");
    });

    it("should compare entities by ID", () => {
      const orgUnit1 = OrganizationUnit.create({
        name: "IT Department",
        code: "IT",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      const orgUnit2 = OrganizationUnit.create({
        name: "HR Department",
        code: "HR",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
      });

      orgUnit1.setId("test-org-unit-123");
      orgUnit2.setId("test-org-unit-123");

      expect(orgUnit1.equals(orgUnit2)).toBe(true);
    });
  });
});
```

### Integration Testing Use Cases

**Location**: [`src/core/use-cases/foundation/__tests__/`](../../src/core/use-cases/foundation/__tests__/)

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getContainer, resetContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CreateOrganizationUnitUseCase } from "../organization/create-organization-unit.use-case";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

describe("CreateOrganizationUnitUseCase Integration", () => {
  let useCase: CreateOrganizationUnitUseCase;
  let repository: IOrganizationUnitRepository;
  let testUserId: string;

  beforeEach(() => {
    const container = getContainer();
    useCase = container.get(DI_TOKENS.CreateOrganizationUnitUseCase);
    repository = container.get(DI_TOKENS.IOrganizationUnitRepository);
    testUserId = "test-user-admin-id"; // Assume has permissions
  });

  afterEach(async () => {
    // Cleanup: delete test data
    resetContainer();
  });

  it("should create organization unit successfully", async () => {
    const result = await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: OrganizationUnitType.DEPARTMENT,
      level: 2,
      userId: testUserId,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Engineering");
    expect(result.code).toBe("ENG");
    expect(result.id).toBeDefined();
  });

  it("should prevent duplicate codes", async () => {
    await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: OrganizationUnitType.DEPARTMENT,
      level: 2,
      userId: testUserId,
    });

    await expect(
      useCase.execute({
        name: "Engineering 2",
        code: "ENG", // Duplicate
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        userId: testUserId,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("should enforce permission check", async () => {
    const unauthorizedUserId = "test-user-no-permissions";

    await expect(
      useCase.execute({
        name: "Engineering",
        code: "ENG",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        userId: unauthorizedUserId,
      }),
    ).rejects.toThrow(/Permission denied/);
  });

  it("should validate parent exists when creating child", async () => {
    const nonExistentParentId = "non-existent-parent-id";

    await expect(
      useCase.execute({
        name: "IT Team",
        code: "IT-TEAM",
        unitType: OrganizationUnitType.TEAM,
        level: 3,
        parentId: nonExistentParentId,
        userId: testUserId,
      }),
    ).rejects.toThrow(/Parent organization unit.*not found/);
  });

  it("should validate level consistency with parent", async () => {
    const parent = await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: OrganizationUnitType.DEPARTMENT,
      level: 2,
      userId: testUserId,
    });

    await expect(
      useCase.execute({
        name: "IT Team",
        code: "IT-TEAM",
        unitType: OrganizationUnitType.TEAM,
        level: 5, // Wrong level (should be 3)
        parentId: parent.id!,
        userId: testUserId,
      }),
    ).rejects.toThrow(/Level must be/);
  });
});
```

### Testing with Mock Repositories

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { CreateOrganizationUnitUseCase } from "../organization/create-organization-unit.use-case";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

describe("CreateOrganizationUnitUseCase Unit (with mocks)", () => {
  let useCase: CreateOrganizationUnitUseCase;
  let mockRepository: IOrganizationUnitRepository;
  let mockCheckPermission: CheckPermissionUseCase;
  let mockLogger: ILoggerService;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      create: vi.fn(),
      existsByCode: vi.fn(),
      findById: vi.fn(),
      // ... other methods
    } as unknown as IOrganizationUnitRepository;

    mockCheckPermission = {
      execute: vi.fn(),
    } as unknown as CheckPermissionUseCase;

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as ILoggerService;

    // Create use case with mocks
    useCase = new CreateOrganizationUnitUseCase(
      mockRepository,
      mockCheckPermission,
      mockLogger,
    );
  });

  it("should create organization unit when permission granted", async () => {
    // Arrange
    vi.mocked(mockCheckPermission.execute).mockResolvedValue(true);
    vi.mocked(mockRepository.existsByCode).mockResolvedValue(false);
    vi.mocked(mockRepository.create).mockImplementation(async (orgUnit) => {
      orgUnit.setId("test-org-unit-123");
      return orgUnit;
    });

    // Act
    const result = await useCase.execute({
      name: "Engineering",
      code: "ENG",
      unitType: OrganizationUnitType.DEPARTMENT,
      level: 2,
      userId: "test-user",
    });

    // Assert
    expect(result.id).toBe("test-org-unit-123");
    expect(mockCheckPermission.execute).toHaveBeenCalledWith({
      userId: "test-user",
      permission: expect.any(String),
    });
    expect(mockRepository.existsByCode).toHaveBeenCalledWith("ENG");
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it("should reject when permission denied", async () => {
    // Arrange
    vi.mocked(mockCheckPermission.execute).mockResolvedValue(false);

    // Act & Assert
    await expect(
      useCase.execute({
        name: "Engineering",
        code: "ENG",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        userId: "test-user",
      }),
    ).rejects.toThrow(/Permission denied/);

    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("should reject duplicate code", async () => {
    // Arrange
    vi.mocked(mockCheckPermission.execute).mockResolvedValue(true);
    vi.mocked(mockRepository.existsByCode).mockResolvedValue(true); // Code exists

    // Act & Assert
    await expect(
      useCase.execute({
        name: "Engineering",
        code: "ENG",
        unitType: OrganizationUnitType.DEPARTMENT,
        level: 2,
        userId: "test-user",
      }),
    ).rejects.toThrow(/already exists/);

    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});
```

---

## Performance Considerations

### Database Query Optimization

1. **Use Indexes**: All foreign keys, unique constraints, and filter fields indexed
2. **Limit Includes**: Only include relations when needed
3. **Pagination**: Always paginate list queries
4. **Select Specific Fields**: Use Prisma `select` when only subset needed

```typescript
// ❌ Bad: Over-fetching with includes
const orgUnit = await prisma.organizationUnit.findUnique({
  where: { id },
  include: {
    parent: true,
    children: true,
    persons: true,
    manager: true,
  },
});

// ✅ Good: Select only needed fields
const orgUnit = await prisma.organizationUnit.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    code: true,
    isActive: true,
  },
});

// ✅ Good: Include only when needed
const orgUnit = await prisma.organizationUnit.findUnique({
  where: { id },
  include: {
    parent: true, // Only include parent if needed
  },
});
```

### Repository Query Patterns

```typescript
// Efficient pagination
async search(options: SearchOptions): Promise<PaginatedResult<Entity>> {
  const { searchTerm, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    ...(searchTerm && {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } }
      ]
    })
  };

  // Parallel queries for count and data
  const [total, items] = await Promise.all([
    prisma.entity.count({ where }),
    prisma.entity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    })
  ]);

  return {
    items: items.map(this.mapToEntity),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
```

### Caching Strategy

Foundation data is relatively static, making it a good candidate for caching:

```typescript
// In-memory cache for frequently accessed data (example)
import { LRUCache } from 'lru-cache';

const orgUnitCache = new LRUCache<string, OrganizationUnit>({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

async findById(id: string): Promise<OrganizationUnit | null> {
  const cacheKey = `orgunit:${id}`;

  // Check cache
  const cached = orgUnitCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const found = await prisma.organizationUnit.findUnique({ where: { id } });
  if (!found) return null;

  const entity = this.mapToEntity(found);

  // Store in cache
  orgUnitCache.set(cacheKey, entity);

  return entity;
}
```

**Note**: Cache invalidation required on updates/deletes.

---

## Troubleshooting

### Common Development Issues

**Issue**: `Cannot find module '@/...'`
**Solution**: Ensure TypeScript path aliases configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Issue**: `No matching overload for inversify bind`
**Solution**: Ensure interface and implementation have matching method signatures. Check imports use `import type` for interfaces.

**Issue**: `Prisma relation ambiguity error`
**Solution**: Use named relations in schema:

```prisma
parent OrganizationUnit? @relation("OrgUnitHierarchy", fields: [parentId], references: [id])
children OrganizationUnit[] @relation("OrgUnitHierarchy")
```

**Issue**: `Permission denied despite admin role`
**Solution**: Check permission cache is up-to-date. Invalidate cache after role/permission changes:

```typescript
await invalidatePermissionCache(userId);
```

---

## Next Steps

With Layer 1 complete, proceed to implement Layer 2 (CMDB & Asset):

1. **CIClass Implementation**: Define CI classes using Foundation entities
2. **ConfigurationItem Implementation**: Create CIs referencing locations, persons, lifecycle models
3. **Asset Implementation**: Financial asset records referencing vendors, contracts

**See Also**:

- [Layer 2 Implementation Guide](./LAYER_2_IMPLEMENTATION.md) (Coming Soon)
- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md) - User-facing guide
- [Data Model](./DATA_MODEL.md) - Complete data model documentation

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Barq Assets Development Team
