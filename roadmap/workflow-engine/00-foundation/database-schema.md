# Database Schema — Foundation Reference

**Phase:** [00-foundation](./README.md)
**Status:** Reference for engineers starting Phase 00. Aligned to the sealed [PRD.md](../PRD.md).

---

## Purpose

This document describes the entities the database needs, their relationships, and the constraints the database itself enforces. It is **not** a full Prisma schema — that lives in `prisma/schema/*.prisma` once the work starts. The point of this document is to make the *shape* of the data model clear before anyone writes a migration.

The guiding rule: **there are no Change Management tables.** Every CM concept (Change Request, Application Release, maintenance window, risk score, PIR) is a row in a generic engine table. The engine is entity-agnostic; CM is seed data on top of it.

---

## Entity Map

```
                            ┌──────────────┐
                            │     Form     │
                            └──────┬───────┘
                                   │ 1:N
                          ┌────────▼────────┐
                          │   FormVersion   │  ← immutable once published
                          └────────┬────────┘
                                   │ 1:N
                ┌──────────────────┼──────────────────┐
                │                  │                  │
         ┌──────▼──────┐   ┌──────▼─────────┐  ┌─────▼──────────┐
         │  FormField  │   │ WorkflowDef    │  │ RejectionPolicy│
         └─────────────┘   └──────┬─────────┘  └────────────────┘
                                  │ 1:N
                          ┌───────▼─────────┐
                          │ WorkflowVersion │  ← immutable once published
                          └───────┬─────────┘
                                  │ 1:N
                          ┌───────▼─────────┐
                          │     Request     │  ← pinned to one FormVersion + one WorkflowVersion
                          └───────┬─────────┘
                                  │
   ┌──────────────┬───────────────┼────────────────┬─────────────────┐
   │              │               │                │                 │
┌──▼─────────┐ ┌─▼──────────┐ ┌──▼─────────┐ ┌────▼─────┐ ┌─────────▼────┐
│StepInstance│ │FieldHistory│ │ RequestLink│ │  Watcher │ │ HoldEvent /  │
└──────┬─────┘ └────────────┘ └────────────┘ └──────────┘ │   SLAEvent   │
       │                                                  └──────────────┘
   ┌───▼────────────┐
   │ AuditEntry +   │
   │ AssigneeSnapsh │
   └────────────────┘
```

Reference data (referenced by Forms / WorkflowVersions / Steps):

```
BusinessCalendar · MaintenanceWindow · BlackoutPeriod · HoldReason
EmailTemplate · Delegation · ModuleStatusExtension · ModuleOutcomeExtension
WatcherSubscription (form-level)
```

---

## Core Entities

### Form

A request type. The `Form` row is the *logical* form ("Change Request"); each immutable published edit is a `FormVersion` row, mirroring the workflow versioning model (PRD §6.3).

| Field | Notes |
|---|---|
| `id` | CUID2 |
| `slug` | stable across versions |
| `name`, `description` | metadata; mutable on the `Form` row |
| `ownerIds` | array of Person IDs |
| `isActive` | inactive forms reject new submissions |
| `activeVersionId` | currently published `FormVersion` |
| `metadata` | including `builtIn: true` for seeded forms |

### FormVersion

A specific published edit of a Form. Immutable once published.

| Field | Notes |
|---|---|
| `formId` | FK to Form |
| `version` | monotonic integer per form |
| `status` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `referenceNumberFormat` | JSON: prefix, date component, sequence, timezone (PRD §21) |
| `rejectionPolicyId` | FK to RejectionPolicy (which is itself versioned implicitly via the form version that pins it) |
| `fieldsJson` | the full set of FormField definitions for this version, captured inline so the version is self-contained |
| `publishedAt`, `publishedById` | |

**Constraint:** once `status = PUBLISHED`, every column on the version is immutable. Database trigger raises an error on any `UPDATE`. A new draft is published as a new row, never an in-place edit (PRD §22 invariant 7).

`Request.formVersionId` points at a specific `FormVersion`. Form reads/writes on a running request always use the pinned version. `FieldHistoryEntry` is keyed by `(formVersionId, fieldKey)` so renames and removals in newer versions never break audit reads on older instances.

### FormField

A field within a FormVersion. Lives inside `FormVersion.fieldsJson` for atomic publication; this table is the searchable/indexable projection.

