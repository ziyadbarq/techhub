# Implementation Plan

Phase-by-phase delivery plan for the Workflow Engine and Change Management module. Each phase is independently deployable and builds on the previous one. Phases 1–3 form the MVP; Phases 4–5 are post-MVP enhancements.

---

## Phase 0 — Schema & Permissions (Foundation)

**Goal:** Land the database, permissions, and feature flag. Nothing visible in the UI yet, but all downstream phases depend on this.

**Estimated scope:** 1 day

### 0.1 Prisma Schemas

Create two new schema files and update shared enums:

**New files:**
```
src/infrastructure/database/prisma/schema/workflow-engine.prisma
src/infrastructure/database/prisma/schema/change-management.prisma
```

**Edit:**
```
src/infrastructure/database/prisma/schema/shared-enums.prisma
  → Add: WorkflowDefinitionStatus, WorkflowInstanceStatus, WorkflowStepType,
          WorkflowStepStatus, WorkflowActionType, WorkflowSlaEventType,
          ChangeType, ChangeStatus, ChangePriority, ChangeRiskLevel,
          MaintenanceWindowRecurrence, PIROutcome
  → Edit: TargetObjectTypeEnum — add CHANGE_REQUEST, WORKFLOW_INSTANCE,
          WORKFLOW_STEP_INSTANCE, POST_IMPLEMENTATION_REVIEW, MAINTENANCE_WINDOW
```

See DATABASE_SCHEMA.md for the complete Prisma model definitions.

**Run:**
```bash
npx prisma migrate dev --name workflow_engine_and_change_management
npm run db:generate
```

### 0.2 Permissions

**Edit:**
```
src/core/domain/value-objects/permission-key.ts
  → Add 4 Workflow Engine permissions (WORKFLOW_DEFINITIONS_VIEW, etc.)
  → Add 17 Change Management permissions (CHANGES_VIEW, CHANGES_CREATE, etc.)
```

See PERMISSIONS.md for the complete permission key list.

**Edit:**
```
src/infrastructure/database/prisma/seed-factories/rbac-seed-factory.ts
  → Add 2 new permission groups: "Workflow Engine" and "Change Management"
  → Add 21 permissions with codes and descriptions
  → Assign permissions to roles per PERMISSIONS.md Role Assignments table
```

### 0.3 Feature Flag

**Edit:**
```
src/infrastructure/database/prisma/seed-factories/feature-flags-seed-factory.ts
  → Add CHANGE_MANAGEMENT flag (layer LAYER_3, dependencies: CMDB, SERVICES, FOUNDATION)
```

### 0.4 Acceptance Criteria

- [ ] `npx prisma migrate dev` runs clean with no errors
- [ ] All 21 permissions visible in Admin → RBAC
- [ ] `CHANGE_MANAGEMENT` feature flag exists (default disabled)
- [ ] Running `npm run validate` passes

---

## Phase 1 — Workflow Engine Core

**Goal:** A working generic workflow engine with full step execution, SLA tracking, and audit trail. Change Management is NOT wired yet — the engine is tested in isolation.

**Estimated scope:** 5–7 days

### 1.1 Domain Entities

**New files:**
```
src/core/domain/entities/workflow-definition.entity.ts
src/core/domain/entities/workflow-instance.entity.ts
src/core/domain/entities/workflow-step-instance.entity.ts
src/core/domain/entities/workflow-action.entity.ts
src/core/domain/entities/workflow-sla-event.entity.ts
```

Each entity follows the standard pattern: `static create(props, idGenerator)`, value validation in constructor, no Prisma imports.

### 1.2 Repository Interfaces

**New files:**
```
src/core/repositories/workflow-definition.repository.interface.ts
src/core/repositories/workflow-instance.repository.interface.ts
src/core/repositories/workflow-step-instance.repository.interface.ts
src/core/repositories/workflow-action.repository.interface.ts
```

Key query methods needed:
- `WorkflowInstance`: `findByEntityId(entityType, entityId)`, `findActiveByEntity(...)`, `findPendingTasksForUser(userId)`
- `WorkflowStepInstance`: `findActiveByInstanceId(instanceId)`, `findByStepId(instanceId, stepId)`
- `WorkflowAction`: `findByStepInstance(stepInstanceId)`

### 1.3 Prisma Repository Implementations

**New files:**
```
src/infrastructure/repositories/prisma-workflow-definition.repository.ts
src/infrastructure/repositories/prisma-workflow-instance.repository.ts
src/infrastructure/repositories/prisma-workflow-step-instance.repository.ts
src/infrastructure/repositories/prisma-workflow-action.repository.ts
```

