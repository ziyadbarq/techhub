# Product Requirements Document
## Workflow Engine & Change Management
**TechHub — Internal IT Platform**
**Status:** Draft · For internal use only

---

## 1. Purpose

This document describes what the Workflow Engine and Change Management module must do — the features, the rules, and the expected behavior from the perspective of every person who will use it. It does not describe how any of it is built.

The goal is to have a single reference that answers: *"What does this system do, and how should it behave in every situation?"*

---

## 2. Background

Barq's IT team today handles change requests through a mix of email threads, spreadsheets, and manual approvals. There is no audit trail, no consistent process, and no visibility into where a request is in its lifecycle. This creates risk: changes go to production without proper approval, approvers are not notified, and post-mortems are never written.

This module introduces an ITIL-aligned change management process with a native approval workflow engine built directly into TechHub. Every change request goes through a defined, trackable, auditable process from creation to closure.

---

## 3. Goals

1. Every change to Barq's IT environment is logged, tracked, and approved before it goes live.
2. Approvers always know what needs their attention and by when.
3. The full history of every decision — who approved, who rejected, what they said, when — is permanently visible.
4. The process is enforced by the system, not by people remembering to follow it.
5. Emergency changes can move fast (hours, not days) without sacrificing accountability.
6. The workflow logic itself is configurable by admins without requiring a software deployment.

---

## 4. Who Uses This

### Requestor (IT Staff)
Any employee who needs to make a change to an IT system, deploy software, modify infrastructure, or request access. They create change requests, track their status, and carry out the actual implementation work.

### Change Manager
The person or team responsible for the change process. They review risks, approve or reject change requests, manage the scheduling calendar, and handle escalations. They have the highest operational authority in the system.

### CAB Member (Change Advisory Board)
A designated group of senior reviewers who approve Emergency changes. They are notified immediately when an emergency request is submitted and must respond within tight deadlines.

### CI Owner
A person designated as the owner of one or more Configuration Items (servers, applications, network devices, etc.). They are included in the approval of any change that touches their CI.

### Service Owner
A person responsible for a business service. They are notified when a change affects their service.

### Viewer
Read-only access. Can see change requests, their status, and the full workflow history but cannot take any action.

### System Administrator
Full access to everything including workflow configuration, role assignments, and admin overrides.

---

## 5. Change Request Types

There are seven types of requests in this system. Each has a different purpose and different rules.

### 5.1 Type Overview

| Type | Short Code | Purpose | Needs a Parent CR? |
|---|---|---|---|
| Change Request | CR | A coordinated release that contains multiple sub-requests | No — it is the parent |
| Application Release | AR | A software or application deployment | Yes — must link to a CR |
| Infrastructure Release | IR | An infrastructure or network change | Yes — must link to a CR |
| Config/Firewall Release | CFR | A configuration or firewall rule change | Yes — must link to a CR |
| Access Request | ACCESS | Granting or revoking user access | No |
| Firewall Request | FIREWALL | A standalone firewall rule change | No |
| Other Request | OTHER | Anything that doesn't fit the above | No |

### 5.2 The CR Hierarchy

A Change Request (CR) acts as the parent container for a coordinated release. It cannot do work on its own — its purpose is to group related sub-requests together so they can be tracked as a unit.

- An Application Release, Infrastructure Release, or Config/Firewall Release must always be linked to a parent CR before it can be submitted.
- The parent CR cannot be closed until every sub-request under it has reached a final state (approved and closed, rejected, or cancelled).
- The CR detail view shows the current status of all its sub-requests at a glance.
- Each sub-request has its own independent approval process.

---

## 6. Change Classification

Every request is classified by **change type**, which determines how urgently it moves and how many approvals it needs.

### Standard Change
A pre-approved, low-risk, routine change. The system approves it automatically — no human review needed. Examples: scheduled nightly backups, pre-approved software patches, routine certificate renewals.

### Normal Change
A planned, non-urgent change that needs human review. It goes through a risk assessment, then a single Change Manager approval. Examples: new software deployments, infrastructure upgrades, database schema changes.

