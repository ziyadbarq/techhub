# Seed Idempotency — Rules & Pattern

**Phase:** [02-seed-and-cm](./README.md)
**Status:** Reference for engineers writing seed factories. Aligned to [PRD.md](../PRD.md) and [docs/guides/DATABASE_SEEDING.md](../../../docs/guides/DATABASE_SEEDING.md).

---

## Purpose

Phase 02's seed runner must be **fully idempotent**: running `npm run db:seed` repeatedly (on a fresh DB, on a seeded DB, or on a DB with in-flight Requests) must produce the same final state without errors, duplicates, or data loss.

This document specifies the idempotency pattern every seed factory follows and the invariants every seed run must respect. If a factory cannot meet these rules, **the seed design is wrong** — fix the approach, don't add exceptions.

---

## 1. The Five Rules

1. **Never wipe user-generated data.** Seed runs touch only seeded rows, identified by their stable `seed_slug`. Running the seed on a production DB with thousands of live Requests is safe.
2. **Never delete seeded rows the caller no longer declares.** Removing a Form or Workflow from the seed code does *not* delete existing rows. Removal is a deliberate migration, not a side effect.
3. **Respect version pinning.** Existing Requests are pinned to a specific `FormVersion` / `WorkflowVersion`. Seeds never mutate a published version (database trigger enforces this — see [00-foundation/database-triggers.md §2](../00-foundation/database-triggers.md)). Seeds may *publish a new version* and retire the old one by marking it `ARCHIVED`.
4. **Deterministic IDs.** Every seeded row uses a deterministic CUID2 derived from its `seed_slug`, not a random one. Two runs produce the same IDs. This is critical for relation resolution across factories.
5. **Composable, not ordered.** Factories declare dependencies (Calendar → MaintenanceWindow → Form → FormVersion → WorkflowDefinition → WorkflowVersion → Form.associatedWorkflowId). The seed runner topologically sorts them. Factory authors never rely on execution order.

---

## 2. The `seed_slug` Convention

Every seeded entity has a `seed_slug` column (`TEXT NOT NULL UNIQUE` within its table):

| Entity | Example slugs |
|---|---|
| Form | `form.change-request`, `form.access-request`, `form.incident-request`, `form.customer-feedback` |
| WorkflowDefinition | `workflow.standard-change`, `workflow.normal-change`, `workflow.emergency-change` |
| Calendar | `calendar.saudi-standard`, `calendar.twenty-four-seven` |
| MaintenanceWindow | `window.weekly-standard`, `window.monthly-extended` |
| BlackoutPeriod | `blackout.ramadan-freeze`, `blackout.year-end-freeze` |
| HoldReason | `hold.awaiting-info`, `hold.awaiting-cab` |
| RejectionPolicy | `policy.default`, `policy.standard-correction`, `policy.emergency-correction` |
| EmailTemplate | `template.step-activated`, `template.decision-taken` |
| Permission | `changes:view`, `changes:approve` (slug == permission key) |
| Role | `role.change-manager`, `role.cab-member`, `role.ci-owner`, `role.service-owner` |

Slugs are **stable forever**. Renaming a slug is a data-migration operation, not a seed edit.

---

## 3. The Upsert Pattern

Every factory implements the same shape:

```ts
async function seedCalendar(input: CalendarSeedInput): Promise<Calendar> {
  return prisma.calendar.upsert({
    where: { seedSlug: input.seedSlug },
    create: {
      id: deterministicId(input.seedSlug),   // CUID2 derived from slug
      seedSlug: input.seedSlug,
      name: input.name,
      workingHours: input.workingHours,
      holidays: input.holidays,
      // …
    },
    update: {
      // Safe fields only. Never include anything a user might have customized.
      name: input.name,
      workingHours: input.workingHours,
      holidays: input.holidays,
    },
  });
}
```

**Safe update fields:** values the seed owns authoritatively and admins are expected to override via the admin UI (Phase 05) if they diverge. Examples: calendar contents, email template bodies, hold reason labels.

**Unsafe update fields:** anything tied to an in-flight state. Never in an `update` clause:

- `Form.active_form_version_id`
- `WorkflowDefinition.active_workflow_version_id`
- `Request.*` (seeds never touch requests)
- Anything on a `_versions` row with `state = 'PUBLISHED'` (the trigger will reject it)

---

## 4. Form and Workflow Version Seeding

Forms and Workflows are the two complicated cases because they are versioned (PRD §6.3). The pattern:

1. **Upsert the parent definition** (`Form` or `WorkflowDefinition`) keyed by `seed_slug`.
2. **Compute a content hash** of the version body (fields + per-step field state + visibility rules for Form; steps + routing + SLA + assignees for Workflow).
3. **Look up the latest `PUBLISHED` version for that parent.**
4. **If the hash matches** the latest published version: do nothing — the seed is already live.
5. **If the hash differs:**
   - Insert a **new `DRAFT`** version row with the new content.
   - Call the publish use case (not a direct SQL update) — publishing atomically flips `DRAFT → PUBLISHED` and updates `active_form_version_id` / `active_workflow_version_id` on the parent.
   - Leave the old version as `PUBLISHED` (or `ARCHIVED` if the seed explicitly archives it). In-flight Requests remain pinned to their version and keep running correctly.

This is the **only** legal way to update a seeded Form or Workflow. Never `UPDATE form_versions SET ...` on a published row — the [trigger](../00-foundation/database-triggers.md) will reject it.

---

## 5. Deterministic ID Derivation

Deterministic IDs make cross-factory joins trivial: factory B references factory A's rows by calling `deterministicId("form.change-request")` without needing to await factory A's result.

```ts
// Pseudocode — real implementation lives in the seed factory utilities folder.
function deterministicId(seedSlug: string): string {
  // CUID2-compatible 24-char output derived from a stable hash of the slug.
  // The engine's IIdGenerator offers a deterministic variant for seeds.
  return idGenerator.deriveDeterministic(`wf-seed:${seedSlug}`);
}
```

The `wf-seed:` prefix guarantees collision-free coexistence with runtime-generated CUID2 IDs.

---

## 6. Permissions and Roles

Engine permissions are seeded in Phase 00 (see [reference/techhub-integration-map.md §4](../reference/techhub-integration-map.md)). Phase 02 seeds:

- **Module permissions** (`CHANGES_*`) via upsert keyed by the permission string itself.
- **Built-in roles** via upsert keyed by `seed_slug`. The role→permission mappings are expressed declaratively in the seed and re-applied on every run. A user manually added to a seeded role via the admin UI is preserved.
- **Default role assignments** for the initial admin user are **not** part of the engine seed — they come from the existing TechHub user seed.

---

## 7. Watcher Subscriptions

Seeded `WatcherSubscription` rows use a composite `seed_slug` like `subscription.form.change-request.role.change-manager`. Upserts preserve any `enabled = false` flip an admin made.

---

## 8. Rollback Strategy

There is no "un-seed" operation. If a seeded row must be removed from the product, the migration is:

1. Mark the seed entry as deprecated in the seed code.
2. Write a one-off migration script that archives the row (`state = 'ARCHIVED'` for versions, or a soft-delete equivalent).
3. Ship the migration as a normal DB migration, not as a seed change.

This keeps the seed purely additive and avoids the "old seed runs on a new deployment and resurrects deleted rows" class of bugs.

---

## 9. Testing

Acceptance tests per [02-seed-and-cm/README.md](./README.md):

- Run seed twice on a fresh DB. Assert row counts are identical between runs.
- Run seed on a DB with 100 in-flight Requests. Assert zero Requests mutated.
- Modify one field in a seeded Form's content (add a field, change a label) — run seed — assert a new FormVersion exists, the old one is preserved, and the Form's `activeFormVersionId` points to the new one.
- Assert no `UPDATE` ever touches a `form_versions` or `workflow_versions` row whose `state = 'PUBLISHED'` (verified by enabling the immutability trigger before the test run).
- Assert seed completes in a single transaction: if any factory fails, the entire run rolls back.
