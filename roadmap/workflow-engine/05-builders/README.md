# Phase 05 — Form Builder & Workflow Builder

**Goal:** the no-code builders that make the entire system actually self-service. Until this phase lands, every change to a form or workflow requires a developer (or seed re-run). After this phase, admins do it themselves.

This is the most ambitious UI in the entire project and the hardest one to get right. **Do not start until Phases 00–03 are stable in production**, and ideally not until Phase 04's notifications layer is in place — admins will want to wire up email templates from the builder.

---

## Scope

### 5.1 Form Builder

A drag-and-drop or list-based editor for creating and editing forms.

1. **Field palette** — every field type from PRD §5.3, including Request link and Scored matrix.
2. **Field configuration panel** — name, label, required, default value, validation, format-specific options.
3. **Conditional visibility editor** — UI for the rules from PRD §5.4. Visual rule builder, not a code DSL.
4. **Per-step field state matrix editor** — the (field × step) grid from PRD §5.5. Authoring-time validation prevents the "hidden + editable" conflict.
5. **Section headers and layout** — sections, columns, dividers.
6. **Form settings** — owners, active toggle, reference number format (PRD §21), associated workflow.
7. **Linked-request configuration** — target form, cardinality, required, parent gate (PRD §6.4).
8. **Cascade rules editor** — close gate and cancel cascade settings (PRD §6.4).
9. **Preview mode** — render the form as a requestor would see it, at any step.
10. **Draft / Publish** — every save is a draft; explicit Publish action makes it live. Versioning per PRD §6.3 (forms live alongside workflows in immutable published versions).

### 5.2 Workflow Builder

A visual graph editor for designing workflows.

1. **Step palette** — every step type from PRD §7, including Schedule.
2. **Graph canvas** — drag steps, connect routing edges, see the workflow at a glance.
3. **Step configuration panel** — name, type, single/parallel policy (PRD §8), assignees (PRD §12), available actions (PRD §9), per-step field state, SLA configuration (PRD §13), routing on each action outcome.
4. **Conditional branch editor** — visual rule builder for routing on field values, including scored matrix routing (PRD §6.5).
5. **Schedule step configuration** — calendar, allowed windows, blackout behavior, lead time (PRD §7.8).
6. **SLA configuration UI** — calendar reference, thresholds, escalation actions (PRD §13.2).
7. **Rejection Policy editor** — form-level setting (PRD §11.1), edited from the workflow context for convenience.
8. **JSON ↔ Graph round-trip** — workflows are stored as JSON; the visual editor serializes/deserializes losslessly.
9. **Schema validation** — every save validates the workflow against the engine schema before allowing publish (no orphan steps, no broken routing, no missing required fields).
10. **Draft / Publish** — same versioning model as forms.

### 5.3 Reference Data Builders

Lighter-weight admin UIs for the supporting reference data:

11. **Calendar editor** — working days/hours, holidays (PRD §13.1).
12. **Maintenance window editor** — recurrence, time ranges (PRD §7.8 / workflow-seed.md §3).
13. **Blackout period editor** — date ranges, reasons.
14. **Email template editor** — visual or code editor with the dynamic variables from PRD §14.3, action button embedding (PRD §14.2).
15. **Hold reason editor** — admin-managed list per PRD §10.3.
16. **Rejection policy editor** — standalone editor; policies are referenced by forms.

## Out of Scope

- The runtime everything is built on (Phase 01)
- The seed system that loads built-in data (Phase 02) — builders edit *user-created* forms/workflows; the built-in CM forms remain seed-managed (admins clone them to customize)
- Cross-cutting reporting and analytics (later)

## Dependencies

- All earlier phases must be production-stable
- Phase 04 notifications layer should ideally be in place so the email template builder has somewhere to wire into
- This phase will surface gaps in the engine (Phase 01) — expect a small Phase 01 follow-up after the builders ship

## Key Documents

- [PRD §5](../PRD.md) — forms and field types (form builder spec)
- [PRD §6](../PRD.md) — workflow definitions and versioning (workflow builder spec)
- [PRD §7](../PRD.md) — step types
- [PRD §8 / §9 / §11 / §12 / §13](../PRD.md) — everything the builders configure
- [PRD §14.3](../PRD.md) — email template builder

## Acceptance Criteria

- An admin can create a brand-new form with at least 5 field types, define visibility conditions, and publish it through the form builder UI alone — no developer involvement
- An admin can create a brand-new workflow with at least 6 steps including a parallel branch, a conditional branch, and an SLA escalation, and publish it through the workflow builder UI alone
- An admin can build the equivalent of one of the built-in CM workflows from scratch, in the builder, in under one hour. (This is the real test that the builders are usable.)
- Workflow JSON ↔ graph round-trip is lossless: import a built-in workflow JSON, render it in the editor, export it, and assert byte equivalence
- Schema validation rejects an invalid workflow with a clear error message
- An admin can build a second non-CM form (e.g., Access Request) using only the builders, end-to-end, with no developer help
- `npm run validate` passes

## Why This Is Last

Builders are seductive — they look like the most exciting part of the system. They are also the part most likely to fail or take 4× the estimated time. By the time you build them, you'll know exactly what configuration surface needs to be exposed because you'll have lived with the engine for months. **Building them earlier is the single biggest scope risk in the project.**
