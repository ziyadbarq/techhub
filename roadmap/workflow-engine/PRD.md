# Product Requirements Document
## Workflow Engine & Change Management
**TechHub — Internal IT Platform**
**Prepared by:** Abdullah Alzuwayed
**Input from:** Ziyad Almaghrebi, Asrar Alsahli (BRD v2.1)
**Status:** Draft · Internal use only

---

## 1. Purpose

This document describes what the Workflow Engine and Change Management modules must do — the features, the rules, and the expected behavior from the perspective of every person who will use them. It does not describe how any of it is built.

The goal is a single reference that answers: *"What does this system do, and how should it behave in every situation?"*

---

## 2. Background

Barq's IT team currently manages change requests through a combination of email threads, spreadsheets, and WordPress forms (Gravity Forms + Gravity Flow). This stack has no unified audit trail, no consistent approval process, and no visibility into where a request stands in its lifecycle. Changes reach production without proper approval, approvers miss notifications, and post-mortems are rarely written.

This system replaces that stack with a native, fully auditable workflow engine built into TechHub. The engine is general purpose — any team can use it to model any kind of request process. Change Management is the first and primary module built on top of it, implementing a full ITIL-aligned change lifecycle.

---

## 3. Design Principles

These principles govern behavior throughout the system. They take priority when two requirements conflict.

1. **Approval is not completion.** An approved request still needs implementation work. The workflow ends only when every step — including execution steps — is marked done. Reaching the final approval step does not auto-close the request.
2. **Rejection is not death.** A rejected request can be edited and resubmitted. The same request is updated in place. Every version of every field is preserved in history.
3. **The process is enforced by the system, not by people remembering.** Rules, deadlines, assignments, and routing are all configured — not assumed.
4. **Full transparency.** Every action, every decision, every comment, every field change is permanently recorded and visible to anyone with access to the request.
5. **Configurability without code.** Admins can build forms, define workflows, set routing rules, configure SLAs, and design email templates without a software deployment.
6. **IT operations focus.** The engine is generic, but the product is purpose-built for IT operations. Change Management is a first-class feature, not an afterthought.
7. **Three-field state model.** Every request carries three state fields at all times: Status (where it is in the process), Outcome (what happened when it ended), and Hold Reason (why it is paused). These three together give a complete, unambiguous picture of any request at any point in time.

---

## 4. Who Uses This

The system has two **engine-level roles** the runtime cares about — Requestor and Form Owner — plus a small number of **administrative roles** that exist on every TechHub install (System Administrator, Viewer). Everything else listed below is an **illustrative example role** drawn from the built-in Change Management seed (Change Manager, CAB Member, CI Owner, Service Owner). Those are not engine concepts — they are seeded roles in `workflow-seed.md`. Other modules (Access Requests, Vendor Onboarding, etc.) will declare their own roles in the same way without any engine change.

### Requestor
Any employee submitting a request — a change, an access request, a deployment. They fill in the form, track status, respond to questions from approvers, carry out implementation work, and write the post-implementation review.

### Approver
Anyone assigned to a workflow step that requires a decision. Depending on the step, they approve, reject, complete a task, acknowledge, or ask for more information. An approver is defined by role or named directly — it is not a fixed job title.

### Change Manager
The person responsible for the IT change process. They assess risk, approve or reject Normal changes, manage the maintenance calendar, handle escalations, and have admin authority over the Change Management module.

### CAB Member (Change Advisory Board)
A designated group of senior reviewers for Emergency changes. They are alerted immediately on emergency submissions and must respond within tight deadlines.

### CI Owner
A named owner of a Configuration Item (server, application, device). They are pulled into approvals for any change that touches their CI.

### Service Owner
A named owner of a business service. They are notified when changes affect their service.

### Form Owner
An admin who has been given management rights over a specific form. They can edit the form definition, view all requests submitted through it, and enable or disable the form.

### System Administrator
Full access to everything — all forms, all workflows, all requests, all admin settings.

### Viewer
Read-only access. Can see requests and their full history but cannot take any action.

---

---

# PART ONE: WORKFLOW ENGINE

---

## 5. Forms and Request Types

### 5.1 What a Form Is

A form is a request type. It defines what information is collected from the requestor and which workflow processes the request after submission. Every request in the system belongs to exactly one form.

Any team can define their own forms. Examples: IT change request, access request, vendor onboarding, purchase approval, HR onboarding checklist. The system does not restrict what a form can represent.

### 5.2 Form Builder

Admins build forms through a no-code interface. A form has:
- A name and description
- An owner list (users who can manage this form)
- An active/inactive toggle (inactive forms do not accept new submissions)
- A list of fields
- An associated workflow definition

### 5.3 Field Types

Available field types for form builders:

| Type | Description |
|---|---|
| Short text | Single line of text |
| Long text | Multi-line text area |
| Number | Numeric input |
| Date / Date-time | Date picker or date + time |
| Dropdown | Single selection from a list |
| Multi-select | Multiple selections from a list |
| Checkbox | Yes / No toggle |
| File upload | One or more file attachments |
| User picker | Single user selected from the directory |
| Multi-user picker | Multiple users selected from the directory |
| Request link | A reference to another request. Can be constrained to specific forms (e.g., "only CR requests"). Supports one-to-one or one-to-many. Enables parent/child hierarchies, dependencies, "related requests", and supersedes chains without any module-specific code. See §6.4 for cascade rules. |
| Scored matrix | A 2-axis scoring input (e.g., likelihood × impact) with configurable dimensions, labels, and a computed score. The form declares the axes; the workflow declares how to route on the score (§6.5). |
| Repeater | A group of sub-fields that the requestor can add N rows of. Each row collects the same set of inner fields. Used for line items, affected CIs with per-item impact descriptions, dependents, multi-asset requests, and anywhere a "list of the same thing with metadata" is needed. Rows can be added, removed, and reordered by the requestor subject to the per-step field state rules (§5.5). Min/max row counts are configurable. **Per-step state and visibility rules apply to the repeater container as a whole, not to individual sub-fields or rows.** Sub-field configuration (which inner fields exist, their types, which are required) lives on the repeater's own definition and is part of the pinned form version (§6.3). |
| Lookup | A field whose default value or dropdown options are populated at render time from an external source — a database query, another form's entries, a user directory attribute (e.g., requestor's manager, department head), a CMDB entity, or an external API. The source query can reference other fields on the same form, so lookups can cascade (e.g., pick a department → list of services in that department). **Lookups re-evaluate live only during edit modes.** When an action is taken, the resolved lookup value is captured in field history (§17), so historical reads always show what the actor saw at that moment — even if the underlying source data changes later. |
| Section header | Visual grouping — not a data field |
| Computed field | A read-only field whose value is derived from a formula over other fields on the same request. Formulas support arithmetic, comparisons, date math (e.g., days between two dates within a business calendar), string concatenation, and conditional expressions. **Formulas use the same expression language as conditional visibility rules (§5.4) and conditional branch routing (§7.6) — there is one expression DSL across the entire engine.** Computed fields recalculate automatically whenever an input field changes; computed values are captured in field history at every action so historical reads remain stable. The formula is part of the form definition. |

### 5.4 Conditional Field Visibility

Each field can have visibility conditions. A condition is a rule based on the value of another field. If the condition is met, the field appears. If not, it is hidden. Multiple conditions can be combined.

