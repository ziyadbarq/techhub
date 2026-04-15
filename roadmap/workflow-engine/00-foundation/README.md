# Phase 00 — Foundation

**Goal:** lay the data model, permissions, and feature flag scaffolding that everything else stands on. No runtime behavior yet.

---

## Scope

1. **Prisma schema for the workflow engine.** Forms, fields, workflow definitions, workflow versions, workflow instances, step instances, audit entries, field history, assignee snapshots, request links, calendars, maintenance windows, blackout periods, hold reasons, rejection policies, email templates, delegations.
2. **Database-level invariants.** Where Postgres can enforce engine invariants (PRD §22) directly — NOT NULL where required, atomic constraint checks for the three-field state model, foreign keys for request links, append-only audit tables — do it at the DB layer, not in application code.
3. **Permissions seed.** Engine-level permissions from PRD §24.1 (`FORMS_*`, `WORKFLOW_DEFINITIONS_*`, `WORKFLOW_INSTANCES_*`, `CALENDARS_*`, `EMAIL_TEMPLATES_*`, `DELEGATIONS_*`, `DASHBOARDS_*`). Module permissions (e.g., `CHANGES_*`) are owned by the seed system in Phase 02, not Phase 00.
4. **Feature flag.** `WORKFLOW_ENGINE` flag, off by default until the rest of the phases are usable.
5. **CUID2 IDs and reference number generator skeleton.** Honor PRD §21 reference number formats as a per-form setting.

## Out of Scope

- Workflow runtime (Phase 01)
- Any seed beyond engine permissions and the feature flag (Phase 02)
- UI of any kind (Phase 03)
- Any Change Management-specific entity. **There are no CM-specific tables in this phase.** Change Management is built entirely on the generic engine tables in Phase 02.

## Key Documents

- [`database-schema.md`](./database-schema.md) — entity-by-entity schema reference, aligned to the sealed PRD
- [PRD §5–§6](../PRD.md) — forms, fields, workflow definitions
- [PRD §10](../PRD.md) — three-field state model and its invariants
- [PRD §22](../PRD.md) — engine invariants that must be enforced at the data layer
- [PRD §24.1](../PRD.md) — engine permissions

## Acceptance Criteria

- `npx prisma migrate dev` runs cleanly on a fresh DB
- `npx prisma migrate status` is clean
- All engine-level permissions from PRD §24.1 are seeded
- The `WORKFLOW_ENGINE` feature flag exists and is off by default
- `npm run validate` passes (type-check + lint + tests)
- A unit test demonstrates that the three-field state invariants reject invalid writes at the data layer
- No CM-specific Prisma models exist in this phase