### Emergency Change
An urgent change needed to resolve or prevent a major incident. It bypasses the normal scheduling rules and goes through a fast parallel approval process. Examples: hotfix for a production outage, emergency security patch.

---

## 7. The Full Lifecycle of a Change Request

A change request moves through a fixed set of stages. Each stage has a clear meaning and clear rules for what can happen next.

```
DRAFT → SUBMITTED → IN WORKFLOW → APPROVED → SCHEDULED → IN PROGRESS → COMPLETED → CLOSED
                                           ↘ REJECTED                  ↘ FAILED → ROLLED BACK → CLOSED
                                                                                                ↗
                                                               (NORMAL/EMERGENCY) → PIR PENDING → CLOSED

Any non-final stage → CANCELLED
```

### DRAFT
The requestor is filling out the form. The request is not yet visible to anyone else. It is saved automatically so it can be resumed later.

### SUBMITTED
The requestor has finished the form and clicked Submit. The system begins processing the request and starts the appropriate approval workflow automatically.

### IN WORKFLOW
The approval process is running. The change is moving through review steps. The requestor can watch its progress in real time.

### APPROVED
All required approvals have been received. The change is authorized to proceed to implementation.

### REJECTED
One or more approvers rejected the request. This is a final state — a rejected change cannot be re-submitted. A new request must be created.

### SCHEDULED
The change has been given a specific date and time for implementation, and (for Normal changes) a maintenance window has been assigned.

### IN PROGRESS
Implementation has begun. The requestor is actively making the change.

### COMPLETED
Implementation finished successfully.

### FAILED
Something went wrong during implementation. The team must decide whether to roll back.

### ROLLED BACK
The change failed and was reversed. The system is back to its state before the change.

### PIR PENDING
The change is complete (or rolled back) but requires a Post-Implementation Review before it can be formally closed. Applies to Normal and Emergency changes only.

### CLOSED
The change is fully done. No further action can be taken.

### CANCELLED
The change was stopped before reaching a final state. This is a final state — a cancelled change cannot be restarted.

---

## 8. The Approval Workflow

### 8.1 How Workflows Are Selected

When a request is submitted, the system automatically selects the right approval process based on the change type:
- Standard → instant auto-approval, no humans involved
- Normal → risk assessment, then a Change Manager reviews and approves
- Emergency → simultaneous approval from a CAB member and the CI owner

Admins can define custom workflows for specific situations. A workflow is just a sequence of steps — each step is a task that someone must complete before the next one begins.

### 8.2 Step Types

**Approval step:** A person (or group of people) must decide: Approve, Reject, or Request More Information.

**Input step:** A person must fill in a form. For example: the risk assessment form asking the Change Manager to rate likelihood and impact.

**Parallel step:** Multiple approval tasks run at the same time. The workflow waits for all (or a defined number) to complete before moving on.

**Notification step:** The system sends a message to relevant people. No action required.

**Branch step:** The workflow takes different paths based on information already collected. For example: if the risk score is high, route to an extra review; otherwise, go straight to approval.

**Automation step:** The system performs a task automatically without human involvement. For example: calculating the risk score after the assessor fills in the form.

**Delay step:** The workflow pauses for a set amount of time before continuing.

**Escalation step:** If an approval step is not completed within a deadline, the system automatically adds the approver's manager to the task.

### 8.3 Who Gets Assigned

Approval steps are assigned to people based on rules, not hard-coded names. The system figures out at runtime who the right people are. Assignment methods include:

- **A specific role** — all Change Managers, all CAB members
- **The person who created the request**
- **The CI owner** of the affected configuration items
- **The service owner** of the affected services
- **The manager of the requestor**
- **Round-robin** across a group — distribute workload evenly
- **Least busy** — assign to whoever has the fewest pending tasks

### 8.4 What Approvers Can Do

On an active approval step, the approver can:

- **Approve** — confirms the change can proceed
- **Reject** — stops the change; the requestor is notified with the reason
- **Request More Information** — pauses the workflow clock and sends a question to the requestor; the clock resumes when the requestor responds

### 8.5 Delegation

