# Engine Core — Internal Reference

**Phase:** [01-engine-core](./README.md)
**Status:** Reference for engineers building the runtime. Aligned to the sealed [PRD.md](../PRD.md).

---

## Purpose

This document covers the internal mechanics of the workflow runtime — the parts that aren't visible in the PRD because they are implementation details, but that engineers building Phase 01 need to agree on before they start.

It is **not** a re-statement of the PRD. Anywhere this document overlaps with the PRD, the PRD wins. Every section ends with an explicit cross-reference to the PRD passages it implements.

The engine is **entity-agnostic**. There is no special handling for Change Management or any other module. Every behavior here applies to every form on the system equally.

---

## 1. Step Executor Architecture

Every step type from PRD §7 has a corresponding **Step Executor**. An executor is a stateless service that:

1. **Activates** the step — resolves assignees, takes an assignee snapshot, starts the SLA clock, fires step-activated notifications, persists the StepInstance.
2. **Accepts actions** — validates the action against the step's allowed actions, persists an AuditEntry, advances or pauses the step.
3. **Completes** the step — writes the outcome, stops the SLA clock, fires step-completed notifications, hands control back to the engine to route to the next step.

Executors do not call each other. The engine is the only thing that activates the next executor.

| Step Type (PRD §7) | Executor |
|---|---|
| Approval | `ApprovalStepExecutor` |
| Execution | `ExecutionStepExecutor` |
| Info / Acknowledgment | `InfoAckStepExecutor` |
| Automation | `AutomationStepExecutor` |
| Notification | `NotificationStepExecutor` |
| Conditional Branch | `ConditionalBranchStepExecutor` |
| Delay | `DelayStepExecutor` |
| Schedule | `ScheduleStepExecutor` |

Each executor is registered in the DI container and resolved by step type. New step types in Phase 04 (Webhook, Wait-For-Event, Spawn-Sub-Workflow) are added by registering new executors — no engine code changes.

**Cross-ref:** PRD §7 (step types), PRD §9 (actions reference).

---

## 2. Engine Service Interface

There is one service that owns the workflow lifecycle. Every other module calls *into* it; it does not import from any module.

```ts
interface IWorkflowEngineService {
  // Submit a new request. Validates required fields, assigns reference number,
  // creates Request row, activates step 1.
  submit(input: SubmitRequestInput): Promise<Request>;

  // Take an action on an active step. Validates against allowed actions,
  // writes audit, advances or branches.
  takeAction(input: TakeActionInput): Promise<Request>;

  // Place a request on hold (PRD §10.3). Atomically sets status, hold reason,
  // pauses every active step's SLA clock.
  placeOnHold(input: PlaceOnHoldInput): Promise<Request>;

  // Resume from hold. Atomically clears hold reason, restores prior status,
  // resumes every paused SLA clock.
  resume(input: ResumeInput): Promise<Request>;

  // Cancel a request in any non-final state. Sets outcome, fires linked-request
  // cancel cascade if applicable.
  cancel(input: CancelInput): Promise<Request>;

  // Reject — convenience around takeAction with REJECT, plus rejection policy logic.
  reject(input: RejectInput): Promise<Request>;

  // Resubmit a rejected request on the same record (PRD §11.5).
  resubmit(input: ResubmitInput): Promise<Request>;

  // Admin only — force-advance a stuck step.
  forceAdvance(input: ForceAdvanceInput): Promise<Request>;

  // Admin only — override outcome on a closed/cancelled request.
  overrideOutcome(input: OverrideOutcomeInput): Promise<Request>;

  // Background job — scan active steps, evaluate SLA escalations, fire actions.
  processSlaTick(): Promise<void>;
}
```

Every method runs inside a single database transaction that includes:
1. The request mutation
2. The corresponding AuditEntry insert
3. Any AssigneeSnapshot, HoldEvent, SLAEvent, FieldHistoryEntry, RequestLink mutations triggered by the action
4. The state-transition CHECK constraints

If any one of those fails, the entire action is rolled back. There is no partial state.

**Cross-ref:** PRD §10.2 atomic closure, PRD §22 invariants 1, 8, 9.

---

## 3. Assignee Resolution

