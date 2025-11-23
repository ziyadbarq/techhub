# Universal Data Importer - Remaining Work

**Status**: Partially Complete (Core Complete, Extensions Pending)
**Priority**: Medium
**Complexity**: Medium (Core Complete) / Small-Medium (Extensions)
**Estimated Effort**: 3-5 days for extensions

## Overview

A universal data importer admin page that supports importing CSV/Excel data into all 66 entities in the system with intelligent validation, fuzzy matching, and comprehensive error handling.

### What's Completed ✅

**Phase 1: Foundation Layer** (100% complete)
- ✅ Complete TypeScript type system (entity-config.types.ts - 500 lines)
- ✅ Universal data cleaning and normalization (csv-sanitizer.ts - 450 lines)
- ✅ Validation engine with fuzzy matching (field-validators.ts - 550 lines)
- ✅ Lookup resolver with Levenshtein distance (lookup-resolver.ts - 350 lines)
- ✅ Template generator for CSV/Excel (template-generator.ts - 500 lines)
- ✅ Import processor with batch processing (import-processor.ts - 450 lines)
- ✅ Entity registry system (entity-configs.ts - 600 lines)

**Phase 2: 7-Step Wizard UI** (100% complete)
- ✅ Step 1: Entity Selector with search/filters
- ✅ Step 2: Import Settings (duplicate handling, sanitization, performance)
- ✅ Step 3: File Upload with drag-and-drop
- ✅ Step 4: Field Mapper with auto-mapping
- ✅ Step 5: Validation Results with error reports
- ✅ Step 6: Import Progress with real-time tracking
- ✅ Step 7: Results Summary with performance stats

**Phase 3: Server-Side Integration** (100% complete)
- ✅ Lookup controller for reference resolution
- ✅ Import workflow helper controller
- ✅ Permission system integration (DATA_IMPORT_MANAGE)
- ✅ Admin navigation integration

**Currently Functional For**:
- ✅ Assets (12 fields, fully configured)
- ✅ Persons (12 fields, fully configured)

## Remaining Work

### 1. Complete Entity Configurations (Medium Priority)

**Objective**: Configure remaining 64 entities for import support

**Entity Categories Pending**:

#### Foundation Layer (10 entities remaining)
- OrganizationUnit (8 fields)
- Role (6 fields)
- Location (12 fields)
- Vendor (9 fields)
- LifecycleState (6 fields)
- CustomFieldDefinition (8 fields)
- Tag (4 fields)
- AuditLog (read-only, skip)
- ExchangeRate (5 fields)
- SystemSetting (key-value, special handling)

#### Asset Layer (7 entities remaining)
- AssetCategory (7 fields)
- AssetModel (10 fields)
- AssetAssignment (7 fields)
- Warranty (8 fields)
- MaintenanceSchedule (10 fields)
- MaintenanceRecord (9 fields)

#### Inventory Layer (2 entities)
- StockLocation (6 fields)
- StockMovement (8 fields)

#### CMDB Layer (6 entities)
- ConfigurationItem (12 fields)
- CIRelationship (7 fields)
- RelationshipType (8 fields)
- CIClass (6 fields)
- CIClassField (9 fields)
- RelationshipTypeScope (5 fields)

#### Contract Management (3 entities)
- ContractType (6 fields)
- Contract (14 fields)
- ContractLinkedObject (5 fields)

#### License Management (4 entities)
- LicenseProduct (10 fields)
- LicenseProductField (7 fields)
- LicenseEntitlement (9 fields)
- LicenseAllocation (8 fields)

#### Asset Operations (3 entities)
- AssetDisposal (12 fields)
- AssetKit (7 fields)
- AssetReservation (9 fields)

#### Governance (4 entities)
- DataDomain (6 fields)
- DataOwnership (6 fields)
- VerificationCampaign (9 fields)
- VerificationItem (8 fields)

#### Attachments (2 entities)
- AttachmentType (8 fields)
- Attachment (10 fields)

#### Service Management (5 entities)
- Service (15 fields)
- ServiceOwnership (6 fields)
- BusinessProcess (8 fields)
- ServiceInfrastructure (12 fields)
- ServiceAsset (6 fields)

**Implementation Checklist Per Entity**:
- [ ] Define field configurations with types, validation, examples
- [ ] Configure lookup fields with target entities
- [ ] Add sanitization rules for each field type
- [ ] Set unique fields and required fields
- [ ] Configure auto-mapping alternatives
- [ ] Add business rules if applicable
- [ ] Create or verify bulk create action exists
- [ ] Test with sample data