An approver going on leave can delegate their approval authority to a colleague for a specific date range. While the delegation is active, the colleague can take approval actions on their behalf. The audit trail records who made the decision and notes that it was via delegation.

### 8.6 Audit Trail

Every single action taken on every step is permanently recorded:
- Who took the action
- What they decided
- When
- Any comment they added
- Whether it was a manual action or an automated system action

This record cannot be edited or deleted.

---

## 9. Risk Assessment

### 9.1 How Risk Is Scored

For Normal changes, the Change Manager fills in two values:
- **Likelihood** — How likely is this change to cause a problem? (1 = very unlikely, 5 = almost certain)
- **Impact** — If something goes wrong, how severe would the damage be? (1 = minimal, 5 = catastrophic)

Risk Score = Likelihood × Impact (range: 1–25)

### 9.2 What Happens at Each Risk Level

| Score | Level | What the System Does |
|---|---|---|
| 1–5 | Low | No special action |
| 6–10 | Medium | No special action |
| 11–15 | High | Warning banner shown to the approver |
| 16–20 | Very High | System suggests converting to an Emergency change for faster parallel review |
| 21–25 | Critical | The workflow pauses. The Change Manager must explicitly acknowledge the risk before the normal approval step can proceed |

### 9.3 Where Risk Is Shown

The risk score, level, and the assessor's notes are shown on the change detail page. A visual 5×5 grid highlights the current position.

---

## 10. SLA — Time Limits on Approvals

Every approval step has a deadline. If the approver does not act before the deadline, the system escalates.

### 10.1 SLA Behavior

1. The clock starts when the approval task is assigned.
2. The clock **pauses** if the approver requests more information and **resumes** when the requestor responds.
3. When the deadline is approaching, the approver receives a warning notification.
4. When the deadline passes, the system escalates: it adds the approver's manager to the task as an additional approver.
5. If a step is configured with an auto-decision, the system takes that action automatically at a second deadline (e.g., auto-approve an Emergency change if no CAB member responds within 6 hours).

### 10.2 Business Hours

SLA clocks can be configured to count only business hours (Sunday–Thursday, 08:00–17:00 Riyadh time) or to count 24/7. Emergency changes always use 24/7 time.

### 10.3 SLA for Each Change Type

- **Standard:** No SLA (instant auto-approval)
- **Normal:** 5 business days total; individual steps have their own sub-deadlines
- **Emergency:** 8 calendar hours total; individual steps have 4-hour deadlines

---

## 11. Scheduling

### 11.1 What Scheduling Means

After a Normal or Emergency change is approved, the implementor must pick a date and time to perform the work. This is the scheduled implementation window.

### 11.2 Maintenance Windows

Maintenance windows are pre-defined time slots during which IT changes are permitted. The IT team defines these in advance (e.g., every Tuesday night from 10 PM to 4 AM, every Saturday).

**Rules by change type:**

| Change Type | Maintenance Window Required? | Blackout Periods |
|---|---|---|
| Standard | No | Ignored |
| Normal | Yes — must be scheduled within an active window | Cannot schedule during a blackout |
| Emergency | No | A warning is shown but scheduling is not blocked |

### 11.3 Blackout Periods

Certain times of year are designated as change freezes — no Normal changes can be scheduled during these periods. Examples: the Ramadan freeze, year-end, or the days before a major system go-live. The Change Manager creates and manages blackout periods.

### 11.4 The Scheduling Calendar

A calendar view shows all scheduled changes on their planned dates. It also shows when maintenance windows are open (highlighted in green) and when blackout periods are active (shown in red). This gives the team a clear picture of what is changing when.

---

## 12. Implementation

### 12.1 Starting Work

When it is time to perform the change, the implementor marks it as "In Progress." The system records the exact time work began.

### 12.2 During Implementation

The implementor can add notes as they go. These notes are saved to the change record and are visible to everyone with access.

### 12.3 Finishing Work

When the implementor is done, they mark the change as either:
- **Completed** — everything went as planned
- **Failed** — something went wrong

### 12.4 When It Fails

