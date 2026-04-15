# Workflow Engine — Built-in Seed Reference
**TechHub — Internal IT Platform**
**Companion document to** [PRD.md](./PRD.md)
**Status:** Draft · Internal use only

---

## 1. Purpose

This document is a **high-level reference** for everything the Workflow Engine ships with out of the box. It is not a schema, not a migration file, and not a spec. It describes:

- Which built-in forms exist
- Which built-in workflows exist
- Which fields, steps, SLAs, and routing rules each one ships with
- Which supporting seeds (calendars, roles, templates, rejection policies, hold reasons) are pre-configured

Read it as *"this is the default configuration a fresh TechHub install comes with."*

Every item described here is **editable by the appropriate admin without a deployment**. The only rules the engine enforces unconditionally are the Engine Invariants in [PRD §22](./PRD.md). Anything in this file can be renamed, re-numbered, re-targeted, or replaced.

### How this relates to the PRD

The PRD describes *what the engine does*. This file describes *what ships inside it on day one*. If the PRD says "the built-in Normal Change workflow ships with a risk assessment step," this is the file that tells you what that step actually looks like.

As the engine gains more generic features (request linking, scheduling-against-calendar as a step type, scored-input field types, related-form population, etc.), more of the PRD's Part Two will collapse into this seed file. The long-term goal is for Change Management to be *entirely* seed data — no dedicated module — built on top of a fully generic engine.

---

## 2. Built-in Business Calendars

Calendars are first-class, shared entities (PRD §13.1). Two ship by default:

| Name | Purpose | Working Days | Working Hours | Timezone | Holidays |
|---|---|---|---|---|---|
| **Saudi Standard** | Default for Normal work | Sunday – Thursday | 08:00 – 17:00 | Asia/Riyadh | Seeded with KSA public holidays |
| **24/7** | Default for Emergency work | All days | All hours | Asia/Riyadh | None |

Both are active on install. Admins can add more calendars (e.g., "Ops Night Shift", "Vendor Hours") without touching code.

---

## 3. Built-in Maintenance Windows

Maintenance windows are time slots that scheduling steps can require. Seeded defaults:

| Name | Recurrence | Day | Start | End | Timezone | Purpose |
|---|---|---|---|---|---|---|
| **Weekly Standard Window** | Weekly | Friday | 22:00 | 02:00 (Sat) | Asia/Riyadh | Default slot for Normal changes |
| **Monthly Extended Window** | Monthly (last Friday) | Friday | 20:00 | 06:00 (Sat) | Asia/Riyadh | Larger releases that need more time |

Active on install. Change Managers can edit, add, or disable.

---

## 4. Built-in Blackout Periods

| Name | When | Reason |
|---|---|---|
| **Ramadan Freeze** | Ramadan dates (annual) | Reduced capacity; protect stability |
| **Year-End Freeze** | Dec 20 – Jan 5 (annual) | Year-end financial close |
| **Hajj Freeze** | Hajj week (annual) | Reduced staffing |

All seeded active. Dates refreshed annually by Change Manager.

---

## 5. Built-in Hold Reasons (generic engine)

The generic hold-reason list from PRD §10.3 is seeded:

- AWAITING_REQUESTOR
- AWAITING_THIRD_PARTY
- AWAITING_DEPENDENCY
- AWAITING_RESOURCE
- AWAITING_WINDOW
- PENDING_DECISION
- OTHER

Admins can add more. Forms can scope which reasons are selectable.

---

## 6. Built-in Forms

Change Management ships with four forms, one per request type. Each has its associated workflow (Section 7) selected at runtime based on the `change_type` field.

### 6.1 Common Fields (shared across all four change forms)

| Field | Type | Required | Notes |
|---|---|---|---|
| Title | Short text | Yes | |
| Description | Long text | Yes | |
| Change Type | Dropdown | Yes | STANDARD / NORMAL / EMERGENCY · drives workflow selection |
| Priority | Dropdown | Yes | LOW / MEDIUM / HIGH / CRITICAL |
| Justification | Long text | Yes | Why this change is needed |
| Implementation Plan | Long text | Yes | Steps to execute |
| Test Plan | Long text | Yes (except some STANDARD variants) | |
| Rollback Plan | Long text | Yes for NORMAL and EMERGENCY | |
| Affected CIs | Multi-select (CMDB) | Yes | Each CI also captures an impact description |
| Affected Services | Multi-select (Service catalog) | Yes | Each service also captures an impact description |
| Attachments | File upload | No | Supporting docs, diagrams, scripts |
| Requestor | User picker | Auto | Set to submitting user |
| Scheduled Start | Date-time | Conditional | Required once status reaches APPROVED |
| Scheduled End | Date-time | Conditional | Required once status reaches APPROVED |
| Maintenance Window | Reference | Conditional | Required for NORMAL; optional for EMERGENCY |

