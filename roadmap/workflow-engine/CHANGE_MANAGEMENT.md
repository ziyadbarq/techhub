# Change Management — Domain Design

## Overview

Change Management is built on top of the Workflow Engine. It adds:
- Domain-specific request types and form configurations
- ITIL-aligned lifecycle with risk assessment, scheduling, implementation, and PIR
- Maintenance windows and blackout periods
- CAB (Change Advisory Board) process
- Dashboard and calendar views

---

## Request Types

| Code | Name | Requires Parent CR | Purpose |
|---|---|---|---|
| `CR` | Change Request | No (is the parent) | Parent container for coordinated releases |
| `AR` | Application Release | Yes → CR | Application/software deployment |
| `IR` | Infrastructure Release | Yes → CR | Infrastructure or network change |
| `CFR` | Config/Firewall Release | Yes → CR | Config or firewall rule change |
| `ACCESS` | Access Request | No | User access provisioning |
| `FIREWALL` | Firewall Request | No | Standalone firewall rule request |
| `OTHER` | Other Request | No | Miscellaneous IT requests |

### CR Hierarchy

```
Change Request (CR)          ← parent, created first
  ├── Application Release (AR)
  ├── Infrastructure Release (IR)
  └── Config/Firewall Release (CFR)
```

- AR, IR, CFR cannot be submitted unless linked to a parent CR
- Parent CR cannot close until all child requests are in a terminal state
- Child request statuses are surfaced on the parent CR detail view
- Each sub-request has its own workflow instance and approval flow

---

## Change Types & Workflow Selection

| Change Type | Default Workflow | Risk Threshold Escalation |
|---|---|---|
| `STANDARD` | Standard Change (auto-approve) | N/A |
| `NORMAL` | Normal Change (single approval) | If riskScore ≥ 16 → Emergency workflow |
| `EMERGENCY` | Emergency Change (parallel CAB) | N/A (already highest) |

The change type is set at creation. The workflow definition is selected automatically based on type. Admins can override the workflow definition selection per submission.

---

## Full Status Lifecycle

```
DRAFT
  │  submit()
  ▼
SUBMITTED
  │  workflow starts automatically
  ▼
IN_WORKFLOW ◄─────────────────────────┐
  │                                   │ (engine-driven state — stays here while
  │  workflow reaches terminal step   │  workflow instance is RUNNING)
  ├──────── approved ────────────────►APPROVED
  │
  └──────── rejected ───────────────►REJECTED (terminal)

APPROVED
  │  schedule()
  ▼
SCHEDULED
  │  startImplementation()           (or directly from APPROVED if no scheduling needed)
  ▼
IN_PROGRESS
  │
  ├── completeImplementation() ──────►COMPLETED (STANDARD) ──► close() ──►CLOSED
  │                                   │
  │                                   └──►PIR_PENDING (NORMAL/EMERGENCY)
  │                                           │  createPIR() + close()
  │                                           ▼
  │                                        CLOSED (terminal)
  │
  ├── failImplementation() ──────────►FAILED
  │                                   │  executeRollback()
  │                                   ▼
  │                                ROLLED_BACK ──► close() ──► CLOSED
  │
  └── (any non-terminal state)
        cancel() ──────────────────►CANCELLED (terminal)
```

### State Transition Rules

| Transition | Guard Conditions |
|---|---|
| `DRAFT → SUBMITTED` | Required fields filled; AR/IR/CFR must have parentChangeRequestId |
| `SUBMITTED → IN_WORKFLOW` | Automatic on submit; workflow engine starts instance |
| `IN_WORKFLOW → APPROVED` | Workflow instance reached COMPLETED outcome |
| `IN_WORKFLOW → REJECTED` | Workflow instance reached REJECTED outcome |
| `APPROVED → SCHEDULED` | scheduledStartAt set; Normal must fall within maintenance window |
| `APPROVED/SCHEDULED → IN_PROGRESS` | User has CHANGES_IMPLEMENT permission |
| `IN_PROGRESS → COMPLETED` | actualEndAt set |
| `COMPLETED → PIR_PENDING` | changeType is NORMAL or EMERGENCY |
| `COMPLETED → CLOSED` | changeType is STANDARD |
| `PIR_PENDING → CLOSED` | PIR record exists with outcome |
| `FAILED → ROLLED_BACK` | rollbackNotes provided |
| `ROLLED_BACK/FAILED → CLOSED` | Requires CHANGES_CLOSE permission |
| Any non-terminal → `CANCELLED` | Requires CHANGES_CANCEL permission |

---

## Risk Matrix

Likelihood (1–5) × Impact (1–5) = Risk Score

| Score | Risk Level | Auto-action |
|---|---|---|
| 1–5 | `LOW` | None |
| 6–10 | `MEDIUM` | None |
| 11–15 | `HIGH` | Warning banner on approval step |
| 16–20 | `VERY_HIGH` | System suggests escalating to Emergency workflow |
| 21–25 | `CRITICAL` | Blocks submission until Change Manager acknowledges |

Risk is collected via an `INPUT` step in the Normal and Emergency workflow definitions. The engine stores the result in the entity's `riskLikelihood`, `riskImpact`, `riskScore`, and `riskLevel` fields via an `AUTOMATION` step after the INPUT step completes.