**Estimated Effort**: 15-20 minutes per entity = ~16-20 hours total

---

### 2. Import History & Audit Trail (Low Priority)

**Objective**: Persist import operations for audit and reference

**Database Schema**:
```prisma
model ImportHistory {
  id              String   @id @default(cuid())
  entityKey       String   // e.g., "ASSET"
  entityName      String   // e.g., "Assets"
  fileName        String
  fileSize        Int      // bytes
  totalRows       Int
  successCount    Int
  failureCount    Int
  skipCount       Int
  duration        Float    // seconds
  throughput      Float    // rows/second
  settings        Json     // ImportSettings
  importedById    String
  importedBy      Person   @relation(fields: [importedById], references: [id])
  importedAt      DateTime @default(now())
  errorReport     String?  // Path to error report file

  @@index([entityKey])
  @@index([importedById])
  @@index([importedAt])
}
```

**Implementation**:
1. Add ImportHistory table to Prisma schema
2. Implement `recordImportHistoryAction()` in data-import.controller.ts
3. Implement `getImportHistoryAction()` in data-import.controller.ts
4. Create UI component to view import history (optional)
5. Add error report file storage (optional)

**Estimated Effort**: 4-6 hours

---

### 3. Bulk Create Actions for Missing Entities (Low Priority)

**Objective**: Ensure all entities have bulk create server actions

**Entities That May Need Bulk Actions**:
- Most foundation entities (OrganizationUnit, Location, Vendor, etc.)
- CMDB entities (ConfigurationItem, CIRelationship, etc.)
- License entities (LicenseProduct, LicenseEntitlement, etc.)
- Service entities (Service, BusinessProcess, etc.)

**Pattern** (follow existing `bulkCreateAssetsAction`):
```typescript
export async function bulkCreate[Entity]Action(
  itemsData: Create[Entity]DTO[]
): Promise<ActionResponse<{
  successCount: number;
  failureCount: number;
  failures: Array<{ index: number; [uniqueField]: string; error: string }>;
}>> {
  try {
    await requirePermission(PERMISSIONS.[ENTITY]_CREATE);

    const container = getContainer();
    const useCase = container.get<Create[Entity]UseCase>(
      DI_TOKENS.Create[Entity]UseCase
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [],
    };

    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        const validated = Create[Entity]Schema.parse(itemData);
        await useCase.execute(validated);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          [uniqueField]: itemData.[uniqueField] || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/[entity-route]");

    return { success: true, data: results };
  } catch (error) {
    return handleControllerError(error, { function: "bulkCreate[Entity]Action" }, "Failed to bulk create [entities]");
  }
}
```

**Estimated Effort**: 30 minutes per entity = ~20 hours if all 40+ entities need it

**Note**: Many entities may already have bulk actions or may not need them (read-only, system-managed)

---

### 4. Enhanced Features (Optional, Low Priority)

#### 4.1 Advanced Duplicate Detection
- **Current**: Basic unique field matching
- **Enhancement**: Cross-field fuzzy matching (e.g., same name + email = duplicate person)
- **Effort**: 3-4 hours

#### 4.2 Import Templates with Real Data
- **Current**: Templates have headers + instructions + examples
- **Enhancement**: Option to download template pre-filled with existing data for updates
- **Use Case**: Export-edit-reimport workflow for bulk updates
- **Effort**: 4-6 hours

#### 4.3 Scheduled Imports
- **Feature**: Schedule recurring imports from SFTP/S3/Google Drive
- **Use Case**: Daily sync from external systems
- **Effort**: 2-3 days (requires job scheduler, file watchers, credentials management)

#### 4.4 Import Rollback
- **Feature**: Ability to undo an import operation
- **Implementation**: Track created/updated records, provide rollback action
- **Effort**: 1-2 days

#### 4.5 Column Mapping Presets
- **Feature**: Save and reuse column mappings for recurring imports
- **Use Case**: Monthly reports with same structure
- **Effort**: 4-6 hours

#### 4.6 Data Transformation Rules
- **Feature**: UI for defining custom transformations (e.g., "IF category = 'OLD', SET category = 'NEW'")
- **Current**: Only predefined sanitization rules
- **Effort**: 2-3 days

---

## Testing Strategy

### Unit Tests
- [ ] CSV sanitizer edge cases (BOM, encoding, control characters)
- [ ] Field validator for all field types
- [ ] Levenshtein distance algorithm accuracy
- [ ] Lookup resolver with fuzzy matching
- [ ] Auto-mapping algorithm with various column name formats

