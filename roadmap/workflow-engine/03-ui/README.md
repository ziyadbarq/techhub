# Phase 03 — Generic Request UI

**Goal:** ship the read-side UI: list, detail, timeline, dashboards, action panels. All views are generic — they read from the form definition and the workflow timeline; there is no per-form view code.

---

## Scope

1. **Request list view** (PRD §20.1) — filterable, sortable, exportable. Same component for every form. A form-specific list page is just the generic list scoped to one form.
2. **Request detail view** (PRD §20.2) — two-column layout. Left: form fields rendered from the form definition + per-step field state matrix. Right: workflow timeline + action panel + people.
3. **Workflow timeline component** (PRD §20.3) — reads from the audit trail and assignee snapshots. Renders parallel branches, on-hold events, SLA bars.
4. **Action panel** — contextual; shows the actions the current step exposes (PRD §9) filtered by the current user's permissions. The action buttons are not hardcoded per form.
5. **Dashboards** (PRD §20.4) — generic widget renderer. Built-in widget types: pipeline funnel, outcome breakdown, my pending actions, currently on hold, SLA health, volume over time, recent failures, upcoming scheduled.
6. **Maintenance windows view** — for any team configuring scheduling. Read view for now; edit comes with builders in Phase 05.
7. **Workflow definitions view** — read-only viewer for any user with `WORKFLOW_DEFINITIONS_VIEW`. Shows the step graph, assignees, SLAs. Edit happens in the builder (Phase 05).
8. **Form rendering** — fields rendered according to the per-step field state matrix (PRD §5.5) and runtime visibility conditions (PRD §5.4). The form renderer is the same for every form.
9. **Permission-protected routes** — every page uses the existing `requirePermission()` server action pattern. No client-side-only checks.
10. **Sidebar navigation** — entries for the built-in CM forms come from seed; the sidebar is configurable per role.

## Out of Scope

- Form builder (Phase 05)
- Workflow builder (Phase 05)
- Email templates with action buttons (Phase 04 or wherever notifications land)
- Custom dashboard composition UI — built-in dashboards in this phase are seeded; admin composition comes later
- Mobile-specific layouts

## Key Documents

- [`ui-plan.md`](./ui-plan.md) — generic UI component reference: RequestList, RequestDetail, WorkflowTimeline, ActionPanel, FieldRenderer, FormRenderer, Dashboard widgets
- [PRD §20](../PRD.md) — generic request UI specification (single source of truth)
- [PRD §5.4 / §5.5](../PRD.md) — field visibility and per-step state
- [PRD §9](../PRD.md) — actions reference
- [PRD §17](../PRD.md) — audit trail (drives the timeline)

## Acceptance Criteria

- The CM list page renders entirely from the generic list component, scoped to the four CM forms
- The CM detail page renders entirely from the generic detail component, with no CM-specific form code
- The workflow timeline correctly renders a Normal change with its parallel branches, hold events, and SLA bars from real audit data
- Action buttons on the detail page come from the workflow definition, not from a hardcoded array
- A test verifies that adding a new field to a form (via seed re-run) shows up in the detail view immediately, with no UI code change
- A test verifies that a viewer-only user sees no action buttons but can read the full timeline
- `npm run validate` passes

