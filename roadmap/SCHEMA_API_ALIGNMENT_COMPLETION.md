# Schema-API Alignment Completion: Phases 5-8

**Status**: Planned
**Priority**: High
**Complexity**: Large (10 entities, 100+ files across all layers)
**Estimated Effort**: 6-8 days
**Related**: Schema-API alignment project (Phases 1-4 completed)

## Overview

Complete the schema-API alignment project by implementing the remaining 4 phases:
- **Phase 5**: Governance Features (4 entities) - Data domains, ownership, and verification campaigns
- **Phase 6**: Attachments System (3 entities) - File attachments for all entities
- **Phase 7**: Standalone APIs (optional) - Sub-entity CRUD endpoints
- **Phase 8**: Testing & Documentation - Comprehensive test coverage and guides

**Current Progress**: 18/27 phases complete (67%)

## Business Requirements

### Phase 5: Governance Features

**Why This Matters for Barq (Financial Services)**:
- **SAMA Compliance**: Saudi Central Bank requires strong data governance and accountability
- **Regulatory Audits**: Prove data ownership and regular verification for compliance
- **Risk Management**: Track which assets/CIs handle regulated data (PII, financial data, payment card data)
- **Incident Response**: Know immediately who to contact when issues arise

**Entities to Implement**:

1. **DataDomain** - Define logical data classifications
   - Examples: "Customer PII" (GDPR/PDPL), "Financial Data" (SAMA), "Payment Card Data" (PCI-DSS)
   - Track which systems handle regulated data
   - Enable policy enforcement based on data classification

2. **DataOwnership** - Assign accountability for data domains
   - Map data domains to CI classes or asset categories
   - Assign ownership to persons or organizational units
   - Answer "Who owns financial data?" for audits

3. **VerificationCampaign** - Scheduled audit/review processes
   - Create campaigns like "Q1 2025 Finance Asset Verification"
   - Define scope with filters (location, category, data domain)
   - Track completion and generate compliance reports

4. **VerificationItem** - Individual verification tasks
   - Each asset/CI in campaign becomes a verification item
   - Track status: PENDING → IN_PROGRESS → VERIFIED/EXCEPTION
   - Capture verifier notes and timestamp for audit trail

### Phase 6: Attachments System

**Why This Matters**:
- **Compliance Documentation**: Attach certificates, audit reports, licenses to assets/CIs
- **Purchase Records**: Store invoices, receipts, quotes with assets
- **Warranty/Contract Documents**: Link PDFs directly to warranty or contract records
- **Disposal Certificates**: Attach data sanitization certificates to disposal records
- **Audit Trail**: Prove documentation exists for regulatory reviews

**Entities to Implement**:

1. **AttachmentType** - Define allowed attachment types
   - Examples: "Invoice", "Certificate", "License", "Audit Report", "Photo"
   - Configure allowed file extensions per type
   - Set max file size limits

2. **Attachment** - Store file metadata and paths
   - Polymorphic: Can attach to any entity (Asset, CI, Contract, Warranty, etc.)
   - Store file metadata (name, size, MIME type, upload date)
   - Track uploader and description
   - File storage path (local filesystem or S3-compatible)

3. **Integration** - Connect attachments to existing entities
   - Update all major entities to support attachments
   - Add attachment counts to list views
   - Create reusable attachment upload/viewer components

### Phase 7: Standalone APIs (Optional)

**Why This Matters**:
- **API Completeness**: Currently sub-entities are managed through parent entities
- **Frontend Flexibility**: Enable direct CRUD on sub-entities when needed
- **Developer Experience**: Consistent API patterns across all entities

**Examples**:
- Direct CRUD for `LicenseProductField` (currently only via `LicenseProduct`)
- Direct CRUD for `AssetCategoryField` (currently only via `AssetCategory`)
- Direct CRUD for `CIClassField` (currently only via `CIClass`)

### Phase 8: Testing & Documentation

**Why This Matters**:
- **Reliability**: Ensure new entities work correctly under all conditions
- **Maintainability**: Tests catch regressions when refactoring
- **Onboarding**: New developers understand patterns and usage

**Deliverables**:
- Unit tests for all use cases (target: 80%+ coverage)
- Integration tests for repository layer
- API endpoint tests for controllers
- Documentation guides for each new module

