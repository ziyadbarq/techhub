# Workflows Module Overview

## What it is

The **Workflows** module is a generic, configurable workflow engine inside TechHub. It powers any request-based process — Change Management, Access Requests, Vendor Onboarding, Asset Assignment approvals — through **forms + workflow definitions loaded as data**, with zero per-module runtime code.

Originally developed as a standalone app called Flowbit, the engine was folded into TechHub as a native CORE module gated by the `WORKFLOW_ENGINE` feature flag.

## Source roadmap

See [roadmap/workflow-engine/](../../roadmap/workflow-engine/) for the original PRD, phase docs, and the access-request validation pilot.

## Architecture

5-layer Clean Architecture, identical to the rest of TechHub:

| Layer | Location |
|------|---------|
| Domain (pure types, errors, expression DSL) | `src/core/domain/workflow/` |
| Repository interfaces + handler ports | `src/core/repositories/workflow/` |
| Engine + use cases + executors + resolvers | `src/core/use-cases/workflow/` |
| Prisma repository implementations | `src/infrastructure/repositories/prisma-workflow-*.repository.ts` |
| Services (SLA, notifications, calendar, templates, …) | `src/infrastructure/services/workflow/` |
| API routes (61 + 3 cron) | `src/app/api/workflow/` |
| UI pages (47) | `src/app/(dashboard)/workflows/` |
| UI components | `src/components/workflows/` |

DI wiring lives at [src/di/modules/workflow.module.ts](../../src/di/modules/workflow.module.ts) (CORE tier, gated by feature flag).

## Three-field state model

Every `Request` is uniquely described at any instant by three orthogonal columns:

- **`status`** — where the request is (`DRAFT` → `SUBMITTED` → `IN_REVIEW` → `IN_PROGRESS` → ... → `CLOSED`/`CANCELLED`)
- **`outcome`** — what happened at the end (`SUCCESSFUL`, `UNSUCCESSFUL`, `REJECTED`, `SUPERSEDED`, ...) — `NULL` while in-flight, required at terminal status
- **`holdReasonId`** — why a pause is in effect — `NULL` while running, required when `status = ON_HOLD`

Module-defined `OutcomeCode` rows give finer-grained domain semantics (e.g., `ROLLED_BACK` → `UNSUCCESSFUL`) while keeping cross-module reporting consistent.

## Append-only audit

- `AuditEntry` — every action / state transition / admin override (immutable)
- `FieldHistoryEntry` — every field value change keyed by `(formVersionId, fieldKey)`
- `AssigneeSnapshot` — who was assigned at the moment of step activation (with delegation chain)
- `SLAEvent` — `START` / `PAUSE` / `RESUME` / `BREACH` for SLA computation
- `SLAEscalationLog` — once per `(stepInstanceId, ruleKey)` to guarantee single-fire

Append-only is enforced at the application layer today. DB triggers for hard enforcement are a follow-up (Phase 00 PRD invariant 1).

## Version pinning

Every `Request` is pinned to a `FormVersion` and `WorkflowVersion` at submission time. Publishing a new version of a form or workflow does NOT affect in-flight requests — they continue running against the version they were created against. Published versions are intended to be immutable.

## Step executors (11 types)

`APPROVAL`, `EXECUTION`, `INFO_ACK`, `AUTOMATION`, `NOTIFICATION`, `CONDITIONAL_BRANCH`, `DELAY`, `SCHEDULE`, `WEBHOOK`, `SUB_WORKFLOW`, `WAIT_FOR_EVENT`.

Each is an `@injectable()` class in `src/core/use-cases/workflow/executors/`. Wired into a `WorkflowStepExecutorRegistry` via `multiInject`.

## Assignee resolvers

Implemented: `USER`, `ROLE`, `REQUESTER`, `FIELD_USER`.

Stub (throws `NotImplementedError`): `REQUESTER_MANAGER` — requires HR manager-chain integration.

## SLA system

- Business calendars (`Calendar`) with working hours + holidays
- Per-step `SLAConfig` with optional pause-on-hold semantics
- Deadlines **computed** from the pause/resume log — never stored as a mutable field
- Escalation rules: `REMINDER`, `ADD_ASSIGNEE`, `REASSIGN`, `AUTO_ADVANCE`, `AUTO_REJECT`
- Driven by the `workflow-sla-tick` cron job (every 2 minutes)

## Rejection on the same record