If a change fails, the implementor documents what went wrong. They then have the option to:
- **Execute a rollback** — reverse the change and restore the system to its previous state. The system records the time the rollback was performed and any notes.

---

## 13. Post-Implementation Review (PIR)

### 13.1 When a PIR Is Required

A PIR is mandatory for every Normal and Emergency change before it can be closed. Standard changes go straight to Closed with no PIR needed.

### 13.2 What the PIR Captures

The implementor fills in:

- **Outcome** — Did the change succeed fully, partially, fail, or was it rolled back?
- **What actually happened** — Description of the actual impact, compared to what was planned
- **Planned vs. actual notes** — Where did the reality differ from the plan?
- **Lessons learned** — What would be done differently next time?
- **Follow-up actions** — Any remaining tasks, with owners
- **Customer impact** — Yes or No: did end users experience any disruption?
- **Customer impact description** — If yes, describe what happened (required when customer impact is Yes)

### 13.3 PIR Reminders

The system automatically reminds the implementor to complete the PIR:
- 24 hours after the change completed: first reminder to the implementor
- 72 hours: reminder escalated to include the implementor's manager
- 7 days: escalated to the Change Manager role

### 13.4 Closing After PIR

Once the PIR is submitted, the change can be formally closed.

---

## 14. Emergency Changes — Special Rules

Emergency changes are designed to move as fast as possible while still maintaining accountability.

- Two approvals run simultaneously: one from a CAB member and one from the CI owner. Both must approve.
- If either approver does not respond within 6 hours, the system auto-approves on their behalf and records it as a timed-out auto-approval.
- Emergency changes do not require a maintenance window, but a warning is shown if they are scheduled during a blackout period.
- The total process is designed to complete within 8 hours from submission to approval.
- CAB members are alerted by notification the moment an emergency request is submitted.

---

## 15. The Change Request Form

### 15.1 Creating a Request

The form is a step-by-step wizard:

**Step 1 — What kind of request is this?**
The requestor picks the request type and change type. If the type is AR, IR, or CFR, they must search for and link a parent CR before proceeding.

**Step 2 — Details**
The requestor fills in: title, description, justification for the change, and (where required by the change type) a test plan, rollback plan, and implementation plan.

**Step 3 — What does this change affect?**
The requestor selects:
- Which configuration items (servers, databases, devices, etc.) are affected, and for each one, a brief description of what the change does to it
- Which business services are affected, and for each one, a brief description of the impact

**Step 4 — Review and Submit**
A summary of everything entered. If anything is missing or invalid, the errors are shown here. The requestor clicks Submit to start the workflow.

### 15.2 Auto-Save

The form saves automatically at every step. If the requestor closes the browser or loses connection, their progress is not lost. They can return and pick up where they left off.

---

## 16. The Change List

The main page shows all change requests the user has access to see. It can be filtered by:
- Status
- Change type (Standard, Normal, Emergency)
- Request type (CR, AR, IR, etc.)
- Priority
- Assigned to
- Date range
- "My changes" — show only requests I created
- "My approvals" — show only requests awaiting my action

The list can be exported to Excel.

Alongside the list, a count shows how many requests are currently waiting for my approval action and how many changes have breached their SLA.

---

## 17. The Change Detail Page

When a user opens a change request, they see a two-panel view.

### Left Side — The Change Itself
- Change number, title, type, status, and how much time is left on the SLA
- Description and justification
- Test plan, rollback plan, implementation plan (collapsed by default, expandable)
- The list of affected CIs and services
- Implementation notes (editable while the change is In Progress)
- The PIR form (visible once the change is Complete or has been rolled back)

### Right Side — The Process
- **The workflow timeline** — every step from start to end. Completed steps show who acted, what they decided, what they said, and when. The current active step is highlighted. Pending future steps are shown dimmed.
- **The action panel** — if the current user has a pending task on the active step, this panel shows the approve/reject/request-info buttons and a comment field. If the user has no pending task, this panel is not shown.
- Risk assessment result (if risk has been assessed)
- Scheduling details (once a date is set)
- People: who created the request, who is assigned to implement it, who assessed the risk