The `IAssigneeResolverRegistry` holds one resolver per strategy from PRD §12. When a step activates, the engine calls each configured resolver, deduplicates the results, and persists an `AssigneeSnapshot` per resolved user.

| Strategy (PRD §12) | Resolver |
|---|---|
| Specific user | `SpecificUserResolver` |
| Specific role | `SpecificRoleResolver` |
| Form field — single user | `FormFieldUserResolver` |
| Form field — multiple users | `FormFieldMultiUserResolver` |
| CI owner | `CIOwnerResolver` |
| Service owner | `ServiceOwnerResolver` |
| Requestor's manager | `RequestorManagerResolver` |
| Round-robin | `RoundRobinResolver` |
| Least busy | `LeastBusyResolver` |

**Delegation interception.** Before persisting the snapshot, the engine checks whether each resolved user has an active `Delegation`. If yes, it substitutes the delegatee, follows the chain (max depth 3 to prevent loops), and records the full chain on the snapshot. Delegation is now a generic engine concern, not an advanced feature — it lives in this phase.

**Failure mode.** If every resolver returns zero users, the step fails with a clearly-identified system error and an admin alert. The system never silently advances or auto-assigns to "anyone."

**Cross-ref:** PRD §12 (assignment strategies), PRD §17 (assignee snapshots), PRD §19 (delegation).

---

## 4. Expression DSL — One Language, Used Everywhere

The engine has **one expression language**, used by:
- Conditional field visibility (PRD §5.4)
- Conditional Branch steps (PRD §7.6)
- Computed field formulas (PRD §5.3)
- SLA escalation conditions (advanced)

All four use the same JSON expression evaluator. There is no second DSL anywhere in the system. It is small, deliberately limited, and not Turing-complete.

### 4.1 Primitives

```jsonc
{ "field": "priority", "op": "==", "value": "CRITICAL" }
{ "field": "riskScore", "op": ">=", "value": 21 }
{ "field": "affectedCIs", "op": "count_gt", "value": 3 }
{ "field": "scheduledStart", "op": "<", "value": "now+48h" }
{ "field": "department", "op": "in", "value": ["IT", "Security"] }
{ "field": "rollbackPlan", "op": "exists" }
```

Supported operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not_in`, `exists`, `not_exists`, `count_gt`, `count_lt`, `matches` (regex against strings).

### 4.2 Composite

```jsonc
{ "and": [ {...}, {...} ] }
{ "or":  [ {...}, {...} ] }
{ "not":   {...} }
```

### 4.3 Available Context

- **Request fields** — any field defined on the form, including computed fields, scored matrix fields, repeater fields (accessed by index or aggregate), and lookup fields (resolved value at evaluation time)
- **Linked requests** — `linked.{linkFieldKey}.{field}` reads a property of a linked target
- **Step outcomes** — `steps.{stepKey}.outcome` (used in conditional branches placed after parallel steps)
- **Actor** — `actor.id`, `actor.roles`, `actor.department` (the user who took the action that triggered evaluation)
- **Time** — `now`, `now+Nh`, `now-Nd` for relative comparisons
- **Calendar math** — `business_days_between(date1, date2, calendarId)` for day counting that respects business calendars

### 4.4 Computed Field Formulas

A `COMPUTED` field's `formula` is a single expression in this DSL whose result is the field's value. Recalculation rules:

- The formula is evaluated whenever any input field referenced in the expression changes (during edit modes)
- The resolved value is written into `FieldHistoryEntry` at every action so historical reads remain stable
- Formulas can reference any other field on the form, including other computed fields (cycles are detected at form publish time and rejected)
- Formulas can reference linked-request fields via `linked.{...}` — useful for "show parent CR's risk score on this AR"

**Examples:**
```jsonc
// Risk score from a scored matrix field
{ "expr": "{field: 'riskMatrix', op: 'score'}" }

// Days between scheduled start and now
{ "expr": "business_days_between(now, scheduledStart, 'saudi-standard')" }

