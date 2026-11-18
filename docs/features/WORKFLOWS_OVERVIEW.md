# Workflows Module Overview

## What it is

The **Workflows** module is a generic, configurable workflow engine inside TechHub. It powers any request-based process — Change Management, Access Requests, Vendor Onboarding, Asset Assignment approvals — through **forms + workflow definitions loaded as data**, with zero per-module runtime code.

Originally developed as a standalone app called Flowbit, the engine was folded into TechHub as a native CORE module gated by the `WORKFLOW_ENGINE` feature flag.

## Source roadmap

See [roadmap/workflow-engine/](../../roadmap/workflow-engine/) for the original PRD, phase docs, and the access-request validation pilot.

## Architecture

5-layer Clean Architecture, identical to the rest of TechHub:

| Layer                                                 | Location                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Domain (pure types, errors, expression DSL)           | `src/core/domain/workflow/`                                       |
| Repository interfaces + handler ports                 | `src/core/repositories/workflow/`                                 |
| Engine + use cases + executors + resolvers            | `src/core/use-cases/workflow/`                                    |
| Prisma repository implementations                     | `src/infrastructure/repositories/prisma-workflow-*.repository.ts` |
| Services (SLA, notifications, calendar, templates, …) | `src/infrastructure/services/workflow/`                           |
| API routes (61 + 3 cron)                              | `src/app/api/workflow/`                                           |
| UI pages (47)                                         | `src/app/(dashboard)/workflows/`                                  |
| UI components                                         | `src/components/workflows/`                                       |

DI wiring lives at [src/di/modules/workflow.module.ts](../../src/di/modules/workflow.module.ts) (CORE tier, gated by feature flag).

## Building a request type (admin journey)

1. **New request type** (`/workflows/admin/forms/new`): name, description, and the approval path: a new path from a template (line manager; manager then a team; two approvals) or an existing workflow. A new path is created with the form, so nobody has to build the workflow first.
2. **Form builder** (`/workflows/admin/forms/[id]`): a launch bar shows Details → Fields → Approval path → Publish, what is missing, and when the request type is live. Field types are grouped with icons; a new field's key follows its label until published, and renaming a key updates conditions, formulas and per-step field state.
3. **Workflow builder** (`/workflows/designer/[id]`): the path reads top to bottom (approved → next step, rejected → back to the requester, no next step → completed). "Before you publish" lists problems and blocks publishing until fixed. Pure graph helpers live in `src/lib/workflows/builder/`.
4. A form is offered to employees (Browse forms, submit page) only when the form **and** its approval path are published; the engine refuses submissions against an unpublished path.

## Three-field state model

Every `Request` is uniquely described at any instant by three orthogonal columns:

- **`status`** — where the request is (`DRAFT` → `SUBMITTED` → `IN_REVIEW` → `IN_PROGRESS` → ... → `CLOSED`/`CANCELLED`)
- **`outcome`** — what happened at the end (`SUCCESSFUL`, `UNSUCCESSFUL`, `REJECTED`, `SUPERSEDED`, ...) — `NULL` while in-flight, required at terminal status
- **`holdReasonId`** — why a pause is in effect — `NULL` while running, required when `status = ON_HOLD`

Module-defined `OutcomeCode` rows give finer-grained domain semantics (e.g., `ROLLED_BACK` → `UNSUCCESSFUL`) while keeping cross-module reporting consistent.

## File attachments

A **File** field uses the same uploader as asset attachments (`components/ui/file-upload.tsx`). Each file uploads as soon as it is added (`POST /api/workflow/uploads`) and waits, visible only to its uploader, with no request (`request_attachments.requestId` null). Submitting the request, resubmitting it, or a step action that edits the field links the files to the request; the engine only accepts files the actor uploaded for that field (or already on the request) and stores `{ id, name, size }` from the attachment rows.

- Allowed: PDF, Word, Excel, PowerPoint (new and legacy), PNG/JPEG/GIF/WebP, Outlook `.msg`, TXT, CSV; up to 10 MB each, 10 per field. The content (magic number) must match the extension; HTML, SVG, scripts and archives are refused (`lib/workflows/attachments/upload-check.ts`).
- Storage is private: GCS when configured, `.workflow-uploads-dev/` under `next dev`, otherwise uploads are refused (`lib/storage/private-file-storage.ts`).
- Download (`GET /api/workflow/attachments/[id]`) and the request's file list are for the requester, anyone assigned to one of its steps, or holders of `workflows-requests:view`; others get 404. Files are served with `nosniff` and a sandbox CSP; only PDF, images and plain text open inline.
- Pending uploads that are never submitted stay in storage; cleaning them up is not automated yet.

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