---

## Maintenance Windows

### Window Types

| Recurrence | Description |
|---|---|
| `WEEKLY` | Same day and time every week |
| `BIWEEKLY` | Every two weeks |
| `MONTHLY` | Specific day of month |
| `CUSTOM` | Cron expression |

### Window Rules

| Change Type | Maintenance Window | Blackout |
|---|---|---|
| `STANDARD` | Not required | Ignored |
| `NORMAL` | Must schedule within an active window | Blocks scheduling |
| `EMERGENCY` | Not required | Warning shown, does not block |

### Built-in Dev Seed Windows

| Name | Schedule | Duration |
|---|---|---|
| Tuesday Night | Every Tuesday 22:00 AST | 6 hours |
| Weekend Window | Every Saturday 00:00 AST | 6 hours |
| Monthly Patch | First Saturday of month 22:00 AST | 8 hours |

---

## Blackout Periods

Blackouts block Normal change scheduling during critical periods:

- Ramadan freeze (configurable dates)
- Year-end freeze
- Major system go-live periods
- Ad hoc emergency blackouts (set by Change Manager)

Each blackout has: name, reason, startAt, endAt, createdBy, isActive flag.

---

## Post-Implementation Review (PIR)

Required for all NORMAL and EMERGENCY changes before closure.

### PIR Fields

| Field | Type | Notes |
|---|---|---|
| `outcome` | Enum | SUCCESSFUL / PARTIAL / FAILED / ROLLED_BACK |
| `actualImpactDescription` | Text | What actually happened vs. planned |
| `plannedVsActualNotes` | Text | Variance analysis |
| `lessonsLearned` | Text | What to do differently next time |
| `followUpActions` | Text | Action items with owners |
| `customerImpact` | Boolean | Was there end-user impact? |
| `customerImpactDescription` | Text | Required if customerImpact = true |

### PIR Reminders

A scheduled job runs daily and sends reminders to the implementer (assignedTo) for any change in `PIR_PENDING` state that is:
- > 24h old (first reminder)
- > 72h old (escalate to manager)
- > 7 days old (escalate to Change Manager role)

---

## CAB Process (Emergency Changes)

CAB = Change Advisory Board. For Emergency changes, the built-in workflow uses a PARALLEL step that routes simultaneously to:
1. A CAB member (SPECIFIC_ROLE: `cab-member`)
2. The CI owner of the primary affected CI

Both must approve (merge policy: `ALL_COMPLETE`, SLA: 4h calendar hours).

CAB members are any Person with the `cab-member` role. Admins manage this role via the standard RBAC interface.

---

## Notifications

| Event | Recipients | Template |
|---|---|---|
| Submitted | Requestor | `change-submitted` |
| Approval step activated | Each assignee | `change-approval-needed` |
| Approved | Requestor + assignedTo | `change-approved` |
| Rejected | Requestor | `change-rejected` |
| More info requested | Requestor | `change-more-info` |
| Info provided | Step assignees | `change-info-provided` |
| Scheduled | Requestor + assignedTo | `change-scheduled` |
| Implementation started | Requestor + CI owners | `change-started` |
| Completed | Requestor + approvers | `change-completed` |
| Failed | Requestor + assignedTo + approvers | `change-failed` |
| SLA warning | Step assignees | `workflow-sla-warning` |
| SLA breach | Step assignees + manager | `workflow-sla-breach` |
| PIR reminder | assignedTo | `pir-reminder` |
| PIR escalation | assignedTo + manager | `pir-escalation` |
| Closed | Requestor | `change-closed` |

---

## Number Generation

Auto-generated change numbers at creation time:

| Request Type | Format | Example |
|---|---|---|
| CR | `CR-YYYYMMDD-XXXXX` | `CR-20260414-00042` |
| AR | `AR-YYYYMMDD-XXXXX` | `AR-20260414-00001` |
| IR | `IR-YYYYMMDD-XXXXX` | `IR-20260414-00003` |
| CFR | `CFR-YYYYMMDD-XXXXX` | `CFR-20260414-00001` |
| ACCESS | `ACC-YYYYMMDD-XXXXX` | `ACC-20260414-00007` |
| FIREWALL | `FW-YYYYMMDD-XXXXX` | `FW-20260414-00002` |
| OTHER | `OTH-YYYYMMDD-XXXXX` | `OTH-20260414-00001` |

Counter is per type per day, padded to 5 digits. Stored as a unique constraint on the entity.

---

## Business Rules Summary

1. AR/IR/CFR cannot be submitted without a `parentChangeRequestId`
2. Parent CR cannot close while any child is in a non-terminal state
3. Normal change scheduling must fall within an active, non-blacked-out maintenance window
4. Emergency changes bypass window checks but display a warning if scheduled during a blackout
5. Standard changes are auto-approved — no human approval step
6. PIR is mandatory for Normal and Emergency changes before closure
7. Risk score ≥ 21 (CRITICAL) blocks submission until explicitly acknowledged by Change Manager
8. A change cannot be re-submitted after REJECTED — a new change request must be created
9. Only the requestor or a user with CHANGES_CANCEL can cancel; cancellation is terminal
10. `actualStartAt` is set automatically when `startImplementation()` is called