### 1.4 Engine Service Interface

**New file:**
```
src/core/services/workflow-engine.service.interface.ts
```

```typescript
export interface IWorkflowEngineService {
  startWorkflow(params: StartWorkflowParams): Promise<WorkflowInstance>;
  takeAction(params: TakeActionParams): Promise<void>;
  getInstanceForEntity(entityType: string, entityId: string): Promise<WorkflowInstance | null>;
  getPendingTasksForUser(userId: string): Promise<WorkflowStepInstance[]>;
  adminForceAdvance(instanceId: string, stepId: string, actorId: string): Promise<void>;
  cancelInstance(instanceId: string, actorId: string, reason?: string): Promise<void>;
}
```

### 1.5 Assignee Resolver Registry

**New files:**
```
src/core/services/workflow-assignee-resolver.interface.ts
  → IAssigneeResolver: { resolve(context: WorkflowContext): Promise<string[]> }

src/infrastructure/workflow/resolvers/requestor.resolver.ts
src/infrastructure/workflow/resolvers/assigned-to.resolver.ts
src/infrastructure/workflow/resolvers/affected-ci-owners.resolver.ts
src/infrastructure/workflow/resolvers/affected-service-owners.resolver.ts
src/infrastructure/workflow/resolvers/specific-role.resolver.ts
src/infrastructure/workflow/resolvers/requestor-manager.resolver.ts
src/infrastructure/workflow/resolvers/resolver-registry.ts
  → Map<string, IAssigneeResolver> — keyed by resolver name
```

### 1.6 Automation Handler Registry

**New files:**
```
src/core/services/workflow-automation-handler.interface.ts
  → IAutomationHandler: { execute(context: WorkflowContext, params: Json): Promise<Json> }

src/infrastructure/workflow/handlers/automation-handler-registry.ts
  → Map<string, IAutomationHandler> — keyed by handler name
```

(Concrete CM handlers live in Phase 2)

### 1.7 SLA Calculator

**New file:**
```
src/infrastructure/workflow/sla/sla-calculator.ts
```

Responsibilities:
- Convert ISO 8601 duration strings (e.g., `PT48H`, `P5D`) to milliseconds
- Business-hour calendar: `saudi-standard` (Sun–Thu, 08:00–17:00 AST, skip Fri/Sat)
- Calendar: `calendar` (24/7, no exclusions)
- `calculateDeadline(startAt: Date, duration: string, calendar: string): Date`
- `isBreached(deadline: Date): boolean`
- `getRemainingMs(deadline: Date): number`

### 1.8 Condition Evaluator

**New file:**
```
src/infrastructure/workflow/conditions/condition-evaluator.ts
```

Evaluates the condition DSL against a `WorkflowContext` object:
- Primitive: `{ field, op, value }` — supports `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not_in`, `contains`, `exists`
- Composite: `{ and: [...] }`, `{ or: [...] }`, `{ not: {...} }`
- Field paths support dot notation (`steps.cab-approval.outcome`)

### 1.9 Step Executors

One executor class per step type. Each implements `IStepExecutor`:

```typescript
interface IStepExecutor {
  execute(step: WorkflowStepDefinition, instance: WorkflowInstance, context: WorkflowContext): Promise<StepResult>;
}
```

**New files:**
```
src/infrastructure/workflow/executors/approval.executor.ts
src/infrastructure/workflow/executors/input.executor.ts
src/infrastructure/workflow/executors/automation.executor.ts
src/infrastructure/workflow/executors/notification.executor.ts
src/infrastructure/workflow/executors/branch.executor.ts
src/infrastructure/workflow/executors/parallel.executor.ts
src/infrastructure/workflow/executors/delay.executor.ts
src/infrastructure/workflow/executors/escalation.executor.ts
src/infrastructure/workflow/executors/webhook.executor.ts
src/infrastructure/workflow/executors/review.executor.ts
src/infrastructure/workflow/executors/loop.executor.ts
src/infrastructure/workflow/executors/termination.executor.ts
src/infrastructure/workflow/executors/executor-registry.ts
```

### 1.10 WorkflowEngineService Implementation

**New file:**
```
src/infrastructure/workflow/workflow-engine.service.ts
```