| Field | Notes |
|---|---|
| `formVersionId` | FK to FormVersion |
| `key`, `label`, `type` | type from `FormFieldType` enum below |
| `required`, `defaultValue`, `validation` | |
| `visibilityCondition` | JSON expression tree (PRD §5.4) |
| `order` | for layout |
| `config` | type-specific (see notes below) |

`FormFieldType` enum (mirrors PRD §5.3): `SHORT_TEXT`, `LONG_TEXT`, `NUMBER`, `DATE`, `DATETIME`, `DROPDOWN`, `MULTI_SELECT`, `CHECKBOX`, `FILE_UPLOAD`, `USER_PICKER`, `MULTI_USER_PICKER`, `REQUEST_LINK`, `SCORED_MATRIX`, `REPEATER`, `LOOKUP`, `SECTION_HEADER`, `COMPUTED`.

**Type-specific `config` shapes:**

- `REQUEST_LINK` — `{ targetFormSlugs, cardinality, parentGate }`
- `SCORED_MATRIX` — `{ xAxis: { label, levels }, yAxis: { label, levels }, scoreFn }`
- `REPEATER` — `{ subFields: [...FormField], minRows, maxRows, allowReorder }`. Sub-fields are full FormField definitions; the repeater stores them inline. Per-step state and visibility apply to the repeater container as a whole, not to individual sub-fields or rows (PRD §5.3 clarification).
- `LOOKUP` — `{ source: 'cmdb' | 'directory' | 'form' | 'http', sourceConfig, dependsOn: [fieldKey], cacheStrategy: 'live-edit-only' }`. Lookups re-evaluate live only during edit modes; resolved values are written into `FieldHistoryEntry` at every action so historical reads are stable (PRD §5.3 clarification).
- `COMPUTED` — `{ formula }` where `formula` is an expression in the engine's shared expression language (same DSL as visibility rules and conditional branch routing — see [`engine-core.md`](../01-engine-core/engine-core.md) §4).

### WorkflowDefinition / WorkflowVersion

A workflow associated with a Form. The `WorkflowDefinition` is the logical "workflow X"; each immutable published edit is a `WorkflowVersion` (PRD §6.3).

| Field | Notes |
|---|---|
| `WorkflowDefinition.id`, `slug`, `formId` | one definition per form |
| `WorkflowDefinition.activeVersionId` | currently published version |
| `WorkflowVersion.definitionId`, `version` | monotonic int per definition |
| `WorkflowVersion.status` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `WorkflowVersion.steps` | JSON: full step graph |
| `WorkflowVersion.fieldStateMatrix` | JSON: per-step field state (PRD §5.5) |
| `WorkflowVersion.publishedAt`, `publishedById` | |

**Constraint:** once `status = PUBLISHED`, `steps`, `fieldStateMatrix`, and every other field on the version are immutable. Enforced both at the application layer and via a database trigger (PRD §22 invariant 7).

### Request

The unit that flows through the system. Replaces the old `WorkflowInstance` + entity-specific tables.

| Field | Notes |
|---|---|
| `id` | CUID2 |
| `formId` | FK to Form (logical) |
| `formVersionId` | pinned at submission, never changes (PRD §22 invariant 7) |
| `workflowVersionId` | pinned at submission, never changes (PRD §22 invariant 7) |
| `referenceNumber` | unique per form (PRD §21); never changes after assignment (PRD §22 invariant 5) |
| `status` | enum below |
| `outcome` | enum below; null until CLOSED/CANCELLED |
| `outcomeNotes` | text; required when outcome ≠ SUCCESSFUL |
| `holdReasonId` | FK to HoldReason; required when status = ON_HOLD; null otherwise |
| `currentStepIds` | array (parallel branches) |
| `requestorId` | FK to Person |
| `submittedAt`, `closedAt`, `cancelledAt` | |
| `fieldValues` | JSON: current value of every field (point-in-time view, evaluated against the pinned form version) |
| `metadata` | |