Examples:
- Show "Emergency justification" only when Change Type = Emergency
- Show "Rollback procedure" only when field "Has rollback plan" = Yes
- Show "Parent CR number" only when Request Type = AR, IR, or CFR

### 5.5 Per-Step Field State

Every field has a configurable state at each workflow step:

| State | Meaning |
|---|---|
| Editable | The step's assignee can fill in or change this field |
| Visible (read-only) | Shown but cannot be changed at this step |
| Hidden | Not shown at this step |

This allows approver-specific fields — for example, a "Server credentials" field that is hidden during initial submission but becomes editable when it reaches the sysadmin approval step. It also allows locking down fields that should only be filled in at a specific stage.

**Field state is stored as data, not code.** The (field × step) state matrix lives on the workflow definition and is edited through the no-code workflow builder. The runtime reads this matrix on every render and every write. No field behavior is hardcoded per form or per module. This is what allows the Rejection Policy's field-lock setting (§11.1), approver-specific fields, and future per-role visibility rules to all compose through a single mechanism.

**Visibility and editability interact cleanly.** If a field is hidden by a runtime visibility condition (§5.4), it is treated as hidden regardless of its per-step editable state — the runtime condition wins. The form builder also prevents authoring-time conflicts: a field marked hidden at a step cannot simultaneously be marked editable in the per-step state matrix.

### 5.6 Form Ownership

Each form has one or more designated owners. Owners can:
- Edit the form definition (fields, layout, conditional rules)
- View all requests submitted through the form
- Enable or disable the form
- Manage the form's associated workflow

System administrators can assign anyone as a form owner.

### 5.7 Form Activation

A form can be set to inactive by its owner or a system admin. Inactive forms are not visible to requestors and do not accept new submissions. In-progress requests on an inactive form continue until they close.

---

## 6. Workflow Definitions

### 6.1 What a Workflow Is

A workflow is a sequence of steps that a request follows after submission. Each step is a task assigned to someone (or someones) who must take an action before the request advances.

A workflow is associated with a form. When a request is submitted, its workflow starts automatically.

### 6.2 Admin Configurability

Admins configure workflows through a no-code interface. Everything below can be changed by an admin without a code deployment:

- The steps in a workflow and their order
- The type of each step (approval, execution, info, automation, notification, conditional, delay)
- Which actions are available at each step
- Who is assigned to each step (by name, role, or dynamic rule)
- Which fields are editable, visible, or hidden at each step
- What the SLA is for each step and what happens when it expires
- The routing logic between steps (what happens on each possible action outcome)
- Conditional branching (skip steps or route differently based on field values)

### 6.3 Workflow Versioning

Workflows have draft, published, and archived states:
- **Draft** — being configured, not yet active
- **Published** — active and used for new submissions
- **Archived** — retired, no longer used for new submissions

**Published versions are immutable.** This is a hard rule, not a convention. Once a workflow version is published, its step graph, routing, SLAs, assignment rules, field states, and every other setting are frozen forever. Any change — even a typo fix — requires creating a new draft version and publishing it.

**Running instances are pinned.** A request in progress is bound to the exact version of the workflow that was active at the moment it was submitted. Publishing a new version never affects running instances. Archiving a version never affects running instances. This pin is enforced at the engine level, not at the UI.

New submissions always use the latest published version of their form's workflow.

Built-in system workflows (e.g., Standard Change, Normal Change, Emergency Change) can be cloned and customized but not deleted.

**Forms version the same way workflows do.** A form definition — its fields, their types, their visibility conditions, their per-step state matrix, its rejection policy, and its reference number format — is versioned with the same draft/published/archived lifecycle. Published form versions are immutable. Running instances are pinned to the form version active at submission time. This pin matters: a request submitted under form v3 continues to be read and written using v3's field definitions, even after v4 has been published with new fields, removed fields, or changed types. Field history (§17), per-step field state, and the rejection policy all operate against the pinned version so the behavior a requestor saw on day one remains intact on day 365. When a form and its workflow are edited together, publishing them as a matched pair is supported; each side pins independently on the resulting instance.

**Field renames and removals across versions.** Field history is keyed by `(formVersion, fieldKey)` — never by field key alone. When form v2 renames a field from `oldKey` to `newKey`, requests pinned to v1 continue to read and write `oldKey` and their history remains queryable. When form v2 removes a field entirely, requests pinned to v1 still have that field, still write to it, and its history remains intact. The pinned form version is authoritative; later versions never reach back into running instances.

### 6.4 Linked Requests and Cascade Rules

A **Request link** field (§5.3) creates a relationship between two requests. The form owner configures:

| Setting | Options |
|---|---|
| **Target form(s)** | Which forms the link can point to (e.g., "only Change Request", "any form") |
| **Cardinality** | One-to-one · one-to-many |
| **Required** | Whether the link must be set for the request to be submitted |
| **Parent gate** | Can the target be linked only while it is in a non-final state? Yes · No |

**Cascade rules** are set on the *target* form (the form being linked *to*, e.g., a Change Request that has child requests pointing at it):

| Rule | Meaning |
|---|---|
| **Close gate** | The target cannot transition to a final state while any inbound-linked request is in a non-final state |
| **Cancel cascade** | When the target is cancelled, all non-final inbound-linked requests are automatically cancelled in the same atomic operation with a configured outcome (default: SUPERSEDED) and a system-generated outcome note referencing the target |

Both rules are generic engine features. Any form can be the target of a cascade — Change Management's CR → AR/IR/CFR parent/child is just one application. Other uses: a "release" form with child deployment requests, a "project" form with child tasks, a "vendor onboarding" form with child compliance checks.

The relational constraint (a required Request link cannot be blank; a parent-gated link cannot point at a final-state target) is enforced at the data layer, not the UI.

### 6.5 Conditional Routing on Scored Matrix Fields

A **Scored matrix** field (§5.3) produces a numeric score. Any **Conditional Branch** step (§7.6) can route on that score. The workflow definition declares the score ranges and routing targets in a table — e.g., *"0–10 → skip, 11–20 → add warning, 21–25 → route to acknowledgement step."* Thresholds and targets are editable; the score-to-routing mapping is part of the workflow, not hardcoded anywhere.

---

## 7. Step Types

Every step in a workflow has a type. The type defines what the assignee is expected to do and what actions are available.

### 7.1 Approval Step

The assignee must make a formal decision. They are accountable for the outcome. Typically used for review gates, authorization checkpoints, and compliance sign-offs.

Default available actions: Approve, Reject, Request More Info, Return to Previous Step, Send to Requestor.

The form definition controls which of these actions are enabled for each specific step.

### 7.2 Execution Step

The assignee must perform a task — create accounts, run a script, deploy something, configure a system, or complete any hands-on work. There is no approval decision. They mark the step complete when the task is done.

Default available actions: Complete, Request More Info, Return to Previous Step.

### 7.3 Info / Acknowledgment Step

The assignee is notified and may acknowledge. This step does not block the workflow — it can be configured to auto-skip if the assignee does not respond within the SLA, or to require an explicit acknowledgment before advancing.

Default available actions: Acknowledge, Skip.

### 7.4 Automation Step

The system performs a registered automation handler with no human involvement. Examples: auto-approve a step, set a field value, generate or assign a reference number, send a batch notification, run any other action implemented by an automation handler registered in the engine.

