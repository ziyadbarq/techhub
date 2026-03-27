# Change Management Module — Migration & Implementation Plan

## Context

Barq has an existing Change Management system running on **WordPress / GravityForms / GravityFlow** for years. A separate **gf-report** Next.js app was built to provide better dashboards and UX on top of the WordPress data. The goal is to migrate everything into **techhub** (barq-assets), retire gf-report, and eventually retire the WordPress change management system entirely.

**Why migrate:**
- WordPress/GravityForms is slow UX, hard to develop and maintain
- gf-report is read-only — can't create or approve changes from it
- techhub already has CMDB, service management, RBAC, audit logging — natural home for change management
- Single unified platform for all IT operations

**Migration strategy:** Incremental and careful. No big bang.

---

## Current System Overview

### WordPress / GravityForms / GravityFlow

**Source of truth** for all change management data. Stores form submissions, workflow state, approval decisions, and activity logs.

**Key WordPress tables:**
- `wp_gf_entry` — Entry headers (form_id, created_by, status)
- `wp_gf_entry_meta` — Entry field values + workflow state (meta_key/meta_value pairs)
- `wp_gf_entry_notes` — Workflow comments (note_type='gravityflow')
- `wp_gf_addon_feed` — GravityFlow step definitions (step_name, step_type, step_order)
- `wp_gravityflow_activity_log` — Step events, durations, assignee actions
- `wp_options` — Step ordering (`gravityflow_feed_order_{form_id}`)

**Workflow states:** pending → approved/rejected/cancelled (GravityFlow also uses "complete" = approved)

**Assignee types:** user, role, email, api_key — stored as `workflow_{type}_{id}` meta keys

### Form Types (Current)

| Short Label | Name | Requires Parent CR | Purpose |
|---|---|---|---|
| **CR** | Change Request | No (is the parent) | Parent container for all release-related changes |
| **AR** | Application Release | Yes → CR | Application/software release request |
| **IR** | Infrastructure Release | Yes → CR | Infrastructure change request |
| **CFR** | Config/Firewall Release | Yes → CR | Configuration or firewall rule change |
| — | Access Request | No | Access provisioning (independent) |
| — | Firewall Request | No | Firewall rule request (independent) |
| — | Other Requests | No | Misc IT requests (independent) |

**Hierarchy:** CR is created first → AR/IR/CFR sub-requests are created and linked to the CR via `parent_ref` attribute.

### gf-report Next.js App

**Read-only reporting layer** on top of WordPress data. Key architecture:

- **Dual MySQL pools**: WordPress DB (source) + App DB (synced optimized tables)
- **Sync workers**: Background jobs (every 60s-60m) that sync WordPress data into `report_*` tables
- **Form-agnostic**: All forms dynamically registered via `report_forms` + `report_form_categories`
- **Key tables**: `report_requests`, `report_request_attrs` (key-value), `report_request_assignees`, `report_entry_timeline` (JSON), `report_services`, `report_service_owners`
- **Read modes**: fresh (live) / hybrid (cached) / offline (fully cached)
- **Features**: Executive dashboard, personal work hub, approval queue, request detail view, SLA tracking, Jira integration, export, search

**Key gf-report files:**
- `next-report/src/lib/db/schema.ts` — Full schema (source of truth)
- `next-report/src/lib/services/` — All business logic services
- `next-report/src/lib/sync/` — Sync worker infrastructure
- `next-report/docs/gravityflow-db-architecture.md` — WordPress DB reference

---

## Target Architecture in Techhub

### Design Principles

1. **Form-agnostic like gf-report**: Support multiple request types (CR, AR, IR, CFR, access, firewall, etc.) via a configurable form/category system — NOT hardcoded entity types per form
2. **CR hierarchy**: Model parent CR → child sub-requests relationship
3. **Reuse existing techhub infrastructure**: CMDB CIs, Services, RBAC, audit logging, BullMQ, email notifications
4. **ITIL-aligned**: Full lifecycle with risk assessment, tiered approval, maintenance windows, PIR
5. **Migration-friendly**: Schema designed to accept imported WordPress data with field mapping

---

## Database Schema

### File: `prisma/schema/change-management.prisma`

