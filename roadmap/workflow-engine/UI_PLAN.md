# UI Plan

## Routes

```
/change-management                       → List + filters
/change-management/new                   → Multi-step creation form
/change-management/[id]                  → Detail view
/change-management/[id]/workflow         → Full workflow timeline (deep link)
/change-management/calendar              → Scheduled changes calendar
/change-management/dashboard             → Executive dashboard
/maintenance-windows                     → Admin: windows + blackouts
/workflow-definitions                    → Admin: view/clone definitions
/workflow-definitions/[id]               → Admin: definition detail + step graph
```

---

## Pages

### Change List `/change-management`

**Filters:** status, changeType, requestTypeCode, priority, assignedTo, dateRange, myChanges toggle, myApprovals toggle

**Columns:** changeNumber, title, requestTypeCode badge, changeType badge, priority badge, status badge, requestedBy, assignedTo, scheduledStartAt, SLA indicator, workflow step

**Table features:** sortable, searchable, exportable (XLSX), badge counts in sidebar for pending approvals and SLA breaches

**Quick actions per row:** View, Approve (if user has pending approval task), Cancel

---

### Change Creation `/change-management/new`

Multi-step wizard:

**Step 1 — Request Type**
- Select request type (CR / AR / IR / CFR / ACCESS / FIREWALL / OTHER) with icon cards
- Select change type (STANDARD / NORMAL / EMERGENCY) — shown only for CR/AR/IR/CFR
- If AR/IR/CFR: required parent CR picker (typeahead search of open CRs)

**Step 2 — Details**
- Title, description
- Priority
- Justification
- testPlan (if form type requires it)
- rollbackPlan (if form type requires it)
- implementationPlan

**Step 3 — Impact**
- Affected CIs: multi-select from CMDB with impact description per CI
- Affected Services: multi-select from Services catalog with impact description

**Step 4 — Review & Submit**
- Summary of all fields
- Validation errors surface here
- Submit button → triggers workflow start

Form saves as DRAFT on every step navigation (auto-save). Draft is resumable.

---

### Change Detail `/change-management/[id]`

Layout: two-column — left content, right sidebar.

**Left column:**
- Change header: changeNumber, title, type badges, status badge, SLA ribbon
- Description + justification
- Planning: testPlan, rollbackPlan, implementationPlan (collapsible)
- Affected CIs panel
- Affected Services panel
- Implementation notes (editable when IN_PROGRESS)
- PIR section (visible when PIR_PENDING or CLOSED)

**Right sidebar:**
- **Workflow Timeline** — vertical step list showing all steps, current active step(s) highlighted, completed steps with actor + decision + timestamp
- **Action Panel** — if user has a pending task on the current step: shows approve/reject/request-info buttons with comment field
- Risk matrix (if risk assessed)
- Scheduling block (if APPROVED or SCHEDULED)
- People: requestedBy, assignedTo, riskAssessedBy

**Actions bar** (contextual, shown based on status + permissions):
- Submit (DRAFT → SUBMITTED)
- Schedule (APPROVED → SCHEDULED)
- Start Implementation (APPROVED/SCHEDULED → IN_PROGRESS)
- Complete / Fail / Rollback (IN_PROGRESS)
- Create PIR (PIR_PENDING)
- Close (COMPLETED / ROLLED_BACK / PIR done)
- Cancel (any non-terminal)

---

### Change Calendar `/change-management/calendar`

Monthly calendar view. Each scheduled change appears as a colored block on its scheduled date range.

Color coding:
- `STANDARD` → grey
- `NORMAL` → blue
- `EMERGENCY` → red

Maintenance windows shown as semi-transparent background regions. Blackout periods shown as striped red regions.

Click a change → side panel with summary and link to detail. Hover a maintenance window → tooltip with name and duration.

---

### Executive Dashboard `/change-management/dashboard`

**Requires:** `CHANGES_DASHBOARD` permission