## Technical Design

### Phase 5: Governance Features

#### Database Schema

**Already in schema.prisma**:
```prisma
model DataDomain {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dataOwnerships DataOwnership[]
}

model DataOwnership {
  id              String   @id @default(cuid())
  dataDomainId    String
  ciClassId       String?
  assetCategoryId String?
  ownerPersonId   String?
  ownerOrgUnitId  String?
  note            String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model VerificationCampaign {
  id               String               @id @default(cuid())
  name             String
  description      String?              @db.Text
  targetType       TargetObjectTypeEnum // CI or ASSET
  filterDefinition Json?
  scheduledStart   DateTime
  scheduledEnd     DateTime?
  createdById      String
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  items            VerificationItem[]
}

model VerificationItem {
  id                     String                 @id @default(cuid())
  verificationCampaignId String
  targetType             TargetObjectTypeEnum
  targetId               String
  verifierPersonId       String?
  status                 VerificationStatusEnum
  verifiedAt             DateTime?
  comment                String?                @db.Text
  createdAt              DateTime               @default(now())
  updatedAt              DateTime               @updatedAt
}

enum VerificationStatusEnum {
  PENDING
  IN_PROGRESS
  VERIFIED
  EXCEPTION
}
```

#### Implementation Pattern (Per Entity)

Follow the same pattern used for License entities (Phases 4.1-4.4):

**Files to Create** (13 per entity × 4 entities = 52 files):

1. **Domain Layer** (`src/core/domain/entities/`)
   - `data-domain.entity.ts`
   - `data-ownership.entity.ts`
   - `verification-campaign.entity.ts`
   - `verification-item.entity.ts`

2. **Repository Interface** (`src/core/repositories/`)
   - `data-domain.repository.interface.ts`
   - `data-ownership.repository.interface.ts`
   - `verification-campaign.repository.interface.ts`
   - `verification-item.repository.interface.ts`

3. **Repository Implementation** (`src/infrastructure/repositories/`)
   - `prisma-data-domain.repository.ts`
   - `prisma-data-ownership.repository.ts`
   - `prisma-verification-campaign.repository.ts`
   - `prisma-verification-item.repository.ts`

4. **Use Cases** (`src/core/use-cases/governance/`)
   - `data-domain/` (5 use cases: create, get, list, update, delete + `index.ts`)
   - `data-ownership/` (5 use cases + `index.ts`)
   - `verification-campaign/` (7 use cases: CRUD + start, complete, report + `index.ts`)
   - `verification-item/` (6 use cases: CRUD + verify, flag-exception + `index.ts`)

5. **DTOs** (`src/interface-adapters/dtos/generated/`)
   - `data-domain.dto.ts`
   - `data-ownership.dto.ts`
   - `verification-campaign.dto.ts`
   - `verification-item.dto.ts`

6. **Presenters** (`src/interface-adapters/presenters/`)
   - `data-domain.presenter.ts`
   - `data-ownership.presenter.ts`
   - `verification-campaign.presenter.ts`
   - `verification-item.presenter.ts`

7. **Controllers** (`src/interface-adapters/controllers/`)
   - `data-domain.controller.ts`
   - `data-ownership.controller.ts`
   - `verification-campaign.controller.ts`
   - `verification-item.controller.ts`

8. **DI Bindings**
   - Create `src/di/modules/governance.module.ts`
   - Add to `src/di/container.ts`
   - Add tokens to `src/di/types.ts`

9. **Permissions** (`src/core/domain/value-objects/permission-key.ts`)
   - `DATA_DOMAINS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
   - `DATA_OWNERSHIPS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
   - `VERIFICATION_CAMPAIGNS_*` (VIEW, CREATE, UPDATE, DELETE, START, COMPLETE, MANAGE)
   - `VERIFICATION_ITEMS_*` (VIEW, UPDATE, VERIFY, FLAG_EXCEPTION, MANAGE)

#### Key Business Logic

**DataDomain Entity**:
```typescript
class DataDomain {
  activate(): void
  deactivate(): void
  updateCode(code: string): void  // Validates format (uppercase, alphanumeric + underscores)
}
```