### Integration Tests
- [ ] End-to-end import for Assets (10 rows)
- [ ] End-to-end import for Persons (10 rows)
- [ ] Large file import (10,000+ rows)
- [ ] Duplicate handling (skip, overwrite, fail, append)
- [ ] Lookup resolution with typos
- [ ] Error report generation
- [ ] Template generation with all field types

### Performance Tests
- [ ] Import 50,000 rows with batch size 100
- [ ] Import with parallel batches (measure throughput)
- [ ] Memory usage with large files
- [ ] Database connection pool under load

### User Acceptance Tests
- [ ] Non-technical user imports sample data
- [ ] User fixes validation errors and re-imports
- [ ] User downloads template and fills it correctly
- [ ] User maps non-standard column names
- [ ] User reviews error report and takes action

---

## Risk & Considerations

### Technical Risks

1. **Database Connection Pool Exhaustion**
   - **Risk**: Parallel batch processing may overwhelm connection pool
   - **Mitigation**: Limit max parallel batches to 4, use transactions wisely
   - **Status**: Already mitigated in design

2. **Memory Usage with Large Files**
   - **Risk**: Loading 100,000-row Excel file into memory
   - **Mitigation**: Stream-based parsing (papaparse supports streaming, xlsx may need adjustment)
   - **Status**: Consider for files >10MB

3. **Type Safety for Dynamic Entities**
   - **Risk**: Using `any` types for CSV data before validation
   - **Mitigation**: Runtime validation with Zod at boundaries
   - **Status**: Acceptable tradeoff, well-contained

### Business Risks

1. **Incomplete Entity Configurations**
   - **Risk**: Users expect all entities to be importable
   - **Mitigation**: Clear messaging about which entities are supported
   - **Status**: Only 2 of 66 configured currently

2. **Data Quality Issues**
   - **Risk**: Poor imports create bad data in production
   - **Mitigation**: Dry run mode, comprehensive validation, preview before import
   - **Status**: Already mitigated

3. **Permission Bypass**
   - **Risk**: Import bypasses row-level security
   - **Mitigation**: Check permissions at entity level, use existing use cases
   - **Status**: Already mitigated (requirePermission checks)

### Operational Risks

1. **Support Burden**
   - **Risk**: Users struggle with complex imports
   - **Mitigation**: User guide, error messages with suggestions, templates
   - **Status**: Need user guide (not yet created)

2. **Audit Trail Gaps**
   - **Risk**: No record of who imported what
   - **Mitigation**: Implement ImportHistory table
   - **Status**: Planned (Item #2 above)

---

## Implementation Priority

### Phase 1 (Completed) ✅
- Core infrastructure
- 7-step wizard UI
- Server controllers
- Admin navigation

### Phase 2 (Recommended Next)
1. **Configure Top 10 Most-Imported Entities** (1-2 days)
   - OrganizationUnit
   - Location
   - Vendor
   - AssetCategory
   - AssetModel
   - StockLocation
   - ConfigurationItem
   - Contract
   - Service
   - LicenseProduct

2. **Create Missing Bulk Actions** (1-2 days)
   - For the 10 entities above
   - Follow existing pattern

3. **User Guide Documentation** (1 day)
   - How to use the importer
   - Best practices
   - Troubleshooting common errors

### Phase 3 (Later)
1. Import History & Audit Trail (1 day)
2. Remaining 54 entity configurations (3-4 days)
3. Enhanced features (as needed)

---

## Success Criteria

- [ ] Top 10 most-imported entities fully configured
- [ ] Successful import of 10,000+ row files without errors
- [ ] Average user can complete import in <5 minutes
- [ ] Error messages are actionable (user knows what to fix)
- [ ] Import history tracked for audit compliance
- [ ] Zero permission bypass vulnerabilities
- [ ] User guide published and accessible

---

## Documentation Needed

1. **User Guide** (`docs/features/UNIVERSAL_DATA_IMPORTER.md`)
   - Step-by-step walkthrough
   - Screenshot of each wizard step
   - Common import scenarios
   - Troubleshooting guide
   - Template usage instructions

2. **Developer Guide** (Add section to `docs/guides/DEVELOPER_GUIDE.md`)
   - How to add new entity configuration
   - How to create bulk create action
   - How to add custom validation rules
   - How to extend sanitization rules

3. **Update CLAUDE.md**
   - Add data import section to "Critical Patterns"
   - Reference entity-configs.ts pattern
   - Note about bulk create action pattern

---

**Last Updated**: 2025-11-24
**Maintained By**: Development Team
