# UI Plan — Generic Request UI

**Phase:** [03-ui](./README.md)
**Status:** Reference for engineers building the UI. Aligned to the sealed [PRD.md](../PRD.md).

---

## Purpose

This document describes the **generic UI** the engine ships with: list, detail, timeline, dashboards, action panels, form rendering. Every page in the system is built from these generic surfaces. There is **no per-form UI code**.

When a user navigates to `/change-management`, they are looking at the generic request list scoped to the four CM forms. When they open a CR detail page, they are looking at the generic request detail rendering the CR form definition. The "Change Management" experience is entirely composed of generic UI plus seed configuration.

The PRD covers the *what* in §20. This document covers the component-level *how* — what gets built, what is reusable, and what is wired up where.

---

## 1. Routes

| Route | Page | Backed By |
|---|---|---|
| `/requests` | All-form request list (cross-form view) | Generic List component |
| `/requests/[formSlug]` | Single-form request list | Generic List, scoped to one form |
| `/requests/[formSlug]/new` | Create new request on a form | Generic Form Renderer in create mode |
| `/requests/[id]` | Request detail (any form) | Generic Detail component |
| `/requests/[id]/timeline` | Workflow timeline deep link | Generic Timeline component |
| `/dashboards/[dashboardKey]` | Configurable dashboard | Generic Dashboard renderer |
| `/calendars` | Calendar admin | Reference data list |
| `/maintenance-windows` | Maintenance window admin | Reference data list |
| `/blackout-periods` | Blackout period admin | Reference data list |
| `/workflow-definitions` | Workflow definition viewer | Generic Definition viewer (read-only in Phase 03; edit in Phase 05) |
| `/workflow-definitions/[id]` | Single definition + step graph | Generic Definition viewer |
| `/forms` | Form definition viewer | Generic Form viewer (read-only in Phase 03; edit in Phase 05) |
| `/delegations` | User's delegations | Generic Delegations management |
| `/notification-preferences` | User's per-form watcher channel preferences | `WatcherChannelPreferences` settings page |

### Aliased CM Routes

For continuity with how Change Management users speak about the system, the following aliases route to the generic pages with the appropriate form scope:

| Alias | Resolves To |
|---|---|
| `/change-management` | `/requests/cr` (or a tabbed view across CR/AR/IR/CFR) |
| `/change-management/[id]` | `/requests/[id]` |
| `/change-management/calendar` | a generic calendar view scoped to CM forms with seeded color coding |
| `/change-management/dashboard` | `/dashboards/change-management-executive` (a seeded dashboard configuration) |

These are **route aliases**, not separate pages. They render the same generic components with seeded configuration. There are no CM-specific page files.

---

## 2. Generic Components

### 2.1 RequestList

A single component that powers every list view. Accepts:
- `formIds?: string[]` — if set, scopes to one or more forms; if absent, lists across all
- `defaultFilters?` — initial filter state
- `defaultSort?` — initial sort
- `columnPreset?: 'minimal' | 'standard' | 'extended'` — which columns to show by default

**Filters available** (inferred from the form definitions in scope):
- Status (canonical from PRD §10.1)
- Outcome (canonical from PRD §10.2)
- Hold reason (when status = ON_HOLD)
- Form (when not already scoped)
- Priority, requestor, assignee, date range
- Any field marked `filterable: true` on the form definition
- Toggles: "My requests", "My approvals", "On hold", "SLA at risk"

**Sortable columns**: reference number, title, status, outcome, priority, requestor, current assignee, current step, SLA indicator.

**Row actions**: View; plus contextual quick-actions resolved from the active step's allowed actions for users with a pending task.

**Output**: paginated, exportable to CSV/XLSX. Sidebar badges show counts of pending approvals, SLA breaches, on-hold requests for the current user.

There is no `ChangeListPage` component. Every list is `RequestList` with different props.

**Cross-ref:** PRD §20.1.

### 2.2 RequestDetail

Two-column layout, used for every form. Driven entirely by:
- The Request row (status, outcome, hold reason, current step IDs, field values)
- The Form definition (fields, sections, layout)
- The WorkflowVersion the Request is pinned to (steps, per-step field state, allowed actions)
- The audit trail (timeline data)

