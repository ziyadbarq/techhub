# Multi-Tenancy Data Isolation

## Overview

Enhance data isolation across organizational units to prevent cross-tenant data leakage if system is extended to multiple business units with strict isolation requirements.

## Current State

- **Implemented**: 5 repositories with `orgUnitId` filtering
  - Person, ConfigurationItem, AssetReservation, DataOwnership, OrganizationUnit
- **Missing**: Asset, Contract, License, Vendor repositories
- **Risk**: Current risk is LOW (single organization deployment), future risk is HIGH

## Organizational Structure

```
OrganizationUnit (hierarchical)
  ├─ id, parentId, level
  ├─ level 1: Company
  ├─ level 2: Business Unit
  ├─ level 3: Department
  └─ level 4: Team
```

All persons belong to an orgUnit; assets/contracts/licenses should too.

## Proposed Solution

### 1. Add orgUnitId to Critical Entities

**Schema changes** (`prisma/schema/`):

```prisma
// assets.prisma
model Asset {
  id           String  @id
  orgUnitId    String  // Add this field
  orgUnit      OrganizationUnit @relation(fields: [orgUnitId], references: [id])
  // ... existing fields

  @@index([orgUnitId])
  @@map("assets")
}

// contracts.prisma
model Contract {
  id           String  @id
  orgUnitId    String  // Add this field
  orgUnit      OrganizationUnit @relation(fields: [orgUnitId], references: [id])
  // ... existing fields

  @@index([orgUnitId])
  @@map("contracts")
}

// licenses.prisma
model LicenseProduct {
  id           String  @id
  orgUnitId    String  // Add this field
  orgUnit      OrganizationUnit @relation(fields: [orgUnitId], references: [id])
  // ... existing fields

  @@index([orgUnitId])
  @@map("license_products")
}
```

### 2. Create Query Filtering Middleware

**New file**: `src/infrastructure/middleware/org-unit-filter.middleware.ts`

```typescript
export function applyOrgUnitFilter<T>(
  userId: string,
  baseWhere: T
): T & { orgUnitId?: string } {
  const userOrgUnitId = getUserOrgUnitId(userId);

  return {
    ...baseWhere,
    orgUnitId: userOrgUnitId,
  };
}

// Helper to get user's orgUnitId from session
async function getUserOrgUnitId(userId: string): Promise<string> {
  const person = await prisma.person.findFirst({
    where: { userId },
    select: { orgUnitId: true }
  });
  return person?.orgUnitId || DEFAULT_ORG_UNIT_ID;
}
```

### 3. Update Repository Methods

**Pattern** (for ALL repositories):

```typescript
// Before
async findAll(): Promise<Asset[]> {
  return await this.prisma.asset.findMany({
    where: { deletedAt: null },
  });
}

// After
async findAll(userId: string): Promise<Asset[]> {
  return await this.prisma.asset.findMany({
    where: applyOrgUnitFilter(userId, { deletedAt: null }),
  });
}
```

**Files to update**:
- `src/infrastructure/repositories/prisma-asset.repository.ts`
- `src/infrastructure/repositories/prisma-contract.repository.ts`
- `src/infrastructure/repositories/prisma-license.repository.ts`
- `src/infrastructure/repositories/prisma-vendor.repository.ts`
- All other entity repositories

### 4. Add Integration Tests

**New file**: `src/__tests__/multi-tenancy/data-isolation.test.ts`

```typescript
describe('Multi-Tenancy Data Isolation', () => {
  it('should not allow user from BU1 to access BU2 assets', async () => {
    const bu1User = await createUser({ orgUnitId: 'bu1' });
    const bu2Asset = await createAsset({ orgUnitId: 'bu2' });

    const result = await listAssetsAction(bu1User.id);
    expect(result.data).not.toContainEqual(
      expect.objectContaining({ id: bu2Asset.id })
    );
  });

  it('should only show contracts from same orgUnit', async () => {
    // Test contract isolation
  });

  it('should only show licenses from same orgUnit', async () => {
    // Test license isolation
  });
});
```

## Implementation Steps

1. **Phase 1**: Database migration
   - Add `orgUnitId` column to Asset, Contract, License, Vendor tables
   - Add indexes for performance
   - Backfill existing records with default orgUnitId

2. **Phase 2**: Middleware creation
   - Create `org-unit-filter.middleware.ts`
   - Add helper to get user's orgUnitId
   - Test middleware in isolation

3. **Phase 3**: Repository updates
   - Update all findMany/findFirst queries
   - Add orgUnitId parameter to all methods
   - Update use cases to pass userId down

4. **Phase 4**: Integration tests
   - Create comprehensive test suite
   - Test all repositories for isolation
   - Test edge cases (null orgUnitId, cross-tenant queries)

5. **Phase 5**: Rollout
   - Enable in staging first
   - Monitor for data isolation issues
   - Deploy to production

## Benefits

- **Security**: Prevents cross-tenant data leakage
- **Compliance**: Meets data residency requirements
- **Scalability**: Enables multi-business-unit deployment
- **Audit**: Easy to track data access by orgUnit

## Considerations

- **Breaking change**: Requires migration for existing data
- **Performance**: Index on `orgUnitId` needed for fast queries
- **System admins**: May need special "view all orgUnits" permission
- **Reports**: Cross-orgUnit reports need special handling
