# Database Schema Design Guide

**Last Updated**: November 2025

This document outlines the schema design conventions, patterns, and best practices used throughout the barq-assets application. Understanding these patterns is essential for maintaining consistency when adding new entities or modifying existing ones.

## Table of Contents

1. [ID Strategy](#id-strategy)
2. [Naming Conventions](#naming-conventions)
3. [Timestamp Conventions](#timestamp-conventions)
4. [Soft Delete Pattern](#soft-delete-pattern)
5. [Audit Trail Pattern](#audit-trail-pattern)
6. [Index Strategy](#index-strategy)
7. [Relation Patterns](#relation-patterns)
8. [JSON Field Usage](#json-field-usage)
9. [Migration Best Practices](#migration-best-practices)

---

## ID Strategy

### Current Approach: `cuid()`

All entities in the schema use **string-based CUID (Collision-resistant Unique Identifier)** for primary keys:

```prisma
model Example {
  id String @id @default(cuid())
  // ...
}
```

### Why CUID?

**Benefits**:

- ✅ **Distributed-safe**: No coordination needed between instances (unlike autoincrement sequences)
- ✅ **URL-safe**: Can be used directly in URLs without encoding
- ✅ **Time-sortable**: CUIDs are roughly time-ordered (prefix encodes timestamp)
- ✅ **Collision-resistant**: 25-character length provides excellent uniqueness guarantees
- ✅ **No database sequences**: Reduces database round-trips during bulk inserts
- ✅ **Framework-agnostic**: Works across any database (PostgreSQL, MySQL, SQLite, etc.)

**Tradeoffs**:

- ❌ Larger index size compared to BigInt (25 bytes vs 8 bytes)
- ❌ Not sequential (can fragment B-tree indexes slightly)
- ❌ Less human-readable than integers

### When to Use BigInt Autoincrement

**Not currently used in this project**, but consider for:

- High-volume transactional tables where index size matters
- Legacy integrations requiring integer IDs
- Tables requiring guaranteed sequential ordering

**Migration Note**: Historical documentation (ENTITY_REFERENCE.md, LAYER_1_IMPLEMENTATION.md) referenced `BigInt @id @default(autoincrement())` - this was an earlier design that has been fully replaced with CUID.

---

## Naming Conventions

### Model Names (Prisma)

Use **PascalCase** for model names:

```prisma
model OrganizationUnit { }
model PersonRoleAssignment { }
model LicenseAllocation { }
```

### Table Names (Database)

Map to **snake_case plural** table names using `@@map`:

```prisma
model OrganizationUnit {
  // ...
  @@map("organization_units")  // Plural snake_case
}

model Person {
  // ...
  @@map("persons")  // Note: not "people"
}
```

**Rules**:

- ✅ Always use plural form (e.g., `users`, `roles`, `contracts`)
- ✅ Multi-word models: separate with underscores (e.g., `organization_units`, `license_allocations`)
- ✅ Join tables: combine both entity names (e.g., `person_role_assignments`, `role_permissions`)

### Field Names

Use **camelCase** for all field names (both in Prisma and database):

```prisma
model Person {
  firstName       String
  lastName        String
  emailAddress    String?
  isActive        Boolean
  organizationId  String  // Foreign key suffix: "Id"
  createdAt       DateTime
  updatedAt       DateTime
}
```

**Rules**:

- ✅ Field names remain camelCase in PostgreSQL (no `@map` needed)
- ✅ Foreign key fields always end with `Id` (e.g., `userId`, `licenseEntitlementId`)
- ✅ Boolean fields use `is`/`has` prefix (e.g., `isActive`, `isSystem`, `hasAccess`)
- ✅ Timestamp fields use past-tense verbs (e.g., `createdAt`, `updatedAt`, `deletedAt`)

### Relation Names

```prisma
model User {
  // Forward relation: camelCase singular
  person Person?

  // Reverse relation: camelCase plural
  accounts Account[]
  sessions Session[]
}

model Person {
  // Forward relation
  user User? @relation(fields: [userId], references: [id])

  // Reverse relation
  roleAssignments PersonRoleAssignment[]
}
```

---

## Timestamp Conventions

### Standard Pattern

All entities **must include** both `createdAt` and `updatedAt`:

```prisma
model StandardEntity {
  id          String   @id @default(cuid())
  // ... business fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("standard_entities")
}
```

**Rules**:

- ✅ `createdAt`: Automatically set on insert via `@default(now())`
- ✅ `updatedAt`: Automatically updated on every modification via `@updatedAt`
- ✅ Always place timestamps at the end of field definitions (before relations)

### Exceptions and Special Cases

#### 1. Join Tables (Many-to-Many)

May have **only `createdAt`** if updates are rare:

```prisma
model RolePermission {
  roleId       String
  permissionId String
  createdAt    DateTime @default(now())
  // No updatedAt - join tables are typically immutable

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

#### 2. Audit/Event Tables

Use **`changedAt`** instead of `createdAt` for semantic clarity:

```prisma
model AuditLogEntry {
  id            String   @id @default(cuid())
  // ... audit fields
  changedAt     DateTime @default(now())  // Semantic: when change occurred
  // Note: No updatedAt - audit logs are immutable

  @@map("audit_log_entries")
}
```

#### 3. Temporal/Lifecycle Tables

May include additional temporal fields:

```prisma
model LicenseAllocation {
  id                String    @id @default(cuid())
  allocatedAt       DateTime  @default(now())  // Business timestamp
  deallocatedAt     DateTime?                  // Business timestamp
  createdAt         DateTime  @default(now())  // Technical timestamp
  updatedAt         DateTime  @updatedAt       // Technical timestamp

  @@map("license_allocations")
}
```

**Rule**: Separate business timestamps (e.g., `allocatedAt`, `effectiveStart`) from technical timestamps (`createdAt`, `updatedAt`).

---

## Soft Delete Pattern

### `isActive` Field

For entities requiring soft delete (logical deletion), use the `isActive` boolean field:

```prisma
model SoftDeletableEntity {
  id          String   @id @default(cuid())
  name        String
  isActive    Boolean  @default(true)  // Soft delete flag
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive])  // Always index for query performance
  @@map("soft_deletable_entities")
}
```

### When to Use `isActive`

**✅ Use for**:

- Core business entities (Person, OrganizationUnit, Vendor, Location)
- Configuration entities (Role, Permission, FieldDefinition)
- Master data (CIClass, AssetCategory, LifecycleState)
- Reference data with UI visibility (ContractType, AttachmentType, DataDomain)

**❌ Don't use for**:

- Pure join tables (RolePermission, UserRole)
- Immutable event logs (AuditLogEntry, StockMovement)
- System-generated data (Session, Account, Verification)

### Query Patterns

When querying soft-deletable entities:

```typescript
// ✅ Always filter by isActive in business logic
const activePersons = await prisma.person.findMany({
  where: { isActive: true },
});

// ❌ Don't forget the filter!
const allPersons = await prisma.person.findMany(); // Includes inactive!
```

### Indexing

Always add an index on `isActive` for performance:

```prisma
@@index([isActive])
```

Compound indexes for common queries:

```prisma
@@index([organizationId, isActive])  // Filter by org + active status
@@index([isActive, createdAt])       // Active items sorted by date
```

---

## Audit Trail Pattern

### AuditLogEntry Dual-Link Design

The `AuditLogEntry` model supports tracking changes made by both **Person** (organizational entity) and **User** (authentication entity):

```prisma
model AuditLogEntry {
  id              String   @id @default(cuid())
  targetType      TargetObjectTypeEnum  // What entity was changed
  targetId        String                // ID of changed entity
  fieldName       String?               // Which field changed
  oldValue        String?   @db.Text    // Previous value (JSON)
  newValue        String?   @db.Text    // New value (JSON)

  // Dual-link: Person (required) + User (optional)
  changedById     String                // Person.id (organizational actor)
  changedByUserId String?               // User.id (authentication actor)

  changedAt       DateTime  @default(now())
  sourceSystem    String?               // UI, API, Discovery, Import
  note            String?   @db.Text

  // Relations
  changedBy     Person @relation("AuditLogChangedBy", fields: [changedById], references: [id], onDelete: Restrict)
  changedByUser User?  @relation("AuditLogChangedByUser", fields: [changedByUserId], references: [id], onDelete: Restrict)

  @@index([targetType, targetId])
  @@index([changedById])
  @@index([changedByUserId])
  @@index([changedAt])
  @@map("audit_log_entries")
}
```

### Why Dual-Link?

**Person vs User**:

- **Person**: Organizational entity (employee, contractor, contact) - always present in audit
- **User**: Authentication entity (system login) - may or may not be linked to Person

**Use Cases**:

1. **Authenticated UI change**: Both `changedById` (Person) and `changedByUserId` (User) populated
2. **API change with auth**: Both populated (API token → User → Person)
3. **System import/discovery**: Only `changedById` (system Person created for "System Importer")
4. **Batch operation**: Only `changedById` (Person representing batch job owner)

### Referential Integrity

- ✅ **Person link**: Required (`changedById String`) - ensures organizational accountability
- ✅ **User link**: Optional (`changedByUserId String?`) - captures authentication context when available
- ✅ **Both use foreign keys**: Maintains referential integrity (no orphaned audit logs)
- ✅ **Restrict on delete**: Prevents deletion of Person/User with audit history

### Alternative Pattern: Polymorphic (Not Used)

We **rejected** the polymorphic pattern for audit logs:

```prisma
// ❌ NOT USED - No referential integrity
model AuditLogEntry {
  changedByType String  // "PERSON" | "USER"
  changedById   String  // No foreign key constraint
}
```

**Why rejected**: Loses referential integrity, harder to query, less type-safe.

---

## Index Strategy

### When to Add Indexes

Always index:

- ✅ Primary keys (automatic via `@id`)
- ✅ Foreign keys (for join performance)
- ✅ Unique constraints (automatic via `@unique`)
- ✅ Soft delete flags (`isActive`)
- ✅ Timestamp fields used for sorting/filtering
- ✅ Enum fields used for filtering
- ✅ Compound lookups (multiple fields frequently queried together)

### Index Patterns

#### 1. Single-Column Indexes

```prisma
model Example {
  code      String  @unique  // Automatic index
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())

  @@index([code])      // Redundant if @unique, but explicit is fine
  @@index([isActive])  // Performance for active-only queries
  @@index([createdAt]) // Performance for date-range queries
}
```

#### 2. Compound Indexes (Order Matters!)

```prisma
model OrganizationUnit {
  parentId  String?
  isActive  Boolean
  name      String

  // ✅ Correct: Most selective field first
  @@index([parentId, isActive])  // Filter by parent, then active

  // ❌ Less useful
  @@index([isActive, parentId])  // Less selective first
}
```

**Rule**: Order compound indexes from most to least selective.

#### 3. Foreign Key Indexes

```prisma
model Contract {
  vendorId       String
  contractTypeId String

  vendor       Vendor       @relation(fields: [vendorId], references: [id])
  contractType ContractType @relation(fields: [contractTypeId], references: [id])

  @@index([vendorId])       // Always index FKs
  @@index([contractTypeId])
}
```

#### 4. Polymorphic Indexes

```prisma
model LicenseAllocation {
  targetType AllocationTargetTypeEnum  // Person | CI | Asset
  targetId   String                    // Polymorphic FK (no constraint)

  // ✅ Index both fields together for polymorphic lookups
  @@index([targetType, targetId])
}
```

### Index Size Tradeoffs

**Benefits**:

- ✅ Faster queries (can avoid full table scans)
- ✅ Faster joins (indexed foreign keys)
- ✅ Faster sorts (indexed timestamp fields)

**Costs**:

- ❌ Slower inserts/updates (index must be updated)
- ❌ Disk space (indexes can be 30-50% of table size)
- ❌ Maintenance overhead (VACUUM, REINDEX)

**Rule**: Don't over-index. Only add indexes for queries you **know** will be common.

---

## Relation Patterns

### One-to-Many

```prisma
model Vendor {
  id        String   @id @default(cuid())
  // ...
  contracts Contract[]  // Reverse relation (plural)
}

model Contract {
  id       String @id @default(cuid())
  vendorId String

  vendor Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  //                                                            ^^^^^^^^^^^^^^^^
  //                                                            Deletion behavior
}
```

### Many-to-Many (Explicit Join Table)

```prisma
model Person {
  id               String                    @id @default(cuid())
  roleAssignments  PersonRoleAssignment[]    // Reverse relation
}

model Role {
  id               String                    @id @default(cuid())
  personAssignments PersonRoleAssignment[]   // Reverse relation
}

model PersonRoleAssignment {
  id        String   @id @default(cuid())
  personId  String
  roleId    String

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@index([personId])
  @@index([roleId])
  @@unique([personId, roleId])  // Prevent duplicate assignments
}
```

**Why explicit join table?** Allows temporal data (effectiveStart, effectiveEnd, note, metadata).

### Self-Referencing (Hierarchies)

```prisma
model OrganizationUnit {
  id       String             @id @default(cuid())
  parentId String?

  // Self-referencing relations
  parent   OrganizationUnit?  @relation("OrgUnitHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children OrganizationUnit[] @relation("OrgUnitHierarchy")

  @@index([parentId])
}
```

**Key details**:

- Named relation (`"OrgUnitHierarchy"`) required for self-references
- `onDelete: Restrict` prevents accidental deletion of parents with children
- Always index `parentId` for hierarchy traversal

### Deletion Behaviors

| Behavior   | Use Case                            | Example                                              |
| ---------- | ----------------------------------- | ---------------------------------------------------- |
| `Cascade`  | Child is meaningless without parent | `Contract` → `Vendor` deleted = delete all contracts |
| `Restrict` | Prevent deletion if children exist  | `Person` → Prevent delete if audit logs exist        |
| `SetNull`  | Child can exist without parent      | `Person.managerId` → Manager deleted = set to null   |
| `NoAction` | Database handles it (rare)          | Legacy systems                                       |

**Rule**: Use `Cascade` for owned relationships, `Restrict` for audit/history.

---

## JSON Field Usage

### When to Use JSON

**✅ Good use cases**:

- Semi-structured metadata (varies by entity type)
- API responses stored as-is
- Configuration objects (UI preferences, settings)
- Polymorphic data (different structures per type)

**❌ Avoid for**:

- Queryable/filterable data (use real columns)
- Highly structured data (use relations)
- Data requiring integrity constraints

### Pattern

```prisma
model FieldDefinition {
  id          String @id @default(cuid())
  name        String
  fieldType   String

  // JSON field for flexible configuration
  config      Json?  // { defaultValue, validation, options, etc. }
  metadata    Json?  // { category, tags, customData }
}
```

### Type Safety

Use Prisma helpers for type-safe JSON access:

```typescript
import {
  serializeJsonField,
  deserializeJsonField,
} from "@/infrastructure/database/prisma/prisma-helpers";

// Write
const config = { defaultValue: "foo", required: true };
await prisma.fieldDefinition.create({
  data: {
    name: "ExampleField",
    config: serializeJsonField(config), // Type-safe serialization
  },
});

// Read
const field = await prisma.fieldDefinition.findUnique({ where: { id } });
const config = deserializeJsonField<FieldConfig>(field.config); // Type-safe with Zod
```

**See**: [prisma-helpers.ts](../../src/infrastructure/database/prisma/prisma-helpers.ts) for implementation.

---

## Migration Best Practices

### Safe Migrations

**Always safe** (can roll forward without data loss):

- ✅ Adding nullable columns
- ✅ Adding columns with defaults
- ✅ Adding indexes
- ✅ Creating new tables

**Potentially unsafe** (may lose data or fail):

- ⚠️ Dropping columns (data loss!)
- ⚠️ Changing column types (may fail if incompatible)
- ⚠️ Adding non-nullable columns without defaults (fails if table not empty)
- ⚠️ Removing indexes (performance regression)

### Migration Workflow

```bash
# 1. Modify schema.prisma
# 2. Generate migration
npx prisma migrate dev --name descriptive_migration_name

# 3. Review generated SQL
cat src/infrastructure/database/prisma/migrations/XXXXXX_descriptive_migration_name/migration.sql

# 4. Test migration on copy of production data
# 5. Apply to production
npx prisma migrate deploy
```

### Naming Migrations

Use **verb + subject** format:

```bash
# ✅ Good
add_timestamps_to_license_allocation
add_isactive_to_reference_models
add_user_link_to_audit_log

# ❌ Bad
update_schema
fixes
new_fields
```

### Backward Compatibility

**Adding fields**:

```prisma
// ✅ Nullable or with default
newField  String?           // Safe: nullable
newField  Boolean @default(true)  // Safe: has default

// ❌ Required without default
newField  String  // FAILS if table not empty!
```

**Removing fields**: Use two-step process:

1. Mark as deprecated, make nullable
2. Wait for code deployment
3. Remove field in separate migration

---

## Summary Checklist

When creating a new entity, ensure:

- [ ] Uses `String @id @default(cuid())` for primary key
- [ ] Model name is PascalCase
- [ ] Table name is snake_case plural via `@@map("table_name")`
- [ ] All fields use camelCase
- [ ] Includes `createdAt DateTime @default(now())`
- [ ] Includes `updatedAt DateTime @updatedAt`
- [ ] Includes `isActive Boolean @default(true)` if soft-deletable
- [ ] Foreign keys end with `Id` suffix
- [ ] All foreign keys have `@@index()`
- [ ] `isActive` has `@@index()` if present
- [ ] Timestamp fields have `@@index()` if used for queries
- [ ] Relations use appropriate `onDelete` behavior
- [ ] Self-references use named relations
- [ ] JSON fields use type-safe helpers
- [ ] Migration name is descriptive
- [ ] Migration is backward-compatible

---

## Related Documentation

- [Database Migrations & Deployment](../guides/DATABASE_MIGRATIONS.md) - Migration workflow and production deployment
- [Architecture Guide](./ARCHITECTURE.md) - Clean Architecture patterns
- [Foundation Layer](../guides/FOUNDATION_LAYER.md) - Layer 1 entities reference implementation
- [Developer Guide](../guides/DEVELOPER_GUIDE.md) - Development workflow

---

**Questions or suggestions?** Update this guide when you discover new patterns or conventions.