**Left column (the request itself):**
- Header: reference number, title, status badge, outcome badge (when final), hold reason badge (when on hold), SLA ribbon
- All form fields, grouped by section, rendered by the **FormRenderer** (§2.6) using the per-step field state matrix and runtime visibility conditions
- Comment thread (§2.7)

**Right column (the process):**
- **WorkflowTimeline** (§2.3)
- **ActionPanel** (§2.4) — visible only to users with a pending task on the active step
- People: requestor, current assignee(s), past actors (read from assignee snapshots)
- **WatcherPanel** (§2.8) — current watchers, add/remove controls

**Bottom: Actions bar** — contextual, rendered from the *active step's enabled actions* and the *current user's permissions*. Every button on the actions bar comes from the workflow definition. There is no hardcoded actions list per form.

There is no `ChangeDetailPage`, no `AccessRequestDetailPage`, etc. There is one `RequestDetail`.

**Cross-ref:** PRD §20.2.

### 2.3 WorkflowTimeline

Vertical step list. Each item shows:
- Step name and step type icon
- Step status (pending / active / completed / skipped / failed / cancelled)
- Assigned users — read from the **AssigneeSnapshot** taken at activation time, never re-resolved live (PRD §17)
- For completed steps: actor, action taken, comment, timestamp
- For parallel steps: all branches shown simultaneously, each with its own status and assignees, and the merge policy clearly labeled
- SLA bar: elapsed vs deadline, color-coded (green / amber / red), computed from the step's pause/resume event log

On Hold events appear as timeline entries between steps — when, by whom, why, when resumed, total paused duration.

The timeline is the same component for every form. CM's "12-step Normal Change" timeline and an Access Request's "5-step access flow" timeline are the same component fed different data.

**Cross-ref:** PRD §20.3.

### 2.4 ActionPanel

Renders the buttons for the active step's allowed actions. Each button is wired to a single generic server action (`takeWorkflowAction`) with the step ID and action key. The button labels and any required input fields (comment, rejection reason, etc.) come from the action definitions in PRD §9.

| Action (PRD §9) | UI |
|---|---|
| Approve | Button + optional comment |
| Reject | Button + required predefined reason picker + required notes |
| Complete | Button + optional comment |
| Acknowledge | Button |
| Request More Info | Button + required question |
| Provide Info | Button + required answer |
| Return to Previous Step | Button + step picker (target restricted to step config) |
| Send to Requestor | Button + optional message |
| Reassign | Button + user picker |
| Put On Hold | Button + required hold reason picker + optional note |
| Resume | Button + optional note |

Same component for every form. Same wiring for every button.

**Cross-ref:** PRD §9.

### 2.5 FieldRenderer

One renderer per field type from PRD §5.3. The `FormRenderer` resolves the field type and delegates. Each renderer handles read-mode and edit-mode separately based on the per-step field state.

| Field Type | Renderer |
|---|---|
| Short text | `ShortTextField` |
| Long text | `LongTextField` |
| Number | `NumberField` |
| Date / Date-time | `DateField` |
| Dropdown | `DropdownField` |
| Multi-select | `MultiSelectField` |
| Checkbox | `CheckboxField` |
| File upload | `FileUploadField` |
| User picker | `UserPickerField` |
| Multi-user picker | `MultiUserPickerField` |
| Request link | `RequestLinkField` |
| **Scored matrix** | `ScoredMatrixField` |
| **Repeater** | `RepeaterField` |
| **Lookup** | `LookupField` |
| Section header | `SectionHeaderField` (display only) |
| Computed | `ComputedField` (display only) |

**Repeater rendering.** The `RepeaterField` renders an Add/Remove/Reorder list of row instances. Each row delegates to a nested set of `FieldRenderer` instances for its sub-fields. The sub-field definitions come from the repeater's own `config.subFields`, not from the form's top-level field list. Per-step state and visibility on the *repeater container itself* govern whether the whole repeater is editable, visible, or hidden — sub-fields and rows always inherit the container's state. Min/max row counts come from the repeater config and are validated client-side and server-side.

