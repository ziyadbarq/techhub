# Workflow Engine — Core Design

## Overview

The engine executes **workflow definitions** against **entity instances**. A definition is a JSON-described graph of steps. An instance is a running execution of that definition, attached to a specific record (e.g. a ChangeRequest).

The engine is pure business logic — it does not know what a ChangeRequest is. It knows steps, actions, conditions, assignees, and SLA.

---

## Step Types

### APPROVAL
Human decision step. One or more assignees are presented with approve / reject / request-more-info.

Config:
- `policy`: `ANY` (one approval sufficient) | `ALL` (everyone must approve) | `MAJORITY` | `QUORUM(N)`
- `assignees`: list of assignee descriptors (see Assignee Strategies)
- `allowedActions`: subset of `[APPROVE, REJECT, REQUEST_INFO]`
- `onApprove`: next step ID
- `onReject`: next step ID or `TERMINATE`
- `onRequestInfo`: pause, notify submitter, resume when info provided
- `sla`: duration + business hours flag

### INPUT
Collects structured data from a specific user mid-workflow. Used for risk assessment forms, supplemental information, etc.

Config:
- `fields`: list of field names to collect (maps to entity attributes)
- `assignee`: single assignee descriptor
- `onComplete`: next step ID
- `sla`: duration + business hours flag

### AUTOMATION
Runs a named server-side function. No human interaction.

Config:
- `handler`: registered handler name (e.g. `"auto-approve"`, `"notify-ci-owners"`, `"create-jira-ticket"`)
- `params`: static params merged with runtime context
- `onSuccess`: next step ID
- `onFailure`: next step ID or `TERMINATE`
- `retryPolicy`: `{ maxAttempts: 3, backoffMs: 5000 }`

### NOTIFICATION
Sends email and/or in-app notifications to a computed set of recipients. Non-blocking — advances immediately after dispatch.

Config:
- `recipients`: list of assignee descriptors
- `template`: notification template name
- `next`: next step ID

### DELAY
Pauses the workflow for a duration or until a datetime.

Config:
- `duration`: ISO duration (e.g. `"PT48H"`) OR
- `until`: ISO datetime OR
- `untilField`: entity field name containing a datetime
- `next`: next step ID

### BRANCH
Evaluates a list of conditions in order and routes to the first matching branch. One branch fires.

Config:
- `branches`: ordered list of `{ condition: ConditionExpr, next: stepId }`
- Last branch should have `condition: true` as the default/fallback

### PARALLEL
Forks into N concurrent sub-workflows. Merges when the configured policy is met.

Config:
- `branches`: list of branch definitions, each with an inline `steps` array
- `mergePolicy`: `ALL_COMPLETE` | `ANY_COMPLETE` | `QUORUM(N)` | `FIRST_DECISION`
- `onMerge`: next step ID after merge
- `branchTimeout`: optional per-branch deadline; on timeout the branch is treated as a specific outcome

### WEBHOOK
Calls an external HTTP endpoint and optionally waits for a callback.

Config:
- `url`: endpoint (may contain `{{context.field}}` interpolation)
- `method`: `POST` | `GET` | `PUT`
- `headers`: static headers map
- `body`: template with context interpolation
- `mode`: `FIRE_AND_FORGET` | `WAIT_FOR_CALLBACK`
- `callbackPath`: path that the external system will POST to signal completion
- `timeoutDuration`: how long to wait before failing
- `onSuccess` / `onFailure`: next step IDs

### ESCALATION
Monitors an in-progress step (typically APPROVAL) for SLA breach and re-routes.

Config:
- `watchesStep`: ID of the step being monitored
- `afterDuration`: when to trigger escalation (ISO duration)
- `escalateTo`: assignee descriptor for the escalation target
- `action`: `REASSIGN` | `ADD_ASSIGNEE` | `AUTO_APPROVE` | `AUTO_REJECT`

Escalation steps are always active in parallel with the step they watch — they do not replace it.

### REVIEW
Like APPROVAL but non-blocking and non-decision. Reviewer reads and acknowledges. Used for mandatory read-and-sign steps.

Config:
- `assignees`: list of assignee descriptors
- `policy`: `ANY` | `ALL`
- `next`: next step ID (no branching — review never blocks the outcome)

### LOOP
Repeats a group of steps until a condition is met or a maximum iteration count is reached.

Config:
- `steps`: inline step list to loop
- `exitCondition`: ConditionExpr evaluated after each iteration
- `maxIterations`: hard cap (default 10)
- `onComplete`: next step ID after loop exits
- `onMaxReached`: next step ID if max hit without exit condition (or `TERMINATE`)

### TERMINATION
Explicitly ends the workflow with a configured outcome. Used as a branch target for rejection paths.

Config:
- `outcome`: `REJECTED` | `CANCELLED` | `EXPIRED` | `WITHDRAWN` | any custom string
- `notifyRoles`: list of roles to notify on termination

---

## Assignee Resolution Strategies

Resolved at runtime when a step activates. The engine calls the appropriate resolver and caches resolved user IDs in the step instance.

| Strategy | Description |
|---|---|
| `SPECIFIC_USER` | Named user by Person ID |
| `SPECIFIC_ROLE` | All active users with a given TechHub RBAC role |
| `CI_OWNER` | Primary owner of each affected CI on the entity |
| `SERVICE_OWNER` | Owner of each affected Service |
| `REQUESTOR_MANAGER` | Manager of the Person who submitted the request |
| `DEPARTMENT_HEAD` | Head of the requestor's department |
| `ROUND_ROBIN` | Cycles through a named user group by submission count |
| `LEAST_BUSY` | Member of a group with fewest open workflow tasks |
| `FALLBACK_CHAIN` | Try resolver A; if resolves to no one, try resolver B |
| `COMPUTED` | Calls a named server-side resolver function with entity context |