**Change-type gating on required fields** is a runtime visibility/requirement condition, not a per-form thing. `Rollback Plan required = true` when `change_type in (NORMAL, EMERGENCY)`.

### 6.2 CR Form (Change Request — Parent)

Purpose: parent container grouping related sub-requests into a coordinated release.

| Extra Field | Type | Required |
|---|---|---|
| Release Name | Short text | Yes |
| Business Owner | User picker | Yes |
| Target Release Date | Date | No |

CR does not carry Test Plan, Rollback Plan, or Implementation Plan — those live on child AR/IR/CFR records.

**Per-step field state (highlights):**
- All fields Editable at DRAFT
- All fields Visible (read-only) from SUBMITTED onward except Implementation notes
- Scheduled Start/End become Editable at APPROVED

### 6.3 AR Form (Application Release)

| Extra Field | Type | Required |
|---|---|---|
| Parent CR | Request link | Yes (hard constraint, see PRD §22 invariant 11) |
| Application | Dropdown (from CMDB) | Yes |
| Version | Short text | Yes |
| Deployment Environment | Dropdown | Yes (DEV / UAT / PROD) |
| Database Migration Required | Checkbox | No |
| Migration Script | File upload | Conditional — required if Database Migration Required = Yes |

### 6.4 IR Form (Infrastructure Release)

| Extra Field | Type | Required |
|---|---|---|
| Parent CR | Request link | Yes |
| Infrastructure Component | Dropdown (from CMDB) | Yes |
| Change Category | Dropdown | Yes (Hardware / Network / Virtualization / Storage / Other) |
| Downtime Expected | Checkbox | Yes |
| Downtime Duration | Short text | Conditional — required if Downtime Expected = Yes |

### 6.5 CFR Form (Config/Firewall Release)

| Extra Field | Type | Required |
|---|---|---|
| Parent CR | Request link | Yes |
| Target System | Dropdown (from CMDB) | Yes |
| Rule Type | Dropdown | Yes (Firewall / Network ACL / Config / Policy) |
| Source | Short text | Conditional — firewall types only |
| Destination | Short text | Conditional — firewall types only |
| Port / Protocol | Short text | Conditional — firewall types only |
| Rule Justification | Long text | Yes |

### 6.6 Risk Assessment Fields (added by Normal workflow runtime)

When the Normal Change workflow's Risk Assessment step activates, these fields become editable on the form:

| Field | Type | Notes |
|---|---|---|
| Risk Likelihood | Dropdown (1–5) | Seeded |
| Risk Impact | Dropdown (1–5) | Seeded |
| Risk Score | Computed | Likelihood × Impact |
| Risk Notes | Long text | Required |
| Risk Assessor | User picker | Auto — set to the step's actor |

Thresholds for routing are seeded in the workflow definition, not the form (see Section 7.3).

### 6.7 PIR Fields (added by Normal/Emergency workflows)

When the PIR step activates, these fields become editable:

| Field | Type | Required |
|---|---|---|
| PIR Outcome | Dropdown | Yes — SUCCESSFUL / PARTIAL / FAILED / ROLLED_BACK |
| What Actually Happened | Long text | Yes |
| Planned vs Actual Notes | Long text | Yes |
| Lessons Learned | Long text | Yes |
| Follow-up Actions | Long text (with owners) | No |
| Customer Impact | Checkbox | Yes |
| Customer Impact Description | Long text | Conditional — required if Customer Impact = Yes |

### 6.8 Implementation Fields

Editable during IN_PROGRESS:

| Field | Type | Notes |
|---|---|---|
| Implementation Start | Date-time | System-set, not user-editable (PRD §22 invariant 14) |
| Implementation End | Date-time | System-set on Complete or Fail |
| Implementation Notes | Long text | Visible to anyone with view access |
| Rollback Notes | Long text | Visible only after Fail + Rollback |

---

## 7. Built-in Workflows

Three workflows ship — one per change type. The form routes the request to the matching workflow at submission time, based on the `change_type` field.

### 7.1 Standard Change Workflow

**Purpose:** auto-approved, pre-authorized low-risk work.

