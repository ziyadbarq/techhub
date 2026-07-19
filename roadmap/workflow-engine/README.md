# Workflow Engine — Planning Index

A **native enterprise workflow engine** inside TechHub, plus **Change Management** as its first consumer. The engine is fully generic; Change Management is just seed data on top of it. Heavily influenced by ServiceNow, Jira, and GravityForms/GravityFlow.

---

## Read in This Order

1. **[reference/glossary.md](./reference/glossary.md)** — canonical definitions. Read first so every other doc means the same thing.
2. **[PRD.md](./PRD.md)** — the sealed product spec. Source of truth for what the engine does and the rules it enforces. No further changes.
3. **[reference/techhub-integration-map.md](./reference/techhub-integration-map.md)** — how the engine maps onto TechHub's 5-layer Clean Architecture, DI tiers, permissions, feature flags, and existing modules. Read before Phase 00 starts.
4. **Phase folders, in order** — each phase folder has its own `README.md` with scope, dependencies, key documents, and acceptance criteria.
5. **[reference/access-request-pilot.md](./reference/access-request-pilot.md)** — validation pilot proving the engine generalizes beyond Change Management. Optional but reassuring.
6. **[reference/techhub-feature-integration.md](./reference/techhub-feature-integration.md)** — *forward-looking.* Which TechHub features benefit from the engine, the "action gating" gap (hold an action in DRAFT until approved, then replay it), and a sketch of a future Phase 06 — Action Gateway. **Not part of the sealed PRD.**

---

## Phase Map

Six phases, one subfolder each. Scope/acceptance criteria live inside every phase's `README.md`.

| # | Phase | Folder | One-line Goal |
|---|---|---|---|
| 00 | **Foundation** | [`00-foundation/`](./00-foundation/) | Data model, permissions, feature flag — no runtime behavior yet |
| 01 | **Engine Core** | [`01-engine-core/`](./01-engine-core/) | Make the engine actually run — submit, advance, audit, all without UI |
| 02 | **Seed & CM** | [`02-seed-and-cm/`](./02-seed-and-cm/) | Load all four CM forms and three workflows as **pure seed data** on the generic engine — zero CM-specific runtime code |
| 03 | **Generic Request UI** | [`03-ui/`](./03-ui/) | List, detail, timeline, dashboards — all generic, all driven by form/workflow definitions |
| 04 | **Advanced Engine** | [`04-advanced-engine/`](./04-advanced-engine/) | SLA escalation cron, notifications, email action tokens, webhooks, sub-workflows, bulk ops |
| 05 | **Builders** | [`05-builders/`](./05-builders/) | Form builder + workflow builder + reference data editors. The hardest UI in the project — comes last, on purpose |

**Hard ordering:** 00 → 01 → 02 must be sequential. 03 can start once 02 is shippable. 04 is post-MVP. 05 should not start until everything else is stable in production.

**MVP = Phases 00 → 03.** Change Management is production-ready at the end of Phase 03.

---

## Folder Layout

```
roadmap/workflow-engine/
├── README.md                          # this file — index + reading order
├── PRD.md                             # sealed product spec
│
├── 00-foundation/                     # data model, permissions, feature flag
│   ├── README.md
│   ├── database-schema.md
│   └── database-triggers.md
│
├── 01-engine-core/                    # runtime: executors, services, DSL
│   ├── README.md
│   └── engine-core.md
│
├── 02-seed-and-cm/                    # CM as pure seed data
│   ├── README.md
│   ├── workflow-seed.md
│   └── seed-idempotency.md
│
├── 03-ui/                             # generic read-side UI
│   ├── README.md
│   └── ui-plan.md
│
├── 04-advanced-engine/                # post-MVP: SLA cron, notifications, webhooks
│   └── README.md
│
├── 05-builders/                       # no-code form + workflow builders
│   └── README.md
│
└── reference/                         # cross-phase artifacts
    ├── glossary.md
    ├── techhub-integration-map.md
    └── access-request-pilot.md
```

---

## Architectural Principle

> Change Management is **not a separate module**. It is four built-in forms, three built-in workflows, and supporting seed data on top of a fully generic Workflow Engine.

Every PRD section, every phase folder, and every implementation choice should be checked against this principle. If you find yourself writing a CM-specific entity, repository, or service, **stop** — the behavior belongs in the generic engine plus seed data, or it doesn't belong at all.

The end state, several phases out: the engine supports access requests, vendor onboarding, purchase approvals, HR onboarding, compliance reviews, and anything else a Barq team wants to model — without any code changes, just new forms and workflows.