If a resolver returns no users, the step fails with `ASSIGNEE_RESOLUTION_FAILED` and a system alert is raised.

---

## Condition DSL

Conditions are JSON expression trees. Used in BRANCH steps, LOOP exit conditions, and step skip rules.

### Primitives

```jsonc
{ "field": "riskScore", "op": ">=", "value": 16 }
{ "field": "changeType", "op": "==", "value": "EMERGENCY" }
{ "field": "affectedCICount", "op": ">", "value": 3 }
{ "field": "scheduledStartAt", "op": "<", "value": "now+48h" }
{ "field": "title", "op": "matches", "value": "^\\[URGENT\\]" }
{ "field": "priority", "op": "in", "value": ["HIGH", "CRITICAL"] }
```

Supported ops: `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not_in`, `matches` (regex), `exists`, `not_exists`

### Composite

```jsonc
{ "and": [
    { "field": "changeType", "op": "==", "value": "NORMAL" },
    { "field": "riskScore", "op": ">=", "value": 16 }
]}

{ "or": [
    { "field": "priority", "op": "==", "value": "CRITICAL" },
    { "field": "changeType", "op": "==", "value": "EMERGENCY" }
]}

{ "not": { "field": "testPlan", "op": "exists" } }
```

### Context fields available in conditions

- Entity fields: any scalar field on the bound entity (e.g. `riskScore`, `changeType`, `priority`)
- Computed: `affectedCICount`, `affectedServiceCount`, `daysSinceSubmission`
- Step outcomes: `steps.stepId.outcome` (for use in post-parallel merge conditions)
- Current user: `actor.role`, `actor.department`

---

## SLA System

### Configuration (per step)

```jsonc
{
  "sla": {
    "duration": "PT48H",
    "businessHours": true,
    "calendar": "saudi-standard",
    "warnAt": "PT36H",
    "escalateAt": "PT48H",
    "autoDecideAt": "PT72H",
    "autoDecision": "AUTO_APPROVE"
  }
}
```

### Calendars (built-in)

| ID | Work Days | Work Hours |
|---|---|---|
| `saudi-standard` | Sun–Thu | 08:00–17:00 AST |
| `saudi-extended` | Sun–Thu | 07:00–20:00 AST |
| `calendar` | All days | All hours (24/7) |

Custom calendars can be defined and registered.

### SLA Lifecycle

```
Step activates → SLA clock starts
  → at warnAt: notification to assignees and their manager
  → at escalateAt: ESCALATION step fires (if configured)
  → at autoDecideAt: engine applies autoDecision automatically
  → on REQUEST_INFO action: clock pauses
  → on PROVIDE_INFO action: clock resumes
  → on action taken before deadline: SLA met, recorded
```

SLA breach is recorded as a `WorkflowSlaEvent` and factored into dashboard metrics.

---

## Parallel Branches

### Merge Policies

| Policy | Meaning |
|---|---|
| `ALL_COMPLETE` | Wait for every branch to reach a terminal step |
| `ANY_COMPLETE` | Advance as soon as one branch completes |
| `QUORUM(N)` | Advance when N branches complete |
| `FIRST_DECISION` | Use the outcome of whichever branch produces a decision first; cancel the rest |

### Branch Timeout

Each branch can have an independent timeout. On timeout, the branch is treated as a synthetic `TIMED_OUT` outcome. The merge policy then evaluates with this outcome included.

### Cancellation on Early Merge

When `ANY_COMPLETE` or `FIRST_DECISION` fires, the engine sends a cancellation signal to all still-active branches. In-progress human steps receive a "withdrawn" notification.

---

## Delegation & Out-of-Office

- Any assigned user can set a delegate for a date range in their profile
- When the engine resolves an assignee, it checks for active delegation → substitutes delegate
- If delegate also has delegation → follows the chain (max depth 3)
- OOO flag: if set and no delegate configured, engine applies `FALLBACK_CHAIN` resolver
- Admins can force-reassign any active step task from the workflow admin panel

---

## Workflow Versioning

- Every `WorkflowDefinition` has a monotonically increasing `version` integer
- Editing a published definition creates a new version (old version archived)
- `WorkflowInstance` stores `definitionVersion` at the time of start
- Running instances are never affected by definition changes
- The admin UI shows the version snapshot that governed any historical run
- Definitions can be exported/imported as JSON blobs

---

## Audit Trail

Every state change produces an immutable `WorkflowAction` record:

- Actor (Person ID or `SYSTEM`)
- Action type and timestamp
- Step context (which step, which instance)
- Comment and any submitted input data
- IP address and user agent (for human actions)

The full action history for an instance is displayed as a visual timeline in the UI and can be exported as PDF or JSON.

---

## Engine Service — Core Operations

```typescript
interface WorkflowEngineService {
  // Start a new workflow instance for an entity
  startWorkflow(definitionId: string, entityType: string, entityId: string, context: object): Promise<WorkflowInstance>

  // Advance the engine after an action is taken on a step
  advanceWorkflow(instanceId: string, stepInstanceId: string, action: WorkflowActionInput): Promise<WorkflowInstance>

  // Evaluate all pending SLA timers (called by cron)
  processSlaTick(): Promise<void>

  // Re-evaluate branch conditions (e.g. after entity fields update)
  reevaluateConditions(instanceId: string): Promise<void>

  // Admin: force-advance past a stuck step
  forceAdvance(instanceId: string, stepInstanceId: string, outcome: string, adminId: string): Promise<void>

  // Get full state of a running or completed instance
  getInstanceState(instanceId: string): Promise<WorkflowInstanceState>
}
```
