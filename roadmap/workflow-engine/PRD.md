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
| Section header | Visual grouping — not a data field |
| Computed field | Value calculated from other fields (read-only) |

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

When a published workflow is updated, the admin saves a new draft and publishes it. Requests already in progress continue on the version that was active when they were submitted. New submissions use the latest published version.

Built-in system workflows (Standard Change, Normal Change, Emergency Change) can be cloned and customized but not deleted.

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

The system performs an action automatically with no human involvement. Examples: calculate a risk score, generate a reference number, update a field value, trigger an external webhook, send a batch notification.

No assignee. Runs immediately when activated. On success or failure, routes to the configured next step.

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

---

## 8. Step Policy — Single and Parallel

Every step is configured with one of two execution policies:

**Single:** The step runs alone. The workflow waits for it to complete before moving on.

**Parallel:** The step runs at the same time as other consecutive parallel steps. When the workflow activates a parallel step, it continues activating all following parallel steps until it reaches the next Single step. The next Single step acts as a synchronization barrier — it waits for all preceding parallel steps to complete before it activates.

Example sequence:
```
Step 1 (Single) → Step 2 (Parallel) → Step 3 (Parallel) → Step 4 (Single)
```
Execution: Step 1 completes → Steps 2 and 3 activate simultaneously → Step 4 waits for both → Step 4 activates.

Parallel steps with an approval policy can be configured with: **Any** (first approver to decide advances the step) or **All** (every assignee must decide before the step advances).

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

**Outcome Notes** — a free-text field set alongside the outcome code. Required when outcome is anything other than SUCCESSFUL. Provides the human-language explanation of what happened. This is separate from the audit trail (which records mechanical facts) — outcome notes record the *narrative*.

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

For reporting, the combination unlocks precise queries without any text parsing:
- All changes that closed successfully this quarter
- All requests currently on hold waiting for a third party
- All emergency changes that ended in rollback in the last 6 months
- Average time-to-close by outcome type, by department, by form

---

## 11. Rejection and Resubmission Model

Rejection is not the end of a request. The system treats it as a correction cycle.

### What the Rejector Configures

When rejecting, the approver:
1. Writes a rejection reason (shown to the requestor)
2. Sets the **re-approval scope**: does the requestor need to collect prior approvals again, or can they resubmit and continue from this step?
   - **Full restart** — the workflow starts from the beginning; all prior approvals must be obtained again
   - **Resume from this step** — once the requestor edits and resubmits, the workflow returns to this approval step directly, skipping already-completed prior steps

### What the Requestor Does