**Lookup rendering.** The `LookupField` calls a server endpoint to resolve its source on every input-field change during edit mode. The endpoint takes the lookup's source config plus the current values of the `dependsOn` fields and returns the resolved value or option list. **In view mode, the field reads the captured value from the request's field history** — never live-resolves the lookup. This is what makes historical reads stable.

**Computed field rendering.** The `ComputedField` renders the value the engine computed at the most recent action. The renderer never evaluates the formula client-side; it always reads the engine's resolved value from field history. (The formula engine is server-side only; the UI is purely a display surface.)

**`ScoredMatrixField` is what CM users will recognize as the "risk matrix"**. It is not a CM component. Any form can use it — for likelihood × impact, severity × probability, complexity × urgency, etc. The dimensions and labels are configured per form.

**`RequestLinkField` is what CM users will recognize as the "parent CR picker"**. Any form can use it. The target form, cardinality, and parent-gating are configured per form.

There are no `RiskMatrix`, `MaintenanceWindowPicker`, `PIRForm`, or `ChildRequestsPanel` components. They were CM-specific names for things that are now generic field renderers (or generic patterns of field renderers, like "PIR form fields" being a set of LongText + Dropdown + Checkbox renderers grouped by section in the form definition).

### 2.6 FormRenderer

Renders an entire form (every visible field) given a Request and a step context. Honors:
- Per-step field state (Editable / Visible / Hidden) from PRD §5.5
- Runtime visibility conditions from PRD §5.4 (hidden always wins; PRD §5.5 clarification)
- The current user's permissions
- Form sections and ordering

Used in three modes:
- **Create mode** — submitting a new request
- **View mode** — reading an existing request
- **Edit mode** — taking an action that requires field changes (e.g., risk assessment, PIR, scheduled date)

### 2.7 CommentThread

A Jira-style thread (PRD §15.2). General comments do not affect workflow state. Files can be attached. Comments are append-only. Same component for every request type.

**Cross-ref:** PRD §15.

### 2.8 WatcherPanel

Renders the current watcher list for a request and exposes the management surface (PRD §14.4). Lives on the request detail page, in the right column, beneath the action panel and people block.

**Display:**
- List of current watchers with avatars, name, source badge (Self / Implicit / Manual / Subscription)
- "Watch this request" button if the current user is not already a watcher (subject to view permission)
- "Stop watching" button if the current user is a watcher (with a tooltip explaining the requestor cannot stop watching their own request)
- For form owners and admins: an "Add watcher" button that opens a user picker

**Per-form channel preferences:**
- A separate `WatcherChannelPreferences` settings page lists every form the user is watching and lets them set channels per form (in-app / email / both / muted)
- Accessed from the user's profile menu under "Notification Preferences"

**Form-level subscription editor:**
- Form owners see a "Subscriptions" tab on the form definition page
- Lists current `WatcherSubscription` rows with the role, who added them, and an enable/disable toggle
- Add button takes a role picker

Watcher add/remove actions appear in the request's audit timeline (§2.3) but are visually distinguished from workflow actions — they are *administrative* actions, not workflow decisions.

**Cross-ref:** PRD §14.4.

### 2.9 Dashboard / Widget

A dashboard is a configured collection of widgets. Each widget is one of a small set of widget types, each backed by a query against the canonical state model:

| Widget Type | Backing Query |
|---|---|
| `pipeline_funnel` | count of requests grouped by status, scoped by form/role |
| `outcome_breakdown` | count of CLOSED/CANCELLED requests grouped by outcome over a window |
| `my_pending_actions` | requests with an active step assigned to the current user |
| `currently_on_hold` | requests in ON_HOLD grouped by hold reason |
| `sla_health` | requests with SLA on-track / at-risk / breached counts |
| `volume_over_time` | request submission counts grouped by interval |
| `recent_failures` | requests closed with a non-successful outcome over a window |
| `upcoming_scheduled` | requests with a scheduled start in the next N days |

Built-in dashboards are rows in a `dashboard` table seeded with widget configurations. The seed file [`workflow-seed.md`](../workflow-seed.md) defines the CM executive dashboard as one such row. Custom dashboards are created in Phase 05 via an admin UI.

