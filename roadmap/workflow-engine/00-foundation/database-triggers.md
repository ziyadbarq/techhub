# Database Triggers — Engine Invariant Enforcement

**Phase:** [00-foundation](./README.md)
**Status:** Reference for engineers writing the Prisma schema + migrations. Aligned to the sealed [PRD.md](../PRD.md).

---

## Purpose

PRD §22 lists engine invariants that must hold unconditionally. Some are enforced at the application layer (inside `IWorkflowEngineService` transactions); others belong at the database layer because they must hold even against direct SQL writes, admin queries, and future modules that may not go through the service.

This document specifies **every invariant that must be enforced by a database trigger or constraint** and how it is implemented. It is the companion to [`database-schema.md`](./database-schema.md) — schema defines the *shape*; this file defines the *immutable rules*.

---

## 1. Append-Only Tables

These tables accept `INSERT` only. `UPDATE` and `DELETE` raise an error.

- `audit_entries`
- `field_history_entries`
- `assignee_snapshots`
- `hold_events`
- `sla_events`

**Enforcement:** one Postgres trigger per table.

```sql
-- One function, reused by every append-only table.
CREATE OR REPLACE FUNCTION wf_enforce_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not permitted',
    TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_entries_append_only
  BEFORE UPDATE OR DELETE ON audit_entries
  FOR EACH ROW EXECUTE FUNCTION wf_enforce_append_only();

-- Repeat the trigger (not the function) for the other four tables.
```

**Why trigger, not `GRANT` revocation:** revocation can be bypassed by a superuser or a pooled service role that owns the table. A trigger runs on every write regardless of role.

**Admin override flow.** Admin overrides are **new `INSERT`s** that reference the overridden entry via `references_audit_entry_id`. They never mutate the original. See [engine-core.md §9](../01-engine-core/engine-core.md).

**Maps to:** PRD §22 invariants 9–10, PRD §17.

---

## 2. Published Version Immutability

Once a `form_versions.state` or `workflow_versions.state` row is `PUBLISHED`, the row's content columns cannot change.

**Rule:** any `UPDATE` that changes a content column on a row where `state = 'PUBLISHED'` (either before or after the update) raises an error. The only legal transition is `DRAFT → PUBLISHED`; going backwards is forbidden.

```sql
CREATE OR REPLACE FUNCTION wf_enforce_version_immutability()
RETURNS trigger AS $$
BEGIN
  IF OLD.state = 'PUBLISHED' AND NEW.state = 'PUBLISHED' THEN
    -- Content mutation on published row
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
      RAISE EXCEPTION 'Published % row % is immutable',
        TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  IF OLD.state = 'PUBLISHED' AND NEW.state <> 'PUBLISHED' THEN
    RAISE EXCEPTION 'Cannot un-publish % row %',
      TG_TABLE_NAME, OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_versions_immutable
  BEFORE UPDATE ON form_versions
  FOR EACH ROW EXECUTE FUNCTION wf_enforce_version_immutability();

CREATE TRIGGER workflow_versions_immutable
  BEFORE UPDATE ON workflow_versions
  FOR EACH ROW EXECUTE FUNCTION wf_enforce_version_immutability();
```

**Archival.** `ARCHIVED` is a terminal state. `PUBLISHED → ARCHIVED` is allowed, but archived rows are still immutable on content.

**Maps to:** PRD §6.3 (versioning), PRD §22 invariant 7, [engine-core.md §8](../01-engine-core/engine-core.md).

---

## 3. Three-Field State Model

The `requests` table carries `status`, `outcome`, and `hold_reason_id`. PRD §10 mandates that these three fields are atomically coherent. Two invariants must hold on every write:

| Rule | Enforced by |
|---|---|
| `status = 'CLOSED'` OR `status = 'CANCELLED'` ⇒ `outcome IS NOT NULL` | `CHECK` constraint |
| `status = 'ON_HOLD'` ⇒ `hold_reason_id IS NOT NULL`; `status <> 'ON_HOLD'` ⇒ `hold_reason_id IS NULL` | `CHECK` constraint |
| `status` is not a terminal state ⇒ `outcome IS NULL` | `CHECK` constraint |