Rejecting a request does NOT delete or supersede it. The same row goes back to a previous step (per the form's `RejectionPolicy.restartMode`), the requester edits, and resubmits. Reference number, audit trail, and field history are all preserved across the cycle.

## Permissions (35 total)

All under the `WORKFLOWS_*` namespace, grouped:

- **Forms (admin)** — `WORKFLOWS_FORMS_{VIEW,CREATE,UPDATE,DELETE,PUBLISH,MANAGE_NOTIFICATIONS}`
- **Definitions (admin)** — `WORKFLOWS_DEFINITIONS_{VIEW,CREATE,UPDATE,DELETE,PUBLISH}`
- **Requests (everyday)** — `WORKFLOWS_REQUESTS_{VIEW,VIEW_OWN,SUBMIT,ACT,COMMENT,ATTACH,CANCEL,CANCEL_OWN,HOLD,OVERRIDE,REASSIGN}`
- **Inbox / Notifications / Analytics / Audit** — `WORKFLOWS_{INBOX_VIEW,NOTIFICATIONS_VIEW,ANALYTICS_VIEW,AUDIT_EXPORT}`
- **Reference data (admin)** — `WORKFLOWS_{CALENDARS_VIEW,CALENDARS_MANAGE,HOLD_REASONS_MANAGE,OUTCOME_CODES_MANAGE,REJECTION_POLICIES_MANAGE,EMAIL_TEMPLATES_MANAGE,DELEGATIONS_MANAGE,BLACKOUT_PERIODS_MANAGE,MAINTENANCE_WINDOWS_MANAGE,WATCHERS_MANAGE}`

Seeded by [seed-rbac-permissions.ts](../../src/infrastructure/database/prisma/seed-rbac-permissions.ts). All granted to `system-administrator`.

## Feature flag

`WORKFLOW_ENGINE` — defined in [feature-flag-keys.ts](../../src/lib/features/feature-flag-keys.ts), seeded by [seed-features.ts](../../src/infrastructure/database/prisma/seed-features.ts). **Default OFF.**

When off:
- Every `/workflows/*` page redirects to `/feature-disabled?feature=WORKFLOW_ENGINE`
- Every `/api/workflow/*` route returns 503 (or redirect, depending on the endpoint shape)
- BullMQ cron jobs are NOT scheduled (gated at `setupScheduledJobs()` startup check)
- The DI module still loads (CORE tier) so flipping the flag on at runtime requires no restart

## Routes

22 entries added to [routes-manifest.ts](../../src/config/routes-manifest.ts) under the new `workflows` nav group. Run `npm run generate:routes` after edits.

User-facing nav items: Inbox, My Requests, Browse Forms, Notifications, Analytics, Workflow Admin.

## Background jobs (BullMQ)

Three cron-driven ticks under `QUEUE_NAMES.WORKFLOW`:

| Job | Pattern | Purpose |
|-----|---------|---------|
| `workflow-sla-tick` | `*/2 * * * *` | Fire SLA escalations whose thresholds have crossed |
| `workflow-schedule-tick` | `* * * * *` | Advance `SCHEDULE` steps when their window opens |
| `workflow-entry-automation-tick` | `*/5 * * * *` | Run automation rules on matching requests |

Handlers: `src/infrastructure/services/queue/handlers/workflow-*-tick.handler.ts`.
Worker registration: `src/infrastructure/services/queue/worker.ts`.
Scheduling: `src/infrastructure/services/queue/scheduled-jobs.ts` (gated by `WORKFLOW_ENGINE`).

HTTP cron endpoints (`/api/workflow/cron/*`) remain as manual triggers protected by the `CRON_SECRET` env header.

## What's deferred / not yet done

- **Migration** — must be applied to a running DB (`npx prisma migrate dev --name add_workflow_engine`); deferred from PR 1 until a postgres is reachable on `localhost:5434`
- **DB triggers for append-only enforcement** — currently application-layer only (PRD Phase 00 invariant 1)
- **REQUESTER_MANAGER resolver** — stub; needs HR manager-chain
- **GROUP / DYNAMIC / ESCALATION_CHAIN resolvers** — not implemented (out of scope for v1)
- **Visual form + workflow builders** — Phase 05; basic JSON-editor admin pages are in place
- **Change Management seed (cm-seed.ts)** — the donor app's full CR/AR/IR/CFR seed has not been ported yet. Run it manually from `flowbit/` if needed for demos; production seed remains lean
- **Action gating ("Phase 06")** — intercepting existing TechHub actions (asset assignment, license allocation, etc.) and routing them through workflows; planned future work
- **Expression DSL evaluator** — full implementation lives in `expression-evaluator.service.ts`; complex grammar tests are sparse
- **Donor `flowbit/` directory** — kept in repo root as a reference during integration. Safe to delete once the merged version is validated end-to-end

## Quick smoke test (after migration + flag on)

1. `npm run db:migrate` (or `npx prisma migrate deploy`) — apply schema
2. `npm run db:seed:dev` — seed permissions + flag
3. Enable `WORKFLOW_ENGINE` flag for the current user via Prisma Studio or the admin UI
4. Visit `/workflows/inbox` — empty inbox renders
5. Create a form via `/workflows/admin/forms` (or POST to `/api/workflow/admin/forms`)
6. Submit a request against it
7. Check `/workflows/requests/[id]/timeline` for the audit trail

## Tests

5 Vitest files cover expression evaluator, outcome enum handling, reference number formatting, SLA calendar math, and template rendering: `src/core/use-cases/workflow/__tests__/` and `src/infrastructure/services/workflow/__tests__/`. **29/29 pass.**