In Phase 03, the dashboard renderer ships with all widget types implemented. Only seeded dashboards can be viewed; admin composition comes in Phase 05.

**Cross-ref:** PRD §20.4.

---

## 3. Permission Protection

Every page that displays request data goes through the standard TechHub server-component permission check pattern (CLAUDE.md):

1. Server component checks `requireFeature("WORKFLOW_ENGINE")` first
2. Then checks `requirePermission(...)` for the relevant permission
3. Only then renders the client component with the data

For request-specific pages, the relevant permission is one of the form's declared view permissions. Since CM permissions are seeded (Phase 02), the same generic check works for any form — the form definition declares which permission key gates view access.

Action buttons on the action panel are also permission-gated server-side, even though client-side gating exists for UX. Defense in depth (CLAUDE.md).

**Cross-ref:** PRD §24, CLAUDE.md "Route Protection".

---

## 4. Sidebar Navigation

The main app sidebar has a "Requests" group whose contents are generated from:
1. The list of forms the current user has view permission for
2. Optional pinned dashboards
3. Optional pinned filtered list views (future enhancement)

When the system has only the four built-in CM forms seeded, the sidebar shows them under "Change Management". When other modules add forms (Access Requests, Vendor Onboarding), they appear in the same sidebar without any sidebar code changes — purely because they are seeded forms.

---

## 5. UX Principles

These are inherited from the original UI plan and remain valid post-refactor:

1. **Status is always visible.** Every reference number link shows a status badge. Outcome shown when final. Hold reason shown when on hold. Never make users click to find out.
2. **Action-first design.** When a user has a pending task, the ActionPanel and the actions bar are the most prominent things on the page.
3. **SLA always visible.** SLA countdowns shown inline in list rows and as a colored ribbon in detail headers. Red = breached, amber = at risk, green = on track.
4. **Workflow transparency.** Anyone with view access can see the full timeline: who approved, who rejected, what they wrote.
5. **No dead ends.** Every rejection, failure, cancellation shows a clear message explaining what happened and what options are available. Resubmission paths are surfaced explicitly.
6. **Generic by default.** If a CM-specific UI choice is being made, the question to ask first is *"could every other form benefit from this?"* — if yes, build it as a generic surface in this phase. If no, push back on whether the choice is actually needed.

---

## 6. What This Phase Does NOT Build

- The form builder (Phase 05)
- The workflow builder (Phase 05)
- Custom dashboard composition UI (Phase 05; built-in seeded dashboards are viewable in Phase 03)
- Admin override UIs (Phase 04)
- Email template builder (Phase 05; templates are seeded in Phase 02)
- Mobile-specific layouts
- Any per-form bespoke component. **If a designer asks for a "Change Management dashboard widget that does X," the answer is "is X useful for any other form? If yes, generic widget. If no, is X really needed?"**

---

## 7. Acceptance Criteria

- The CM list page (`/change-management`) renders entirely from `RequestList` with no CM-specific component file
- The CM detail page (`/change-management/[id]`) renders entirely from `RequestDetail` with no CM-specific component file
- Adding a new field to the CR form via seed re-run causes that field to appear in the detail view immediately, with no UI code change
- The workflow timeline correctly renders an Emergency change with parallel branches, a hold/resume cycle, and SLA bars from real audit data
- Action buttons on a Normal change come from the workflow definition, not from a hardcoded array
- A viewer-only user sees no action buttons but can read the full timeline and history
- A second non-CM form (Access Request, per the validation pilot) renders correctly through the same generic components, end-to-end, without any additional UI code
- A test form using a Repeater field with three sub-field types renders, lets the requestor add/remove rows, and persists every row's values
- A test form using a Lookup field whose source depends on another field re-resolves on input change in edit mode and reads the captured value in view mode
- A computed field renders the value the engine resolved at the most recent action, never re-evaluating client-side
- The WatcherPanel correctly lists watchers, supports self-add/self-remove, and respects per-form channel preferences when notifications fire
- `npm run validate` passes

If a generic component requires special-casing for a specific form to render correctly, the abstraction is wrong — fix the component, don't add the special case.