No assignee. Runs immediately when activated. On success or failure, routes to the configured next step. The set of available handlers is extensible — new handlers can be registered without changing the engine.

### 7.5 Notification Step

Sends a message to configured recipients and advances automatically. No action required from recipients. Used to keep stakeholders informed at key points in the workflow.

### 7.6 Conditional Branch Step

Evaluates a rule against the current field values of the request and routes to one of several possible next steps. No human action required.

Examples:
- If risk score ≥ 21 → route to Critical Risk Acknowledgement
- If change type = Emergency → skip Normal approval, go to CAB
- If a user field is empty → skip CI Owner approval

### 7.7 Delay Step

Pauses the workflow for a configured duration before automatically advancing to the next step. Useful for scheduling constraints, cool-down periods, or timed follow-ups.

### 7.8 Schedule Step

The assignee picks a start date/time (and optionally an end date/time) for the request. The step is configured against a business calendar (§13.1) plus an optional set of allowed windows and an optional set of blackout periods. The step enforces its rules at submission:

| Step Setting | Options |
|---|---|
| **Calendar** | Which business calendar the schedule must fall inside |
| **Allowed windows** | Named recurring time slots (e.g., "Friday Night Maintenance"); empty list = free scheduling inside the calendar |
| **Blackout behavior** | Block · Warn · Ignore — what happens if the chosen date/time falls inside a blackout period |
| **Minimum lead time** | How far in advance the schedule must be set (e.g., 24h) |
| **Duration required** | Whether end date/time is mandatory |

Default available actions: Set Schedule, Request More Info, Return to Previous Step.

Maintenance windows and blackouts are just named reference data. Any team can define their own — deployment windows, release trains, training slots, vendor hours. The Schedule step is the generic mechanism that enforces them.

Scheduled start/end are stored as regular fields on the request and can be edited later subject to workflow permissions.

---

## 8. Step Policy — Single and Parallel

This section is about **how multiple steps run alongside each other in a workflow**. It is *not* about how multiple assignees on a single step decide — that is a separate concept covered in §12.

Every step is configured with one of two execution policies:

**Single:** The step runs alone. The workflow waits for it to complete before moving on.

**Parallel:** The step runs at the same time as other consecutive parallel steps. When the workflow activates a parallel step, it continues activating all following parallel steps until it reaches the next Single step. The next Single step acts as a synchronization barrier — it waits for all preceding parallel steps to complete before it activates.

Example sequence:
```
Step 1 (Single) → Step 2 (Parallel) → Step 3 (Parallel) → Step 4 (Single)
```
Execution: Step 1 completes → Steps 2 and 3 activate simultaneously → Step 4 waits for both → Step 4 activates.

**Parallel branch merge policies.** When the synchronization barrier evaluates whether to advance, it uses a merge policy declared on the barrier step:

| Merge Policy | Meaning |
|---|---|
| **All complete** | Wait for every preceding parallel branch to reach a terminal state. This is the default. |
| **Any complete** | Advance as soon as one preceding parallel branch produces a decision; cancel any still-active branches. |

Each parallel branch may itself contain a multi-assignee step — in which case the branch's *internal* aggregation uses the policies in §12, and the *cross-branch* aggregation at the barrier uses the merge policies above. The two are orthogonal and compose cleanly.

---

## 9. Actions Reference

These are the actions available to assignees on a workflow step. Which actions appear on a given step is configured in the step definition.

### Approve
Available on: Approval steps.
Marks the step approved. The workflow advances to the configured next step.

### Complete
Available on: Execution steps.
Marks the task done. The workflow advances to the configured next step.

### Acknowledge / Skip
Available on: Info steps.
Confirms the assignee has seen the notification. The workflow advances. If the step is configured as skippable, it may auto-advance without requiring this action.

### Reject
Available on: Approval steps.
Stops the current path. The rejector provides a reason and configures the re-approval scope — see Section 11.

### Request More Info
Available on: Approval and Execution steps.
Pauses the SLA clock on the current step. Sends a message (with the question) to the requestor. The clock resumes and the step returns to the assignee when the requestor responds.

### Return to Previous Step
Available on: Approval and Execution steps.
Routes the request back to a specific earlier step in the workflow. The target step is configured per step definition (not open-ended). The request does not restart from scratch — only the specified step is reactivated.

### Send to Requestor
Available on: Approval and Execution steps.
Returns full control of the request to the requestor. All fields become editable. The requestor reviews, makes changes, and resubmits. The workflow restarts from the beginning of the workflow (or from a configured entry point).

### Reassign
Available on: Any active step.
Transfers the step to a different assignee. The original assignee loses the task. Full audit record of the reassignment is kept.

### Put On Hold
Available on: Any step, by the form owner, workflow admin, or configured roles.
Pauses the request. A Hold Reason must be selected. The SLA clock stops. See Section 10.3.

---

## 10. Status, Outcome, and Hold Reason

Every request carries three state fields at all times. Together they give a complete, unambiguous picture of where a request is and what happened to it.

---

### 10.1 Status — Where Is It Right Now?

Status tracks the request's current position in its lifecycle. It changes every time the request moves forward, is paused, or reaches a final state.

**Generic status values** — apply to every form type in the system:

| Status | Meaning |
|---|---|
| DRAFT | Being filled out by the requestor; not yet submitted |
| SUBMITTED | Submitted; workflow is starting |
| IN_REVIEW | The workflow is running; pending human decisions |
| ON_HOLD | Paused; waiting for something external to the workflow |
| IN_PROGRESS | Active work is being performed by the implementor |
| PENDING_REVIEW | Work is done; awaiting a formal post-work review |
| CLOSED | Final; no further action possible |
| CANCELLED | Stopped before reaching a final state; permanent |

**Module-specific intermediate statuses** can be inserted between the generic ones. Each module declares which generic status its intermediates extend:

| Module | Intermediate Status | Sits Between |
|---|---|---|
| Change Management | APPROVED | IN_REVIEW → IN_PROGRESS |
| Change Management | SCHEDULED | APPROVED → IN_PROGRESS |
| Change Management | FAILED | IN_PROGRESS → PENDING_REVIEW or CLOSED |
| Change Management | ROLLED_BACK | FAILED → CLOSED |
| Change Management | PIR_PENDING | replaces PENDING_REVIEW |

This way every module speaks the same generic language for cross-module reporting, while retaining the domain-specific granularity needed for operations.