This is the core engine. Key responsibilities:
- `startWorkflow()`: select definition by `triggerConditions`, instantiate `WorkflowInstance`, activate the first step
- `_activateStep()`: resolve assignees, compute SLA deadline, create `WorkflowStepInstance`, dispatch to correct executor
- `takeAction()`: validate actor is an assignee, record `WorkflowAction`, apply merge policy (for PARALLEL), advance to next step
- `_advanceToNext()`: evaluate branch conditions, handle END/TERMINATE, loop back for LOOP steps
- `cancelInstance()`: mark instance CANCELLED, cancel all ACTIVE step instances

### 1.11 SLA Background Job

**New file:**
```
src/infrastructure/workflow/sla/sla-monitor.job.ts
```

Runs on a cron schedule (every 5 minutes). Scans all `WorkflowStepInstance` records with `status = ACTIVE` and `slaDeadline != null`:
- If `slaDeadline - now <= warnAt`: fire WARNING event, notify assignees (once)
- If `now >= slaDeadline`: fire BREACH event, notify assignees + manager
- If `autoDecideAt` configured and `now >= autoDecideAt`: auto-take the configured `autoDecision` action

**Edit:**
```
src/infrastructure/jobs/   (or wherever existing cron jobs live)
  → Register sla-monitor.job.ts in the job scheduler
```

### 1.12 DI Module

**New file:**
```
src/di/modules/workflow-engine.module.ts
```

Binds all repositories, resolvers, handlers, executors, and `WorkflowEngineService`.

**Edit:**
```
src/di/module-definitions.ts
  → Add workflow-engine module to DASHBOARD or HEAVY tier (HEAVY preferred — lazy loaded)

src/di/types.ts
  → Add DI_TOKENS for all new interfaces
```

### 1.13 Use Cases

**New directory + files:**
```
src/core/use-cases/workflow-engine/
  index.ts                             ← barrel export (CRITICAL)
  start-workflow.use-case.ts
  take-workflow-action.use-case.ts
  get-workflow-instance.use-case.ts
  list-pending-tasks.use-case.ts
  cancel-workflow-instance.use-case.ts
  admin-force-advance.use-case.ts
  admin-reassign-step.use-case.ts
```

### 1.14 Admin Use Cases — Workflow Definitions

**New directory + files:**
```
src/core/use-cases/workflow-definitions/
  index.ts
  get-workflow-definition.use-case.ts
  list-workflow-definitions.use-case.ts
  clone-workflow-definition.use-case.ts
  publish-workflow-definition.use-case.ts
  archive-workflow-definition.use-case.ts
```

### 1.15 Seed — Built-in Workflow Definitions

**New file:**
```
src/infrastructure/database/prisma/seed-factories/workflow-definitions-seed-factory.ts
```

Seeds the three built-in definitions from WORKFLOW_DEFINITIONS.md. These are `PUBLISHED` and marked as read-only via a `metadata.builtIn: true` flag.

**Edit:**
```
src/infrastructure/database/prisma/seed.ts
  → Call workflow-definitions-seed-factory in both prod and dev presets
```

### 1.16 Acceptance Criteria

- [ ] Engine can start a workflow instance given a matching definition
- [ ] APPROVAL steps: action taken by correct assignee advances instance
- [ ] BRANCH steps: correct branch selected based on condition evaluation
- [ ] PARALLEL steps: all branches activate simultaneously; merge policy enforced
- [ ] AUTOMATION steps: registered handlers execute and output flows into context
- [ ] SLA monitor fires WARNING event when approaching deadline
- [ ] SLA auto-decision triggers at `autoDecideAt`
- [ ] `cancelInstance()` terminates all active steps
- [ ] `npm run validate` passes

---

## Phase 2 — Change Management Domain

**Goal:** Full Change Management domain layered on top of the engine. All lifecycle transitions, workflows, and business rules from CHANGE_MANAGEMENT.md work correctly. No UI yet — tested via server actions.

**Estimated scope:** 4–5 days

### 2.1 Change Management Entities

**New files:**
```
src/core/domain/entities/change-request.entity.ts
src/core/domain/entities/change-affected-ci.entity.ts
src/core/domain/entities/change-affected-service.entity.ts
src/core/domain/entities/maintenance-window.entity.ts
src/core/domain/entities/maintenance-blackout.entity.ts
src/core/domain/entities/post-implementation-review.entity.ts
```

`ChangeRequest.entity.ts` encodes all state transition guards as methods (e.g., `canSubmit()`, `canApprove()`, `canSchedule()`, `canStartImplementation()`, `canClose()`). Business rules from CHANGE_MANAGEMENT.md are enforced here.

### 2.2 Repository Interfaces