**DataOwnership Entity**:
```typescript
class DataOwnership {
  hasOwner(): boolean              // Check if owner is assigned
  isOwnedByPerson(): boolean
  isOwnedByOrgUnit(): boolean
  appliesToCIClass(): boolean
  appliesToAssetCategory(): boolean
  assignOwner(type: 'person' | 'orgunit', id: string): void
}
```

**VerificationCampaign Entity**:
```typescript
class VerificationCampaign {
  isActive(asOfDate?: Date): boolean
  isCompleted(): boolean
  hasStarted(): boolean
  start(): void                    // Mark campaign as started
  complete(): void                 // Finalize campaign
  calculateProgress(): { total: number; verified: number; exceptions: number; pending: number }
}
```

**VerificationItem Entity**:
```typescript
class VerificationItem {
  isPending(): boolean
  isInProgress(): boolean
  isVerified(): boolean
  isException(): boolean
  startVerification(): void        // PENDING → IN_PROGRESS
  verify(comment?: string): void   // → VERIFIED
  flagException(comment: string): void  // → EXCEPTION
}
```

### Phase 6: Attachments System

#### Database Schema

**Already in schema.prisma**:
```prisma
model AttachmentType {
  id                String   @id @default(cuid())
  name              String   @unique
  allowedExtensions String[] // e.g., ["pdf", "jpg", "png"]
  maxFileSizeMB     Int      // Maximum file size in megabytes
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  attachments       Attachment[]
}

model Attachment {
  id               String          @id @default(cuid())
  attachmentTypeId String
  targetType       TargetObjectTypeEnum
  targetId         String
  fileName         String
  fileSize         Int             // Size in bytes
  mimeType         String
  storagePath      String          // File path or S3 key
  uploadedById     String
  description      String?         @db.Text
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  attachmentType AttachmentType
  uploadedBy     Person
}
```

#### File Storage Strategy

**Local Filesystem** (Phase 6 initial implementation):
```typescript
// Store files in: /public/uploads/{year}/{month}/{cuid}.{ext}
// Example: /public/uploads/2025/01/clq1234567890abcdef.pdf

interface FileStorageService {
  uploadFile(file: File, type: AttachmentType): Promise<string>;  // Returns storagePath
  deleteFile(storagePath: string): Promise<void>;
  getFileUrl(storagePath: string): string;  // Returns public URL
}
```

**Future Enhancement**: S3-compatible storage (MinIO, AWS S3, DigitalOcean Spaces)

#### Entity-Attachment Relationships

**Polymorphic Pattern**:
```typescript
// Attachments can be linked to ANY entity via targetType + targetId
// No foreign keys needed - application-level relationship

interface AttachmentTarget {
  targetType: 'ASSET' | 'CI' | 'CONTRACT' | 'WARRANTY' | 'DISPOSAL' | ...;
  targetId: string;
}
```

#### Implementation Files (25 files)

**Phase 6.1: AttachmentType Entity** (13 files):
- Entity, repository interface/implementation
- 5 use cases (CRUD + list)
- DTO, presenter, controller
- DI bindings, permissions

**Phase 6.2: Attachment Entity** (13 files):
- Entity with file validation logic
- Repository interface/implementation
- 6 use cases (CRUD + upload, download)
- DTO, presenter, controller
- DI bindings, permissions

**Phase 6.3: Integration** (varies):
- Add `getAttachmentCount()` helper to repositories
- Create reusable attachment components:
  - `<AttachmentUploader>`
  - `<AttachmentList>`
  - `<AttachmentViewer>`
- Update entity detail pages to show attachments

### Phase 7: Standalone APIs

**Pattern**: Convert nested operations to standalone endpoints

**Example: LicenseProductField**

Currently (nested):
```typescript
// Only accessible via parent
POST   /api/license-products/{id}/fields
GET    /api/license-products/{id}/fields
PUT    /api/license-products/{id}/fields/{fieldId}
DELETE /api/license-products/{id}/fields/{fieldId}
```

After Phase 7 (standalone):
```typescript
// Direct access
POST   /api/license-product-fields
GET    /api/license-product-fields?licenseProductId={id}
GET    /api/license-product-fields/{id}
PUT    /api/license-product-fields/{id}
DELETE /api/license-product-fields/{id}
```