### Enums (in `shared-enums.prisma`)

```
ChangeTypeEnum: STANDARD, NORMAL, EMERGENCY
ChangeStatusEnum: DRAFT, SUBMITTED, RISK_ASSESSED, PENDING_APPROVAL, APPROVED, REJECTED, SCHEDULED, IN_PROGRESS, COMPLETED, FAILED, ROLLED_BACK, PIR_PENDING, CLOSED, CANCELLED
ChangePriorityEnum: LOW, MEDIUM, HIGH, CRITICAL
ChangeRiskLevelEnum: LOW, MEDIUM, HIGH, VERY_HIGH, CRITICAL
ChangeApprovalStatusEnum: PENDING, APPROVED, REJECTED, MORE_INFO_REQUESTED
ChangeApproverRoleEnum: CI_OWNER, CHANGE_MANAGER, CAB_MEMBER, SERVICE_OWNER, STEP_ASSIGNEE
MaintenanceWindowRecurrenceEnum: DAILY, WEEKLY, BIWEEKLY, MONTHLY, CUSTOM
PIROutcomeEnum: SUCCESSFUL, PARTIAL, FAILED, ROLLED_BACK
RequestFormTypeEnum: CHANGE_REQUEST, APPLICATION_RELEASE, INFRASTRUCTURE_RELEASE, CONFIG_FIREWALL_RELEASE, ACCESS_REQUEST, FIREWALL_REQUEST, OTHER
```

Add to `TargetObjectTypeEnum`: CHANGE_REQUEST, CHANGE_APPROVAL, POST_IMPLEMENTATION_REVIEW, MAINTENANCE_WINDOW

### Models