**New files:**
```
src/core/repositories/change-request.repository.interface.ts
  → findById, findByChangeNumber, list(filters), countByStatus,
    findChildRequests(parentId), hasOpenChildren(parentId),
    findScheduledInRange(start, end)

src/core/repositories/maintenance-window.repository.interface.ts
  → findActive(), findWindowsContaining(dateTime), findAll()

src/core/repositories/maintenance-blackout.repository.interface.ts
  → findActiveInRange(start, end), findAll()

src/core/repositories/post-implementation-review.repository.interface.ts
  → findByChangeRequestId(id), create(pir)
```

### 2.3 Prisma Implementations

**New files:**
```
src/infrastructure/repositories/prisma-change-request.repository.ts
src/infrastructure/repositories/prisma-maintenance-window.repository.ts
src/infrastructure/repositories/prisma-maintenance-blackout.repository.ts
src/infrastructure/repositories/prisma-post-implementation-review.repository.ts
```

### 2.4 Change Number Generator

**New file:**
```
src/infrastructure/workflow/handlers/generate-change-number.handler.ts
```

Implements `IAutomationHandler`. Generates change numbers per format in CHANGE_MANAGEMENT.md (e.g., `CR-20260414-00042`). Uses a per-type-per-day counter with optimistic locking (retry on unique constraint violation).

### 2.5 CM-Specific Automation Handlers

**New files:**
```
src/infrastructure/workflow/handlers/set-change-status.handler.ts
src/infrastructure/workflow/handlers/compute-change-risk.handler.ts
src/infrastructure/workflow/handlers/validate-maintenance-window.handler.ts
src/infrastructure/workflow/handlers/notify-ci-owners.handler.ts
```

Register all handlers in `automation-handler-registry.ts`.

### 2.6 CM-Specific Assignee Resolvers

**New files:**
```
src/infrastructure/workflow/resolvers/affected-ci-owners.resolver.ts  (update from stub)
src/infrastructure/workflow/resolvers/affected-service-owners.resolver.ts
```

### 2.7 Maintenance Window Service

**New file:**
```
src/core/services/maintenance-window.service.interface.ts
src/infrastructure/workflow/maintenance-window.service.ts
```

Methods:
- `findWindowsForDateTime(dt: Date): Promise<MaintenanceWindow[]>`
- `isInBlackout(dt: Date): Promise<boolean>`
- `validateScheduling(changeType: ChangeType, startAt: Date, endAt: Date): Promise<ValidationResult>`
- `getNextAvailableWindow(after?: Date): Promise<Date>`

### 2.8 Use Cases

**New directory + files:**
```
src/core/use-cases/change-management/
  index.ts                                         ← barrel export (CRITICAL)

  # CR lifecycle
  create-change-request.use-case.ts
  update-change-request.use-case.ts
  submit-change-request.use-case.ts
  schedule-change-request.use-case.ts
  start-implementation.use-case.ts
  complete-implementation.use-case.ts
  fail-implementation.use-case.ts
  execute-rollback.use-case.ts
  cancel-change-request.use-case.ts
  close-change-request.use-case.ts
  delete-change-request.use-case.ts               ← DRAFT only

  # Approval / workflow actions
  take-workflow-action.use-case.ts                ← thin wrapper over engine's takeAction

  # PIR
  create-pir.use-case.ts
  get-pir.use-case.ts

  # Maintenance windows
  list-maintenance-windows.use-case.ts
  create-maintenance-window.use-case.ts
  update-maintenance-window.use-case.ts
  toggle-maintenance-window.use-case.ts
  delete-maintenance-window.use-case.ts

  # Blackouts
  list-maintenance-blackouts.use-case.ts
  create-maintenance-blackout.use-case.ts
  delete-maintenance-blackout.use-case.ts

  # Queries
  get-change-request.use-case.ts
  list-change-requests.use-case.ts
  get-pending-approvals-for-user.use-case.ts
  get-change-calendar.use-case.ts                 ← returns changes with scheduledStartAt in range
  get-change-dashboard-stats.use-case.ts          ← pipeline funnel, SLA health, volume chart data
```

### 2.9 DI Module

**New file:**
```
src/di/modules/change-management.module.ts
```

**Edit:**
```
src/di/module-definitions.ts    → add change-management module to HEAVY tier
src/di/types.ts                 → add DI_TOKENS for all new interfaces
```

### 2.10 Seed — Maintenance Windows + Demo CRs

**New file:**
```
src/infrastructure/database/prisma/seed-factories/change-management-seed-factory.ts
```

Seeds:
- Three built-in maintenance windows (Tuesday Night, Weekend Window, Monthly Patch)
- Dev preset: 10–20 demo CRs in various statuses (DRAFT, IN_WORKFLOW, APPROVED, CLOSED) across all change types