**Rejection Policy:** Default (see Section 8).

**Steps:**

| # | Name | Type | Assignee | SLA | Actions | Routing |
|---|---|---|---|---|---|---|
| 1 | Auto-Approve | Automation | — | Instant | — | → Step 2 |
| 2 | Schedule | Execution | Requestor | 24 business hours | Complete | → Step 3 |
| 3 | Execute Change | Execution | Requestor | 5 business days | Complete, Fail | Complete → Step 4 · Fail → Step 5 |
| 4 | Close | Automation | — | Instant | — | Sets outcome SUCCESSFUL · CLOSED |
| 5 | Review Failure | Execution | Change Manager | 24 business hours | Complete, Request More Info | → Step 4 (with outcome UNSUCCESSFUL) |

**Notes:**
- No human approval. Auto-Approve step records actor `system (policy)` in the audit trail.
- No PIR step.
- Scheduling step is optional — uses free scheduling, no maintenance window required.
- Total target: 5 business days elapsed.

### 7.2 Normal Change Workflow

**Purpose:** planned, non-urgent work requiring human review.

**Business Calendar:** Saudi Standard
**Rejection Policy:** Standard Correction (Section 8)

**Steps:**

| # | Name | Type | Assignee | SLA | Actions | Routing |
|---|---|---|---|---|---|---|
| 1 | Requestor Self-Review | Info / Ack | Requestor | 4 business hours | Acknowledge | → Step 2 |
| 2 | Risk Assessment | Execution | Change Manager role | 48 business hours, remind at 24h, add manager at 48h | Complete, Request More Info | → Step 3 |
| 3 | Critical Risk Branch | Conditional | — | — | — | Risk Score ≥ 21 → Step 4 · else → Step 5 |
| 4 | Critical Risk Acknowledgement | Approval | CAB role (policy: All) | 24 business hours | Approve, Reject, Request More Info | Approve → Step 5 · Reject → Step 11 |
| 5 | CI Owner Approval | Approval | CI Owner (resolved from Affected CIs) | 48 business hours, remind at 24h, escalate to CI Owner's manager at 48h | Approve, Reject, Request More Info | Approve → Step 6 · Reject → Step 11 |
| 6 | Service Owner Approval | Approval | Service Owner (resolved from Affected Services) | 48 business hours | Approve, Reject, Request More Info | Approve → Step 7 · Reject → Step 11 |
| 7 | Change Manager Approval | Approval | Change Manager role | 48 business hours, remind at 24h, add manager co-assignee at 48h | Approve, Reject, Request More Info | Approve → Step 8 · Reject → Step 11 |
| 8 | Schedule | Execution | Requestor | 48 business hours | Complete | Validates against Maintenance Window + Blackouts · → Step 9 |
| 9 | Execute Change | Execution | Requestor | — (uses scheduled window) | Complete, Fail, Put On Hold | Complete → Step 10 · Fail → Step 12 |
| 10 | PIR | Execution | Requestor | 24h / 72h / 7d ladder (reminder, escalation to manager, escalation to Change Manager) | Complete | → Step 13 |
| 11 | Rejection Handling | Automation | — | — | — | Notifies requestor · awaits resubmit or abandonment |
| 12 | Rollback | Execution | Requestor | 24 business hours | Complete | Sets outcome ROLLED_BACK · → Step 13 |
| 13 | Close | Automation | — | Instant | — | Sets outcome from PIR mapping · CLOSED |

**Scheduling rules (Step 8):**
- Maintenance Window: required (must pick an active window)
- Blackouts: block scheduling

**Total target:** 5 business days elapsed.

### 7.3 Emergency Change Workflow

**Purpose:** urgent work to resolve or prevent a major incident.

**Business Calendar:** 24/7
**Rejection Policy:** Emergency Correction (Section 8)

**Steps:**