- `USER`, `ROLE`, `REQUESTER`, `FIELD_USER` (a person field of the form).
- `REQUESTER_MANAGER`: the requester's manager from Microsoft Entra ID / Active Directory (`Person.managerId`, linked by the user sync), else their org unit's manager; never the requester themselves (`lineManagerPersonId`). When a form opens, a manager missing from the Person record is read from Microsoft Graph and linked; on submit the manager gets an account if they have none, so the approval reaches them (`PrepareLineManagerUseCase`).
- `ACCESS_SERVICE_ROLE`: owner, cybersecurity or implementer of the service chosen in an Access Services field.
- `FALLBACK`: the line manager, or a person field when there is none (or when `forceFallbackWhen` holds).
- `OPTION_USERS` ("Depends on the answer" in the builder): people per option of a choice field (`DROPDOWN`, `RADIO`, `MULTI_SELECT`), e.g. the data owner of each selected product. Every chosen option adds its people; an option with nobody adds no one, so pair it with another assignee if a step must never be empty.

A step's assignees are the union of its specs. A step that resolves nobody stays active until an admin reassigns it.

## Fields at each step

A form's `perStepFieldState` sets, per step key, whether a field is `EDITABLE`, `READ_ONLY` or `HIDDEN` ("Field visibility" in the workflow builder). A field a step doesn't mention is editable. The submission is the step `SUBMIT`: a field `HIDDEN` there is filled later in the workflow, not by the requester (e.g. an assignee picked by an approver).

- **Submit / resubmit**: values for fields not editable at `SUBMIT` are dropped, and they aren't required.
- **Actions on a step**: the assignee can change only the fields editable at that step (the request page shows them under "Fields you can change at this step"). The engine refuses any other change. Approving or completing needs the step's required, editable, shown fields filled; rejecting doesn't.
- System fields (`SYSTEM_FIELD`, `COMPUTED`, `SECTION_HEADER`) are never editable.

Rules: `src/core/domain/workflow/step-field-state.ts`. A field's `config.helpText` is shown under its label.

## Who sees a request, and who hears about it

**Opening a request** (`/workflows/requests/[id]`): its requester, anyone assigned to any of its steps — finished steps included — or a holder of `WORKFLOWS_REQUESTS_VIEW`.

**The request list** (`/workflows/requests`) has three scopes (`src/lib/workflows/request-list-scope.ts`):

| Scope          | Shows                                                   | Who                                                                  |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| All            | every request                                           | `WORKFLOWS_REQUESTS_VIEW` only — anyone else asking for it gets Mine |
| Mine           | requests they submitted                                 | everyone                                                             |
| Assigned to me | requests with a step assigned to them, open or finished | everyone                                                             |

The Inbox lists active steps only; "Assigned to me" is where an approver finds a request again after acting.

**Watchers** get the request-level notifications (closed, held, resumed, cancelled). They are the requester and members of roles subscribed to the form (at submit), plus **everyone who acts on a step** (reason `participant`, added when they act).

**Form notification rules** (Form → Notifications) fire on `request.submitted`, `step.activated`, `step.approved` (an approval step completed by approval), `step.rejected` (an approval step rejected), `request.held`, `request.resumed`, `request.closed` and `request.cancelled`, to the requester, the step's assignees, the watchers, or a role's members.

## Creating forms from the browser console

`scripts/browser-console/create-request-forms.js` creates and publishes the Access Management and Data Request forms with their approval paths, through the same admin APIs as "New request type". Paste it into DevTools while signed in as an admin. Published forms with the same name are skipped. People named in the steps are matched to Persons by name (`POST /api/workflow/admin/people/resolve`, which creates an account for a matched person who has none); if any name is unknown or shared by two people, nothing is created and the names are listed.

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

| Job                              | Pattern       | Purpose                                            |
| -------------------------------- | ------------- | -------------------------------------------------- |
| `workflow-sla-tick`              | `*/2 * * * *` | Fire SLA escalations whose thresholds have crossed |
| `workflow-schedule-tick`         | `* * * * *`   | Advance `SCHEDULE` steps when their window opens   |
| `workflow-entry-automation-tick` | `*/5 * * * *` | Run automation rules on matching requests          |

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