**Edit:**
```
src/infrastructure/database/prisma/seed.ts
  → Call change-management-seed-factory in prod preset (windows only)
  → Call with demo CRs in dev preset
```

### 2.11 Notifications — Change Management Templates

**Edit:**
```
src/infrastructure/notifications/   (or existing notification service)
  → Register templates: change-submitted, change-approval-needed, change-approved,
    change-rejected, change-more-info, change-info-provided, change-scheduled,
    change-started, change-completed, change-failed, workflow-sla-warning,
    workflow-sla-breach, pir-reminder, pir-escalation, change-closed,
    emergency-change-alert, emergency-change-approved, change-risk-escalation-suggested
```

### 2.12 PIR Reminder Job

**New file:**
```
src/infrastructure/workflow/pir/pir-reminder.job.ts
```

Daily cron. Finds all `PIR_PENDING` changes older than 24h and sends escalating reminders per CHANGE_MANAGEMENT.md PIR Reminders section.

### 2.13 Acceptance Criteria

- [ ] CR created → `changeNumber` auto-generated in correct format
- [ ] CR submitted → workflow instance starts automatically with correct definition
- [ ] Standard CR auto-approves immediately
- [ ] Normal CR: risk assessment INPUT step activates for change-manager role
- [ ] Normal CR: riskScore computed → branches correctly (critical/escalation/single approval)
- [ ] Emergency CR: parallel CAB + CI owner approval activates simultaneously
- [ ] Emergency CR: auto-approves at 6h if no action taken
- [ ] `scheduledStartAt` for Normal CR validated against active maintenance window
- [ ] Blackout period blocks Normal scheduling
- [ ] PIR required before CLOSED for Normal and Emergency
- [ ] Parent CR cannot close while children are open
- [ ] All 10 business rules from CHANGE_MANAGEMENT.md enforced
- [ ] `npm run validate` passes

---

## Phase 3 — UI

**Goal:** All routes from UI_PLAN.md are functional. The full workflow lifecycle is operable through the browser.

**Estimated scope:** 8–10 days

### 3.1 Route Registration & Navigation

**Edit:**
```
src/app/(dashboard)/layout.tsx (or nav config)
  → Add Change Management and Workflow Engine sections (behind CHANGE_MANAGEMENT flag)

protected-routes.ts
  → Register all 9 routes per UI_PLAN.md with required permissions

npm run generate:routes
  → Regenerates route manifest after editing source
```

### 3.2 Controllers

**New files:**
```
src/interface-adapters/controllers/change-management.controller.ts
  → Server actions: createChangeAction, updateChangeAction, submitChangeAction,
    scheduleChangeAction, startImplementationAction, completeImplementationAction,
    failImplementationAction, executeRollbackAction, cancelChangeAction,
    closeChangeAction, deleteChangeAction, takeWorkflowActionAction, createPIRAction

src/interface-adapters/controllers/maintenance-windows.controller.ts
  → Server actions: createWindowAction, updateWindowAction, toggleWindowAction,
    deleteWindowAction, createBlackoutAction, deleteBlackoutAction

src/interface-adapters/controllers/workflow-definitions.controller.ts
  → Server actions: cloneDefinitionAction, publishDefinitionAction, archiveDefinitionAction
```

All server actions follow the existing pattern:
- `await requireFeature("CHANGE_MANAGEMENT")`
- `await requirePermission(PERMISSIONS.CHANGES_CREATE)` (or relevant permission)
- Validate input via Zod DTO
- Resolve use case from DI container
- Call use case, return result

### 3.3 DTOs

**New files:**
```
src/interface-adapters/dtos/change-request.dto.ts
src/interface-adapters/dtos/change-workflow-action.dto.ts
src/interface-adapters/dtos/maintenance-window.dto.ts
src/interface-adapters/dtos/maintenance-blackout.dto.ts
src/interface-adapters/dtos/post-implementation-review.dto.ts
src/interface-adapters/dtos/workflow-definition.dto.ts
```

### 3.4 Presenters

**New files:**
```
src/interface-adapters/presenters/change-request.presenter.ts
src/interface-adapters/presenters/workflow-timeline.presenter.ts
  → Shapes WorkflowInstance + StepInstances + Actions into timeline view model
src/interface-adapters/presenters/change-dashboard.presenter.ts
src/interface-adapters/presenters/maintenance-window.presenter.ts
```

### 3.5 Shared Components

