# Workflow Engine — Glossary

Canonical definitions for every term used across the workflow engine docs. If a phase doc and this file disagree, **this file wins** — file a fix against the phase doc, never drift the term.

Every definition cites the PRD section where the concept is authoritatively specified.

---

## Core Entities

**Request** — A single instance flowing through the engine: one row in the `requests` table, pinned to one `FormVersion` and one `WorkflowVersion`. Has a status, optional outcome, optional hold reason, and a collection of step instances. Every CR, AR, IR, CFR, Access Request, etc. is a Request. (PRD §4, §10)

**Form** — A named definition of fields + sections + settings. Versioned. Has one or more `FormVersion` rows. A Form is associated with exactly one `WorkflowDefinition`. "Change Request (CR)" is a Form; "Access Request" is a Form. (PRD §5, §6.3)

**FormVersion** — An immutable snapshot of a Form's field list, per-step field state matrix, visibility rules, and computed formulas. Requests pin to one FormVersion at submission and never re-pin. (PRD §6.3)

**WorkflowDefinition** — A named workflow with a chain of `WorkflowVersion` rows. One definition may be referenced by many Forms. (PRD §6.3)

**WorkflowVersion** — An immutable snapshot of a workflow's steps, routing, assignees, SLAs, and merge policies. Requests pin to one WorkflowVersion at submission and never re-pin. Editing a published version is impossible; admins clone → edit → publish a new version. (PRD §6.3, §22 invariant 7)

**Step** — One unit of work inside a WorkflowVersion. Eight types: Approval, Execution, Info/Ack, Automation, Notification, Conditional Branch, Delay, Schedule. (PRD §7)

**StepInstance** — A live occurrence of a Step inside a running Request. Has its own status (`PENDING` / `ACTIVE` / `COMPLETED` / `SKIPPED` / `FAILED` / `CANCELLED`), assignee snapshot, SLA clock, and audit trail. (PRD §10, §17)

**Action** — What an assignee does on an active StepInstance: Approve, Reject, Complete, Acknowledge, Request More Info, Provide Info, Return to Previous Step, Send to Requestor, Reassign, Put On Hold, Resume. Recorded as an `AuditEntry`. (PRD §9)

---

## State Model (PRD §10)

The three-field state model is atomic: every request has exactly one Status, Status determines whether Outcome and HoldReason are allowed.

**Status** — Where the request currently is. Canonical values: `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `ON_HOLD`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`. Modules may declare intermediate statuses (e.g., CM adds `APPROVED`, `SCHEDULED`, `PIR_PENDING`). (PRD §10.1)

**Outcome** — What happened when the request closed. `NULL` until `CLOSED` or `CANCELLED`. Canonical values: `SUCCESSFUL`, `UNSUCCESSFUL`, `SUPERSEDED`, `ABANDONED`. Modules may declare intermediate outcomes. (PRD §10.2)

**HoldReason** — Why the request is paused. `NULL` unless `Status = ON_HOLD`. Admin-managed list. Pausing sets this atomically with the status transition; resuming clears it atomically. (PRD §10.3)

**Invariant:** You cannot CLOSE without an Outcome; you cannot ON_HOLD without a HoldReason. Enforced at the database and service layer. (PRD §22 invariants 1, 3)

---

## People and Assignment

**Requestor** — The user who submitted the Request. Immutable for the lifetime of the Request. Always an implicit watcher. (PRD §4, §14.4)

**Assignee** — A user resolved to act on an active StepInstance. Resolved by an `IAssigneeResolver` at step activation and frozen into an `AssigneeSnapshot`. Never re-resolved live. (PRD §12, §17)

**AssigneeSnapshot** — The frozen list of users who *were* expected to act on a StepInstance at the moment of activation. Used by timeline rendering and "who was supposed to act" reports. Unaffected by role membership changes after activation. (PRD §17)

**Delegate** — A user another user has temporarily routed their assignments to via a `Delegation` row. The engine intercepts assignee resolution, follows the delegation chain (max depth 3), and records the full chain on the snapshot. Generic engine concern, not an advanced feature. (PRD §19)

**Watcher** — A user subscribed to a Request's notifications with no action authority. Resolved once at submission (implicit requestor + `WatcherSubscription` expansion) and frozen into `Watcher` rows. Kept strictly separate from AssigneeSnapshot. (PRD §14.4)

**Form Owner** — A user or role who owns a Form definition and can edit its drafts, manage watcher subscriptions, and configure settings. Engine-level role. (PRD §4)

---

## Versioning and History