`RequestStatus` enum (PRD §10.1): `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `ON_HOLD`, `IN_PROGRESS`, `PENDING_REVIEW`, `CLOSED`, `CANCELLED`. Module-declared intermediates (CM's `APPROVED`, `SCHEDULED`, `FAILED`, `ROLLED_BACK`, `PIR_PENDING`) are stored as values in this same enum, registered via `ModuleStatusExtension`.

`RequestOutcome` enum (PRD §10.2): `SUCCESSFUL`, `SUCCESSFUL_WITH_ISSUES`, `UNSUCCESSFUL`, `WITHDRAWN`, `REJECTED`, `SUPERSEDED`, `ABANDONED`, `EXPIRED`. CM-declared additions: `ROLLED_BACK`, `PARTIALLY_ROLLED_BACK`, `DEFERRED`.

**Database-enforced invariants on Request** (PRD §22):
1. `outcome IS NOT NULL` exactly when `status IN ('CLOSED', 'CANCELLED')` — CHECK constraint.
2. `holdReasonId IS NOT NULL` exactly when `status = 'ON_HOLD'` — CHECK constraint.
3. `outcomeNotes IS NOT NULL` when `outcome IS NOT NULL AND outcome <> 'SUCCESSFUL'` — CHECK constraint.
4. `referenceNumber` is `NOT NULL UNIQUE` per `formId` — UNIQUE constraint.
5. The transition function (a stored procedure or trigger) is the only path that writes status/outcome/holdReason, and it enforces atomicity of the three-field model.

### StepInstance

An active or completed step within a Request's workflow run.

| Field | Notes |
|---|---|
| `requestId` | FK |
| `stepKey` | matches the `id` field in the WorkflowVersion's `steps` JSON |
| `stepType` | mirrors PRD §7 enum |
| `status` | `PENDING`, `ACTIVE`, `WAITING`, `COMPLETED`, `SKIPPED`, `FAILED` |
| `policy` | `SINGLE` or `PARALLEL` (PRD §8) |
| `parentStepId` | for parallel branch children |
| `activatedAt`, `completedAt` | |
| `outcomeKey` | the action result (e.g., "approve", "reject", "complete") |
| `slaCalendarId` | snapshot of which calendar this step uses |
| `slaThresholdsJson` | snapshot of escalation rules (so the version's edits never affect this step) |

`StepType` enum (PRD §7): `APPROVAL`, `EXECUTION`, `INFO_ACK`, `AUTOMATION`, `NOTIFICATION`, `CONDITIONAL_BRANCH`, `DELAY`, `SCHEDULE`.

### AuditEntry

Append-only record of every action ever taken on a Request (PRD §17).

| Field | Notes |
|---|---|
| `requestId`, `stepInstanceId` | |
| `actorId` | Person or null |
| `actorKind` | `HUMAN`, `SYSTEM_POLICY`, `SYSTEM_SLA_ESCALATION`, `SYSTEM_AUTOMATION`, `DELEGATEE` |
| `delegationChainJson` | full chain in effect at action time (PRD §17) |
| `actionType` | enum below |
| `payload` | JSON: arbitrary action data (form values, comments, threshold info) |
| `viaEmailToken` | bool — was the action taken via email action button (PRD §14.2) |
| `createdAt` | |

`ActionType` enum (PRD §9): `SUBMIT`, `APPROVE`, `REJECT`, `COMPLETE`, `ACKNOWLEDGE`, `REQUEST_INFO`, `PROVIDE_INFO`, `RETURN_TO_PREVIOUS_STEP`, `SEND_TO_REQUESTOR`, `REASSIGN`, `PUT_ON_HOLD`, `RESUME`, `CANCEL`, `OVERRIDE`, plus `SYSTEM_AUTO_ADVANCE` and `SYSTEM_AUTOMATION_RAN` for system actors.

**Constraint:** no `UPDATE` or `DELETE` on this table. Enforced via a database trigger that raises an error on any write other than `INSERT`. Override actions are inserted as new entries that reference the `id` they override.

### FieldHistoryEntry

Append-only record of every field value change (PRD §17).

| Field | Notes |
|---|---|
| `requestId`, `fieldKey` | |
| `previousValueJson`, `newValueJson` | |
| `actorId` | |
| `auditEntryId` | optional FK linking this change to the action that produced it |
| `createdAt` | |

Same insert-only trigger as AuditEntry.

### AssigneeSnapshot

Append-only record of who was resolved as an assignee for a step at the moment it activated (PRD §17).

| Field | Notes |
|---|---|
| `stepInstanceId` | |
| `assigneeId` | Person |
| `strategy` | which assignment strategy from PRD §12 produced this user |
| `delegationChainJson` | the chain in effect at snapshot time, if any |
| `snapshotAt` | |

The system never re-resolves assignment rules later — it always reads from these snapshots. Stale roles or departed users do not corrupt the audit trail.

### HoldEvent

Append-only log of hold/resume cycles for SLA pause computation (PRD §13.3).

| Field | Notes |
|---|---|
| `requestId`, `stepInstanceId` | |
| `eventType` | `PAUSE`, `RESUME` |
| `reasonId` | FK to HoldReason; required for PAUSE |
| `actorId`, `notes`, `occurredAt` | |

The current SLA deadline is always **computed** from this log plus the step's `activatedAt` plus the calendar — never stored as a mutable field. PRD §22 invariant 8.

### SLAEvent

Append-only record of SLA threshold crossings and escalations fired (PRD §13.2).

| Field | Notes |
|---|---|
| `stepInstanceId` | |
| `eventType` | `WARN`, `BREACH`, `ESCALATION_FIRED`, `AUTO_ADVANCED` |
| `escalationRuleKey` | which rule from the step config fired |
| `firedAt`, `metadata` | |

### Watcher

A user explicitly subscribed to receive notifications for a request without holding any action authority (PRD §14.4).

| Field | Notes |
|---|---|
| `requestId` | FK |
| `userId` | FK to Person |
| `addedById` | who added this watcher (self, form owner, or admin) |
| `addedAt` | |
| `removedAt` | nullable; soft-removal preserved for audit |
| `source` | `SELF`, `IMPLICIT_REQUESTOR`, `MANUAL`, `SUBSCRIPTION` |

`(requestId, userId)` is `UNIQUE` where `removedAt IS NULL`.

The Requestor row is added implicitly on submission with `source = IMPLICIT_REQUESTOR` and cannot be removed.

### WatcherSubscription

A form-level rule that auto-enrolls users as watchers on every new submission (PRD §14.4).

| Field | Notes |
|---|---|
| `formId` | FK |
| `roleId` | FK to Role — every user with this role becomes a watcher |
| `addedById`, `createdAt` | |
| `isActive` | |

**Resolution timing.** When a request is submitted, every active subscription for its form is evaluated *at that moment* and matching users become explicit `Watcher` rows on the request. New role members joining *after* submission are not retroactively added — they only become watchers on requests submitted from then on. This mirrors the assignee snapshot model in §17.

### WatcherChannelPreference

Per-user, per-form channel preferences for watchers (PRD §14.4).

| Field | Notes |
|---|---|
| `userId`, `formId` | composite key |
| `channels` | `IN_APP`, `EMAIL`, `BOTH`, `MUTED` |
| `updatedAt` | |

A watcher's channel preferences are *per form*, not per request or per event. A noisy form can be muted without affecting other watches.

### RequestLink

Generic relational link between two Requests (PRD §6.4).

| Field | Notes |
|---|---|
| `sourceRequestId` | the request *with* the link field |
| `targetRequestId` | the request being linked to |
| `linkFieldKey` | which FormField on the source defines this link |
| `createdAt` | |

**Constraints:**
- `(sourceRequestId, linkFieldKey)` is `UNIQUE` if the field is one-to-one
- A required `REQUEST_LINK` field cannot be missing — enforced at submission
- A parent-gated link cannot point at a target whose status is final — enforced at link creation

**Cascade rules** (PRD §6.4) are configured on the *target* form (close gate, cancel cascade) and live as columns on `Form`. The cancel cascade is implemented as a stored procedure that runs in the same transaction as the parent's cancellation.

---

## Reference Data

### BusinessCalendar (PRD §13.1)
| Field | Notes |
|---|---|
| `name`, `workingDays`, `workingHours`, `timezone`, `holidaysJson`, `isActive` | |

### MaintenanceWindow (PRD §7.8)
A named recurring time slot that Schedule steps can require. Generic — not CM-specific.
| Field | Notes |
|---|---|
| `name`, `recurrence`, `dayOfWeek`, `startTime`, `endTime`, `timezone`, `effectiveFrom`, `effectiveTo`, `isActive` | |

### BlackoutPeriod (PRD §7.8)
Generic blackout date ranges. Schedule steps configure block / warn / ignore behavior.
| Field | Notes |
|---|---|
| `name`, `reason`, `startAt`, `endAt`, `isActive` | |

### HoldReason (PRD §10.3)
Admin-managed list. Forms can scope which reasons are selectable.
| Field | Notes |
|---|---|
| `key`, `label`, `requiresNote`, `isActive` | |

### RejectionPolicy (PRD §11.1)
| Field | Notes |
|---|---|
| `name`, `defaultScope`, `rejectorDiscretion`, `allowedScopes`, `predefinedReasonsJson`, `fieldLockJson` | |

### EmailTemplate (PRD §14.3)
| Field | Notes |
|---|---|
| `name`, `subject`, `bodyHtml`, `eventKey`, `actionButtonsJson`, `metadata` | |

### Delegation (PRD §19)
| Field | Notes |
|---|---|
| `delegatorId`, `delegateeId`, `effectiveFrom`, `effectiveTo`, `reason`, `revokedAt`, `revokedById` | |

### ModuleStatusExtension / ModuleOutcomeExtension
Lets modules (like CM) register additional intermediate statuses and outcomes (PRD §10.1, §10.2). One row per extension.
| Field | Notes |
|---|---|
| `moduleKey` | e.g., `change-management` |
| `valueKey` | e.g., `APPROVED`, `ROLLED_BACK` |
| `kind` | `STATUS` or `OUTCOME` |
| `sitsBetween` | for statuses: which generic transitions it sits between |

---

## Index Strategy

| Query | Index |
|---|---|
| Active requests by form | `(formId, status)` on `Request` |
| Requests assigned to me | `(assigneeId)` on `AssigneeSnapshot` (latest per `stepInstanceId`) |
| Requests on hold by reason | `(holdReasonId, status)` on `Request` |
| Pending step instances per request | `(requestId, status)` on `StepInstance` |
| Audit entries per request | `(requestId, createdAt)` on `AuditEntry` |
| Field history per request | `(requestId, fieldKey, createdAt)` on `FieldHistoryEntry` |
| Linked children of a request | `(targetRequestId)` on `RequestLink` |
| SLA cron scan | `(status)` partial index on `StepInstance` where status = ACTIVE |
| Reference number lookup | `(formId, referenceNumber)` UNIQUE on `Request` |
| Blackouts by date range | `(startAt, endAt)` on `BlackoutPeriod` |
| Watchers of a request | `(requestId)` on `Watcher` (filtered: `removedAt IS NULL`) |
| Requests a user is watching | `(userId)` on `Watcher` (filtered: `removedAt IS NULL`) |
| Active form version lookup | `(formId, status)` partial index on `FormVersion` where status = PUBLISHED |

---

## What This Phase Does NOT Build

- No `ChangeRequest`, `ChangeAffectedCI`, `ChangeAffectedService`, `PostImplementationReview`, or any other CM-named table. Every one of those is a row in `Request` / `FieldHistoryEntry` / linked rows in the generic tables. CM specificity lives entirely in seed data (Phase 02).
- No webhook/loop/quorum tables. Those land in Phase 04 if and when those step types are added.
- No form builder or workflow builder UI tables. Phase 05.
- No notification queue tables. Phase 04.

---

## Acceptance Criteria for the Schema

A migration is correct when:

1. `npx prisma migrate dev` runs cleanly on a fresh database.
2. A DB-level CHECK constraint refuses an attempt to write `status='CLOSED', outcome=NULL` and the test asserts the failure.
3. A DB-level CHECK constraint refuses an attempt to write `status='ON_HOLD', holdReasonId=NULL`.
4. The append-only trigger refuses an `UPDATE` on `AuditEntry`, `FieldHistoryEntry`, `AssigneeSnapshot`, `HoldEvent`, and `SLAEvent`.
5. A test inserts a `RequestLink` pointing at a final-state target and asserts the parent-gate check rejects it.
6. A test verifies that a `FormVersion` with status `PUBLISHED` cannot be updated (trigger fires).
7. A test verifies that a `Request` pinned to FormVersion v1 reads field history correctly even after FormVersion v2 renames or removes a field.
8. There is no Prisma model whose name starts with `Change` or `CM`.

If any of those tests fails, the schema does not honor the sealed PRD invariants — fix it before moving to Phase 01.
