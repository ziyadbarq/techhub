# Asset Management Procedures

This document outlines the asset management procedures for Barq's IT Asset Management (ITAM) system, including creation, evaluation, and disposal workflows with their current implementation status.

## Table of Contents

- [6.1.2. Asset Creation and Evaluation Procedure](#612-asset-creation-and-evaluation-procedure)
  - [6.1.2.1. Asset Discovery and Initial Registration](#6121-asset-discovery-and-initial-registration)
  - [6.1.2.2. Asset Registration and Ownership](#6122-asset-registration-and-ownership)
  - [6.1.2.3. Asset Custodian Assignment](#6123-asset-custodian-assignment)
  - [6.1.2.4. Asset Classification and Valuation](#6124-asset-classification-and-valuation)
  - [6.1.2.5. Validation and Approval](#6125-validation-and-approval)
  - [6.1.2.6. Asset Inventory Update](#6126-asset-inventory-update)
  - [6.1.2.7. Cyber Security Notification](#6127-cyber-security-notification)
- [6.1.3. Asset Management RACI Matrix](#613-asset-management-raci-matrix)
- [6.2.2. Asset Disposal Procedure](#622-asset-disposal-procedure)
  - [6.2.2.1. Initialize Asset Disposal Request](#6221-initialize-asset-disposal-request)
  - [6.2.2.2. Declassify Asset](#6222-declassify-asset)
  - [6.2.2.3. Raise Data Sanitization Request](#6223-raise-data-sanitization-request)
  - [6.2.2.4. Internal vs. Third-Party Sanitization Decision](#6224-internal-vs-third-party-sanitization-decision)
  - [6.2.2.5. Third-Party Sanitization and Disposal](#6225-third-party-sanitization-and-disposal)
  - [6.2.2.6. Third-Party Disposal Plan](#6226-third-party-disposal-plan)
  - [6.2.2.7. Technology Department Approval](#6227-technology-department-approval)
  - [6.2.2.8. Asset Owner Approval](#6228-asset-owner-approval)
  - [6.2.2.9. Cyber Security Department Approval](#6229-cyber-security-department-approval)
  - [6.2.2.10. Data Sanitization Execution](#62210-data-sanitization-execution)
  - [6.2.2.11. Stakeholder Notification and Inventory Update](#62211-stakeholder-notification-and-inventory-update)
- [6.2.3. Asset Disposal RACI Matrix](#623-asset-disposal-raci-matrix)
- [Implementation Status Summary](#implementation-status-summary)
- [Identified Gaps and Recommendations](#identified-gaps-and-recommendations)

---

## 6.1.2. Asset Creation and Evaluation Procedure

### 6.1.2.1. Asset Discovery and Initial Registration

**Development Status**: ✅ Implemented

**Procedure**:

1. The Technology Department shall perform asset discovery on a periodic basis.
   - **Current Implementation**: ✅ Automated Microsoft Intune device sync scheduled daily at 3:00 AM UTC
   - **Implementation Reference**:
     - Scheduled Job: [scheduled-jobs.ts:126-154](../../src/infrastructure/services/queue/scheduled-jobs.ts)
     - Handler: [intune-device-sync.handler.ts](../../src/infrastructure/services/queue/handlers/intune-device-sync.handler.ts)
     - Use Case: `SyncDevicesFromIntuneUseCase`
   - **Features**:
     - Auto-links devices to Assets by serial number
     - Auto-links devices to Persons by Azure AD ID
     - Tracks compliance history
     - Deactivates devices removed from Intune

2. Upon discovering new assets, the Technology Department shall assign Asset Owners based on the assets discovered.
   - **Current Implementation**: ✅ Asset assignment system supports Person, OrgUnit, Location, and CI (Configuration Item) assignee types
   - **Implementation Reference**:
     - Entity: [AssetAssignment](../../src/core/domain/entities/asset-assignment.entity.ts)
     - Use Case: `CreateAssetAssignmentUseCase`

**Responsible**: Technology Department

---

### 6.1.2.2. Asset Registration and Ownership

**Development Status**: ✅ Implemented

**Procedure**:

1. The Asset Owner shall complete asset details for:
   - New assets
   - Changes to existing assets
   - New acquisitions
   - Periodic asset evaluations

   **Current Implementation**: ✅ Full CRUD operations available
   - Use Cases: `CreateAssetUseCase`, `UpdateAssetUseCase`, `GetAssetUseCase`, `ListAssetsUseCase`
   - Entity: [Asset](../../src/core/domain/entities/asset.entity.ts)

2. Each asset must have a designated owner called "Asset Owner".
   - **Current Implementation**: ✅ Tracked via `AssetAssignment` with assignee type PERSON
   - **Gap**: No explicit "Cyber Security Committee" confirmation workflow

3. All information processing facility assets shall be owned by a designated Barq employee (Asset Owner / Business Owner).
   - **Current Implementation**: ✅ Supported through asset assignment system

4. The Asset Owner/Business Owner of an application owns the information originated, stored, or processed by that application.
   - **Current Implementation**: 🟡 Documented as business rule, not enforced in system

5. The Asset Owner/Business Owner of Technology infrastructure components is the CTO.
   - **Current Implementation**: 🟡 Documented as business rule, not enforced in system

**Responsible**: Asset Owner

---

### 6.1.2.3. Asset Custodian Assignment

**Development Status**: ✅ Implemented

**Procedure**:

1. Each asset must have a custodian called "Asset Custodian" or "Asset Technical Owner".

   **Current Implementation**: ✅ Supported via `AssetAssignment` with multiple concurrent assignments
   - Primary assignment designation available
   - Temporal tracking with start/end dates
   - Condition tracking on assignment and return
   - Entity Methods:
     - `setAsPrimary()` / `unsetAsPrimary()` - Primary designation
     - `endAssignment()` - End an assignment
     - `isActive()` - Check if currently active
     - `wasActiveOn(date)` - Historical queries
     - `getDurationInDays()` - Duration calculation

**Responsible**: Technology Department / Asset Owner / Custodian

---

### 6.1.2.4. Asset Classification and Valuation

**Development Status**: 🟡 Partially Implemented

**Procedure**:

1. Asset Owners shall perform Confidentiality, Integrity, and Availability (CIA) classifications with Technology Department assistance for:
   - New assets
   - Existing assets (per Barq Data Classification Policy)

   **Current Implementation**:
   - ✅ Asset categorization exists via [AssetCategory](../../src/core/domain/entities/asset-category.entity.ts)
   - ✅ Custom fields per category via `AssetCategoryField`
   - ❌ CIA classification fields not found in `Asset` entity
   - **Gap**: No integration with Data Classification Policy

2. Based on Business Impact Analysis (BIA), the Asset Owner shall assign or reassign asset values.

   **Current Implementation**:
   - ✅ Purchase cost tracking with multi-currency support
   - ✅ Depreciation modeling with methods:
     - `isDepreciated()` / `isFullyDepreciated()` - Status checks
   - ✅ Valuation reports: `GetAssetValueByCategoryReportUseCase`
   - ❌ BIA workflow not implemented
   - **Gap**: BIA process not integrated

**Responsible**: Asset Owner / Technology Department

---

### 6.1.2.5. Validation and Approval

**Development Status**: ❌ Not Implemented

**Procedure**:

1. The Asset Owner shall forward the registration request to the Cyber Security Function for validation.

   **Current Implementation**: ❌ No validation workflow found

   **Gap**: Cyber Security approval step not implemented

2. Once validated, the Asset Owner and Custodian(s) shall follow data handling and labeling guidelines per "Data Classification Procedure".

   **Current Implementation**: ❌ No integration with Data Classification Procedure

   **Gap**: Data labeling and handling integration missing

**Responsible**: Cyber Security Department

---

### 6.1.2.6. Asset Inventory Update

**Development Status**: ✅ Implemented

**Procedure**:

1. The Technology Department shall update the Asset Inventory.

   **Current Implementation**:
   - ✅ Real-time asset inventory via database
   - ✅ Stock location tracking via [StockLocation](../../src/core/domain/entities/stock-location.entity.ts)
   - ✅ Stock movement tracking via [StockMovement](../../src/core/domain/entities/stock-movement.entity.ts)
     - Movement types: IN, OUT, TRANSFER, ADJUSTMENT
     - Status tracking: ACTIVE, VOIDED (audit trail preservation)
     - Source tracking: MANUAL, ASSIGNMENT, RETURN, DISPOSAL, IMPORT, LOCATION_CHANGE, SYSTEM
   - ✅ Comprehensive asset listing and filtering

**Responsible**: Technology Department

---

### 6.1.2.7. Cyber Security Notification

**Development Status**: ✅ Implemented (Infrastructure Ready)

**Procedure**:

1. The Technology Department shall inform Cyber Security of asset inventory updates.

   **Current Implementation**:
   - ✅ Email notification service fully implemented via Microsoft Graph API
   - ✅ Templated email support with HTML formatting
   - ✅ Service: [MicrosoftGraphEmailService](../../src/infrastructure/services/email/microsoft-graph-email.service.ts)
   - 🟡 Workflow integration not implemented (email service exists but not called automatically)
   - **Gap**: Automated notification triggers for asset inventory updates

**Responsible**: Technology Department → Cyber Security Department

---

## 6.1.3. Asset Management RACI Matrix

**Development Status**: 🟡 Partially Enforced (through permissions, not explicit RACI)

| Process Step | Technology Department | Asset Owner | Cyber Security Department |
|--------------|----------------------|-------------|---------------------------|
| Asset Discovery and Registration | R (Responsible) ✅ | R (Responsible) ✅ | - |
| Asset Classification and Valuation | R (Responsible) ✅ | R (Responsible), A (Accountable) ✅ | C (Consulted) ⚠️ Not implemented |
| Validation and Approval | I (Informed) ⚠️ Not implemented | I (Informed) ⚠️ Not implemented | R (Responsible) ⚠️ Not implemented |
| Asset Inventory Update | R (Responsible), A (Accountable) ✅ | - | - |
| Cyber Security Notification | R (Responsible) ✅ Infrastructure | - | I (Informed) 🟡 Manual |

**Note**: Permission-based access control exists but no explicit RACI workflow enforcement

**Relevant Permissions**:
- `ASSETS_VIEW` - View asset details
- `ASSETS_CREATE` - Create new assets
- `ASSETS_UPDATE` - Update asset details
- `ASSETS_DELETE` - Delete assets or initiate disposal
- `ASSET_ASSIGNMENTS_CREATE` - Create assignments
- `ASSET_ASSIGNMENTS_UPDATE` - Update/end assignments
- `ASSET_ASSIGNMENTS_VIEW` - View assignments

---

## 6.2.2. Asset Disposal Procedure

**Development Status**: ✅ Fully Implemented

### 6.2.2.1. Initialize Asset Disposal Request

**Development Status**: ✅ Implemented

**Procedure**:

1. Assets no longer required shall be identified and labeled per Barq data labeling and handling guidelines ("Data Classification Procedure").

   **Current Implementation**:
   - ✅ Disposal workflow via [AssetDisposal](../../src/core/domain/entities/asset-disposal.entity.ts) entity
   - ✅ Status flow: PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED
   - ✅ Disposal types: DONATION, SALE, RECYCLING, DESTRUCTION, OTHER
   - 🟡 Data labeling integration not found (gap with Data Classification Procedure)

2. A disposal request shall be raised.

   **Current Implementation**:
   - ✅ Disposal creation via `CreateAssetDisposalUseCase`
   - Controller: [asset-disposal.controller.ts](../../src/interface-adapters/controllers/asset-disposal.controller.ts)

**Responsible**: Asset Owner / Technology Department

---

### 6.2.2.2. Declassify Asset

**Development Status**: 🟡 Partially Implemented

**Procedure**:

1. Set the asset classification, labels, and data that the owner wants removed.

   **Current Implementation**:
   - ✅ Asset disposal request includes reason and notes fields
   - ❌ No explicit "declassification" field or workflow
   - **Gap**: Integration with classification system

**Responsible**: Asset Owner

---

### 6.2.2.3. Raise Data Sanitization Request

**Development Status**: ✅ Implemented

**Procedure**:

1. The Asset Owner raises a sanitization request to the custodian, determining the proper action to take.

   **Current Implementation**:
   - ✅ Sanitization checklist in `AssetDisposal.sanitizationChecklist`
   - ✅ Tracked items with completion dates
   - ✅ Performed-by person tracking
   - ✅ Business rule: Sanitization must complete before disposal completion
   - Entity Methods:
     - `completeSanitization(performedById, completionDate)` - Mark sanitization complete
     - `canComplete()` - Validates sanitization completion requirement

**Responsible**: Asset Owner

---

### 6.2.2.4. Internal vs. Third-Party Sanitization Decision

**Development Status**: 🟡 Partially Implemented

**Procedure**:

1. The Technology Department decides whether data can be sanitized internally or requires a third party.

   **Current Implementation**:
   - ✅ Disposal vendor field exists (`AssetDisposal.disposalVendor`)
   - ❌ No explicit workflow branch for internal vs. third-party decision
   - **Gap**: Decision workflow not implemented

   **Decision Paths**:
   - **If internal**: Create disposal plan → Get approvals from Asset Owner and Cyber Security → Proceed to sanitization
   - **If third-party**: Contact vendor → Vendor provides plan → Approval process → Proceed

**Responsible**: Technology Department

---

### 6.2.2.5. Third-Party Sanitization and Disposal

**Development Status**: 🟡 Partially Implemented

**Procedure**:

1. Third party is contacted to sanitize and dispose of the asset.
2. Contract shall specify disposal per Barq secure disposal process.

   **Current Implementation**:
   - ✅ Vendor tracking in `AssetDisposal.disposalVendor`
   - ✅ Document attachment support via `DisposalDocument` model
   - ❌ No contract management integration
   - **Gap**: Contract specification workflow

**Responsible**: Technology Department

---

### 6.2.2.6. Third-Party Disposal Plan

**Development Status**: 🟡 Partially Implemented

**Procedure**:

1. Third party prepares sanitization and disposal plan based on secure asset disposal standard.

   **Current Implementation**:
   - ✅ Notes field for disposal plan (`AssetDisposal.notes`)
   - ✅ Document attachment support
   - ❌ No structured plan template or checklist
   - **Gap**: Standardized plan template

**Responsible**: Technology Department (via third party)

---

### 6.2.2.7. Technology Department Approval

**Development Status**: ✅ Implemented

**Procedure**:

1. The Technology Department reviews the plan to ensure all steps follow secure disposal standards.
   - **If approved**: Present to Asset Owner
   - **If not approved**: Third party modifies unapproved details

   **Current Implementation**:
   - ✅ Multi-level approval via [DisposalApproval](../../src/core/domain/entities/disposal-approval.entity.ts) entity
   - ✅ Per-approver status: PENDING, APPROVED, REJECTED
   - ✅ Comment tracking for rejections
   - ✅ Use Cases: `ApproveDisposalUseCase`, `RejectDisposalUseCase`
   - Entity Methods:
     - `approve(comment)` - Approve with optional comment
     - `reject(comment)` - Reject with required comment

**Responsible**: Technology Department

---

### 6.2.2.8. Asset Owner Approval

**Development Status**: ✅ Implemented

**Procedure**:

1. The Asset Owner reviews the plan to ensure correct disposal.
   - **If approved**: Present to Cyber Security Department
   - **If not approved**: Re-evaluate internal vs. third-party approach

   **Current Implementation**:
   - ✅ Multi-level approval system supports this workflow
   - ✅ Rejection with comments triggers re-evaluation
   - **Note**: Order of approvers configured at disposal creation

**Responsible**: Asset Owner

---

### 6.2.2.9. Cyber Security Department Approval

**Development Status**: ✅ Implemented

**Procedure**:

1. The Cyber Security Department reviews the plan to ensure secure disposal.
2. Sensitive information shall be destroyed using techniques to make information non-retrievable:
   - Secure erase
   - Secure wiping
   - Double crosscut
   - Shredding
   - Physical destruction

   (Per "Secure Disposal Standard")

   **Decision**:
   - **If approved**: Proceed to sanitization
   - **If not approved**: Re-evaluate internal vs. third-party approach

   **Current Implementation**:
   - ✅ Multi-level approval system
   - ✅ Status flow enforcement (cannot complete without approvals)
   - ✅ Sanitization checklist tracking
   - 🟡 Secure Disposal Standard reference not integrated
   - **Gap**: Checklist templates for specific disposal methods

**Responsible**: Cyber Security Department

---

### 6.2.2.10. Data Sanitization Execution

**Development Status**: ✅ Implemented

**Procedure**:

1. The Technology Department implements the prepared disposal plan per Secure Disposal Standard.

   **Current Implementation**:
   - ✅ Sanitization completion tracking via `CompleteSanitizationUseCase`
   - ✅ Completion date and performed-by tracking
   - ✅ Business rule: Must complete before disposal completion
   - ✅ Status transitions: APPROVED → IN_PROGRESS → (sanitization complete) → COMPLETED
   - Entity Methods:
     - `startDisposal(startedById, actualStartDate)` - Begin disposal process
     - `completeSanitization(performedById, completionDate)` - Mark sanitization complete

**Responsible**: Technology Department

---

### 6.2.2.11. Stakeholder Notification and Inventory Update

**Development Status**: ✅ Implemented (Infrastructure Ready)

**Procedure**:

1. All stakeholders (Cyber Security, Asset Owner) shall be informed.
2. The Technology Department shall update the asset inventory.

   **Current Implementation**:
   - ✅ Disposal completion via `CompleteDisposalUseCase`
   - ✅ Certificate generation via `GenerateCertificateUseCase`
   - ✅ Auto-generated certificate numbers (format: `DISP-YYYYMMDD-XXXXX`)
   - ✅ PDF certificate generation via `GenerateDisposalCertificatePDFUseCase`
   - ✅ Asset soft-delete integration
   - ✅ Email service infrastructure ready (Microsoft Graph API)
   - 🟡 Workflow integration not implemented (email service exists but not called automatically)
   - **Gap**: Automated notification triggers for disposal completion
   - Entity Methods:
     - `completeDisposal(completedById, actualCompletionDate, actualValue)` - Finalize disposal
     - `generateCertificate(issuedById, issuedDate)` - Generate disposal certificate

**Responsible**: Technology Department

---

## 6.2.3. Asset Disposal RACI Matrix

**Development Status**: ✅ Enforced through workflow and permissions

| Process Step | Technology Department | Asset Owner | Cyber Security Department |
|--------------|----------------------|-------------|---------------------------|
| Initialize disposal request | I (Informed) ✅ | R (Responsible) ✅ | I (Informed) ✅ |
| Declassify asset | R (Responsible) 🟡 | R (Responsible) 🟡 | I (Informed) 🟡 |
| Raise sanitization request | R (Responsible) ✅ | - | I (Informed) ✅ |
| Internal vs. third-party decision | R (Responsible), A (Accountable) ✅ | - | C (Consulted) 🟡 |
| Third-party engagement | R (Responsible), A (Accountable) ✅ | - | C (Consulted) 🟡 |
| Third-party plan submission | R (Responsible), A (Accountable) ✅ | - | C (Consulted) 🟡 |
| Disposal process approval | I (Informed) ✅ | R (Responsible) ✅ | R (Responsible) ✅ |
| Data sanitization execution | R (Responsible) ✅ | - | - |
| Stakeholder notification | R (Responsible) ✅ Infrastructure | I (Informed) 🟡 Manual | I (Informed) 🟡 Manual |

**Current Implementation**:
- ✅ Multi-level approval workflow enforces approval responsibilities
- ✅ Permission-based access control (`PERMISSIONS.ASSETS_DELETE`)
- 🟡 Consultation steps not explicitly enforced (manual process)
- 🟡 Notification triggers not automated (infrastructure ready)

---

## Implementation Status Summary

### Legend
- ✅ **Implemented**: Feature fully developed and operational
- 🟡 **Partially Implemented**: Core functionality exists with gaps
- ❌ **Not Implemented**: Feature does not exist

### Asset Creation and Evaluation

| Component | Status | Notes |
|-----------|--------|-------|
| **Asset Creation & Registration** | ✅ Implemented | Full CRUD, Microsoft Intune integration |
| **Automated Asset Discovery** | ✅ Implemented | Daily Intune sync at 3:00 AM UTC, auto-linking to Assets and Persons |
| **Asset Ownership & Assignment** | ✅ Implemented | Multi-type assignees, temporal tracking, condition tracking |
| **CIA Classification** | ❌ Not Implemented | Asset categorization exists, CIA fields not present |
| **Business Impact Analysis** | ❌ Not Implemented | Valuation exists, BIA workflow not integrated |
| **Cyber Security Validation** | ❌ Not Implemented | No approval workflow for new asset registration |
| **Asset Inventory Management** | ✅ Implemented | Stock locations, movements, comprehensive reporting |
| **Task Scheduling Infrastructure** | ✅ Implemented | BullMQ-based job queue with cron scheduling |
| **Email Notification Service** | ✅ Implemented | Microsoft Graph API integration with HTML templates |

### Asset Disposal

| Component | Status | Notes |
|-----------|--------|-------|
| **Disposal Workflow** | ✅ Implemented | Complete status flow with state transitions |
| **Sanitization Tracking** | ✅ Implemented | Checklist, completion tracking, business rule enforcement |
| **Multi-Level Approvals** | ✅ Implemented | Technology Dept → Asset Owner → Cyber Security |
| **Third-Party Disposal** | 🟡 Partial | Vendor tracking exists, contract management missing |
| **Disposal Certificates** | ✅ Implemented | Auto-generation, PDF export, certificate numbers |
| **Data Classification Integration** | ❌ Not Implemented | No integration with Data Classification Procedure |
| **Automated Notifications** | 🟡 Partial | Email service ready, workflow triggers not implemented |

---

## Identified Gaps and Recommendations

### High Priority Gaps

1. **CIA Classification Integration**
   - **Gap**: Confidentiality, Integrity, and Availability classification fields not present in Asset entity
   - **Impact**: Cannot track asset sensitivity levels per Barq Data Classification Policy
   - **Recommendation**: Add CIA classification fields to Asset entity and integrate with Data Classification Procedure

2. **Cyber Security Validation Workflow**
   - **Gap**: No approval workflow for new asset registration
   - **Impact**: Asset owners cannot formally submit assets for Cyber Security validation
   - **Recommendation**: Implement multi-step workflow: Asset Owner creates → Cyber Security validates → Technology updates inventory

3. **Data Classification Procedure Integration**
   - **Gap**: No integration with data labeling and handling guidelines
   - **Impact**: Cannot enforce data handling requirements based on asset classification
   - **Recommendation**: Integrate Data Classification Procedure with asset lifecycle workflows

4. **Automated Notification Triggers**
   - **Gap**: Email service infrastructure exists but not integrated with workflow events
   - **Impact**: Manual communication required for stakeholder notifications
   - **Recommendation**: Add notification triggers for:
     - Asset inventory updates to Cyber Security
     - Disposal completion to Asset Owner and Cyber Security
     - Warranty expiration alerts

### Medium Priority Enhancements

1. **Business Impact Analysis Workflow**
   - **Gap**: BIA process not integrated into asset valuation
   - **Impact**: Asset values may not reflect true business impact
   - **Recommendation**: Add BIA workflow with templates and scoring criteria

2. **Third-Party Disposal Plan Templates**
   - **Gap**: No standardized templates for third-party disposal plans
   - **Impact**: Inconsistent disposal plan documentation
   - **Recommendation**: Create structured plan templates aligned with Secure Disposal Standard

3. **Warranty Expiration Notification Workflow**
   - **Gap**: Scheduled check exists but email sending not implemented
   - **Impact**: Manual follow-up required for warranty renewals
   - **Recommendation**: Integrate warranty expiration handler with email service

### Low Priority Improvements

1. **Contract Management Integration**
   - **Gap**: No contract workflow for third-party disposal agreements
   - **Impact**: Contract terms not tracked in system
   - **Recommendation**: Add contract attachment and tracking to disposal workflow

2. **Secure Disposal Standard Checklists**
   - **Gap**: No method-specific checklists (secure erase, shredding, etc.)
   - **Impact**: Generic sanitization checklist may miss method-specific requirements
   - **Recommendation**: Create disposal method templates with specific checklist items

3. **RACI Workflow Visualization**
   - **Gap**: RACI responsibilities not visualized in UI
   - **Impact**: Users cannot easily see their responsibilities in workflows
   - **Recommendation**: Add RACI role indicators to workflow interfaces

---

## Related Documentation

- [Asset Entity](../../src/core/domain/entities/asset.entity.ts) - Core asset domain entity
- [Asset Assignment](../../src/core/domain/entities/asset-assignment.entity.ts) - Ownership and custodian tracking
- [Asset Disposal](../../src/core/domain/entities/asset-disposal.entity.ts) - Disposal workflow entity
- [Stock Movement](../../src/core/domain/entities/stock-movement.entity.ts) - Inventory movement tracking
- [Asset Disposal Controller](../../src/interface-adapters/controllers/asset-disposal.controller.ts) - Disposal workflow actions
- [Intune Sync Use Case](../../src/core/use-cases/intune/sync-devices-from-intune.use-case.ts) - Automated device discovery
- [Email Service](../../src/infrastructure/services/email/microsoft-graph-email.service.ts) - Microsoft Graph email integration
- [Scheduled Jobs](../../src/infrastructure/services/queue/scheduled-jobs.ts) - BullMQ job scheduling configuration
- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission system documentation
- [Database Schema](../architecture/DATABASE_SCHEMA.md) - Complete database schema reference

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-01 | 1.0 | Initial documentation of asset management procedures with implementation status |
| 2026-01-01 | 1.1 | Corrected implementation status: automated asset discovery, task scheduling, and email service confirmed as implemented |