**Entities to Convert** (8 entities):
- LicenseProductField
- AssetCategoryField
- CIClassField
- RelationshipTypeScope
- ContractLinkedObject
- AssetKitItem
- AssetKitCheckoutItem
- DisposalDocument

**Implementation**: Controllers already exist, just expose them via API routes

### Phase 8: Testing & Documentation

#### Testing Strategy

**Unit Tests** (`__tests__/unit/`):
```typescript
describe('DataDomain Entity', () => {
  describe('create', () => {
    it('should create valid data domain');
    it('should reject invalid code format');
    it('should uppercase code automatically');
  });

  describe('activate/deactivate', () => {
    it('should toggle isActive status');
  });
});

describe('CreateDataDomainUseCase', () => {
  it('should create data domain');
  it('should reject duplicate name');
  it('should reject duplicate code');
});
```

**Integration Tests** (`__tests__/integration/`):
```typescript
describe('DataDomain Repository', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should persist and retrieve data domain');
  it('should enforce unique constraints');
  it('should cascade delete to data ownerships');
});
```

**API Tests** (`__tests__/api/`):
```typescript
describe('POST /api/data-domains', () => {
  it('should create data domain with valid data', async () => {
    const response = await request(app)
      .post('/api/data-domains')
      .send({ name: 'Test Domain', code: 'TEST' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });

  it('should require permissions', async () => {
    // Test without auth
    await request(app)
      .post('/api/data-domains')
      .send({ name: 'Test', code: 'TEST' })
      .expect(403);
  });
});
```

**Coverage Target**: 80%+ for critical paths (use cases, entities)

#### Documentation Deliverables

**Developer Guides** (`docs/guides/`):
- `GOVERNANCE_SYSTEM.md` - Complete guide to Phase 5 entities
- `ATTACHMENTS_SYSTEM.md` - File upload/storage patterns
- `API_REFERENCE.md` - Complete API documentation with examples

**Architecture Updates** (`docs/architecture/`):
- Update `ARCHITECTURE.md` with new modules
- Update `DATABASE_SCHEMA.md` with new tables

**User Guides** (MDX in `src/content/docs/`):
- Data Domains & Ownership setup
- Verification Campaigns workflow
- Attachment management

## Implementation Checklist

### Phase 5: Governance Features

#### Phase 5.1: DataDomain Entity
- [ ] Create entity with business logic (activate, deactivate, code validation)
- [ ] Create repository interface (10 methods)
- [ ] Create Prisma repository implementation
- [ ] Create 5 use cases (create, get, list, update, delete)
- [ ] Create barrel export (`index.ts`)
- [ ] Create DTOs with Zod validation
- [ ] Create presenter (toDTO, toDTOList)
- [ ] Create controller with 5 server actions
- [ ] Add repository binding to DI (singleton scope)
- [ ] Add use case bindings to DI (transient scope)
- [ ] Add DI tokens to types.ts
- [ ] Add 5 permissions to permission-key.ts

#### Phase 5.2: DataOwnership Entity
- [ ] Create entity with polymorphic ownership logic
- [ ] Create repository interface (12 methods including findByDataDomain, findByOwner, findByTarget)
- [ ] Create Prisma repository implementation
- [ ] Create 5 use cases + findByDataDomain, findByOwner
- [ ] Create barrel export
- [ ] Create DTOs with validation (ensure only one owner type, only one target type)
- [ ] Create presenter
- [ ] Create controller with 7 server actions
- [ ] Add DI bindings (repository + use cases)
- [ ] Add DI tokens
- [ ] Add 5 permissions

#### Phase 5.3: VerificationCampaign Entity
- [ ] Create entity with campaign lifecycle logic
- [ ] Create repository interface (10 methods including findActive, findByCreator)
- [ ] Create Prisma repository implementation
- [ ] Create 7 use cases (CRUD + start, complete, getCampaignReport)
- [ ] Create barrel export
- [ ] Create DTOs (filterDefinition as JSON)
- [ ] Create presenter with progress calculation
- [ ] Create controller with 7 server actions
- [ ] Add DI bindings
- [ ] Add DI tokens
- [ ] Add 7 permissions (add START, COMPLETE)