**Canonical status contract.** The statuses listed above (generic + module-declared intermediates) are the **only** values ever stored in the status field. No other value — from imports, integrations, bulk loads, or legacy migrations — is ever written directly. If an external source uses a different vocabulary, it is translated to a canonical value at exactly one named boundary (the workflow engine's write path). No query, UI, report, or business rule anywhere in the system branches on non-canonical values. A build-time contract test enforces this.

---

### 10.2 Outcome — What Happened When It Ended?

Outcome is set once, at the moment a request reaches CLOSED or CANCELLED. It is required — a request cannot be closed without selecting an outcome. It answers: *"Why is this closed, and was it successful?"*

**Generic outcomes** — available to all form types:

| Outcome | Meaning | Applies When |
|---|---|---|
| SUCCESSFUL | Completed as intended, no issues | CLOSED |
| SUCCESSFUL_WITH_ISSUES | Completed but with deviations or known gaps | CLOSED |
| UNSUCCESSFUL | Did not achieve the intended result | CLOSED |
| WITHDRAWN | Requestor cancelled it before completion | CANCELLED |
| REJECTED | Approver rejected it and requestor did not resubmit | CANCELLED |
| SUPERSEDED | Replaced or made redundant by another request | CANCELLED |
| ABANDONED | Went stale; no activity for an extended period | CANCELLED |
| EXPIRED | Auto-closed by the system (SLA or policy rule) | CANCELLED |

**Module-specific outcomes** extend the generic list for domain-specific conclusions. Change Management adds:

| Outcome | Meaning |
|---|---|
| ROLLED_BACK | Implementation failed and was fully reversed |
| PARTIALLY_ROLLED_BACK | Some components rolled back, others kept |
| DEFERRED | Approved but deliberately postponed to a future window |

Each form type declares which outcomes are valid for it. A procurement form does not need ROLLED_BACK. An HR form does not need DEFERRED. The system only presents relevant options at close time.

**A name can be both a status and an outcome.** Some module-declared values appear in both the status list (§10.1) and the outcome list — `ROLLED_BACK` is the obvious example: a Change Management request transits *through* the ROLLED_BACK status while the rollback is being executed, and then *closes* with the ROLLED_BACK outcome. The two uses of the same name are deliberate and the engine treats them as distinct fields. Status answers "where is it now?"; outcome answers "what happened when it ended?". A request can leave the ROLLED_BACK status and still close with a different outcome (e.g., SUCCESSFUL_WITH_ISSUES, if the rollback itself was clean and the original change is now considered properly reverted).

**Outcome Notes** — a free-text field set alongside the outcome code. Required when outcome is anything other than SUCCESSFUL. Provides the human-language explanation of what happened. This is separate from the audit trail (which records mechanical facts) — outcome notes record the *narrative*.

**Atomic closure.** Setting the outcome and transitioning to CLOSED (or CANCELLED) is a **single atomic operation**. There is no "close first, set outcome later" path, ever. The transition function requires outcome (and notes, when applicable) as inputs and fails if they are missing. A request cannot exist in a state of "closed without an outcome" even momentarily.

**Outcome display rules:**
- In the request list: outcome column is shown only for CLOSED and CANCELLED rows
- In the request detail header: outcome badge appears alongside status once the request is final
- In reports and dashboards: always filterable and groupable by outcome

---

### 10.3 On Hold — Why Is It Paused?

ON_HOLD is a first-class status. Any request in a non-final, non-cancelled state can be placed on hold by an authorized user (form owner, workflow admin, or a role configured per form).

**When placed on hold:**
- A Hold Reason must be selected (see below)
- The SLA clock pauses immediately
- All step assignees are notified
- The request header shows ON_HOLD prominently alongside the hold reason
- No workflow steps advance while the request is on hold

**Hold Reason values:**

| Reason | Meaning |
|---|---|
| AWAITING_REQUESTOR | Waiting for information or action from the requestor |
| AWAITING_THIRD_PARTY | Waiting on a vendor, supplier, or external system |
| AWAITING_DEPENDENCY | Waiting for another request or change to complete first |
| AWAITING_RESOURCE | The required team or person is unavailable |
| AWAITING_WINDOW | Holding for the next available maintenance window |
| PENDING_DECISION | Escalated; waiting for a senior or executive decision |
| OTHER | Free text description required when selected |

**When resumed:**
- The actor selects "Resume" and optionally adds a note
- The SLA clock restarts from where it paused (elapsed time before hold is preserved)
- The previous status is restored
- The resume action, actor, timestamp, and note are recorded in the audit trail

**On Hold history:** every hold and resume cycle is visible in the request timeline — including who put it on hold, what reason they selected, who resumed it, and how long it was paused.

---

### 10.4 How the Three Fields Work Together

```
At any point in time, a request can be fully described as:

  Status:      IN_PROGRESS
  On Hold:     —
  Outcome:     (not yet set)

  or:

  Status:      ON_HOLD
  Hold Reason: AWAITING_THIRD_PARTY
  Outcome:     (not yet set)

  or:

  Status:      CLOSED
  Hold Reason: —
  Outcome:     ROLLED_BACK
  Notes:       "Deployment caused service degradation; rolled back at 02:14"
```

**State invariants.** The three fields are not just conventions — they are constraints enforced at the data layer and by the state transition function. A request can never exist in a state that violates any of these:

1. **Outcome is required** when status is CLOSED or CANCELLED, and forbidden otherwise. A request cannot be CLOSED without an outcome set in the same transaction.
2. **Hold Reason is required** when status is ON_HOLD, and forbidden otherwise. A request cannot be placed ON_HOLD without a hold reason set in the same transaction.
3. **Outcome is immutable once set.** Administrators with override authority can edit it, but only via an audited override action — never through a generic field edit.
4. **Status transitions are atomic** with their required side effects. Moving to ON_HOLD sets the hold reason; moving to CLOSED sets the outcome; moving off ON_HOLD clears the hold reason. There is no two-step path.
5. **Invalid combinations are impossible by construction** — the system rejects writes that would produce them, not just hides them in the UI.

For reporting, the combination unlocks precise queries without any text parsing:
- All changes that closed successfully this quarter
- All requests currently on hold waiting for a third party
- All emergency changes that ended in rollback in the last 6 months
- Average time-to-close by outcome type, by department, by form

---

## 11. Rejection and Resubmission Model

Rejection is not the end of a request. The system treats it as a correction cycle. The *policy* that governs rejection — what scopes are allowed, how many attempts a requestor gets, which fields lock on resubmit, what reasons are valid — is configured at the **form level** by the form owner or system administrator. Individual rejectors operate within that policy; they do not set it per rejection.

### 11.1 Rejection Policy (per form)

Every form declares a Rejection Policy. The policy is part of the form definition and is versioned alongside the form.

| Setting | Options | Notes |
|---|---|---|
| **Default re-approval scope** | Full restart · Resume from rejection step | The scope used when a rejector does not (or cannot) pick one |
| **Rejector discretion** | Locked (always use default) · Choose from allowed list | Controls whether the rejector can override the default |
| **Allowed scopes** | Subset of { Full restart, Resume from rejection step } | Only meaningful when discretion = "Choose from allowed list" |
| **Predefined rejection reasons** | Admin-managed list of structured reason codes | The rejector must pick one; free-text notes are always allowed in addition |
| **Field lock on resubmit** | None · Lock specified fields · Lock all except specified fields | Locked fields become read-only for the requestor after the first submission; they cannot be changed during resubmission |

**Scope definitions:**
- **Full restart** — the workflow starts from the beginning; all prior approvals must be obtained again
- **Resume from rejection step** — once the requestor edits and resubmits, the workflow returns to the rejection step directly, skipping already-completed prior steps

### 11.2 What the Rejector Does at Runtime

When taking the Reject action, the approver:
1. Picks a rejection reason from the form's predefined list
2. Writes free-text rejection notes (shown to the requestor)
3. Picks the re-approval scope *only if* the form's policy allows discretion — otherwise the form's default is applied automatically

The rejector never sees a scope picker on forms where discretion is locked.

### 11.3 What the Requestor Does

After rejection:
1. Receives a notification with the reason and notes
2. Opens the request; fields are editable *except* those frozen by the policy's field lock
3. Makes changes and resubmits

### 11.4 Outcome and Rejection

An intermediate rejection — one the requestor responds to and resubmits — is a workflow event, not a final outcome. The outcome is only written when the request truly ends. A request becomes final with status CANCELLED and outcome REJECTED when the requestor never resubmits and the request is cancelled via the configured abandonment policy.

### 11.5 Request Identity

The request is the same record throughout its entire lifecycle — submission, rejection, resubmission, re-rejection, close. This is a hard invariant:
- One row per request, lifetime-stable ID and reference number
- Every version of every field value is preserved in history (append-only field versioning with who/when)
- The reference number never changes
- There is no concept of "request v2", no copy-on-rejection, no soft-delete-and-recreate
- Attachments from prior submissions remain on the record even if later edits remove the field, because the audit trail references them

---

## 12. Assignment Strategies

Step assignees are resolved at runtime using rules, not hardcoded names. Available strategies:

| Strategy | How It Works |
|---|---|
| Specific user | A named person, set in the step definition |
| Specific role | All users who hold a given role at the time the step activates |
| Form field — single user | Pulls the user from a User Picker field on the form |
| Form field — multiple users | Pulls all users from a Multi-User Picker field on the form |
| CI owner | Resolves to the owner(s) of the affected Configuration Items |
| Service owner | Resolves to the owner(s) of the affected Services |
| Requestor's manager | Looks up the direct manager of the person who submitted |
| Round-robin | Distributes across a role's members, one person at a time in rotation |
| Least busy | Assigns to the role member with the fewest active pending tasks |

Multiple strategies can be combined on a single step. All resolved users are co-assignees; the step's **multi-assignee policy** determines when the step advances.

**Multi-assignee policies** apply to any step type that can have more than one assignee — Approval, Execution, and Info/Acknowledgment. The semantics of "decide" depend on the step type: on Approval steps it means approve/reject; on Execution steps it means mark complete; on Info/Ack steps it means acknowledge.

| Policy | Meaning |
|---|---|
| **Any** | The first assignee to decide advances the step. On Approval steps, one approval approves and one rejection rejects. On Execution steps, the first complete advances. |
| **All** | Every assignee must decide. The step advances only when all have decided positively. On Approval steps, a single rejection rejects the step immediately (short-circuit). On Execution steps, every assignee must mark complete. |
| **Majority** | The step advances when more than half of the assignees decide positively. The remaining assignees' decisions are no longer needed once majority is reached. Rejection is symmetric on Approval steps. |
| **Quorum** | Configurable. Admin sets a minimum number (or percentage) of positive decisions required to advance, and a minimum number of total responses needed before the vote is valid. Useful for CAB-style panels where you need at least 3 of 5 members to participate before the decision counts. |
| **Unanimous** | Functionally the same as All on Approval steps, but phrased as a policy — used when the intent is to communicate "every single reviewer must agree" (e.g., critical risk sign-off). |

The policy is set on the step definition. Aggregation is computed from the **assignee snapshot** (§17), not from live role membership — so a user joining or leaving the role mid-decision does not change the required count.

**Multi-assignee policies are independent of parallel branch merge policies (§8).** A multi-assignee step is *one step* that needs *multiple users* to decide. A parallel branch is *multiple steps* running side-by-side. The two compose: a step inside a parallel branch can itself have multiple assignees, and each layer applies its own policy.

---

## 13. SLA System

SLA in this system has two independent parts: the business calendar and the escalation policy.

### 13.1 Business Calendar

Each step can be configured with a business calendar. The calendar defines which hours and days count toward SLA time. Non-business time is excluded from the elapsed time calculation — the SLA clock stops outside business hours and resumes when business hours begin.

**Calendars are first-class, shared entities**, not config blobs copied into step definitions. A calendar has its own name, is managed in a dedicated admin area, and is *referenced* by workflow steps. When an admin updates a calendar (for example, adding a new public holiday), every step that references it picks up the change on the next evaluation — without editing any workflow definitions and without affecting running instance immutability (the calendar reference is pinned, but the calendar's contents are authoritative at evaluation time).

A calendar specifies:
- A unique name
- Working days (e.g., Sunday–Thursday)
- Working hours (e.g., 08:00–17:00)
- Timezone
- Public holidays (managed list of excluded dates)
- Active/inactive status

Multiple calendars can be defined (e.g., Riyadh Standard, 24/7, custom department hours). Each step selects which calendar to use by reference. Emergency change steps always reference the 24/7 calendar.

### 13.2 SLA Escalation Policy

Each step can have an SLA escalation policy — a set of actions that trigger automatically based on how long a step has been pending. Actions are time-based and configurable:

| Action | What It Does |
|---|---|
| Send reminder | Notifies the current assignees that the step is pending |
| Remind on schedule | Sends repeat reminders every x hours/days until the step is resolved |
| Add assignee | Adds a specified user or role (e.g., manager) as an additional assignee |
| Reassign | Transfers the step to a different assignee (e.g., escalate to manager) |
| Auto-advance | Marks the step with a specified auto-decision (e.g., auto-approve, auto-skip) and advances the workflow |

Multiple escalation rules can be stacked with different time thresholds. Example: remind at 24h, add manager at 48h, auto-approve at 72h.

**Auto-advance audit identity.** When an SLA escalation rule auto-advances a step (e.g., auto-approve on timeout), the audit trail records the actor as `system (SLA escalation)` and references the specific escalation rule that fired, including the threshold that was crossed. The entry is clearly distinguishable from a human decision. The same mechanism applies to any policy-driven system action — e.g., a Standard Change's automation-step auto-approval is recorded with actor `system (policy)`.

### 13.3 SLA Clock Pause Rules

The SLA clock pauses automatically in these situations:

| Situation | Clock Behavior |
|---|---|
| Request More Info action taken | Pauses until requestor responds |
| Request placed ON_HOLD | Pauses until request is resumed (all active branches pause, including parallel branches) |
| Step waiting on a sibling parallel branch | Not paused — each parallel branch has its own clock |

**Pauses and resumes are recorded as events, not as deltas.** The system never stores a mutable "deadline" field that gets patched when a pause happens. Instead, every step records:
- Its start timestamp
- The business calendar reference it uses
- An append-only log of pause/resume events (with timestamps, reason, and actor)

The current deadline — and any historical "how much time did this spend paused vs ticking vs in business hours vs outside them" report — is always *computed* from these stored facts. This makes post-hoc analysis precise and eliminates entire classes of "the deadline is wrong" bugs.

---

## 14. Notifications

### 14.1 Channels

- **In-app** — notifications appear within TechHub, visible in the notification center
- **Email** — sent to the user's registered email address

### 14.2 Email Action Buttons

Approval notification emails contain live action buttons (e.g., Approve, Reject, Acknowledge). Clicking a button triggers the corresponding workflow action without requiring the user to log into TechHub.

Security:
- Each button uses a unique, single-use token embedded in the URL
- Tokens expire after a configured time (e.g., 72 hours)
- Expired or already-used tokens are rejected with a clear message
- Token-based actions are logged in the audit trail with a note that the action was taken via email

### 14.3 Email Template Builder

Admins can create and manage email templates used across workflow events.

**Template management:**
- Create, edit, duplicate, and delete templates
- Assign templates to workflow events (step activated, approved, rejected, reminder, escalation, etc.)
- Preview rendered output before saving

**Template composition:**
- HTML code editor (visual editor in a future version)
- Configurable header, body, and footer sections
- Branding: logo, colors, font settings
- Light and dark mode styling (adapts to recipient's email client)

**Dynamic variables** — replaced at send time:
`{{request_id}}`, `{{request_number}}`, `{{request_title}}`, `{{form_name}}`, `{{current_step}}`, `{{assignee_name}}`, `{{requestor_name}}`, `{{action_taken}}`, `{{rejection_reason}}`, `{{sla_deadline}}`, `{{hold_reason}}`, `{{outcome}}`, `{{request_url}}`, `{{action_url_approve}}`, `{{action_url_reject}}`, and more.

**Action button embedding:**
Email templates can include one or more action buttons. Each button maps to a workflow action and embeds the secure token URL automatically at send time.

### 14.4 Watchers

Any TechHub user with view access to a request can **watch** it. Watchers are non-assignees who subscribe to receive the same notifications as the active step assignees, without holding any action authority. A watcher cannot approve, reject, complete, or otherwise affect the workflow — they only receive a copy of the updates.

**Who can watch:**
- The requestor is automatically a watcher on their own request (implicit; cannot be removed)
- Any user with view access can add themselves as a watcher
- Form owners, workflow admins, and system administrators can add any user as a watcher on any request
- Watchers can be added by role — e.g., "watch all requests on the CFR form" — as a **form-level subscription** that auto-enrolls matching users on every new submission

**Subscription resolution timing.** When a request is submitted, every form-level role-based subscription is evaluated *at that moment* and the matching users become explicit watchers on the request. New users who join the role *after* submission are not retroactively added to in-flight requests; they are only enrolled on requests submitted from then on. This mirrors the assignee snapshot model (§17): subscriptions are resolved at a defined moment, not continuously, so the watcher set is auditable and stable.

**What watchers receive:**
- All step activation, decision, hold, resume, and closure notifications the primary assignees receive
- Watchers do not receive action-button emails — their notifications contain a "View Request" link only
- Each watcher has personal channel preferences (in-app, email, both, or muted) configured **per form** — set once on the form, not per request, not per event type. A watcher can mute a noisy form without affecting their watch on others.

**Audit:**
- Adding and removing a watcher are recorded in the audit trail with actor, timestamp, and reason (optional)
- The watcher list at any historical moment is reconstructable from the audit trail
- Watchers do **not** appear in assignee snapshots (§17) — they are a separate concept from step assignees and must never be confused with "who was supposed to act"

**Why this matters:** senior stakeholders and subject-matter experts often need visibility into requests without authority over them. The Change Manager may want to watch every CFR touching the core network even though they are not an approver. A legal reviewer may want to watch any procurement request above a threshold. Watchers make this a first-class feature instead of forcing people to be added as fake approvers.

---

## 15. Comments

There are two distinct comment surfaces on every request.

### 15.1 Action Comments

When a user takes a workflow action (approve, reject, request info, etc.), they can attach a comment. This comment is part of the formal audit trail — it is permanently tied to the action, timestamped, and cannot be edited or deleted.

### 15.2 General Comment Thread

A separate, Jira-style comment thread exists on every request. Any TechHub user with access to the request can read and write general comments. General comments do not trigger any workflow state change — they are a conversation space for context, questions, and coordination.

General comments can include file attachments. They are permanently preserved and cannot be deleted, but they are clearly separate from the formal audit record.

---

## 16. Attachments

File attachments are supported in two places:

- **Form fields** — a form can include one or more file upload fields. Files uploaded here are part of the request record (e.g., deployment scripts, architecture diagrams, approval sign-offs).
- **General comments** — files can be attached to any comment in the comment thread.

**Foundational rules for attachments:**

1. **Immutability.** Once uploaded, a file is never modified in place. "Editing" an attachment means uploading a new version alongside the old one. Both versions remain permanently accessible through history.
2. **Request scoping.** Every attachment belongs to exactly one request. There is no shared attachment pool across requests. Links from one request to another's attachments are not supported.
3. **Retention.** Attachments on cancelled, rejected, or closed requests are retained indefinitely — not purged — because the audit trail, field history, and comment thread permanently reference them. Removing an attachment would break historical integrity.
4. **Access.** Attachments inherit the view access of the request they belong to. Anyone who can view the request can view the attachment.
5. **Removal.** Users cannot delete attachments. An attachment can be detached from an *active* form field (for example, the requestor replaces a file during editing), but the detached version remains recorded in field history and is still accessible through the audit trail.

---

## 17. Audit Trail

Every action taken on a request is permanently recorded:

- Who took the action (or: system, if automated)
- What action was taken
- Which step it was on
- When (date and time, timezone)
- Any comment attached to the action
- Whether it was taken via the TechHub UI or via email token
- If via delegation: the full delegation chain that was active at the moment of the action — not the chain that exists when the record is later read
- For On Hold events: who placed it on hold, the hold reason, who resumed it, and how long it was paused

**Assignee resolution snapshots.** When a step activates, the system records *at that moment* which users resolved as assignees and via which strategy (role membership, form field, CI owner, etc.). This snapshot is immutable and is what the timeline and "who was supposed to act" reports read from. The system never re-resolves assignment rules later to answer historical questions — people leave, roles change, CI owners get reassigned, and reconstructing "who owned this in March" from current state is impossible. The snapshot removes that problem entirely.

**Field-level history** is also tracked:
- Every version of every field value, with who wrote it and when
- Append-only, never overwritten — "current value" is always the latest version
- Enables queries like "what did the rollback plan look like at the moment the CM approved this change?"

**The audit trail is append-only.** Nothing — actions, comments, field history, on-hold events, assignee snapshots, delegation chains, outcome records — can be edited or deleted. Administrative "override" actions (e.g., outcome override) are themselves recorded as new audit entries that reference the entry they override; they do not mutate the original. The trail is exportable.

---

## 18. Workflow Definition Administration

Admins manage workflow definitions through the Workflow Definitions admin area.

**Actions available:**
- View any definition and its step graph
- Create a new definition (starts as Draft)
- Clone an existing definition (creates a Draft copy)
- Edit a Draft definition
- Publish a Draft (makes it the active version for new submissions)
- Archive a Published definition (retires it; existing in-progress requests are unaffected)

**Built-in definitions** (system-provided) are read-only. They can be cloned but not edited or deleted.

**Instance management** (for system administrators):
- View all running and completed workflow instances
- Force-advance a stuck step
- Reassign a step to a different user
- Cancel a running workflow instance

---

## 19. Delegation

An approver going on leave can delegate their approval authority to a colleague. Delegation is a generic engine feature — it applies to any workflow and any form.

A delegation specifies: who is delegating, who receives authority, the active date range, and an optional reason.

While active:
- The delegatee can take approval actions on the delegator's assigned steps across every form
- The audit trail records the decision as: "Action by [delegatee] on behalf of [delegator] (delegation active)"
- The full delegation chain in effect at the moment of each action is captured as part of the assignee snapshot (§17), so historical queries return the correct answer even after the delegation expires or is revoked

When the delegation expires, it has no further effect. The delegator's access returns to normal automatically. Delegations can also be revoked by the delegator or an admin at any time before expiry.

---

## 20. Generic Request UI

Every request in the system — regardless of which form it belongs to — is presented through the same set of generic views. These views read from the three-field state model (§10), the workflow timeline, the assignee snapshots (§17), and the form definition. There is no per-module view code.

### 20.1 Request List

The main list of requests, scoped either to a single form or across forms. Filterable by: status, outcome, hold reason, priority, assigned to, date range, form, and any field the form owner has marked as filterable. Standard toggles: "My requests", "My approvals", "On hold".

Sortable columns include the request reference number, title, status badge, outcome badge (shown only for CLOSED/CANCELLED rows), priority, requestor, current assignee, SLA indicator, and current workflow step. The list is exportable (CSV/Excel).

A sidebar badge shows the count of requests awaiting the current user's approval, the count of SLA breaches, and the count of requests currently on hold.

### 20.2 Request Detail

Two-column layout, used for every form:

**Left — the request itself:**
- Header: reference number, title, status badge, outcome badge (when closed/cancelled), hold reason badge (when on hold), SLA ribbon
- All form fields, grouped by section, rendered according to the per-step field state matrix (§5.5) and any runtime visibility conditions (§5.4)
- General comment thread (§15)

**Right — the process:**
- Workflow timeline (§20.3)
- Action panel — visible only to users with a pending task on the active step
- People: requestor, current assignee(s), past actors (from the assignee snapshot history)

**Actions bar** — contextual, rendered from the active step's enabled actions (§9) and the current user's permissions. There is no hardcoded action list per form; every button on the actions bar comes from the workflow definition.

### 20.3 Workflow Timeline

The timeline is the full story of the request from submission to current state. Visible to all users with view access.

For each step, the timeline shows:
- Step name and type
- Status (pending / active / completed / skipped / failed)
- Assigned users, from the assignee snapshot taken when the step activated (§17), with their individual decision status for multi-assignee steps
- For completed steps: who acted, what they decided, their comment, and the timestamp
- For parallel steps: all branches shown simultaneously with their individual statuses
- SLA bar: time elapsed vs. deadline, color-coded, computed from the step's pause/resume event log (§13.3)

On Hold events appear as timeline entries between steps — showing when the hold was placed, by whom, the reason, when it was resumed, and how long the request was paused.

### 20.4 Dashboards

Dashboards are configurable per form and per role. A dashboard is a collection of widgets — each widget is a query against the canonical status/outcome/hold-reason model plus the workflow timeline. Typical widget types:

- **Pipeline funnel** — count of requests in each status, clickable to filtered list
- **Outcome breakdown** — for closed requests over a configurable window
- **My pending actions** — requests waiting for the current user, with SLA countdown
- **Currently on hold** — grouped by hold reason
- **SLA health** — on-track / at-risk / breached counts
- **Volume over time** — historical trend
- **Recent failures** — requests closed with a non-successful outcome
- **Upcoming scheduled** — requests with a scheduled start in the near future

Widgets and their queries are admin-configurable. Built-in dashboards — for example, a Change Management executive dashboard — are just seeded dashboard configurations. See [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md).

---

## 21. Reference Number Formats

Every request gets a unique reference number generated automatically at creation. The format is configured per form and is not hardcoded per module.

A reference number format specifies:
- A **prefix** (e.g., `CR`, `AR`, `IR`, `INC`, `REQ`)
- A **date component** — optional (e.g., `YYYYMMDD`, `YYYYMM`, or none)
- A **sequence** — per-form per-day, per-form per-month, or per-form lifetime — with configurable zero-padding
- A **timezone** used to evaluate date boundaries (default: Asia/Riyadh)

**Examples:**
- `CR-20260414-00042` — prefix + daily sequence, KSA timezone
- `INC-2026-000123` — prefix + yearly sequence
- `REQ-018742` — prefix + lifetime sequence

Reference numbers are assigned at submission and never change thereafter (§11.5 — request identity invariant). The format lives on the form definition; forms can be reconfigured, but existing reference numbers are preserved as-is.

---

## 22. Engine Invariants

These rules are enforced unconditionally by the engine, not by convention. No user action, no configuration change, and no admin override can bypass them. Changing any of these requires a code deployment. Everything else in this document is configuration.

1. **Three-field state model atomicity (§10).** An Outcome must be set in the same atomic transaction that transitions a request to CLOSED or CANCELLED. A Hold Reason must be set in the same atomic transaction that places a request into ON_HOLD. No request can exist in a "closed without outcome" or "on-hold without reason" state, even momentarily.
2. **Outcome notes required when not successful (§10.2).** Outcome Notes are required when the outcome is anything other than SUCCESSFUL.
3. **Outcome immutability (§10.2).** Once set, an outcome can only be changed via an audited override action by a user with explicit override authority — never through a generic field edit.
4. **Canonical status contract (§10.1).** Only the status values declared in §10.1 (generic + module-declared intermediates) are ever stored. All external values are normalized at a single named boundary.
5. **Request identity across rejection (§11.5).** A rejected request can be edited and resubmitted on the same record. The request ID and reference number are preserved for the entire lifecycle. No copy-on-rejection, no soft-delete-and-recreate.
6. **Rejection Policy is form-level, not per-rejection (§11.1).** Rejection scope, field locking, and predefined rejection reasons are governed by the form's Rejection Policy. Rejectors operate within the policy and cannot override it per rejection.
7. **Published workflow and form immutability with instance pinning (§6.3).** Published workflow and form versions are both immutable. Running instances are pinned to the form version *and* workflow version that were active at submission time, and are never affected by later publishes or archives. Field reads and writes, the per-step field state matrix, the rejection policy, and the reference number format on a running instance all operate against the pinned form version, not the latest. Field history is keyed by `(formVersion, fieldKey)` so renames and removals in newer versions never break audit reads on older instances.
8. **SLA pause on hold; deadlines computed from events (§13.3).** The SLA clock pauses while a request is ON_HOLD. Pauses and resumes are stored as append-only events; deadlines are always computed from these events, never stored as mutable fields.
9. **Append-only audit trail (§17).** Actions, comments, field history, on-hold events, assignee snapshots, delegation chains, and outcome records cannot be edited or deleted. Administrative overrides are recorded as new audit entries that reference the entry they override; they never mutate the original.
10. **Assignee resolution snapshots (§17).** When a step activates, the system records *at that moment* which users resolved as assignees and via which strategy. This snapshot is immutable; the system never re-resolves assignment rules later to answer historical questions.
11. **Request link relational constraint (§6.4).** A required Request link cannot be blank; a parent-gated Request link cannot point at a final-state target. Enforced at the data layer, not the UI.
12. **Linked-request cascades (§6.4).** Close gates and cancel cascades on target forms are enforced by the transition function, not by application code. Cancel cascades fire unconditionally — including for linked requests in IN_PROGRESS — and run in the same atomic operation as the target's cancellation.
13. **No restart after cancellation.** A cancelled request cannot be restarted. A new request must be created.
14. **System-recorded timestamps.** Timestamps that the system generates automatically (implementation start times recorded by execution steps, audit entry timestamps, pause/resume events) cannot be manually edited.

These invariants apply to every form and every workflow. They are the floor under which nothing can go.

---

---

# PART TWO: CHANGE MANAGEMENT

---

## 23. Change Management

Change Management is **not a separate module** in this system. It is a set of four built-in forms (CR, AR, IR, CFR), three built-in workflows (Standard, Normal, Emergency), and supporting reference data (business calendars, maintenance windows, blackout periods, email templates, rejection policies, permissions) — all seeded on top of the generic Workflow Engine described in Part One.

Everything Change Management does — parent/child hierarchies, risk scoring, scheduling against maintenance windows, PIR, emergency parallel approvals, CAB notifications, auto-approval on SLA timeout — is expressed using the generic engine features already described in Part One: Request link fields (§6.4), Scored matrix fields (§5.3, §6.5), Schedule steps (§7.8), SLA escalations (§13.2), linked-request cascades (§6.4), conditional branches (§7.6), and module-declared intermediate statuses (§10.1).

### 23.1 Where the Built-in Configuration Lives

The exact contents of the built-in Change Management configuration — every form's fields, every workflow's steps and SLAs, every default setting, every seeded calendar, window, blackout, email template, rejection policy, role, and permission — live in the companion reference document [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md). That file is the source of truth for "what ships inside the box on day one." Read the PRD for what the engine does; read the seed file for what Change Management *is*.

### 23.2 Module-Declared Intermediate Statuses

Change Management declares the following intermediate statuses (§10.1), inserted between the generic engine statuses:

| Status | Sits Between | Meaning |
|---|---|---|
| APPROVED | IN_REVIEW → IN_PROGRESS | All approvals received; authorized to proceed |
| SCHEDULED | APPROVED → IN_PROGRESS | Implementation date and window assigned |
| FAILED | IN_PROGRESS → PENDING_REVIEW | Implementation encountered a problem |
| ROLLED_BACK | FAILED → CLOSED | Failed change has been reversed |
| PIR_PENDING | replaces PENDING_REVIEW | Awaiting Post-Implementation Review |

These intermediates are the only Change-Management-specific additions to the engine's canonical status contract. Everything else is configuration.

### 23.3 Module-Declared Outcomes

Change Management extends the generic outcome list (§10.2) with:

| Outcome | Meaning |
|---|---|
| ROLLED_BACK | Implementation failed and was fully reversed |
| PARTIALLY_ROLLED_BACK | Some components rolled back, others kept |
| DEFERRED | Approved but deliberately postponed to a future window |

### 23.4 Illustrative Lifecycle

The diagram below shows a representative path through a Normal or Emergency change — for orientation only. The actual sequence is defined by the built-in workflows in [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md) and is editable without a deployment.

```
DRAFT
  │  Submit
  ▼
SUBMITTED ──► workflow starts automatically
  │
  ▼
IN_REVIEW
  ├──► (workflow approved) ──────► APPROVED
  │                                   │  Schedule
  │                                   ▼
  │                              SCHEDULED
  │                                   │  Start Implementation
  │                                   ▼
  ├──────────────────────────────► IN_PROGRESS
  │                                   │
  │                                   ├──► Complete ──► PIR_PENDING
  │                                   │                      │  Submit PIR
  │                                   │                      ▼
  │                                   │                   CLOSED + Outcome
  │                                   │
  │                                   ├──► Fail ──────► FAILED
  │                                   │                    │  Execute Rollback
  │                                   │                    ▼
  │                                   │                ROLLED_BACK ──► CLOSED + Outcome
  │                                   │
  │                                   └──► [On Hold] ◄──────────────────────┐
  │                                              │  Resume                  │
  │                                              └──────────────────────────┘
  │
  └──► (workflow rejected) ──────► Edit & Resubmit ──► back to SUBMITTED
                                   (or)
                                   No resubmission ──► CANCELLED + Outcome: REJECTED

Any non-final state ──► CANCELLED + Outcome (WITHDRAWN / SUPERSEDED / ABANDONED / EXPIRED)
```

### 23.5 Evolution

As the Workflow Engine gains additional generic capabilities — richer computed and lookup fields, sub-request creation from a workflow step, populate-from-external-source, and similar features seen in the Gravity Flow ecosystem — more of this section will disappear into [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md), and the engine will support use cases well beyond Change Management: access requests, vendor onboarding, purchase approvals, HR onboarding, compliance reviews, and anything else any team at Barq wants to model.

---

---

# PART THREE: ACCESS AND ADMINISTRATION

---

## 24. Permissions

**Resource-scoped from day one.** Every permission check in the system is expressed as "does user X have permission P on resource R?" — never just "does user X have permission P?". Even when v1 uses only global role-based flags (where R is "any"), the check interface accepts a resource argument. This makes future form-scoped, service-scoped, or CI-scoped permissions an additive change rather than a rework of every call site.

### 24.1 Workflow Engine Permissions

These permissions apply to the generic engine and are not specific to any module.

| Permission | What It Allows |
|---|---|
| FORMS_VIEW | View form definitions and their field layouts |
| FORMS_MANAGE | Create, edit, publish, archive, and clone form definitions |
| WORKFLOW_DEFINITIONS_VIEW | View published workflow definitions and step graphs |
| WORKFLOW_DEFINITIONS_MANAGE | Create, edit, publish, archive, and clone workflow definitions |
| WORKFLOW_INSTANCES_VIEW | View any running or completed workflow instance and its audit trail |
| WORKFLOW_INSTANCES_MANAGE | Admin: force-advance steps, reassign tasks, cancel stuck instances |
| CALENDARS_VIEW | View business calendars, maintenance windows, and blackout periods |
| CALENDARS_MANAGE | Create, edit, and delete calendars, windows, and blackouts |
| EMAIL_TEMPLATES_VIEW | View email templates |
| EMAIL_TEMPLATES_MANAGE | Create, edit, and delete email templates |
| DELEGATIONS_MANAGE_OWN | Create and manage one's own delegations |
| DELEGATIONS_MANAGE_ANY | Admin: create or revoke any delegation |
| DASHBOARDS_VIEW | View configured dashboards for one's role |
| DASHBOARDS_MANAGE | Configure dashboard widgets and queries |

### 24.2 Module-Specific Permissions

Each module built on the engine declares its own permissions. Change Management's permissions (`CHANGES_VIEW`, `CHANGES_CREATE`, `CHANGES_APPROVE`, `CHANGES_IMPLEMENT`, etc.) and their default role mappings are defined in [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md). As more modules are added (access requests, vendor onboarding, etc.), each will declare its own permission set in the same pattern.

### 24.3 Default Role Assignments

The seed file defines the default role → permission mappings for the built-in roles (System Administrator, Change Manager, CAB Member, IT Staff, Viewer). See [`workflow-seed.md`](./02-seed-and-cm/workflow-seed.md) Section 10.

---

## 25. Out of Scope

The following are not included in this system:

- Integration with external ticketing systems (ServiceNow, Jira, etc.)
- Customer-facing change notifications
- Automated implementation (the system tracks work; humans perform it)
- Cost tracking or budget approval for changes
- SMS, WhatsApp, or Teams notification channels
- Mobile application
- Third-party API for external consumers
- AI-assisted risk scoring or change classification

### Data Retention

Data retention is **indefinite**. All request data, audit trail entries, field history, attachments, on-hold events, assignee snapshots, delegation chains, and outcome records are retained forever. There is no purge, archive, or deletion policy in v1. Any future retention policy will be a new feature, not a change to existing data.