// Concatenated reference for display
{ "expr": "concat(parentCR.referenceNumber, ' / ', referenceNumber)" }
```

The formula evaluator and the condition evaluator are the **same code path** — there is no separate "formula" implementation.

### 4.5 Side Effects

The evaluator is deterministic and side-effect-free. It cannot trigger HTTP calls, database writes, or other actions. **Lookup fields** are resolved by a separate Lookup resolver service (§4.6), not by the expression evaluator.

### 4.6 Lookup Field Resolution

`LOOKUP` fields are resolved by a `LookupResolverService` that is *only* invoked during edit modes (form rendering). The resolver:

1. Reads the field's `source` config (`cmdb`, `directory`, `form`, `http`)
2. Calls the matching backend (CMDB query, directory attribute lookup, query against another form's submissions, or external HTTP call)
3. Substitutes any `dependsOn` field values into the source query
4. Returns the resolved value or option list to the form renderer

When an action is taken, the **resolved value is captured into `FieldHistoryEntry`** alongside the action's audit entry, so historical reads of the request always show the value the actor saw at that moment — even if the underlying source data changes later. The Lookup field is never live-resolved on read after the request is submitted.

**Cross-ref:** PRD §5.3 (Lookup, Computed), PRD §5.4 (visibility conditions), PRD §6.5 (scored matrix routing), PRD §7.6 (conditional branch step).

---

## 5. SLA System Internals

The SLA system has three independently testable parts:

### 5.1 Calendar Math

Given an activation timestamp, a calendar reference, and a list of pause/resume events, compute:
- The current elapsed business time
- The deadline (when elapsed business time reaches the threshold)
- Whether a given threshold has been crossed

The calendar's working days/hours/holidays are read at evaluation time, not at step activation. This means an admin can fix a wrong holiday and every running step picks it up. The *reference* to the calendar is pinned on the step instance; the *contents* of the calendar are authoritative at evaluation time. This is the only mutable input to a running step's deadline computation.

### 5.2 Pause/Resume Event Log

Pauses and resumes are stored as append-only events, never as a mutable "deadline" field. The log lives in `HoldEvent` (for ON_HOLD pauses) and as an action-typed audit entry (for REQUEST_INFO pauses). The deadline is always computed from the log + activation time + calendar.

### 5.3 Escalation Cron

A background job (Phase 04 — not in scope for Phase 01) scans `StepInstance` rows where `status = ACTIVE` and evaluates each step's escalation rules against the computed elapsed time. When a threshold is crossed, the job fires the configured action (reminder, add assignee, reassign, auto-advance) inside a single transaction that also writes an `SLAEvent` row.

In Phase 01, the calendar math and the pause/resume log are implemented and tested end-to-end. The escalation cron itself is deferred until Phase 04 lands the notification infrastructure it depends on.

**Cross-ref:** PRD §13.1 (calendars), PRD §13.2 (escalation policy), PRD §13.3 (pause rules), PRD §22 invariant 8.

---

## 6. Parallel Branches and Multi-Assignee Steps

The engine supports two completely independent forms of "many things at once" that get conflated all the time. They have different mechanisms and different policies.

| Concept | Definition | Policy lives on |
|---|---|---|
| **Parallel branches** (PRD §8) | Multiple *steps* running side-by-side. Activated by consecutive `PARALLEL`-policy steps. Synchronized at the next `SINGLE` step (the "barrier"). | The barrier step's **merge policy** |
| **Multi-assignee step** (PRD §12) | One *step* with multiple co-assignees. Each co-assignee must take an action for the step to advance. | The step's **multi-assignee policy** |

A multi-assignee step *inside* a parallel branch combines both. Each layer applies its own policy independently.

### 6.1 Parallel Branch Merge Policies (on the barrier step)

| Policy | Behavior |
|---|---|
| `ALL_COMPLETE` | Wait for every preceding parallel branch to reach a terminal step. Default. |
| `ANY_COMPLETE` | Advance as soon as one preceding branch produces a decision; cancel the rest. |

`QUORUM(N)` cross-branch (e.g., "advance after any 3 of 5 branches finish") is listed as a Phase 04 enhancement in `workflow-seed.md` §13 and is not in Phase 01.

### 6.2 Multi-Assignee Step Policies (on the step itself, PRD §12)

Implemented in `MultiAssigneePolicyEvaluator`. Applies to `APPROVAL`, `EXECUTION`, and `INFO_ACK` steps with more than one resolved assignee.

| Policy | Approval semantics | Execution semantics | Info/Ack semantics |
|---|---|---|---|
| `ANY` | First positive decision approves; first reject rejects | First complete advances | First acknowledgment advances |
| `ALL` | Every assignee must approve; one reject short-circuits | Every assignee must complete | Every assignee must acknowledge |
| `MAJORITY` | More than half approve; more than half reject rejects | More than half complete | More than half acknowledge |
| `QUORUM` | Configurable: minimum positive count + minimum total response count | Same: minimum complete + minimum responses | Same: minimum acknowledged |
| `UNANIMOUS` | Functionally identical to `ALL` on Approval; surfaced as a distinct policy for communication purposes | n/a | n/a |

The aggregation reads from the **assignee snapshot** (§3) — a user joining or leaving the role mid-decision does not change the required count.

### 6.3 Cancellation on Early Merge

When `ANY_COMPLETE` (cross-branch) or `ANY` (multi-assignee) fires, the engine sends a cancellation signal to all still-active sibling branches and any pending co-assignees. Cancelled branches receive a "withdrawn" notification and their step instance status becomes `CANCELLED`. The audit trail keeps the full history of every branch and every withdrawn assignee.

### 6.4 Independent SLA Clocks

Each parallel branch has its own SLA clock. Pausing one branch (e.g., via REQUEST_INFO) does not affect sibling branches. ON_HOLD on the parent request *does* pause all branches simultaneously.

**Cross-ref:** PRD §8 (parallel branches and merge policies), PRD §12 (multi-assignee policies), PRD §13.3 (clock pause rules).

---

## 7. Linked-Request Cascade Implementation

When a request is cancelled, the engine:

1. Loads every `RequestLink` where `targetRequestId = thisRequest.id`
2. For each linked source request whose status is non-final, recursively calls `cancel()` with outcome `SUPERSEDED` and a system-generated outcome note referencing the parent
3. Wraps everything in the same database transaction as the parent's cancellation
4. The cascade fires unconditionally — including for sources in `IN_PROGRESS`

This is engine code, not module code. Any form can be a target of a cascade by configuring its `cancelCascade` setting; CM's CR → AR/IR/CFR is one application of the same mechanism.

**Cross-ref:** PRD §6.4 (linked requests and cascade rules), PRD §22 invariants 11–12.

---

## 8. Form and Workflow Versioning

Forms and workflows version identically. Both have `Definition + Version` rows; published versions are immutable; running instances pin to one specific version.

- Every `Form` has a chain of `FormVersion` rows; every `WorkflowDefinition` has a chain of `WorkflowVersion` rows
- Editing a `PUBLISHED` version is impossible — admins create a new draft and publish it, which creates a new row. Database trigger enforces this on every UPDATE attempt.
- A `Request` pins **both** `formVersionId` and `workflowVersionId` at submission. Neither pin ever changes.
- The pins survive every subsequent publish/archive of the parent definition
- Every read of a Request's form fields always loads via `formVersionId`, never via `form.activeVersionId`
- Every read of a Request's workflow always loads via `workflowVersionId`, never via `definition.activeVersionId`

### 8.1 Field Renames and Removals Across Form Versions

`FieldHistoryEntry` is keyed by `(formVersionId, fieldKey)` — never by `fieldKey` alone. This means:

- When form v2 *renames* a field from `oldKey` to `newKey`, requests pinned to v1 continue to read and write `oldKey`. Their history remains queryable. v2 instances use `newKey`. The two streams never collide.
- When form v2 *removes* a field, requests pinned to v1 still have that field in their pinned definition, still write to it through the per-step field state matrix, and its history remains intact.
- The per-step field state matrix and the rejection policy on a running request always operate against the pinned form version, not the latest.

The pinning is enforced at the database level (foreign keys on `Request.formVersionId` and `Request.workflowVersionId` directly to specific version rows). There is no application code path that can substitute a different version.

**Cross-ref:** PRD §6.3 (versioning), PRD §22 invariant 7.

---

## 9. Audit Trail Implementation

Every mutation produces an `AuditEntry` row in the same transaction. The application layer never writes audit entries optimistically — they are always part of the action's transaction. There is no "fire and forget" audit.

Inserts only — no updates, no deletes. Enforced by a database trigger that raises an error on any non-`INSERT` operation against `AuditEntry`, `FieldHistoryEntry`, `AssigneeSnapshot`, `HoldEvent`, and `SLAEvent`.

Override actions (admin outcome override, force-advance) are themselves new audit entries that reference the entry they override via a `referencesAuditEntryId` column. They never mutate the original entry.

The trail is exportable via a generic export endpoint that streams the entries for a request as JSON or CSV.

**Cross-ref:** PRD §17 (audit trail), PRD §22 invariants 9–10.

---

## 10. Schedule Step Implementation

The Schedule step is a generic step type, not a Change Management feature. It accepts a date/time input from its assignee and validates it against its configured constraints:

| Setting | Validation |
|---|---|
| `calendarId` | The chosen date/time must fall inside the calendar's working hours |
| `allowedWindowIds` | If non-empty, the chosen date/time must fall inside at least one referenced `MaintenanceWindow` |
| `blackoutBehavior` | `BLOCK`, `WARN`, or `IGNORE` — what to do if the chosen date/time falls inside a `BlackoutPeriod` |
| `minLeadTime` | The chosen date/time must be at least N hours/days in the future |
| `requireDuration` | Whether the step also requires an end date/time |

If validation fails, the step rejects the input with a clear error message and stays active. If validation passes, the start (and end, if required) are written to designated form fields and the step completes.

**Cross-ref:** PRD §7.8 (schedule step), workflow-seed.md §3 (built-in maintenance windows for CM).

---

## 11. Watchers

Watchers are users subscribed to a request's notifications without holding any action authority (PRD §14.4). The engine treats watchers as a second notification channel parallel to step assignees.

### 11.1 Watcher Resolution at Submission

When a request is submitted, the engine:

1. Implicitly creates a `Watcher` row for the requestor with `source = IMPLICIT_REQUESTOR`
2. Loads every active `WatcherSubscription` for the form
3. For each subscription, expands the `roleId` to its current members **at this moment**
4. Creates `Watcher` rows for every matching user with `source = SUBSCRIPTION`
5. The watcher list is now stable on this request — new role members joining later are *not* added to in-flight requests

This mirrors the assignee snapshot pattern in §3. Subscription resolution is a one-time event, not a continuous query.

### 11.2 Notification Dispatch

When the engine fires any notification (step activated, decision taken, hold/resume, closure), the dispatcher:

1. Loads the primary recipient list (assignees of the active step)
2. Loads every active `Watcher` row for the request (`removedAt IS NULL`)
3. For each watcher, looks up their `WatcherChannelPreference` for this form to determine which channels to use (in-app, email, both, or muted)
4. Dispatches to assignees with full action capability (action button tokens for emails); dispatches to watchers with view-only links

Watchers do **not** appear in `AssigneeSnapshot` rows. The two concepts are kept strictly separate so that "who was supposed to act" reports never confuse subscribers with decision-makers.

### 11.3 Watcher Management

Use cases:
- `AddWatcherUseCase` — self-add or admin-add to a specific request
- `RemoveWatcherUseCase` — self-remove or admin-remove (sets `removedAt`, never deletes)
- `CreateWatcherSubscriptionUseCase` — form owner creates a role-based subscription
- `UpdateWatcherChannelPreferenceUseCase` — user sets per-form channel preference

Add and remove actions are recorded in the `AuditEntry` log with `actionType = WATCHER_ADDED` / `WATCHER_REMOVED`.

**Cross-ref:** PRD §14.4 (Watchers).

---

## 12. Rejection and Resubmission

Rejection sets the step's outcome to `REJECT`, writes the rejection reason and notes from the form's predefined list, and routes the request based on the form's Rejection Policy (`Full restart` or `Resume from rejection step`).

The request stays on the same row. The reference number does not change. Field values are preserved in `FieldHistoryEntry`, including the values that were present at the moment of rejection. Editing during resubmission honors the policy's `fieldLock` configuration — locked fields are read-only.

Resubmitting transitions the request status from `IN_REVIEW` back to `SUBMITTED` and re-activates the appropriate step (the first step of the workflow, or the rejection step itself, depending on policy).

The rejector cannot override the form's policy at runtime. There is no scope picker on forms where `rejectorDiscretion = LOCKED`.

**Cross-ref:** PRD §11 (rejection model), PRD §22 invariants 5–6.

---

## 13. Use Cases

Each use case is a thin wrapper around the engine service. Each one is decorated with `@LogExecution` (TechHub convention) and called from a controller:

- `SubmitRequestUseCase`
- `TakeActionUseCase`
- `PlaceOnHoldUseCase`
- `ResumeUseCase`
- `RejectUseCase`
- `ResubmitUseCase`
- `CancelRequestUseCase`
- `ReassignStepUseCase`
- `RequestMoreInfoUseCase`
- `ProvideMoreInfoUseCase`
- `ForceAdvanceUseCase` (admin)
- `OverrideOutcomeUseCase` (admin)
- `CreateDelegationUseCase`
- `RevokeDelegationUseCase`
- `AddWatcherUseCase`
- `RemoveWatcherUseCase`
- `CreateWatcherSubscriptionUseCase` (form owner)
- `UpdateWatcherChannelPreferenceUseCase`

Use cases for *workflow definition admin* (create, clone, edit draft, publish, archive) live in their own subfolder.

Each use case folder gets its mandatory `index.ts` barrel export.

---

## 14. DI Module

`WORKFLOW_ENGINE_MODULE` — registered as a CORE-tier DI module. Always available; no feature flag at the DI layer. Feature flagging happens at the route/controller layer.

Bindings:
- `IWorkflowEngineService` → `WorkflowEngineServiceImpl`
- `IAssigneeResolverRegistry` → `AssigneeResolverRegistryImpl` (with all 9 strategies registered)
- `IConditionEvaluator` → `ConditionEvaluatorImpl`
- `ISLACalculator` → `SLACalculatorImpl`
- `IStepExecutorRegistry` → `StepExecutorRegistryImpl` (with all 8 step type executors registered)
- `IAutomationHandlerRegistry` → `AutomationHandlerRegistryImpl` (with built-in handlers: auto-approve, set-field, generate-reference-number)
- One repository per entity from [`database-schema.md`](../00-foundation/database-schema.md)

There is no `CHANGE_MANAGEMENT_MODULE`. Change Management is seed data — it has no DI module of its own.

---

## 15. What This Phase Does NOT Build

- Webhook step, Wait-for-event step, Spawn-sub-workflow step (Phase 04)
- Loop steps (Phase 04 if at all — listed as future enhancement)
- Cross-branch `QUORUM` merge policy (Phase 04 enhancement); multi-assignee `QUORUM` policy is in scope
- The SLA escalation background job (Phase 04 — needs notification layer first)
- Notification dispatch and watcher delivery (Phase 04 — watcher *data model and resolution* is built here, but the actual notification fan-out lives with the notification infrastructure)
- Email action tokens (Phase 04)
- Any UI (Phase 03)
- The form builder (Phase 05)
- The workflow builder (Phase 05)
- A CM-specific entity, repository, service, or use case (none — that would defeat the point of the refactor)

---

## 16. Testing Strategy

- **Unit tests** for each step executor in isolation, with mocked repositories
- **Integration tests** against a real Postgres for the full submit → advance → close lifecycle of a hand-seeded test workflow (NOT one of the CM workflows — those are Phase 02)
- **Invariant tests** that exercise every PRD §22 invariant and assert it cannot be violated:
  - Cannot CLOSE without an outcome
  - Cannot ON_HOLD without a hold reason
  - Cannot UPDATE an audit entry
  - Cannot publish a workflow version, then mutate it
  - Cannot point a parent-gated link at a final-state target
  - Cannot link a required field without setting it
- **Cascade tests** for parent cancellation against IN_PROGRESS children
- **Calendar tests** for SLA computation across business hours, holidays, and pause/resume events
- **Delegation tests** including chain depth limits and snapshot recording

If any invariant test fails, the runtime is wrong — fix it before the test exits.