```sql
ALTER TABLE requests
  ADD CONSTRAINT requests_closed_requires_outcome CHECK (
    (status NOT IN ('CLOSED', 'CANCELLED') AND outcome IS NULL)
    OR
    (status IN ('CLOSED', 'CANCELLED') AND outcome IS NOT NULL)
  );

ALTER TABLE requests
  ADD CONSTRAINT requests_hold_reason_iff_on_hold CHECK (
    (status = 'ON_HOLD' AND hold_reason_id IS NOT NULL)
    OR
    (status <> 'ON_HOLD' AND hold_reason_id IS NULL)
  );
```

`CHECK` constraints are preferable to triggers here: they are cheaper, declarative, and surface in `\d+ requests`.

**Application-layer requirement.** Transitions like `ON_HOLD → IN_PROGRESS` must set `hold_reason_id = NULL` in the same `UPDATE` statement that changes `status`. Split writes will fail the constraint — this is the correct behavior.

**Maps to:** PRD §10, PRD §22 invariants 1, 3.

---

## 4. Version Pin Integrity

`requests.form_version_id` and `requests.workflow_version_id` are foreign keys pointing directly at `form_versions.id` / `workflow_versions.id` — not at the parent definition.

```sql
-- In Prisma schema, declare relation + onDelete: Restrict.
-- The FK itself is what enforces the pin.
ALTER TABLE requests
  ADD CONSTRAINT requests_form_version_fk
    FOREIGN KEY (form_version_id) REFERENCES form_versions(id) ON DELETE RESTRICT;

ALTER TABLE requests
  ADD CONSTRAINT requests_workflow_version_fk
    FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions(id) ON DELETE RESTRICT;
```

- `ON DELETE RESTRICT` prevents deletion of a version row while any request still pins it.
- There is no application code path that can "re-pin" a request — doing so would require a direct SQL update, which Prisma does not expose.

**Maps to:** PRD §6.3, PRD §22 invariant 7, [engine-core.md §8](../01-engine-core/engine-core.md).

---

## 5. Linked Request Constraints

From PRD §6.4:

| Rule | Enforced by |
|---|---|
| A required `RequestLink` must be non-null on a submitted request | Application layer + NOT NULL on `request_links.target_request_id` |
| A parent-gated link cannot target a request already in a final state at creation time | Trigger (BEFORE INSERT on `request_links`) |
| Parent cancel cascades to every non-final source | Application layer (inside `CancelRequestUseCase` transaction) |

```sql
CREATE OR REPLACE FUNCTION wf_enforce_parent_gate_target_alive()
RETURNS trigger AS $$
DECLARE
  target_status text;
BEGIN
  IF NEW.parent_gate THEN
    SELECT status INTO target_status
      FROM requests WHERE id = NEW.target_request_id;

    IF target_status IN ('CLOSED', 'CANCELLED') THEN
      RAISE EXCEPTION
        'Parent-gated link cannot target request % in terminal state %',
        NEW.target_request_id, target_status
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_links_parent_gate_target_alive
  BEFORE INSERT ON request_links
  FOR EACH ROW EXECUTE FUNCTION wf_enforce_parent_gate_target_alive();
```

**Maps to:** PRD §6.4, PRD §22 invariants 11–12, [engine-core.md §7](../01-engine-core/engine-core.md).

---

## 6. Delegation Chain Depth

PRD §19 / [engine-core.md §3](../01-engine-core/engine-core.md) requires delegation chains to be capped at depth 3. This is enforced in the `AssigneeResolver` at step activation — **not** at the database level, because:

- Delegations themselves are valid rows; only *traversal* is capped.
- The cap is a runtime guard against cycles, not a data integrity rule.

The cap is documented here so engineers don't add a redundant database check.

**Maps to:** PRD §19.

---

## 7. Reference Number Uniqueness

Per-form reference number format is declared on the form (PRD §21). The format's year-scoped counter must be unique per form.

```sql
CREATE UNIQUE INDEX requests_form_reference_number_uniq
  ON requests (form_id, reference_number);
```

A global unique index is **not** used — different forms can share the same visible number (e.g., `CR-2026-0001` vs `AR-2026-0001`) because the prefix disambiguates them at the form level.

**Maps to:** PRD §21.

---

## 8. Timing

Every trigger and check declared here lands in the **Phase 00 initial migration**. No phase after 00 adds a trigger — if a later phase needs one, that's a signal the invariant was missed in PRD §22 and the discussion goes back to the PRD owner.

**Testing.** [01-engine-core/engine-core.md §16](../01-engine-core/engine-core.md) lists invariant tests that exercise every rule in this file. If any trigger can be bypassed by a test case, the trigger is wrong — fix the trigger, not the test.