**New files:**
```
src/components/change-management/
  workflow-timeline.tsx           ← vertical step list (see UI_PLAN.md WorkflowTimeline)
  approval-panel.tsx              ← approve/reject/request-info panel
  risk-matrix.tsx                 ← 5×5 interactive grid
  affected-ci-panel.tsx           ← multi-select + cards
  affected-service-panel.tsx      ← multi-select + cards
  maintenance-window-picker.tsx   ← calendar-aware date/time picker
  pir-form.tsx                    ← PIR fields
  child-requests-panel.tsx        ← linked AR/IR/CFR list
  change-status-badge.tsx         ← status badge with color coding
  change-type-badge.tsx
  priority-badge.tsx
  sla-indicator.tsx               ← elapsed vs. total bar, color-coded
```

### 3.6 Page: Change List `/change-management`

**New files:**
```
src/app/(dashboard)/change-management/page.tsx
  → export const dynamic = "force-dynamic"
  → Server component: requireFeature + requirePermission(CHANGES_VIEW)
  → Returns <ChangeListClient />

src/app/(dashboard)/change-management/change-list-client.tsx
  → Filter bar (status, changeType, requestTypeCode, priority, dateRange, myChanges, myApprovals)
  → TanStack Table with columns per UI_PLAN.md
  → Export to XLSX button
  → Sidebar badge counts (pending approvals, SLA breaches)
```

### 3.7 Page: Change Creation `/change-management/new`

**New files:**
```
src/app/(dashboard)/change-management/new/page.tsx
src/app/(dashboard)/change-management/new/change-creation-wizard.tsx
  → Step 1: Request type picker (icon cards) + change type + parent CR picker
  → Step 2: Details form (title, description, priority, justification, plans)
  → Step 3: Impact (CIs + Services multi-select)
  → Step 4: Review + Submit
  → Auto-save DRAFT on step navigation
  → Resume draft if one exists
```

### 3.8 Page: Change Detail `/change-management/[id]`

**New files:**
```
src/app/(dashboard)/change-management/[id]/page.tsx
src/app/(dashboard)/change-management/[id]/change-detail-client.tsx
  → Two-column layout (left content, right sidebar)
  → Left: header, description, planning (collapsible), CIs, services, impl notes, PIR section
  → Right: WorkflowTimeline, ApprovalPanel (if user has pending task), risk matrix,
           scheduling block, people
  → Actions bar: contextual buttons per status + permissions
```

### 3.9 Page: Workflow Deep Link `/change-management/[id]/workflow`

**New files:**
```
src/app/(dashboard)/change-management/[id]/workflow/page.tsx
  → Full-page WorkflowTimeline with complete audit trail
  → Shows every step, every action, every actor, every timestamp
  → Useful for audit and compliance reviews
```

### 3.10 Page: Calendar `/change-management/calendar`

**New files:**
```
src/app/(dashboard)/change-management/calendar/page.tsx
src/app/(dashboard)/change-management/calendar/change-calendar-client.tsx
  → Monthly calendar view
  → Change blocks color-coded by type (STANDARD=grey, NORMAL=blue, EMERGENCY=red)
  → Maintenance windows as semi-transparent regions
  → Blackout periods as striped red regions
  → Click change → side panel with summary + link
  → Hover window → tooltip
```

### 3.11 Page: Dashboard `/change-management/dashboard`

**New files:**
```
src/app/(dashboard)/change-management/dashboard/page.tsx
  → requirePermission(CHANGES_DASHBOARD)
src/app/(dashboard)/change-management/dashboard/dashboard-client.tsx
  → Pipeline funnel widget
  → My pending approvals widget
  → SLA health widget
  → Change volume bar chart (last 12 months)
  → Type breakdown donut chart
  → CAB queue widget
  → Recent failures widget
  → Upcoming scheduled widget
```

### 3.12 Page: Maintenance Windows `/maintenance-windows`

**New files:**
```
src/app/(dashboard)/maintenance-windows/page.tsx
src/app/(dashboard)/maintenance-windows/maintenance-windows-client.tsx
  → Two tabs: Windows + Blackouts
  → MANAGE permission enables create/edit/delete actions
```

### 3.13 Page: Workflow Definitions `/workflow-definitions`

**New files:**
```
src/app/(dashboard)/workflow-definitions/page.tsx
src/app/(dashboard)/workflow-definitions/workflow-definitions-client.tsx
  → Table of definitions with version, status, publishedAt
  → Actions: Clone, View step graph (JSON editor), Publish, Archive
  → Built-in definitions read-only (no edit/delete)

src/app/(dashboard)/workflow-definitions/[id]/page.tsx
  → Definition detail + step graph visualization
  → JSON editor with syntax highlighting + basic schema validation
```