Widgets:
- **Pipeline funnel**: count of changes per status (DRAFT → CLOSED), clickable to filtered list
- **My pending approvals**: list of steps awaiting my action, with SLA countdown
- **SLA health**: count of changes on-track / at-risk / breached (last 30 days)
- **Change volume by type**: bar chart, last 12 months
- **Type breakdown**: donut chart (CR / AR / IR / CFR / OTHER)
- **CAB queue**: list of EMERGENCY changes awaiting parallel approval
- **Recent failures**: FAILED and ROLLED_BACK changes in the last 30 days
- **Upcoming scheduled**: changes scheduled in the next 7 days with window info

---

### Maintenance Windows `/maintenance-windows`

**Requires:** `MAINTENANCE_WINDOWS_VIEW`

Two tabs:
1. **Windows** — table of all maintenance windows with recurrence, next occurrence, and status. MANAGE permission enables create/edit/delete/toggle.
2. **Blackouts** — table of blackout periods with date range and reason. MANAGE permission enables create/delete.

---

### Workflow Definitions `/workflow-definitions`

**Requires:** `WORKFLOW_DEFINITIONS_VIEW`

Table: name, slug, entityType, version, status (DRAFT/PUBLISHED/ARCHIVED), publishedAt.

**Actions (MANAGE permission):**
- Clone a definition (creates a DRAFT copy at version 1)
- View step graph (JSON editor with syntax highlighting + schema validation)
- Publish (DRAFT → PUBLISHED, bumps version)
- Archive (PUBLISHED → ARCHIVED)

Built-in definitions (standard-change, normal-change, emergency-change) are read-only. They can be cloned but not edited or deleted.

---

## Key Components

### `WorkflowTimeline`

Vertical step-by-step list. Each item shows:
- Step name and type icon
- Status indicator (pending / active / completed / skipped / failed)
- Assignees (resolved, with avatars)
- For completed steps: actor who took action, decision, timestamp, comment
- For parallel steps: expandable sub-list per branch with merge policy label
- SLA bar: elapsed vs. total, color-coded (green / amber / red)

### `ApprovalPanel`

Shown when the current user has a pending task on an active APPROVAL step:
- List of all assignees and their decisions (pending / approved / rejected)
- Comment field (required for REJECT and REQUEST_INFO)
- Three buttons: Approve / Reject / Request More Info
- Submits via server action → `takeWorkflowActionAction()`

### `RiskMatrix`

Interactive 5×5 grid. X-axis: Impact (1–5). Y-axis: Likelihood (1–5). Cells colored by risk level (green → yellow → orange → red). Current score highlighted. Non-interactive in view mode; interactive in risk assessment INPUT step.

### `AffectedCIPanel` / `AffectedServicePanel`

Multi-select picker backed by CMDB / Services data. Each selected item has an optional impact description field. Renders as cards in view mode.

### `MaintenanceWindowPicker`

Calendar-aware picker. Highlights valid windows in green, blackout periods in red. Validates that the selected date/time range falls within a window (for NORMAL changes). Shows next available window if current selection is invalid.

### `PIRForm`

Shows when status is `PIR_PENDING`. Fields: outcome, actualImpact, plannedVsActual, lessonsLearned, followUpActions, customerImpact toggle, customerImpactDescription. Submits via `createPIRAction()` → triggers `close()` eligibility.

### `ChildRequestsPanel`

On CR detail view. Lists all linked AR/IR/CFR requests with their current status and workflow step. Shows a warning if any child is blocking the parent CR closure.

---

## UX Principles

1. **Status is always visible**: Every change number link shows a status badge. Never make users click through to find out.
2. **Action-first design**: The approval panel and action bar are the most prominent elements in the detail view — users with pending tasks should see exactly what to do immediately.
3. **SLA always visible**: SLA countdowns shown inline in the list table and as a colored ribbon in the detail header. Red = breached, amber = at risk, green = on track.
4. **Workflow transparency**: Non-approvers can always see the full workflow timeline including who approved, who rejected, and what they said.
5. **No dead ends**: Every rejection, failure, and cancellation shows a clear message explaining what happened and what options are available.