#### Phase 5.4: VerificationItem Entity
- [ ] Create entity with status transition logic (PENDING→IN_PROGRESS→VERIFIED/EXCEPTION)
- [ ] Create repository interface (12 methods including findByCampaign, countByStatus)
- [ ] Create Prisma repository implementation
- [ ] Create 6 use cases (CRUD + verify, flagException)
- [ ] Create barrel export
- [ ] Create DTOs with status enum validation
- [ ] Create presenter
- [ ] Create controller with 6 server actions
- [ ] Add DI bindings
- [ ] Add DI tokens
- [ ] Add 6 permissions (add VERIFY, FLAG_EXCEPTION)

#### Phase 5 Integration
- [ ] Create `src/di/modules/governance.module.ts`
- [ ] Register governance module in container.ts
- [ ] Test all 4 entities with sample data
- [ ] Verify permission checks work correctly

### Phase 6: Attachments System

#### Phase 6.1: AttachmentType Entity
- [ ] Create entity with file validation logic
- [ ] Create repository interface
- [ ] Create Prisma repository
- [ ] Create 5 use cases
- [ ] Create barrel export
- [ ] Create DTOs (allowedExtensions as array)
- [ ] Create presenter
- [ ] Create controller
- [ ] Add DI bindings
- [ ] Add DI tokens
- [ ] Add permissions

#### Phase 6.2: Attachment Entity with File Storage
- [ ] Create entity with file metadata
- [ ] Create FileStorageService interface
- [ ] Create LocalFileStorageService implementation
- [ ] Create repository interface
- [ ] Create Prisma repository
- [ ] Create 6 use cases (CRUD + upload, download, getByTarget)
- [ ] Create barrel export
- [ ] Create DTOs with file upload validation
- [ ] Create presenter
- [ ] Create controller with file upload handling
- [ ] Add DI bindings
- [ ] Add DI tokens
- [ ] Add permissions
- [ ] Create upload directory structure
- [ ] Add file cleanup on delete

#### Phase 6.3: Integration with Existing Entities
- [ ] Add attachment count to entity DTOs (Asset, CI, Contract, etc.)
- [ ] Create `<AttachmentUploader>` component
- [ ] Create `<AttachmentList>` component
- [ ] Create `<AttachmentViewer>` component
- [ ] Add attachment sections to entity detail pages (5-10 pages)
- [ ] Test file upload/download flows
- [ ] Test file validation (type, size)

#### Phase 6 Integration
- [ ] Create `src/di/modules/attachments.module.ts`
- [ ] Register attachments module in container.ts
- [ ] Test attachment workflows end-to-end
- [ ] Document file storage conventions

### Phase 7: Standalone APIs (Optional)

- [ ] Review all sub-entity controllers
- [ ] Create API routes for standalone access
- [ ] Update OpenAPI/Swagger documentation
- [ ] Test new endpoints
- [ ] Update frontend to use standalone APIs where beneficial

### Phase 8: Testing & Documentation

#### Testing
- [ ] Write unit tests for Phase 5 entities (4 entities × 10 tests = 40 tests)
- [ ] Write unit tests for Phase 5 use cases (23 use cases × 5 tests = 115 tests)
- [ ] Write integration tests for Phase 5 repositories (4 repos × 8 tests = 32 tests)
- [ ] Write API tests for Phase 5 controllers (4 controllers × 10 tests = 40 tests)
- [ ] Write unit tests for Phase 6 entities (2 entities × 10 tests = 20 tests)
- [ ] Write unit tests for Phase 6 use cases (11 use cases × 5 tests = 55 tests)
- [ ] Write integration tests for Phase 6 (file storage + repositories)
- [ ] Write API tests for Phase 6 (file upload/download)
- [ ] Run full test suite and achieve 80%+ coverage
- [ ] Set up CI to run tests automatically

#### Documentation
- [ ] Write `GOVERNANCE_SYSTEM.md` developer guide
- [ ] Write `ATTACHMENTS_SYSTEM.md` developer guide
- [ ] Update `ARCHITECTURE.md` with Governance and Attachments modules
- [ ] Update `DATABASE_SCHEMA.md` with new tables
- [ ] Create MDX user guides for Phase 5 features
- [ ] Create MDX user guides for Phase 6 features
- [ ] Update `CLAUDE.md` with new patterns
- [ ] Create API reference documentation
- [ ] Add inline code documentation for complex logic