### 3.14 Acceptance Criteria

- [ ] `/change-management` shows list with correct filters and badge counts
- [ ] `/change-management/new` creates a CR and starts the correct workflow
- [ ] DRAFT auto-saves on step navigation; resumable after page reload
- [ ] `/change-management/[id]` detail view renders timeline with actor + decision + timestamp
- [ ] ApprovalPanel appears only for users with a pending task on the active step
- [ ] All actions bar buttons gated by status + permission
- [ ] Calendar renders changes on correct dates with correct colors
- [ ] Dashboard widgets show accurate stats (not placeholder data)
- [ ] Emergency CR shows parallel branches simultaneously in timeline
- [ ] PIRForm visible only in PIR_PENDING status
- [ ] `/maintenance-windows` CRUD works for users with MANAGE permission
- [ ] `/workflow-definitions` clone + publish + archive work
- [ ] Route protection: unauthenticated request to any route redirects to login
- [ ] Route protection: user without CHANGES_VIEW gets 403
- [ ] `npm run validate` passes

---

## Phase 4 — Advanced Engine Features

**Goal:** Post-MVP capabilities that extend the engine without breaking existing workflows.

**Estimated scope:** 5–7 days

### 4.1 Delegation & OOO

**New files:**
```
src/core/domain/entities/workflow-delegation.entity.ts
src/core/repositories/workflow-delegation.repository.interface.ts
src/infrastructure/repositories/prisma-workflow-delegation.repository.ts
src/core/use-cases/workflow-engine/create-delegation.use-case.ts
src/core/use-cases/workflow-engine/revoke-delegation.use-case.ts
```

**Edit:**
```
src/infrastructure/workflow/workflow-engine.service.ts
  → When resolving assignees, check for active delegation records
  → If delegator is an assignee and has an active delegation → add delegatee to assignees

src/app/(dashboard)/profile/
  → Add delegation management UI (DELEGATE_TO + date range)
```

**Schema addition:**
```prisma
model WorkflowDelegation {
  id          String   @id @default(cuid())
  delegatorId String
  delegatorId Person   @relation("DelegationFrom", fields: [delegatorId], references: [id])
  delegateeId String
  delegatee   Person   @relation("DelegationTo", fields: [delegateeId], references: [id])
  fromDate    DateTime
  toDate      DateTime
  reason      String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@index([delegatorId, isActive])
}
```

### 4.2 Webhook Steps

**Edit:**
```
src/infrastructure/workflow/executors/webhook.executor.ts
  → Implement HTTP POST to external URL with retry (3 attempts, exponential backoff)
  → Verify HMAC signature on callback
  → Timeout: configurable per step, default 30s
  → On timeout: trigger onFailure path or suspend waiting for callback

src/app/api/workflow/webhook-callback/route.ts
  → POST endpoint for external systems to call back
  → Validate HMAC, find waiting step, inject result into context, advance workflow
```

### 4.3 Loop Steps

**Edit:**
```
src/infrastructure/workflow/executors/loop.executor.ts
  → Implement: evaluate loop condition, if true → re-activate inner steps
  → Track iteration count in step context to prevent infinite loops (maxIterations guard)
```

### 4.4 Quorum Merge Policy

**Edit:**
```
src/infrastructure/workflow/executors/parallel.executor.ts
  → Add QUORUM(N) merge policy: advance when N branches complete
  → Remaining branches are cancelled (SKIPPED status)
```

### 4.5 Admin Override UI

**Edit:**
```
src/app/(dashboard)/workflow-definitions/[id]/page.tsx
  → Add running instances panel (requires WORKFLOW_INSTANCES_VIEW)
  → Force-advance step button (requires WORKFLOW_INSTANCES_MANAGE)
  → Reassign task button (requires WORKFLOW_INSTANCES_MANAGE)
  → Cancel instance button (requires WORKFLOW_INSTANCES_MANAGE)
```

### 4.6 Acceptance Criteria

- [ ] Delegation: approver with active delegation — delegatee can take action on their behalf
- [ ] Delegation: delegation expiry stops delegatee access
- [ ] Webhook: step sends HTTP POST and advances on callback
- [ ] Webhook: step fails gracefully on timeout after configured duration
- [ ] Loop: executes N times based on condition then exits
- [ ] Loop: stops at maxIterations guard
- [ ] QUORUM(2): advances after 2 of 3 branches complete; remaining cancelled
- [ ] Admin force-advance works for WORKFLOW_INSTANCES_MANAGE role
- [ ] Admin reassign works for WORKFLOW_INSTANCES_MANAGE role
- [ ] `npm run validate` passes

