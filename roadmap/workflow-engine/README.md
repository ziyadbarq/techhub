# Workflow Engine — Planning Index

A **native enterprise workflow engine** inside TechHub, plus **Change Management** as its first consumer. The engine is fully generic; Change Management is just seed data on top of it.

---

## Documents at this Level

| File | What's In It |
|---|---|
| **[PRD.md](./PRD.md)** | The product spec — what the engine does, how it should behave, the rules it enforces. **Sealed** — no further changes. The single source of truth for engine behavior. |
| **[workflow-seed.md](./workflow-seed.md)** | The complete reference for what ships inside the box on day one — every built-in form, workflow, calendar, window, blackout, rejection policy, email template, permission, and role. The source of truth for "what is Change Management." |
| **[access-request-pilot.md](./access-request-pilot.md)** | Validation pilot proving the engine generalizes beyond Change Management. Read this if you want to understand why CM is "just seed data" and not a privileged module. |

Read PRD.md first. workflow-seed.md is the companion. The pilot is optional but reassuring.

---

## Phase Map

The project is organized into six phases, one per subfolder. Each phase has its own README with scope, dependencies, key documents, and acceptance criteria.

| # | Phase | Folder | One-line Goal |
|---|---|---|---|
| 00 | **Foundation** | [`00-foundation/`](./00-foundation/) | Data model, permissions, feature flag — no runtime behavior yet |
| 01 | **Engine Core** | [`01-engine-core/`](./01-engine-core/) | Make the engine actually run — submit, advance, audit, all without UI |
| 02 | **Seed & CM** | [`02-seed-and-cm/`](./02-seed-and-cm/) | Load all four CM forms and three workflows as **pure seed data** on the generic engine — zero CM-specific runtime code |
| 03 | **Generic Request UI** | [`03-ui/`](./03-ui/) | List, detail, timeline, dashboards — all generic, all driven by form/workflow definitions |
| 04 | **Advanced Engine** | [`04-advanced-engine/`](./04-advanced-engine/) | SLA escalation cron, notifications, email action tokens, webhooks, sub-workflows, bulk ops |
| 05 | **Builders** | [`05-builders/`](./05-builders/) | Form builder + workflow builder + reference data editors. The hardest UI in the project — comes last, on purpose |

**Hard ordering:** 00 → 01 → 02 must be sequential. 03 can start once 02 is shippable. 04 is post-MVP. 05 should not start until everything else is stable in production.

---

## Architectural Principle

> Change Management is **not a separate module**. It is four built-in forms, three built-in workflows, and supporting seed data on top of a fully generic Workflow Engine.

Every PRD section, every phase folder, and every implementation choice should be checked against this principle. If you find yourself writing a CM-specific entity, repository, or service, **stop** — the behavior belongs in the generic engine plus seed data, or it doesn't belong at all.

The end state, several phases out: the engine supports access requests, vendor onboarding, purchase approvals, HR onboarding, compliance reviews, and anything else a Barq team wants to model — without any code changes, just new forms and workflows.

---

## Cleanup History (April 2026)

These files were deleted during the post-PRD-refactor cleanup because their content has been absorbed into PRD.md, workflow-seed.md, or per-phase READMEs:

- `CHANGE_MANAGEMENT.md` — CM as a separate module. Now seed data; see PRD §23 and workflow-seed.md.
- `WORKFLOW_DEFINITIONS.md` — built-in workflow JSON. Superseded by workflow-seed.md §7.
- `PERMISSIONS.md` — RBAC tables. Engine permissions in PRD §24.1; CM permissions in workflow-seed.md §10.
- `IMPLEMENTATION_PLAN.md` — master engineering plan. Replaced by per-phase READMEs in the numbered subfolders. Engine invariants previously listed here now live in PRD §22 (the canonical source). File-level implementation details will be added to per-phase READMEs as engineers actually start each phase, not before.

Three supporting specs were moved into phase folders and rewritten against the sealed PRD:

- `DATABASE_SCHEMA.md` → [`00-foundation/database-schema.md`](./00-foundation/database-schema.md)
- `ENGINE_CORE.md` → [`01-engine-core/engine-core.md`](./01-engine-core/engine-core.md)
- `UI_PLAN.md` → [`03-ui/ui-plan.md`](./03-ui/ui-plan.md)
