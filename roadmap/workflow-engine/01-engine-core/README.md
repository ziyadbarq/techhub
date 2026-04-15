# Phase 01 — Engine Core

**Goal:** make the workflow engine actually run. Submit a request, advance through steps, take human actions, transition state, write the audit trail. No UI, no builders, no module-specific code.

---

## Scope

1. **Domain entities** — Form, FormField, WorkflowDefinition, WorkflowVersion, WorkflowInstance, StepInstance, Action, AuditEntry, FieldHistoryEntry, AssigneeSnapshot.
2. **Repository interfaces and Prisma implementations** for everything in Phase 00.
3. **Engine service interface** — submit, take-action, transition, place-on-hold, resume, cancel, reject. Every operation goes through this single service. The three-field state model (PRD §10) is enforced here, atomically.
4. **Step executors** — one per step type from PRD §7: Approval, Execution, Info/Ack, Automation, Notification, Conditional Branch, Delay, Schedule.
5. **Assignee resolver registry** — implementations for every strategy in PRD §12 (specific user, specific role, form-field user, CI owner, service owner, requestor's manager, round-robin, least-busy).
6. **Condition evaluator** — used by Conditional Branch steps and visibility rules. Must support scored-matrix routing (PRD §6.5).
7. **Automation handler registry** — pluggable handlers; built-in: auto-approve, set-field, generate-reference-number.
8. **SLA calculator** — start, pause, resume, breach detection, deadline computation from append-only events (PRD §13.3).
9. **Append-only audit trail** with assignee snapshots and field history (PRD §17).
10. **Rejection and resubmission flow** following PRD §11. Same record, no copy-on-rejection.
11. **Hold and resume** with hold-reason atomicity (PRD §10.3).
12. **Linked-request relational constraint and cancel cascade** (PRD §6.4) — generic mechanism, not CM-specific.
13. **Use cases** — Submit Request, Take Action, Place On Hold, Resume, Cancel Request, Reject, Reassign Step, Force Advance (admin), Override Outcome (admin).
14. **DI module** registering everything above.
15. **One hand-seeded test workflow** (NOT the CM workflows — those come in Phase 02) — used for integration tests of the runtime.

## Out of Scope

- Built-in CM forms or workflows (Phase 02)
- The seed system itself (Phase 02)
- Any UI (Phase 03)
- Webhook steps, loop steps, quorum policies (Phase 04)
- Form builder or workflow builder UIs (Phase 05)
- Email templates and notifications (Phase 04 / 06 — TBD)
- SLA background job — the calculator is in scope here, the cron job that triggers escalations can wait until notifications land

## Key Documents

- [`engine-core.md`](./engine-core.md) — internal engine reference: executors, services, condition DSL, cascade implementation, schedule step, delegation, audit internals
- [PRD §6](../PRD.md) — workflow definitions, versioning, linked requests, cascade, scored routing
- [PRD §7](../PRD.md) — step types
- [PRD §8](../PRD.md) — single vs parallel step policy
- [PRD §9](../PRD.md) — actions reference
- [PRD §10](../PRD.md) — status, outcome, hold reason invariants
- [PRD §11](../PRD.md) — rejection and resubmission
- [PRD §12](../PRD.md) — assignment strategies
- [PRD §13](../PRD.md) — SLA system
- [PRD §17](../PRD.md) — audit trail, snapshots, field history
- [PRD §22](../PRD.md) — engine invariants

## Acceptance Criteria

- A request can be submitted, advanced through every step type, and closed — end-to-end, without UI, via use cases called from a test
- The three-field state model invariants are enforced atomically (test: try to write CLOSED without an outcome and assert it fails)
- Rejection on the same record works, with field history preserved across resubmission
- The SLA calculator returns correct deadlines after pause/resume cycles
- Linked-request cascade fires unconditionally on parent cancellation, including for IN_PROGRESS children (test against a generic "parent" form, not CM)
- All engine invariants from PRD §22 are covered by tests
- `npm run validate` passes

