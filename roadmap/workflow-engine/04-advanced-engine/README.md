# Phase 04 — Advanced Engine Features

**Goal:** add the engine capabilities that aren't foundational but unlock real-world breadth — webhooks, sub-workflows, quorum, bulk operations, observability, and the SLA escalation cron.

This phase is **post-MVP**. Phase 03 should be usable in production for Change Management before any of this lands.

---

## Scope

1. **SLA escalation background job** — the cron that scans active steps, evaluates escalation rules from PRD §13.2 against the per-step pause/resume event log, and fires the configured actions (reminder, add assignee, reassign, auto-advance). Records every fired escalation with actor `system (SLA escalation)` per PRD §13.2.
2. **Notifications & email infrastructure** — generic email sender, template renderer with the dynamic variables from PRD §14.3, in-app notification center.
3. **Watcher notification dispatch** (PRD §14.4) — the watcher *data model and resolution* are built in Phase 01; the actual notification fan-out to watchers (using their per-form `WatcherChannelPreference`) is implemented here as part of the dispatch pipeline. Watchers receive view-only notifications; only assignees receive action-button emails.
4. **Email action tokens** (PRD §14.2) — single-use, expiring, audit-logged. Approve/Reject from the inbox without logging in.
4. **Webhook step** — outgoing HTTP call with templated payload and response mapping back into form fields (per [`workflow-seed.md`](../workflow-seed.md) §13 future enhancements).
5. **Wait-for-event step** — incoming webhook / pause-until-callback.
6. **Spawn sub-workflow step** — create a new request in another form from a step, optionally wait for its outcome.
7. **Cross-branch QUORUM merge policy** for parallel barrier steps — e.g., "advance after any 3 of 5 parallel branches finish." Note: the *multi-assignee* QUORUM policy on a single step (PRD §12) is in scope for Phase 01; this is the cross-*branch* version that lives at the parallel-merge barrier (PRD §8).
8. **Bulk operations** — approve / reassign / cancel N requests at once, with a single audit entry per request.
9. **Entry automation** — scheduled rules acting on requests matching a filter (e.g., "auto-cancel any DRAFT older than 90 days, outcome ABANDONED").
10. **Out-of-office auto-reassign** — extends delegation (Phase 01) with automatic reassignment based on a user OOO calendar.
11. **Admin override UI** — surface PRD §17 admin override actions (force-advance, reassign, override outcome) in the workflow instance management view.
12. **Observability** — workflow-instance metrics (time-in-step, breach counts), audit trail export.

## Out of Scope

- Form / workflow builders (Phase 05)
- Saved views, public views, workflow analytics dashboards (later, after Phase 04 lands)
- AI-assisted anything (PRD §25 — out of scope for v1)

## Dependencies

- Phase 01 (engine core) — must be solid before adding step types
- Phase 02 (seed) — needed to test webhook and sub-workflow steps against real workflows
- Phase 03 (UI) — needed for the admin override UI surface

## Key Documents

- [PRD §13.2](../PRD.md) — SLA escalation policy (the cron implements this)
- [PRD §14](../PRD.md) — notifications and email action tokens
- [PRD §17](../PRD.md) — audit trail (admin override appends here)
- [`workflow-seed.md`](../workflow-seed.md) §13 — Future Engine Enhancements (webhook, sub-workflow, OOO, bulk ops, entry automation are all listed there)

## Acceptance Criteria

- An SLA escalation rule on a seeded workflow fires correctly when the step crosses its threshold, in a test that fast-forwards time
- An emergency change auto-approves at 6h via the SLA escalation, with the audit entry actor recorded as `system (SLA escalation)` and a reference to the rule
- An email action token grants exactly one approval and is rejected on second use
- A webhook step calls a test HTTP endpoint with a templated payload and writes the response into a form field
- A sub-workflow step creates a child request and the parent waits for its outcome
- A bulk approval action on 50 requests produces 50 distinct audit entries
- `npm run validate` passes

## Notes

This phase is large. Consider splitting it into 04a (SLA + notifications + email tokens — the next-most-needed) and 04b (webhooks + sub-workflows + bulk + entry automation — broader engine reach) when scheduling. Each sub-phase should be independently shippable.