---

## Phase 5 — Visual Workflow Designer (Post-MVP)

**Goal:** A drag-and-drop browser UI for creating and editing workflow definitions without editing JSON directly. This phase is deliberately last because it is additive — existing JSON definitions continue to work unchanged.

**Estimated scope:** 10–14 days

### 5.1 Designer Infrastructure

**New files:**
```
src/app/(dashboard)/workflow-definitions/[id]/designer/page.tsx
src/components/workflow-designer/
  designer-canvas.tsx             ← React Flow canvas
  designer-sidebar.tsx            ← step type palette
  step-nodes/
    approval-node.tsx
    input-node.tsx
    automation-node.tsx
    notification-node.tsx
    branch-node.tsx
    parallel-node.tsx
    delay-node.tsx
    escalation-node.tsx
  step-config-panels/
    approval-config.tsx
    input-config.tsx
    automation-config.tsx
    notification-config.tsx
    branch-config.tsx
    parallel-config.tsx
  designer-toolbar.tsx            ← save, validate, publish, zoom controls
```

**Dependencies to add:**
```
@xyflow/react          ← React Flow v12 (MIT)
```

### 5.2 JSON ↔ Graph Serialization

**New file:**
```
src/infrastructure/workflow/designer/definition-serializer.ts
```

Converts the step DSL JSON ↔ React Flow node/edge representation. Handles:
- Linear sequences
- Branch nodes (multi-output edges)
- Parallel groups (sub-canvas or collapsed node)
- Escalation watchers (dashed edge to watched step)

### 5.3 Schema Validation

**New file:**
```
src/infrastructure/workflow/designer/definition-validator.ts
```

Validates a step graph before publish:
- Every non-terminal step has at least one outgoing path
- No orphan steps (unreachable from first step)
- Every `onFailure` / `onReject` path leads to a terminal or a real step
- Required fields present per step type
- No circular references (unless intentional LOOP)

### 5.4 Acceptance Criteria

- [ ] Existing JSON definitions render correctly in the visual designer
- [ ] Adding/removing steps via canvas updates the underlying JSON
- [ ] Configuring step properties via side panel updates JSON
- [ ] Validator catches: orphan steps, missing required fields, cycles (non-loop)
- [ ] Save as DRAFT works; published definitions are read-only in designer
- [ ] Built-in definitions render read-only (no drag/edit)
- [ ] `npm run validate` passes

---

## Dependency Map

```
Phase 0 (Schema + Perms)
  └── Phase 1 (Engine Core)
        └── Phase 2 (Change Management Domain)
              └── Phase 3 (UI)
                    ├── Phase 4 (Advanced Engine Features)    ← extends Phase 1+3
                    └── Phase 5 (Visual Designer)             ← extends Phase 3
```

Phases 4 and 5 are independent of each other and can be parallelized after Phase 3 ships.

---

## File Count Summary

| Phase | New Files | Edited Files |
|---|---|---|
| 0 — Schema & Permissions | 2 schema + 2 seed edits | 3 |
| 1 — Engine Core | ~35 | ~4 |
| 2 — Change Management Domain | ~30 | ~3 |
| 3 — UI | ~40 | ~4 |
| 4 — Advanced Features | ~8 | ~5 |
| 5 — Visual Designer | ~15 | ~2 |
| **Total** | **~130** | **~21** |

---

## Key Invariants (Never Violate)

1. **Engine is entity-agnostic.** `WorkflowEngineService` has no imports from Change Management. CM calls the engine via its interface.
2. **Workflow definitions are append-only.** Never mutate a PUBLISHED definition. Clone → edit → publish a new version. Running instances always pin to the version at start time (`definitionVersion` field).
3. **WorkflowAction is immutable.** No `updatedAt`. It is an audit record — never update or delete.
4. **Feature flag gates everything.** Every server action, every server component, every page in Change Management checks `requireFeature("CHANGE_MANAGEMENT")` before anything else.
5. **SLA clock pauses on REQUEST_INFO.** `slaPausedAt` is set when an assignee requests more info. Resume on PROVIDE_INFO. Elapsed time before pause does not reset.
6. **Built-in definitions cannot be deleted.** Guard via `metadata.builtIn === true` check in all delete/update paths.
7. **Barrel exports are mandatory.** Every `src/core/use-cases/{module}/` directory must have an `index.ts` — pre-commit hook enforces this.