**1. ChangeRequestForm** — form type definitions (like gf-report's `report_forms`)
- `id`, `name`, `code` (unique, e.g., "CR", "AR", "IR", "CFR")
- `formType` (RequestFormTypeEnum)
- `categoryId` (FK → ChangeRequestCategory)
- `requiresParentCR` Boolean (true for AR, IR, CFR)
- `requiresTestPlan` Boolean
- `requiresRollbackPlan` Boolean
- `slaThresholdSeconds` Int?
- `workflowSteps` Json? — default step definitions for this form type
- `fieldDefinitions` Json? — configurable fields per form type
- `isActive` Boolean
- `displayOrder` Int
- `createdAt`, `updatedAt`

**2. ChangeRequestCategory** — grouping (like gf-report's `report_form_categories`)
- `id`, `slug` (unique), `label`, `displayOrder`, `color`, `isActive`

**3. ChangeRequest** — main entity
- `id`, `changeNumber` (unique, auto-generated: CR-YYYYMMDD-XXXXX or AR-YYYYMMDD-XXXXX)
- `formId` (FK → ChangeRequestForm) — which form type
- `parentChangeRequestId` (FK → ChangeRequest, self-referential, nullable) — for AR/IR/CFR linking to parent CR
- `title`, `description` @db.Text
- `changeType` (ChangeTypeEnum) — STANDARD/NORMAL/EMERGENCY
- `priority` (ChangePriorityEnum)
- `status` (ChangeStatusEnum)
- `requestedById` (FK → Person)
- `assignedToId` (FK → Person, nullable) — implementer
- `categoryTag` String? — free-form classification
- Planning: `justification`, `testPlan`, `rollbackPlan`, `implementationPlan` (text fields)
- Risk: `riskLikelihood` (1-5), `riskImpact` (1-5), `riskScore` (computed), `riskLevel`, `riskNotes`, `riskAssessedById`, `riskAssessedAt`
- Scheduling: `scheduledStartAt`, `scheduledEndAt`, `maintenanceWindowId`
- Implementation: `actualStartAt`, `actualEndAt`, `implementationNotes`, `failureReason`, `rollbackExecutedAt`, `rollbackNotes`
- Closure: `closedAt`, `closedById`, `closureNotes`
- **Attributes**: `attributes` Json? — flexible key-value for form-specific fields (like gf-report's `report_request_attrs`)
- **Migration tracking**: `wpEntryId` Int? (unique, nullable) — WordPress entry ID for imported records, `wpFormId` Int? — WordPress form ID
- `metadata` Json?, `createdAt`, `updatedAt`
- Relations: form, parentChangeRequest, childRequests[], approvals[], affectedCIs[], affectedServices[], pir, requestedBy, assignedTo

**4. ChangeApproval** — approval records
- `id`, `changeRequestId` (FK), `approverId` (FK → Person)
- `approverRole` (ChangeApproverRoleEnum)
- `stepName` String? — workflow step this approval belongs to
- `stepOrder` Int? — ordering within workflow
- `status` (ChangeApprovalStatusEnum) @default(PENDING)
- `decisionAt` DateTime?, `comment` @db.Text?, `requestedInfoComment` @db.Text?
- `createdAt`
- @@unique([changeRequestId, approverId, stepName])

**5. ChangeAffectedCI** — many-to-many with CIs
- `id`, `changeRequestId`, `configurationItemId`, `impactDescription`
- @@unique([changeRequestId, configurationItemId])

**6. ChangeAffectedService** — many-to-many with Services
- `id`, `changeRequestId`, `serviceId`, `impactDescription`
- @@unique([changeRequestId, serviceId])

**7. MaintenanceWindow** — recurring windows
- `id`, `name`, `description`
- `recurrence` (MaintenanceWindowRecurrenceEnum)
- `dayOfWeek` Int? (0-6), `dayOfMonth` Int?
- `startTime` String (HH:MM), `endTime` String, `timezone` String @default("Asia/Riyadh")
- `durationMinutes` Int
- `isActive` Boolean, `effectiveFrom` DateTime, `effectiveTo` DateTime?
- `customCron` String?
- `metadata` Json?, `createdAt`, `updatedAt`

**8. MaintenanceBlackout** — blackout periods
- `id`, `name`, `reason` @db.Text?, `startAt`, `endAt`
- `createdById` (FK → Person), `isActive` Boolean
- `createdAt`, `updatedAt`

**9. PostImplementationReview** — PIR records
- `id`, `changeRequestId` @unique (FK)
- `reviewedById` (FK → Person), `outcome` (PIROutcomeEnum)
- `actualImpactDescription`, `plannedVsActualNotes`, `lessonsLearned`, `followUpActions` (all @db.Text?)
- `customerImpact` Boolean, `customerImpactDescription` @db.Text?
- `reviewedAt`, `createdAt`, `updatedAt`

---

## Migration Phases

### Phase 1: Techhub Foundation

**Goal**: Build the complete data layer and basic CRUD in techhub. No WordPress integration yet. The system works standalone for new change requests created directly in techhub.

**Delivers**: Schema, entities, repositories, use cases, DI, permissions, feature flag, basic list+detail+create pages.

#### 1A: Schema + Domain Layer

| Type | Files |
|---|---|
| Schema | `prisma/schema/change-management.prisma` |
| Enums | `prisma/schema/shared-enums.prisma` (modify) |
| Entities | `src/core/domain/entities/change-request.entity.ts` |
| | `src/core/domain/entities/change-request-form.entity.ts` |
| | `src/core/domain/entities/change-request-category.entity.ts` |
| | `src/core/domain/entities/change-approval.entity.ts` |
| | `src/core/domain/entities/change-affected-ci.entity.ts` |
| | `src/core/domain/entities/change-affected-service.entity.ts` |
| | `src/core/domain/entities/maintenance-window.entity.ts` |
| | `src/core/domain/entities/maintenance-blackout.entity.ts` |
| | `src/core/domain/entities/post-implementation-review.entity.ts` |
| Repo interfaces | `src/core/repositories/change-request.repository.interface.ts` |
| | `src/core/repositories/change-request-form.repository.interface.ts` |
| | `src/core/repositories/change-approval.repository.interface.ts` |
| | `src/core/repositories/maintenance-window.repository.interface.ts` |
| | `src/core/repositories/maintenance-blackout.repository.interface.ts` |
| | `src/core/repositories/post-implementation-review.repository.interface.ts` |
| Repo impls | `src/infrastructure/repositories/prisma-change-request.repository.ts` |
| | `src/infrastructure/repositories/prisma-change-request-form.repository.ts` |
| | `src/infrastructure/repositories/prisma-change-approval.repository.ts` |
| | `src/infrastructure/repositories/prisma-maintenance-window.repository.ts` |
| | `src/infrastructure/repositories/prisma-maintenance-blackout.repository.ts` |
| | `src/infrastructure/repositories/prisma-post-implementation-review.repository.ts` |

**Entity business rules (ChangeRequest):**
- `create()` → DRAFT, auto-generate changeNumber using form code prefix
- `submit()` → validates testPlan + rollbackPlan based on form's `requiresTestPlan`/`requiresRollbackPlan` → SUBMITTED
- `assessRisk(likelihood, impact)` → computes score, maps to level, auto-suggest escalation if >= VERY_HIGH
- `submitForApproval()` → Standard auto-APPROVED, Normal → single approver, Emergency → CAB
- `approve()` / `reject()` → state guards
- `schedule(start, end, windowId?)` → validates maintenance window for Normal; Emergency bypasses
- `startImplementation()` / `completeImplementation()` / `failImplementation()` / `executeRollback()`
- `close()` → requires PIR for Normal/Emergency
- `cancel()` → from any non-terminal state
- **Parent CR validation**: AR/IR/CFR cannot be submitted if no parentChangeRequestId set

#### 1B: Use Cases + Controller + DI

| Type | Files |
|---|---|
| Use cases | `src/core/use-cases/change-management/` (~35 files + barrel index.ts) |
| Controller | `src/interface-adapters/controllers/change-management.controller.ts` |
| | `src/interface-adapters/controllers/maintenance-window.controller.ts` |
| DTOs | `src/interface-adapters/dtos/generated/change-request.dto.ts` |
| | `src/interface-adapters/dtos/generated/change-approval.dto.ts` |
| | `src/interface-adapters/dtos/generated/maintenance-window.dto.ts` |
| DI module | `src/di/modules/change-management.module.ts` (HEAVY tier) |
| DI tokens | `src/di/types.ts` (modify — add ~40 tokens) |
| Module def | `src/di/module-definitions.ts` (modify) |
| Feature flag | seed-features.ts (modify — add CHANGE_MANAGEMENT) |
| Permissions | permission-key.ts (modify — add 17 permissions) |
| Seed | permission seed (modify — add change management group) |

**Use cases (35 total):**

*RFC & CRUD (6):* CreateChangeRequest, UpdateChangeRequest, SubmitChangeRequest, GetChangeRequest, ListChangeRequests, CancelChange

*CI/Service linkage (4):* LinkCIToChange, UnlinkCIFromChange, LinkServiceToChange, UnlinkServiceFromChange

*Risk (2):* AssessChangeRisk, GetRiskMatrix

*Approval (5):* SubmitForApproval, ApproveChange, RejectChange, RequestMoreInfo, ListPendingApprovals

*Scheduling (4):* ScheduleChange, ValidateSchedule, ListMaintenanceWindows, GetChangeCalendar

*Implementation (4):* StartChangeImplementation, CompleteChangeImplementation, FailChangeImplementation, ExecuteRollback

*PIR (2):* CreatePIR, GetPIR

*Closure (1):* CloseChange

*Admin (4):* CreateMaintenanceWindow, UpdateMaintenanceWindow, CreateMaintenanceBlackout, DeleteMaintenanceBlackout

*Dashboard/Queries (3):* GetChangeDashboardMetrics, GetChangeHistoryForCI, GetChildRequests (sub-requests for a CR)

#### 1C: UI Pages + Components

| Type | Files |
|---|---|
| Routes | `src/config/routes-manifest.ts` (modify) |
| Protected | `src/config/protected-routes.ts` (modify) |
| Pages | `src/app/(dashboard)/change-management/page.tsx` (list) |
| | `src/app/(dashboard)/change-management/[id]/page.tsx` (detail) |
| | `src/app/(dashboard)/change-management/new/page.tsx` (create) |
| | `src/app/(dashboard)/change-management/calendar/page.tsx` (calendar) |
| | `src/app/(dashboard)/change-management/dashboard/page.tsx` (metrics) |
| | `src/app/(dashboard)/maintenance-windows/page.tsx` (admin) |
| Components | `src/components/change-management/change-request-form.tsx` |
| | `src/components/change-management/change-request-table.tsx` |
| | `src/components/change-management/change-detail-view.tsx` |
| | `src/components/change-management/affected-ci-panel.tsx` |
| | `src/components/change-management/approval-panel.tsx` |
| | `src/components/change-management/risk-matrix.tsx` |
| | `src/components/change-management/pir-form.tsx` |
| | `src/components/change-management/implementation-panel.tsx` |
| | `src/components/change-management/child-requests-panel.tsx` |
| | `src/components/change-management/change-dashboard.tsx` |

#### 1D: Notifications + Scheduled Jobs

| Type | Files |
|---|---|
| Queue handlers | `src/infrastructure/services/queue/handlers/change-approval-notification.handler.ts` |
| | `src/infrastructure/services/queue/handlers/change-lifecycle-notification.handler.ts` |
| | `src/infrastructure/services/queue/handlers/check-overdue-pirs.handler.ts` |
| Scheduled jobs | `src/infrastructure/services/queue/scheduled-jobs.ts` (modify) |
| Worker | `src/infrastructure/services/queue/worker.ts` (modify) |

**Email notifications:**

| Event | Recipients | Template |
|---|---|---|
| RFC submitted | Requestor | `change-submitted` |
| Approval needed | Each approver | `change-approval-needed` |
| Approved | Requestor + assignee | `change-approved` |
| Rejected | Requestor | `change-rejected` |
| More info requested | Requestor | `change-more-info` |
| Scheduled | Requestor + assignee | `change-scheduled` |
| Implementation started | Requestor + affected CI owners | `change-started` |
| Completed | Requestor + approvers | `change-completed` |
| Failed | Requestor + assignee + approvers | `change-failed` |
| PIR due reminder | Assignee (daily cron) | `pir-reminder` |
| Closed | Requestor | `change-closed` |

#### 1E: Seed Data

- **Feature flag**: CHANGE_MANAGEMENT (LAYER_3, depends on CMDB + SERVICES + FOUNDATION)
- **Permissions**: 17 permissions in "Change Management" group
- **Form types seed**: CR, AR, IR, CFR, Access Request, Firewall Request, Other
- **Categories seed**: "Release Management" (CR, AR, IR, CFR), "Access & Security" (Access, Firewall), "Other"
- **Maintenance windows (dev seed)**: Tuesday Night 22:00-04:00, Weekend Saturday 00:00-06:00, Monthly Patch First Saturday 22:00-06:00
- **Demo change requests (dev seed)**: 10 across various statuses and form types

---

### Phase 2: Read-Only Integration (gf-report data in techhub)

**Goal**: Display existing WordPress change management data inside techhub alongside native change requests. Users start using techhub as their single dashboard.

**Approach**: Build a sync worker in techhub that reads from gf-report's MySQL app DB (`report_requests`, `report_request_attrs`, `report_request_assignees`, `report_entry_timeline`) and imports into techhub's PostgreSQL `change_requests` table with `wpEntryId` and `wpFormId` set.

| Type | Files |
|---|---|
| Sync service | `src/infrastructure/services/change-sync/wordpress-sync.service.ts` |
| | `src/infrastructure/services/change-sync/field-mapper.ts` (maps gf-report attrs to techhub fields) |
| | `src/infrastructure/services/change-sync/status-mapper.ts` (maps GravityFlow statuses to ChangeStatusEnum) |
| Config | MySQL connection config for gf-report app DB |
| Queue handler | `src/infrastructure/services/queue/handlers/sync-wordpress-changes.handler.ts` |
| Scheduled job | Add to scheduled-jobs.ts (every 5 minutes for pending, every 30 min for terminal) |

**Key mappings:**
- gf-report `report_requests.workflow_status` → techhub `ChangeStatusEnum`
- gf-report `report_request_attrs` → techhub `ChangeRequest.attributes` JSON
- gf-report `report_request_assignees` → techhub `ChangeApproval` records
- gf-report `report_entry_timeline` → techhub display (read-only timeline component)
- gf-report `report_forms.short_label` → techhub `ChangeRequestForm.code`
- gf-report `report_requests.display_ref` → techhub `ChangeRequest.changeNumber`
- gf-report `report_requests.cr_ref` → resolve to `parentChangeRequestId`

**Read-only imported records**: Records with `wpEntryId != null` are read-only in techhub. No edit/approve actions — those still happen in WordPress. Techhub shows status, timeline, and details.

**UI additions:**
- Badge on imported records: "Synced from WordPress"
- Timeline component showing approval history from `report_entry_timeline` JSON
- Filter: "Source: Techhub / WordPress / All"

---

### Phase 3: Interactive WordPress Integration

**Goal**: Users can create and approve changes from techhub that write back to WordPress. Dual-write period where both systems stay in sync.

**Approach**: Techhub writes to WordPress via GravityForms REST API or direct MySQL inserts.

| Component | Description |
|---|---|
| WordPress API client | Service that creates GF entries and triggers GravityFlow |
| Bidirectional sync | Techhub creates entry in WordPress → sync worker picks it up → updates techhub record with wpEntryId |
| Approval proxy | Techhub approval action → calls GravityFlow API to update assignee status in WordPress |
| Feature flag | `CHANGE_MANAGEMENT_WRITE_TO_WP` — controls whether writes go to WordPress or stay in techhub only |

**Risk mitigation:**
- Start with one form type (CR) before expanding
- Audit log every cross-system write
- Ability to disable write-back instantly via feature flag
- WordPress remains source of truth during this phase

---

### Phase 4: Full Migration (WordPress → Techhub)

**Goal**: Migrate all historical change management data from WordPress to techhub. Retire WordPress change management and gf-report.

**Steps:**
1. **Historical data migration script**: Batch import all `report_requests` into techhub's `change_requests` with `wpEntryId` tracking
2. **Verify data completeness**: Compare counts, spot-check records
3. **Cut over**: Disable WordPress forms, point all users to techhub
4. **Retire gf-report**: Once techhub has all dashboards (executive dashboard, personal hub, approval queue, search)
5. **Clean up**: Remove WordPress sync infrastructure from techhub, remove `wpEntryId`/`wpFormId` fields (or keep for audit)

**gf-report features to replicate in techhub before retirement:**
- Executive dashboard (workflow summary, pending heatmap, SLA trends)
- Personal work hub (my requests, my approvals, bookmarks)
- Approval queue with badge counts
- Request detail view with full timeline
- Department and role views
- SLA tracking with business-hour calculations (exclude Fri/Sat)
- Search with filters
- XLSX export
- Jira integration (link tracking)

---

## Permissions (17 total)

| Key | Code | Phase |
|---|---|---|
| CHANGES_VIEW | changes:view | 1 |
| CHANGES_CREATE | changes:create | 1 |
| CHANGES_UPDATE | changes:update | 1 |
| CHANGES_DELETE | changes:delete | 1 |
| CHANGES_SUBMIT | changes:submit | 1 |
| CHANGES_ASSESS_RISK | changes:assess-risk | 1 |
| CHANGES_APPROVE | changes:approve | 1 |
| CHANGES_SCHEDULE | changes:schedule | 1 |
| CHANGES_IMPLEMENT | changes:implement | 1 |
| CHANGES_CLOSE | changes:close | 1 |
| CHANGES_CANCEL | changes:cancel | 1 |
| CHANGES_PIR_CREATE | changes:pir-create | 1 |
| CHANGES_PIR_VIEW | changes:pir-view | 1 |
| CHANGES_MANAGE | changes:manage | 1 |
| MAINTENANCE_WINDOWS_VIEW | maintenance-windows:view | 1 |
| MAINTENANCE_WINDOWS_MANAGE | maintenance-windows:manage | 1 |
| CHANGES_DASHBOARD | changes:dashboard | 1 |

## DI Registration

```typescript
// HEAVY tier — depends on CMDB and Service modules
export const CHANGE_MANAGEMENT_MODULE: DIModule = {
  name: "change-management",
  tier: ModuleTier.HEAVY,
  featureFlag: "CHANGE_MANAGEMENT",
  dependencies: ["logger", "database", "foundation", "cmdb", "service"],
};
```

## Approval Flow (Tiered)

- **Standard**: Auto-approved on submission. No approval records needed.
- **Normal**: Single approver — CI owner (from `primaryOwnerPerson` on affected CI) or Change Manager role. One approval = APPROVED.
- **Emergency**: CAB members (configurable group). All must approve. Any rejection = REJECTED.
- Risk score >= 16 (VERY_HIGH) on a Normal change → system suggests escalation to Emergency.

## Risk Matrix

Likelihood (1-5) × Impact (1-5) = Risk Score:
- 1-5 → LOW, 6-10 → MEDIUM, 11-15 → HIGH, 16-20 → VERY_HIGH, 21-25 → CRITICAL

## Maintenance Window Rules

- **Normal changes**: Must be scheduled within an active window. Must not overlap blackouts.
- **Emergency changes**: Bypass window check. Blackouts warn but don't block.
- **Standard changes**: No scheduling required.

## Status Flow

```
DRAFT → submit() → SUBMITTED
SUBMITTED → assessRisk() → RISK_ASSESSED
RISK_ASSESSED → submitForApproval() → PENDING_APPROVAL (or APPROVED for Standard)
PENDING_APPROVAL → approve()/reject() → APPROVED / REJECTED
APPROVED → schedule() → SCHEDULED
APPROVED/SCHEDULED → startImplementation() → IN_PROGRESS
IN_PROGRESS → completeImplementation() → COMPLETED (Standard) / PIR_PENDING (Normal/Emergency)
IN_PROGRESS → failImplementation() → FAILED
IN_PROGRESS/FAILED → executeRollback() → ROLLED_BACK
PIR_PENDING → [PIR created] → close() → CLOSED
COMPLETED (Standard) → close() → CLOSED
Any non-terminal → cancel() → CANCELLED
```

## Reference Patterns (reuse from techhub)

| Pattern | Reference File |
|---|---|
| Approval workflow | `prisma/schema/disposal.prisma` (DisposalApproval) |
| Entity state machine | `src/core/domain/entities/asset-disposal.entity.ts` |
| HEAVY module DI | `src/di/modules/service.module.ts` |
| Queue handler | `src/infrastructure/services/queue/handlers/task-completed-notification.handler.ts` |
| Controller with heavy guard | `src/interface-adapters/controllers/business-process.controller.ts` |
| Feature flag + permission | `src/interface-adapters/controllers/reports.controller.ts` |
| Form-agnostic design | gf-report `next-report/src/lib/services/form-registry/` |
| Sync worker pattern | gf-report `next-report/src/lib/sync/` |

## Verification Plan

### Phase 1
1. `npx prisma migrate dev` succeeds
2. Seed creates form types (CR, AR, IR, CFR, etc.), categories, permissions, windows
3. Create CR via UI → DRAFT saved with auto-generated number
4. Create AR linked to CR → parentChangeRequestId set
5. Submit AR without parent CR → validation error
6. Submit Normal CR without testPlan → validation error
7. Submit Normal CR with testPlan + rollbackPlan → SUBMITTED
8. Risk assessment → score computed, level auto-mapped
9. Approval flow: Standard auto-approved, Normal creates single approval, Emergency creates CAB approvals
10. Schedule Normal within window → succeeds; outside window → blocked
11. Emergency outside window → allowed
12. Complete Normal → PIR_PENDING; close without PIR → blocked; create PIR → close → CLOSED
13. Dashboard metrics accurate
14. Feature flag off → 403
15. `npm run validate` passes

### Phase 2
1. MySQL connection to gf-report app DB works
2. Sync worker imports pending requests correctly
3. Imported records show "Synced from WordPress" badge
4. Timeline displays from imported JSON
5. Filter by source works
6. No edit/approve actions on imported records
7. Parent CR resolution works for imported sub-requests

### Phase 3
1. Create CR in techhub → entry appears in WordPress
2. Approve in techhub → GravityFlow assignee status updated
3. Feature flag toggle disables write-back instantly
4. Audit log tracks all cross-system writes

### Phase 4
1. Historical migration script imports all records
2. Count verification: techhub records = gf-report records
3. All gf-report dashboard features replicated in techhub
4. WordPress forms disabled, users redirected
5. gf-report decommissioned