### Actions Bar
A row of buttons at the top that changes based on where the request is in its lifecycle and what permissions the current user has:
- Submit (while in Draft)
- Schedule (once Approved)
- Start Implementation (once Approved or Scheduled)
- Mark Complete / Mark Failed / Execute Rollback (while In Progress)
- Submit PIR (while PIR Pending)
- Close (when eligible)
- Cancel (in any non-final state)

---

## 18. The Workflow Timeline (Detail)

The timeline is the heart of the transparency goal. It shows the complete story of a change request from beginning to end.

For each step:
- The step's name and what kind of step it is (approval, input, automated, etc.)
- Whether it is done, active, pending, or was skipped
- For approval steps: who was assigned, and what each person decided (if they have acted)
- For completed steps: the decision, any comment left, and the timestamp
- For parallel steps: both branches are shown side by side with their individual statuses
- A time bar showing how much of the step's SLA has elapsed

Any user with view access can see the full timeline, including all decisions and comments. Nothing is hidden after a step is complete.

---

## 19. The Dashboard

The dashboard is for the Change Manager and senior leadership. It gives a live operational picture of the change process.

It shows:
- **The pipeline** — how many changes are in each status right now, from Draft to Closed. Clicking a status opens the filtered list.
- **My pending approvals** — changes that need my action, with SLA countdowns
- **SLA health** — for the last 30 days: how many changes completed on time, how many were at risk, and how many breached
- **Change volume** — a bar chart of how many changes happened each month over the last 12 months
- **Breakdown by type** — a chart showing the proportion of CR vs AR vs IR vs other types
- **The CAB queue** — Emergency changes currently waiting for parallel approval
- **Recent failures** — changes that failed or were rolled back in the last 30 days
- **Coming up** — changes scheduled to happen in the next 7 days

---

## 20. Maintenance Windows Management

The Change Manager can define, edit, and deactivate maintenance windows.

A maintenance window has:
- A name
- A recurrence pattern: weekly (same day every week), bi-weekly, monthly, or custom
- A day of week or day of month
- A start time and end time (24-hour format)
- A timezone (defaults to Riyadh)
- An effective from and effective to date (optional end)
- Active/inactive toggle

**Blackout periods** are separate from windows. A blackout has a name, a reason, a start date/time, an end date/time, and an active toggle. Blackouts block Normal change scheduling for their entire duration.

---

## 21. Workflow Definition Management

Administrators can view the workflow definitions that drive the approval process. Three built-in definitions come with the system (Standard, Normal, Emergency) and cannot be deleted or edited — they can only be viewed and cloned.

Admins can:
- Clone a built-in or custom definition to create their own variant
- Edit a cloned definition
- Publish a definition to make it available for use
- Archive a definition to retire it

A workflow definition that is actively being used by running change requests is never altered. When a new version is published, only new requests use it. Existing requests continue on the version that was active when they were submitted.

---

## 22. Notifications

The system sends a notification to the relevant people at each key moment:

| When | Who Gets Notified |
|---|---|
| Request submitted | Requestor |
| An approval step is assigned to someone | Each assignee |
| Approved | Requestor + the assigned implementor |
| Rejected | Requestor (with rejection reason) |
| Approver requests more information | Requestor |
| Requestor provides the requested information | The approvers waiting |
| Scheduled | Requestor + assignee |
| Implementation started | Requestor + CI owners |
| Completed | Requestor + approvers |
| Failed | Requestor + assignee + approvers |
| SLA approaching deadline | The approvers on the active step |
| SLA breached | Approvers + their manager |
| PIR reminder (24h) | Assignee |
| PIR escalation (72h) | Assignee + their manager |
| PIR escalation (7 days) | Assignee + Change Manager |
| Closed | Requestor |
| Emergency change submitted | All CAB members + all CI owners |
| Emergency change approved | Requestor + assignee + service owners |

---

## 23. Business Rules

These are the rules the system must enforce unconditionally. No user action can bypass them.