After rejection:
1. Receives a notification with the reason
2. Opens the request, which is now editable
3. Makes changes (all fields unlocked per the form's default state, unless the workflow definition restricts certain fields)
4. Resubmits

### Outcome and Rejection

An intermediate rejection — one that the requestor responds to and resubmits — is a workflow event, not a final outcome. The outcome is only written when the request truly ends. If a request is rejected and the requestor never resubmits, the final status is CANCELLED and the outcome is REJECTED.

### Request Identity

The request is the same record throughout its entire lifecycle — submission, rejection, resubmission, re-rejection. Every version of every field value is preserved in history. The change number does not change. There is no concept of "request v2" — just a single request with a complete edit history.

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

Multiple strategies can be combined on a single step. All resolved users are co-assignees; the step's approval policy (Any or All) determines when it advances.

---

## 13. SLA System

SLA in this system has two independent parts: the business calendar and the escalation policy.

### 13.1 Business Calendar

Each step can be configured with a business calendar. The calendar defines which hours and days count toward SLA time. Non-business time is excluded from the elapsed time calculation — the SLA clock stops outside business hours and resumes when business hours begin.

A calendar specifies:
- Working days (e.g., Sunday–Thursday)
- Working hours (e.g., 08:00–17:00)
- Timezone
- Public holidays (optional list of excluded dates)

Multiple calendars can be defined (e.g., Riyadh standard, 24/7, custom department hours). Each step selects which calendar to use. Emergency change steps always use 24/7.

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

### 13.3 SLA Clock Pause Rules

The SLA clock pauses automatically in these situations:

| Situation | Clock Behavior |
|---|---|
| Request More Info action taken | Pauses until requestor responds |
| Request placed ON_HOLD | Pauses until request is resumed |
| Step waiting on a parallel branch | Not paused — each parallel branch has its own clock |

When the clock resumes, elapsed time before the pause is preserved. The deadline is recalculated from the point of resumption.

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

Attachments are stored centrally and linked to the request. They are accessible to anyone with view access to the request.

---

## 17. Audit Trail

Every action taken on a request is permanently recorded:

- Who took the action (or: system, if automated)
- What action was taken
- Which step it was on
- When (date and time, timezone)
- Any comment attached to the action
- Whether it was taken via the TechHub UI or via email token
- If via delegation: who the original assignee was and who acted on their behalf
- For On Hold events: who placed it on hold, the hold reason, who resumed it, and how long it was paused

Field-level history is also tracked:
- Which fields changed
- The value before and after each change
- Who made the change and when

The audit trail is append-only. Nothing can be edited or deleted from it. It is exportable.

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

---

# PART TWO: CHANGE MANAGEMENT

---

## 19. Overview

Change Management is the first module built on the Workflow Engine. It implements an ITIL-aligned process for managing all changes to Barq's IT environment — from initial request through approval, implementation, and formal closure.

It is tightly coupled to the Workflow Engine. The engine provides the step execution, approvals, SLA, and audit trail. Change Management provides the domain model: the request types, classification rules, risk assessment, maintenance windows, and business rules that govern IT changes specifically.

---

## 20. Request Types

There are seven types of IT change requests. Each has a distinct purpose and different rules.

| Code | Full Name | Purpose | Requires Parent CR? |
|---|---|---|---|
| CR | Change Request | Parent container for a coordinated release | No — it is the parent |
| AR | Application Release | Software or application deployment | Yes |
| IR | Infrastructure Release | Infrastructure or network change | Yes |
| CFR | Config/Firewall Release | Configuration or firewall rule change | Yes |
| ACCESS | Access Request | User access provisioning or revocation | No |
| FIREWALL | Firewall Request | Standalone firewall rule | No |
| OTHER | Other Request | Any IT request that doesn't fit above | No |

### The CR Hierarchy

A Change Request (CR) groups related sub-requests into a coordinated release. AR, IR, and CFR requests must be linked to a parent CR before they can be submitted.

```
Change Request (CR)            ← parent, created first
  ├── Application Release (AR)
  ├── Infrastructure Release (IR)
  └── Config/Firewall Release (CFR)
```

Rules:
- AR, IR, and CFR cannot be submitted without a parent CR
- The parent CR cannot be closed while any child request is in a non-final state
- Each sub-request has its own independent workflow and approval process
- The parent CR detail view shows the current status of all children at a glance

---

## 21. Change Classification

Every request is classified by change type. This determines which workflow runs and what rules apply.

### Standard Change
Pre-approved, low-risk, routine work. The system approves it automatically — no human review. Examples: scheduled patches, pre-approved routine maintenance.

### Normal Change
Planned, non-urgent work requiring human review. Goes through risk assessment, then Change Manager approval. Examples: new deployments, infrastructure upgrades, database changes.

### Emergency Change
Urgent work to resolve or prevent a major incident. Bypasses normal scheduling rules. Goes through a fast parallel approval process. Examples: production hotfix, emergency security patch.

---

## 22. Full Status Lifecycle

The diagram below shows the complete lifecycle of a change request. Generic engine statuses are shown in **bold**. Change Management-specific intermediate statuses are shown in *italics*.

```
DRAFT
  │  Submit
  ▼
SUBMITTED ──► workflow starts automatically
  │
  ▼
IN_REVIEW
  ├──► (workflow approved) ──────► *APPROVED*
  │                                   │  Schedule
  │                                   ▼
  │                              *SCHEDULED*
  │                                   │  Start Implementation
  │                                   ▼
  ├──────────────────────────────► IN_PROGRESS
  │                                   │
  │                                   ├──► Complete ──► *PIR_PENDING* (Normal/Emergency)
  │                                   │                      │  Submit PIR
  │                                   │                      ▼
  │                                   │                   CLOSED + Outcome
  │                                   │
  │                                   ├──► Complete ──► CLOSED + Outcome  (Standard)
  │                                   │
  │                                   ├──► Fail ──────► *FAILED*
  │                                   │                    │  Execute Rollback
  │                                   │                    ▼
  │                                   │                *ROLLED_BACK* ──► CLOSED + Outcome
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

### Status Reference

| Status | Generic or CM-Specific | Meaning |
|---|---|---|
| DRAFT | Generic | Being filled out; not yet submitted |
| SUBMITTED | Generic | Submitted; workflow starting |
| IN_REVIEW | Generic | Approval workflow is running |
| ON_HOLD | Generic | Paused; waiting for something external |
| APPROVED | CM-Specific | All approvals received; authorized to proceed |
| SCHEDULED | CM-Specific | Implementation date and window assigned |
| IN_PROGRESS | Generic | Implementation underway |
| FAILED | CM-Specific | Implementation encountered a problem |
| ROLLED_BACK | CM-Specific | Failed change has been reversed |
| PIR_PENDING | CM-Specific | Awaiting Post-Implementation Review |
| CLOSED | Generic | Fully complete; no further action |
| CANCELLED | Generic | Stopped before completion; permanent |

### Outcome Reference — Change Management

Outcome is set when a change reaches CLOSED or CANCELLED. Valid outcomes for Change Management:

| Outcome | When Set |
|---|---|
| SUCCESSFUL | Change implemented as planned |
| SUCCESSFUL_WITH_ISSUES | Implemented with deviations or minor problems |
| ROLLED_BACK | Implementation failed and was fully reversed |
| PARTIALLY_ROLLED_BACK | Some components rolled back, others kept |
| DEFERRED | Approved but postponed to a future window |
| UNSUCCESSFUL | Completed but did not achieve intended result |
| WITHDRAWN | Requestor cancelled before completion |
| REJECTED | Approver rejected; requestor did not resubmit |
| SUPERSEDED | Replaced by another change request |
| ABANDONED | Went stale; no activity for too long |
| EXPIRED | Auto-closed by system policy |

For Normal and Emergency changes, the PIR outcome (Successful / Partial / Failed / Rolled Back) automatically populates the change's outcome field when the PIR is submitted. The Change Manager can override it before final closure.

---

## 23. The Change Request Form

### Creation Wizard — Steps

**Step 1 — What kind of request?**
- Select request type (CR / AR / IR / CFR / ACCESS / FIREWALL / OTHER) — shown as icon cards
- Select change type (STANDARD / NORMAL / EMERGENCY) — shown only for CR, AR, IR, CFR
- If request type is AR, IR, or CFR: required parent CR picker (typeahead search of open CRs)

**Step 2 — Details**
- Title and description
- Priority (LOW / MEDIUM / HIGH / CRITICAL)
- Justification
- Test plan (required for most types)
- Rollback plan (required for most types)
- Implementation plan

**Step 3 — Scope and Impact**
- Affected Configuration Items: multi-select from CMDB; each selected CI requires an impact description
- Affected Services: multi-select from the Services catalog; each selected service requires an impact description

**Step 4 — Review and Submit**
- Full summary of all entered fields
- Validation errors shown here before submission
- Submit triggers workflow start

### Auto-Save

The form saves automatically at every step navigation. If the requestor closes the browser mid-way, their progress is preserved. Returning to the form resumes exactly where they left off.

---

## 24. Risk Assessment

### Scoring

For Normal changes, the Change Manager fills in a risk assessment:
- **Likelihood** — How likely is something to go wrong? (1 = very unlikely → 5 = near certain)
- **Impact** — If something goes wrong, how severe? (1 = minimal → 5 = catastrophic)
- **Risk Score** = Likelihood × Impact (range: 1–25)

### Risk Levels and System Response

| Score | Level | What the System Does |
|---|---|---|
| 1–5 | Low | No action |
| 6–10 | Medium | No action |
| 11–15 | High | Warning shown to the approver on the approval step |
| 16–20 | Very High | System suggests converting to an Emergency change |
| 21–25 | Critical | Workflow pauses; Change Manager must explicitly acknowledge before proceeding |

The risk score, level, assessor name, and notes are shown on the change detail page as a 5×5 visual grid.

---

## 25. SLA by Change Type

Each change type has a default SLA configuration. These use the SLA system defined in Part One.

| Change Type | Total SLA | Calendar | SLA Model |
|---|---|---|---|
| Standard | N/A | N/A | Auto-approved instantly; no SLA |
| Normal | 5 business days | Saudi standard (Sun–Thu, 08:00–17:00 AST) | Per-step sub-SLAs; escalates to manager on breach |
| Emergency | 8 calendar hours | 24/7 | Tight per-step SLAs; auto-approves at timeout |

### Normal Change — Step SLAs
- Risk Assessment step: 48 business hours
- Change Manager Approval step: 48 business hours; adds manager as co-assignee at 48h breach

### Emergency Change — Step SLAs
- Each parallel approval step: 4 calendar hours
- Auto-approve (each step): at 6 calendar hours if no response

### On Hold and SLA
Placing a change ON_HOLD pauses the SLA clock regardless of hold reason. The clock resumes when the change is taken off hold. Time spent on hold is excluded from SLA calculations and is reported separately.

---

## 26. Scheduling

### Maintenance Windows

Maintenance windows are time slots pre-defined by the Change Manager during which Normal changes are permitted. Windows are recurring and configurable.

A window defines: name, recurrence (weekly / biweekly / monthly / custom), day, start time, end time, timezone, effective date range, and active/inactive status.

### Blackout Periods

Blackout periods are date ranges during which Normal changes cannot be scheduled. Examples: Ramadan freeze, year-end freeze, major go-live periods. Each blackout has a name, reason, start, end, and an active toggle.

### Scheduling Rules by Change Type

| Change Type | Maintenance Window | Blackout Periods |
|---|---|---|
| Standard | Not required | Ignored |
| Normal | Required — must schedule within an active window | Blocks scheduling |
| Emergency | Not required | Warning shown; does not block |

### Scheduling Calendar

A monthly calendar view shows all scheduled changes on their planned dates, maintenance windows highlighted in green, and blackout periods shown in red. Click a change to see a summary and link to its detail page.

---

## 27. Implementation

**Starting:** The implementor marks the change as In Progress. The system records the exact start time automatically.

**During:** Implementation notes can be added at any time while the change is in progress. Notes are visible to all users with access.

**Completing:** The implementor marks the change as either:
- **Completed** — everything went as planned
- **Failed** — something went wrong; the implementor documents what happened

**Rollback:** If failed, the implementor can execute a rollback. The system records the rollback time and captures rollback notes.

---

## 28. Post-Implementation Review (PIR)

PIR is mandatory for Normal and Emergency changes before closure. Standard changes close directly without a PIR.

### PIR Fields

| Field | Notes |
|---|---|
| Outcome | SUCCESSFUL / PARTIAL / FAILED / ROLLED_BACK |
| What actually happened | Compared to what was planned |
| Planned vs. actual notes | Where reality differed from the plan |
| Lessons learned | What to do differently next time |
| Follow-up actions | Remaining tasks with named owners |
| Customer impact | Yes / No |
| Customer impact description | Required if customer impact = Yes |

### PIR Outcome → Request Outcome

When the PIR is submitted, its outcome field automatically sets the change request's Outcome field:
- PIR: Successful → Request Outcome: SUCCESSFUL
- PIR: Partial → Request Outcome: SUCCESSFUL_WITH_ISSUES
- PIR: Failed → Request Outcome: UNSUCCESSFUL
- PIR: Rolled Back → Request Outcome: ROLLED_BACK

The Change Manager can override the auto-populated outcome before final closure. The override is recorded in the audit trail.

### PIR Reminders

The system automatically sends reminders to the implementor (assignedTo):

| Time After Completion | Action |
|---|---|
| 24 hours | First reminder to implementor |
| 72 hours | Reminder escalated to include implementor's manager |
| 7 days | Escalated to the Change Manager role |

---

## 29. Emergency Change Process

Emergency changes are designed to move from submission to approval in under 8 hours without sacrificing accountability.

**On submission:** CAB members, CI owners, and the Change Manager are notified immediately.

**Parallel approval:** Two approval steps run simultaneously:
1. A CAB member (any member of the cab-member role)
2. The CI owner of the primary affected CI

Both must approve. If either rejects, the change is rejected. If either fails to respond within 6 hours, the system auto-approves on their behalf and records it as a timed-out auto-approval.

**No maintenance window required.** A warning is shown if scheduled during a blackout period, but scheduling is not blocked.

---

## 30. Delegation

An approver going on leave can delegate their approval authority to a colleague.

A delegation specifies: who is delegating, who receives authority, the active date range, and an optional reason.

While active:
- The delegatee can take approval actions on the delegator's assigned steps
- The audit trail records the decision as: "Action by [delegatee] on behalf of [delegator] (delegation active)"

When the delegation expires, it has no further effect. The delegator's access returns to normal automatically.

---

## 31. Dashboard

The Change Management dashboard gives the Change Manager and senior leadership a live operational view.

**Widgets:**
- **Pipeline funnel** — count of changes in each status (DRAFT → CLOSED), clickable to filtered list
- **Outcome breakdown** — for CLOSED changes in the last 30 days: SUCCESSFUL / SUCCESSFUL_WITH_ISSUES / ROLLED_BACK / UNSUCCESSFUL counts; clickable to filtered list
- **My pending approvals** — changes waiting for my action, with SLA countdown per item
- **Currently on hold** — changes in ON_HOLD status grouped by hold reason; includes time-on-hold
- **SLA health** — on-track / at-risk / breached counts for the last 30 days
- **Change volume** — bar chart of monthly change counts for the last 12 months
- **Type breakdown** — donut chart of CR / AR / IR / CFR / OTHER proportions
- **CAB queue** — Emergency changes currently awaiting parallel approval
- **Recent failures** — changes closed with outcome ROLLED_BACK or UNSUCCESSFUL in the last 30 days
- **Upcoming scheduled** — changes scheduled in the next 7 days with their maintenance window

---

## 32. Change List View

The main list of change requests. Filterable by:

- Status, outcome, hold reason, change type, request type, priority, assigned to, date range
- "My changes" toggle — only requests I created
- "My approvals" toggle — only requests where I have a pending action
- "On hold" toggle — only requests currently in ON_HOLD status

Sortable columns: change number, title, type badges, status badge, outcome badge (shown for closed/cancelled rows), priority, requestor, assignee, scheduled date, SLA indicator, current workflow step.

The list is exportable to Excel. A badge in the sidebar shows the count of requests awaiting my approval, the count of SLA breaches, and the count of requests currently on hold.

---

## 33. Change Detail View

Two-column layout.

**Left — the request itself:**
- Header: change number, title, type badges, status badge, outcome badge (when closed/cancelled), hold reason badge (when on hold), SLA ribbon (green / amber / red)
- Description and justification
- Test plan, rollback plan, implementation plan (collapsible)
- Affected CIs panel
- Affected Services panel
- Implementation notes (editable while IN_PROGRESS)
- PIR form (visible when PIR_PENDING)
- General comment thread

**Right — the process:**
- Workflow timeline (see Section 34)
- Action panel (visible only to users with a pending task on the active step)
- Risk matrix (if risk assessed)
- Scheduling block (if APPROVED or SCHEDULED)
- People: requestor, assignee, risk assessor, closer

**Actions bar** — contextual, shown based on status and permissions:
Submit · Schedule · Start Implementation · Complete · Fail · Rollback · Submit PIR · Put On Hold · Resume · Close · Cancel

---

## 34. Workflow Timeline

The timeline is the full story of the request from submission to current state. Visible to all users with view access.

For each step, the timeline shows:
- Step name and type
- Status (pending / active / completed / skipped / failed)
- Assigned users (with their individual decision status for multi-assignee steps)
- For completed steps: who acted, what they decided, their comment, and the timestamp
- For parallel steps: both branches shown simultaneously with their individual statuses
- SLA bar: time elapsed vs. deadline, color-coded

On Hold events appear as timeline entries between steps — showing when the hold was placed, by whom, the reason, when it was resumed, and how long the request was paused.

---

## 35. Change Number Format

Every request gets a unique reference number generated automatically at creation:

| Type | Format | Example |
|---|---|---|
| CR | CR-YYYYMMDD-NNNNN | CR-20260414-00042 |
| AR | AR-YYYYMMDD-NNNNN | AR-20260414-00001 |
| IR | IR-YYYYMMDD-NNNNN | IR-20260414-00003 |
| CFR | CFR-YYYYMMDD-NNNNN | CFR-20260414-00001 |
| ACCESS | ACC-YYYYMMDD-NNNNN | ACC-20260414-00007 |
| FIREWALL | FW-YYYYMMDD-NNNNN | FW-20260414-00002 |
| OTHER | OTH-YYYYMMDD-NNNNN | OTH-20260414-00001 |

Counter is per type per day, padded to 5 digits.

---

## 36. Business Rules — Change Management

These are enforced unconditionally by the system. No user action can bypass them.

1. AR, IR, and CFR requests cannot be submitted without a linked parent CR.
2. A parent CR cannot be closed while any child request is in a non-final state.
3. A Normal change cannot be scheduled during a blackout period.
4. A Normal change must be scheduled within an active maintenance window.
5. Emergency changes bypass maintenance window requirements; a warning is shown if during a blackout.
6. Standard changes are auto-approved. No human approver can be added to a Standard change workflow.
7. Normal and Emergency changes require a completed PIR before closure.
8. A change with a Critical risk score (21–25) is held at an acknowledgement gate until the Change Manager explicitly confirms awareness.
9. A cancelled change cannot be restarted. A new request must be created.
10. The implementation start time is recorded automatically by the system. It cannot be manually edited.
11. The audit trail is append-only. Actions, comments, field history, on-hold events, and outcome records cannot be edited or deleted.
12. A rejected change can be edited and resubmitted by the requestor on the same request record.
13. The rejector determines whether prior approvals need to be re-collected on resubmission.
14. An Outcome must be selected before a request can be closed or cancelled.
15. Outcome Notes are required when the outcome is anything other than SUCCESSFUL.
16. Placing a request ON_HOLD requires a Hold Reason. No request can be put on hold without one.
17. The SLA clock pauses while a request is ON_HOLD and resumes from the same point when the hold is lifted.

---

---

# PART THREE: ACCESS AND ADMINISTRATION

---

## 37. Permissions

### Workflow Engine Permissions

| Permission | What It Allows |
|---|---|
| WORKFLOW_DEFINITIONS_VIEW | View published workflow definitions and step graphs |
| WORKFLOW_DEFINITIONS_MANAGE | Create, edit, publish, archive, and clone workflow definitions |
| WORKFLOW_INSTANCES_VIEW | View any running or completed workflow instance and its audit trail |
| WORKFLOW_INSTANCES_MANAGE | Admin: force-advance steps, reassign tasks, cancel stuck instances |

### Change Management Permissions

| Permission | What It Allows |
|---|---|
| CHANGES_VIEW | View change requests, detail, timeline |
| CHANGES_CREATE | Create new change requests |
| CHANGES_UPDATE | Edit a request in DRAFT or SUBMITTED status |
| CHANGES_DELETE | Delete a request in DRAFT status only |
| CHANGES_SUBMIT | Submit a request to start the workflow |
| CHANGES_ASSESS_RISK | Fill in or update the risk assessment |
| CHANGES_APPROVE | Approve, reject, or request more info on a workflow step |
| CHANGES_SCHEDULE | Set scheduled start/end date and maintenance window |
| CHANGES_IMPLEMENT | Mark implementation as started, completed, failed, or rolled back |
| CHANGES_HOLD | Place a change on hold or resume it |
| CHANGES_CLOSE | Close a change (requires selecting an outcome) |
| CHANGES_CANCEL | Cancel a change in any non-final state |
| CHANGES_PIR_CREATE | Submit a PIR |
| CHANGES_PIR_VIEW | View PIR records |
| CHANGES_MANAGE | Admin: reassign steps, override decisions, force state transitions, override outcome |
| CHANGES_DASHBOARD | Access the executive dashboard |
| MAINTENANCE_WINDOWS_VIEW | View maintenance windows and blackout periods |
| MAINTENANCE_WINDOWS_MANAGE | Create, edit, and delete maintenance windows and blackouts |

### Default Role Assignments

| Role | Permissions |
|---|---|
| System Administrator | All permissions |
| Change Manager | All CHANGES_* + MAINTENANCE_WINDOWS_MANAGE + WORKFLOW_INSTANCES_VIEW |
| CAB Member | CHANGES_VIEW + CHANGES_APPROVE + CHANGES_DASHBOARD |
| IT Staff | CHANGES_VIEW + CHANGES_CREATE + CHANGES_SUBMIT + CHANGES_IMPLEMENT + CHANGES_HOLD + CHANGES_PIR_CREATE + CHANGES_PIR_VIEW + CHANGES_CANCEL + MAINTENANCE_WINDOWS_VIEW |
| Viewer | CHANGES_VIEW + CHANGES_PIR_VIEW + MAINTENANCE_WINDOWS_VIEW |

---

## 38. Notifications Reference — Change Management

| Event | Recipients |
|---|---|
| Request submitted | Requestor |
| Approval step assigned | Each assignee |
| Approved | Requestor + assignee |
| Rejected | Requestor (with reason) |
| More info requested | Requestor |
| Info provided by requestor | Step assignees |
| Scheduled | Requestor + assignee |
| Implementation started | Requestor + CI owners |
| Completed | Requestor + approvers |
| Failed | Requestor + assignee + approvers |
| Request placed on hold | Requestor + step assignees (with hold reason) |
| Request resumed from hold | Requestor + step assignees |
| SLA warning | Step assignees |
| SLA breach | Step assignees + their manager |
| PIR reminder (24h) | Assignee (implementor) |
| PIR escalation (72h) | Assignee + their manager |
| PIR escalation (7 days) | Assignee + Change Manager role |
| Closed | Requestor (with outcome) |
| Emergency submitted | All CAB members + all CI owners + Change Manager |
| Emergency approved | Requestor + assignee + service owners |

---

## 39. Out of Scope

The following are not included in this system:

- Integration with external ticketing systems (ServiceNow, Jira, etc.)
- Customer-facing change notifications
- Automated implementation (the system tracks work; humans perform it)
- Cost tracking or budget approval for changes
- SMS, WhatsApp, or Teams notification channels
- Mobile application
- Third-party API for external consumers
- AI-assisted risk scoring or change classification