| # | Name | Type | Assignee | SLA | Actions | Routing |
|---|---|---|---|---|---|---|
| 1 | Emergency Triage Notification | Notification | CAB role + all CI Owners + Change Manager | Instant | — | → Step 2 |
| 2a | CAB Approval (parallel) | Approval | CAB role (policy: Any) | 4 hours · auto-approve at 6h | Approve, Reject | Approve → Step 3 · Reject → Step 6 |
| 2b | CI Owner Approval (parallel) | Approval | CI Owner (primary affected CI) | 4 hours · auto-approve at 6h | Approve, Reject | Approve → Step 3 · Reject → Step 6 |
| 3 | Sync Barrier | Single | — | — | — | Waits for 2a AND 2b · → Step 4 |
| 4 | Execute Change | Execution | Requestor | — | Complete, Fail | Complete → Step 5 · Fail → Step 7 |
| 5 | PIR | Execution | Requestor | 24h / 72h / 7d ladder | Complete | → Step 8 |
| 6 | Rejection Handling | Automation | — | — | — | Notifies requestor |
| 7 | Rollback | Execution | Requestor | 4 hours | Complete | Sets outcome ROLLED_BACK · → Step 8 |
| 8 | Close | Automation | — | Instant | — | Sets outcome from PIR mapping · CLOSED |

**Scheduling rules:**
- Maintenance Window: not required
- Blackouts: warn only, do not block

**Auto-approval audit:** when 2a or 2b auto-advance on timeout, the audit trail records actor `system (SLA escalation)` and references the escalation rule that fired (PRD §13.2).

**Total target:** 8 hours from submission to approval.

---

## 8. Built-in Rejection Policies

### 8.1 Default (used by Standard and generic forms)

| Setting | Value |
|---|---|
| Default re-approval scope | Full restart |
| Rejector discretion | Locked |
| Allowed scopes | Full restart |
| Field lock on resubmit | None |
| Predefined reasons | Insufficient detail · Scope unclear · Missing rollback plan · Other |

### 8.2 Standard Correction (used by Normal Change)

| Setting | Value |
|---|---|
| Default re-approval scope | Resume from rejection step |
| Rejector discretion | Choose from allowed list |
| Allowed scopes | Full restart, Resume from rejection step |
| Field lock on resubmit | Lock: Change Type, Affected CIs |
| Predefined reasons | Risk too high · Insufficient test plan · Missing rollback plan · Scheduling conflict · CI owner objection · Other |

### 8.3 Emergency Correction (used by Emergency Change)

| Setting | Value |
|---|---|
| Default re-approval scope | Resume from rejection step |
| Rejector discretion | Locked |
| Allowed scopes | Resume from rejection step |
| Field lock on resubmit | Lock: Change Type |
| Predefined reasons | Rollback plan inadequate · Wrong CI owner · Should be Normal change · Other |

---

## 9. Built-in Email Templates

Seeded with one template per workflow event. Each uses the default Barq header/footer and branding.

| Template | Used For | Recipients | Action Buttons |
|---|---|---|---|
| Change Submitted | Confirmation to requestor | Requestor | View Request |
| Approval Assigned | Each approval step activation | Assignees | Approve, Reject, View Request |
| Change Approved | On each approval action | Requestor + assignee | View Request |
| Change Rejected | On reject | Requestor | Edit & Resubmit, View Request |
| More Info Requested | On Request More Info | Requestor | Respond, View Request |
| SLA Warning | At reminder threshold | Step assignees | Act Now, View Request |
| SLA Breach | At escalation threshold | Step assignees + manager | Act Now, View Request |
| Change Placed On Hold | On hold | Requestor + assignees | View Request |
| Change Resumed | On resume | Requestor + assignees | View Request |
| Change Scheduled | On schedule | Requestor + assignee | View Request |
| Implementation Started | On IN_PROGRESS | Requestor + CI owners | View Request |
| Change Completed | On complete | Requestor + approvers | View Request |
| Change Failed | On fail | Requestor + assignee + approvers | View Request |
| PIR Reminder | PIR ladder | Implementor | Submit PIR |
| PIR Escalation | PIR ladder | + Manager or Change Manager | Submit PIR |
| Change Closed | On close | Requestor | View Request |
| Emergency Submitted | Emergency triage | CAB + CI owners + Change Manager | Approve, Reject, View Request |

All templates are editable in the admin area. Action button tokens are scoped per recipient per send (PRD §14.2).

---

## 10. Built-in Permissions and Roles

### 10.1 Roles

| Role | Seeded Purpose |
|---|---|
| System Administrator | Full access |
| Change Manager | CM module admin |
| CAB Member | Emergency approvals |
| IT Staff | Create and execute changes |
| Viewer | Read-only |

### 10.2 Default Role → Permission Mapping

See PRD §24 for the engine-level permission matrix. Change Management-specific permissions (`CHANGES_*`, `MAINTENANCE_WINDOWS_*`, etc.) are declared by this seed and installed on a fresh database. Default role → permission mappings:

| Role | Permissions |
|---|---|
| System Administrator | All permissions |
| Change Manager | All `CHANGES_*` + `MAINTENANCE_WINDOWS_MANAGE` + `WORKFLOW_INSTANCES_VIEW` + `CALENDARS_MANAGE` |
| CAB Member | `CHANGES_VIEW` + `CHANGES_APPROVE` + `DASHBOARDS_VIEW` |
| IT Staff | `CHANGES_VIEW` + `CHANGES_CREATE` + `CHANGES_SUBMIT` + `CHANGES_IMPLEMENT` + `CHANGES_HOLD` + `CHANGES_PIR_CREATE` + `CHANGES_PIR_VIEW` + `CHANGES_CANCEL` + `MAINTENANCE_WINDOWS_VIEW` |
| Viewer | `CHANGES_VIEW` + `CHANGES_PIR_VIEW` + `MAINTENANCE_WINDOWS_VIEW` |

### 10.3 Change Management Permissions

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
| MAINTENANCE_WINDOWS_VIEW | View maintenance windows and blackout periods |
| MAINTENANCE_WINDOWS_MANAGE | Create, edit, and delete maintenance windows and blackouts |

### 10.4 Change Management Notifications Reference

Events the built-in workflows emit, and default recipients:

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

## 11. Seed File Organization (implementation hint, not a rule)

When this is wired up in code, the seed is expected to split along these boundaries so each piece can be edited independently:

- **Calendars & Windows & Blackouts** — reference data, shared
- **Hold Reasons** — engine-level reference
- **Rejection Policies** — reusable across forms
- **Email Templates** — reusable across workflows
- **Forms** — CR / AR / IR / CFR
- **Workflows** — Standard / Normal / Emergency
- **Permissions & Roles** — already handled by the existing seed system

Exact file layout is the implementor's call. Nothing in this reference presumes a specific Prisma schema, factory shape, or seed runner.

---

## 12. What This File Is Not

- It is not a schema. No column names, no enum identifiers, no foreign-key specs.
- It is not a migration. It does not describe how to install or update the seed.
- It is not exhaustive. Specific text copy (email bodies, rejection reasons, notification wording) is left for implementation and review with Change Manager / stakeholders.
- It is not the source of truth for engine rules. The PRD is. Anything in this file that conflicts with the PRD is wrong.

---

## 13. Evolution Target

As the Workflow Engine grows additional generic features — richer computed and lookup fields, sub-request creation from a workflow step, populate-from-external-source, and similar capabilities seen in the Gravity Flow ecosystem — more of Part Two of the PRD (currently just the pointer in §23) will collapse into this document.

### Future Engine Enhancements (not in v1)

These are capabilities observed in mature form/workflow platforms (GravityForms / GravityFlow ecosystem, ServiceNow, Jira Service Management, etc.) that are **not foundational** — they can be added after v1 ships without architectural pain. They are listed here as a roadmap, not a commitment.

**Form & field enhancements:**
- Save & continue later (resumable drafts with magic link, including for external submitters)
- Rich input field types: signature, rating, rank/order, likert
- Input masks and format validation: IBAN, Saudi National ID, custom regex
- Multi-page forms with progress bar and conditional pages
- Sandbox / test-submit mode for dry-running a workflow without side effects

**Workflow & step enhancements:**
- Outgoing webhook step (HTTP call with templated payload and response mapping back into form fields)
- Incoming webhook / wait-for-event step (pause until external system posts a callback)
- Spawn sub-workflow step (create a new request in another form and optionally wait for its outcome)
- Out-of-office auto-reassign (respect user OOO calendar, pairs with business calendars)
- Bulk operations (approve / reassign / cancel N requests at once)
- Entry automation (scheduled rules that act on requests matching a filter — e.g., "auto-cancel any DRAFT older than 90 days")

**Views & reporting enhancements:**
- User-defined saved views / saved queries with shareable URLs and per-role visibility
- Published public views (read-only with masking for external stakeholders)
- Workflow analytics (time-in-step, bottleneck heatmap, SLA breach rates, approver throughput)

**Request lifecycle enhancements:**
- Duplicate / clone as new request (one-click resubmit starting from an existing request's data)
- Cross-form entry lookup field (search and link to a prior entry on another form as a soft reference)

None of these should drive v1 architecture decisions. They are all additive.

The end state: **there is no Change Management module.** Change Management is just the four forms, three workflows, and supporting reference data described in this file, sitting on top of a fully generic engine. At that point the PRD shrinks to Part One plus a short pointer to this seed reference.