**Reference Number** — The human-readable identifier of a Request (e.g., `CR-2026-0042`). Format declared per-Form via PRD §21. Immutable for the life of the Request. Does **not** change on rejection/resubmission. (PRD §21, §11.5)

**Per-Step Field State Matrix** — A `(field × step)` grid on a FormVersion declaring whether each field is Editable / Visible / Hidden when that step is the active step. Hidden always wins over a visibility condition that says "show." (PRD §5.5)

**FieldHistoryEntry** — Append-only log of field values per action. Keyed by `(formVersionId, fieldKey)` so field renames or removals across FormVersions never collide. Captures computed field values and resolved lookup values at the moment of the action. (PRD §17, engine-core.md §8)

**AuditEntry** — Append-only log of every state transition and action. Inserts only — no updates, no deletes, enforced by database trigger. Admin override actions reference the overridden entry via `referencesAuditEntryId`. (PRD §17, §22 invariant 9)

---

## Linked Requests and Cascade

**RequestLink** — A typed relationship from one Request to another (e.g., CR → AR, CR → IR, CR → CFR). Configured per Form via a `RequestLinkField` with target form, cardinality, required flag, and parent-gate setting. (PRD §6.4)

**Parent Gate** — A close-gate setting on a RequestLink: the source Request cannot close until every linked target Request has reached a specified state. (PRD §6.4)

**Cancel Cascade** — On parent Request cancellation, the engine recursively cancels every linked-source Request in a non-final state with outcome `SUPERSEDED`, inside the same transaction. Generic mechanism — CM's CR→AR/IR/CFR cascade is one application. (PRD §6.4, §22 invariants 11–12)

---

## Expressions, SLA, and Branching

**Expression DSL** — The single JSON expression language used by computed fields, visibility conditions, conditional-branch routing, scored-matrix routing, and SLA "until" expressions. Deterministic, side-effect-free, not Turing-complete. (engine-core.md §4)

**Scored Matrix Field** — A field type (`SCORED_MATRIX`) that renders an N×M picker (e.g., likelihood × impact) and computes a score. Any form can use it — not a CM-specific "risk matrix." (PRD §5.3, §6.5)

**Calendar** — A business calendar (working days/hours/holidays) against which SLA clocks are computed. Referenced by StepInstance; contents read at evaluation time so admin fixes propagate to running steps. (PRD §13.1)

**Maintenance Window** — A named recurring time range during which Schedule steps may place work. Reference data, editable by admins. (PRD §7.8, §13.1)

**Blackout Period** — A date range during which Schedule steps must `BLOCK`, `WARN`, or `IGNORE` depending on configuration. Reference data. (PRD §7.8)

**SLA Event** — An append-only log entry for SLA pause/resume. Deadlines are always computed from the log + activation time + calendar — never stored as a mutable field. (PRD §13.3, engine-core.md §5)

**Merge Policy** (cross-branch, on the barrier step after a parallel split) — `ALL_COMPLETE` (default) or `ANY_COMPLETE`. Cross-branch `QUORUM` is Phase 04. (PRD §8)

**Multi-Assignee Policy** (on a single step with multiple co-assignees) — `ANY`, `ALL`, `MAJORITY`, `QUORUM`, `UNANIMOUS`. Distinct from cross-branch merge policy. (PRD §12)

---

## Administration

**Rejection Policy** — A named policy on a Form declaring what happens on rejection: `Full restart` vs `Resume from rejection step`, plus field-lock rules. The rejector cannot override the policy at runtime. (PRD §11)

**Email Template** — A named template used by the notification dispatcher. References dynamic variables (`{{request_id}}`, `{{sla_deadline}}`, etc.). Action buttons embed single-use, expiring tokens. (PRD §14.2, §14.3)

**WatcherSubscription** — A role-keyed rule on a Form that implicitly adds every member of the role as a watcher at submission time. Resolved once; later role membership changes do not affect in-flight requests. (PRD §14.4)

**WatcherChannelPreference** — A per-user, per-form setting controlling which channels (in-app / email / both / muted) the user receives notifications on for Requests they watch. (PRD §14.4)

---

## Things That Are NOT Terms

- **"Workflow Instance"** — historical name for Request. Use Request.
- **"Process"** — never used. Use Workflow or Request.
- **"Stage"** — never used. Use Step.
- **"Ticket"** — never used. Use Request.
- **"Change", "CR", "AR", "IR", "CFR"** — these are specific Forms (seeded by Phase 02), not engine concepts. The engine only knows "Request" and "Form."