## Testing Strategy

### Test Categories

1. **Unit Tests** - Entities and use cases in isolation
2. **Integration Tests** - Repository layer with real database
3. **API Tests** - Controller endpoints with authentication
4. **E2E Tests** (future) - Complete user workflows

### Test Utilities

**Test Factories**:
```typescript
// __tests__/factories/
export const createTestDataDomain = (overrides?: Partial<DataDomainProps>) => {
  return DataDomain.create({
    name: 'Test Domain',
    code: 'TEST',
    description: 'Test description',
    ...overrides
  });
};
```

**Database Cleanup**:
```typescript
// __tests__/helpers/
export async function cleanDatabase() {
  await prisma.verificationItem.deleteMany();
  await prisma.verificationCampaign.deleteMany();
  await prisma.dataOwnership.deleteMany();
  await prisma.dataDomain.deleteMany();
  // ... etc
}
```

## Risk & Considerations

### Technical Risks

1. **File Storage Complexity**
   - **Risk**: File uploads/downloads can be slow or fail
   - **Mitigation**: Implement proper error handling, file validation, and cleanup on failure
   - **Future**: Consider S3-compatible storage for production

2. **Polymorphic Relationships**
   - **Risk**: No database-level referential integrity for Attachment.targetId and DataOwnership
   - **Mitigation**: Application-level validation in use cases, validate target exists before creating

3. **Test Coverage**
   - **Risk**: New code without tests can introduce bugs
   - **Mitigation**: Write tests incrementally, don't wait until Phase 8

4. **Performance**
   - **Risk**: Verification campaigns with thousands of items may be slow
   - **Mitigation**: Implement pagination, add proper indexes, consider background job processing

### Business Risks

1. **Scope Creep**
   - **Risk**: Governance features could expand significantly (e.g., approval workflows, notifications)
   - **Mitigation**: Implement MVP first, defer enhancements to future phases

2. **File Storage Costs**
   - **Risk**: Unlimited attachments could consume disk space rapidly
   - **Mitigation**: Enforce max file sizes, implement cleanup policies, monitor usage

3. **Compliance Requirements**
   - **Risk**: SAMA/GDPR may require specific audit trails for attachments
   - **Mitigation**: Already tracking uploadedBy and createdAt, can extend to versioning if needed

## Success Criteria

### Phase 5 Complete When:
- [ ] All 4 entities implemented with full CRUD
- [ ] All business logic working (activate, ownership assignment, campaign lifecycle, item verification)
- [ ] Permissions enforced correctly
- [ ] Sample data demonstrates end-to-end workflow (domain → ownership → campaign → item verification)

### Phase 6 Complete When:
- [ ] Files can be uploaded/downloaded successfully
- [ ] Attachments are linked to entities correctly
- [ ] File validation works (type, size, extensions)
- [ ] UI components are reusable across different entities
- [ ] Old attachments are cleaned up on deletion

### Phase 7 Complete When:
- [ ] All sub-entity controllers have standalone API routes
- [ ] API documentation is updated
- [ ] Frontend can use standalone APIs where beneficial

### Phase 8 Complete When:
- [ ] Test coverage ≥ 80% for critical paths
- [ ] All tests pass in CI
- [ ] Developer guides are complete and accurate
- [ ] User guides are published in MDX docs
- [ ] CLAUDE.md is updated with new patterns

## Maintenance

After implementation:

1. **Monitor File Storage** - Set up alerts for disk usage
2. **Review Verification Campaigns** - Ensure they complete and generate useful reports
3. **Audit Data Ownership** - Verify all critical systems have owners assigned
4. **Test Backups** - Ensure attachments are included in backup strategy
5. **Update Documentation** - Keep guides current as features evolve

## Dependencies

**Must Complete Before Starting**:
- ✅ Phase 1-4 (Foundation, CMDB, Contracts, Licenses) - COMPLETED

**External Dependencies**:
- None - all entities use existing schema and patterns

**Nice to Have** (not blocking):
- Background job system for campaign automation (future enhancement)
- Email notifications for verification assignments (future enhancement)
- S3-compatible storage integration (future enhancement)

---

**Maintained By**: Development Team
**Last Updated**: 2025-11-21
**Next Review**: After Phase 5 completion