1. An Application Release, Infrastructure Release, or Config/Firewall Release cannot be submitted unless it is linked to a parent CR.
2. A parent CR cannot be closed while any of its sub-requests is in an active (non-final) state.
3. A Normal change cannot be scheduled during a blackout period.
4. A Normal change must be scheduled within an active maintenance window.
5. An Emergency change bypasses maintenance window requirements but shows a warning if scheduled during a blackout.
6. Standard changes are always auto-approved. No human can be added as an approver to a Standard change workflow.
7. Normal and Emergency changes require a Post-Implementation Review before they can be closed.
8. A change with a Critical risk score (21–25) cannot proceed to the approval step until the Change Manager explicitly acknowledges the risk.
9. A rejected change cannot be resubmitted. A new request must be created.
10. Only the person who created the request, or a user with the Cancel permission, can cancel a change.
11. Cancellation is permanent — a cancelled change cannot be restarted.
12. The implementation start time is recorded automatically by the system when Start Implementation is clicked. The implementor cannot manually edit it.
13. A delegation only applies while it is active (within the date range). Expired delegations have no effect.
14. The audit trail is append-only. No action, comment, or decision can be modified or deleted after it is recorded.

---

## 24. Change Number Format

Every request gets a unique reference number generated automatically at creation. The format identifies the type and date:

| Type | Format | Example |
|---|---|---|
| Change Request | CR-YYYYMMDD-NNNNN | CR-20260414-00042 |
| Application Release | AR-YYYYMMDD-NNNNN | AR-20260414-00001 |
| Infrastructure Release | IR-YYYYMMDD-NNNNN | IR-20260414-00003 |
| Config/Firewall Release | CFR-YYYYMMDD-NNNNN | CFR-20260414-00001 |
| Access Request | ACC-YYYYMMDD-NNNNN | ACC-20260414-00007 |
| Firewall Request | FW-YYYYMMDD-NNNNN | FW-20260414-00002 |
| Other Request | OTH-YYYYMMDD-NNNNN | OTH-20260414-00001 |

The counter resets daily per type and is padded to 5 digits.

---

## 25. Permissions Summary

Access is controlled by what role a user has been assigned. The key permission levels are:

| What a user can do | Permission needed |
|---|---|
| View any change request | CHANGES_VIEW |
| Create a new change request | CHANGES_CREATE |
| Edit a request while it is in Draft or Submitted | CHANGES_UPDATE |
| Delete a Draft request | CHANGES_DELETE |
| Submit a request to start the workflow | CHANGES_SUBMIT |
| Fill in or update the risk assessment | CHANGES_ASSESS_RISK |
| Approve, reject, or request more info | CHANGES_APPROVE |
| Set the scheduled date and maintenance window | CHANGES_SCHEDULE |
| Mark implementation as started, completed, failed, or rolled back | CHANGES_IMPLEMENT |
| Close a change | CHANGES_CLOSE |
| Cancel a change | CHANGES_CANCEL |
| Submit a PIR | CHANGES_PIR_CREATE |
| View a PIR | CHANGES_PIR_VIEW |
| Admin overrides: re-assign steps, force decisions | CHANGES_MANAGE |
| View the executive dashboard | CHANGES_DASHBOARD |
| View maintenance windows and blackouts | MAINTENANCE_WINDOWS_VIEW |
| Create, edit, delete windows and blackouts | MAINTENANCE_WINDOWS_MANAGE |

Default role presets:
- **System Administrator** — everything
- **Change Manager** — all change permissions + manage maintenance windows + view workflow instances
- **CAB Member** — view changes + approve + view dashboard
- **IT Staff** — view + create + submit + implement + PIR + cancel + view windows
- **Viewer** — view changes + view PIR + view windows

---

## 26. Out of Scope

The following are explicitly not part of this module:

- Integration with external ticketing systems (ServiceNow, Jira, etc.)
- Customer-facing change notifications
- Change request templates stored per CI type
- Automated implementation (the system tracks the work; a human does it)
- Cost tracking or budget approval for changes
- Change impact simulation
- SLA reporting to external regulatory bodies
- Mobile app or dedicated API for third-party consumers
