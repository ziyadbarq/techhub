# Phase 02 — Seed System & Built-in Change Management

**Goal:** load the entire built-in Change Management configuration as **seed data** on top of the generic engine from Phase 01. Zero CM-specific runtime code, zero CM-specific tables, zero CM-specific business logic. Everything is generic engine + seed.

---

## Scope

1. **Seed runner** — a generic system that loads forms, workflows, calendars, maintenance windows, blackout periods, hold reasons, rejection policies, email templates, permissions, and roles from declarative seed data. Idempotent (safe to re-run).
2. **Seed factories** — one per entity type. Compose into a complete seed set.
3. **Built-in business calendars** — Saudi Standard, 24/7. Per [`workflow-seed.md`](./workflow-seed.md) §2.
4. **Built-in maintenance windows** — Weekly Standard Window, Monthly Extended Window. Per workflow-seed.md §3.
5. **Built-in blackout periods** — Ramadan Freeze, Year-End Freeze, Hajj Freeze. Per workflow-seed.md §4.
6. **Built-in hold reasons** — the generic list from PRD §10.3 / workflow-seed.md §5.
7. **Built-in CR / AR / IR / CFR forms** — exactly as specified in workflow-seed.md §6. These are rows in the generic `forms` table created in Phase 00, not new tables.
8. **Built-in Standard / Normal / Emergency workflows** — exactly as specified in workflow-seed.md §7. Rows in the generic `workflow_definitions` table, not new tables.
9. **Risk fields and PIR fields** — added to the relevant forms with per-step field state (workflow-seed.md §6.6, §6.7).
10. **Built-in rejection policies** — Default, Standard Correction, Emergency Correction. Per workflow-seed.md §8.
11. **Built-in email templates** — per workflow-seed.md §9.
12. **CM permissions and role mappings** — declared by this seed (NOT engine-level). Per workflow-seed.md §10.
13. **Module-declared intermediate statuses and outcomes** — APPROVED, SCHEDULED, FAILED, ROLLED_BACK, PIR_PENDING; ROLLED_BACK, PARTIALLY_ROLLED_BACK, DEFERRED outcome additions. Per PRD §23.2 / §23.3.
14. **Reference number formats** — CR/AR/IR/CFR formats per PRD §21, declared as form-level configuration.

## Out of Scope

- Any new Prisma model or runtime service. This phase is **declarative seed data only**.
- UI for managing seeds (Phase 03 covers the read views; admin edit UIs are part of the builders in Phase 05)
- A second module (e.g., Access Requests) — pilot that as a separate seed file later, after the engine is proven by CM
- PIR reminder cron — the SLA escalation rules in the seed declare the ladder; the cron that fires it lives with the SLA infrastructure in Phase 04 or wherever notifications land

## Key Documents

- [`workflow-seed.md`](./workflow-seed.md) — **the source of truth** for everything in this phase. If a question isn't answered there, the answer is "follow the engine defaults."
- [`seed-idempotency.md`](./seed-idempotency.md) — the upsert pattern, deterministic IDs, and how seeds interact with version-pinning on in-flight Requests
- [`../reference/techhub-integration-map.md`](../reference/techhub-integration-map.md) §6 — how engine seeding plugs into the existing TechHub seed system
- [PRD §23](../PRD.md) — Change Management overview, intermediate statuses, intermediate outcomes
- [PRD §10.1](../PRD.md) — module-declared intermediate statuses mechanism
- [PRD §22](../PRD.md) — engine invariants the seeded data must respect

## Acceptance Criteria

- `npm run db:seed:dev` produces a database with all four CM forms, three workflows, calendars, windows, blackouts, rejection policies, email templates, and CM permissions installed
- Seed is idempotent: running twice produces no errors and no duplicates
- A test creates a Normal Change request through the seeded workflow end-to-end (submit → risk → approvals → schedule → execute → PIR → close) using only the generic engine APIs from Phase 01
- A test creates an Emergency Change request and verifies parallel approval + auto-approval on SLA timeout
- A test creates a CR with linked AR/IR/CFR children and verifies parent cancel cascade
- No file in `src/core/use-cases/changes/`, `src/core/domain/entities/change-request.entity.ts`, or any other CM-specific runtime path. **If you find yourself writing CM-specific code in this phase, stop and put the behavior in the seed instead.**
- `npm run validate` passes

## The Hard Rule of This Phase

> If any CM behavior cannot be expressed using the generic engine plus seed data, that's a gap in Phase 01 — fix it there, not here.

This is the test of whether the engine refactor actually held up. If the test passes, Phase 02 is small. If the test fails, we learn early.
