# TechHub Feature Integration — Forward-Looking Plan

**Status:** Forward-looking. **Not part of the sealed [PRD.md](../PRD.md).** This document captures the vision for integrating the Workflow Engine with existing TechHub features and identifies the gap between today's PRD and the "action gating" pattern the product owner wants.

Nothing here changes the Phase 00–05 scope. When the engine is production-ready, this doc is the starting point for Phase 06+ planning.

---

## 1. The Vision: Two Integration Modes

The workflow engine can integrate with existing TechHub features in **two fundamentally different ways**. Understanding the difference is the whole point of this document.

### Mode A — User-Initiated Request Flows *(already supported by the sealed PRD)*

A user submits a new **Request** on a seeded Form. The workflow advances through steps. When the workflow reaches a terminal successful outcome, an **Automation step** (PRD §7.4) calls into an existing TechHub use case to make the change permanent.

**Example:** "Access Request" Form → 3 approval steps → Automation step calls `AssignRoleToUserUseCase` → role granted.

**What the engine already gives you:** Forms, versioning, approvals, SLA, audit, linked requests, rejection policy, delegation, notifications (Phase 04), email action tokens (Phase 04).

**How integration works:** Seed a Form + Workflow in Phase 02 or later. The final Automation step's handler calls the target use case via the DI container. That's it — no engine change required.

### Mode B — Action Interception / Pre-Commit Gating *(NOT in the sealed PRD — forward work)*

An admin **flags an existing TechHub action** (e.g., `CreateAssetAssignmentUseCase`) as "requires approval." When a user invokes that action through the existing UI:

1. The action is **held in DRAFT** inside the workflow engine (a new "PendingAction" row, not a full Form submission).
2. A workflow kicks off using the action's payload as implicit form fields.
3. On **APPROVED**, the engine replays the original use case with the held payload inside a transaction, exactly as if the user had clicked the button themselves.
4. On **REJECTED/CANCELLED**, the held payload is discarded; the action never happens.

**This is the "when I assign an asset, hold it until the workflow approves it" pattern.**

**What the engine currently lacks to support this:**

1. **An `ActionGateway` interceptor layer.** There's no mechanism today for a use case to say "check if this needs approval first, and if yes, serialize my input and hand control to the engine."
2. **A `PendingAction` entity.** The PRD has `Request` (user submits a form). It has no concept of a frozen DTO waiting to be replayed later.
3. **A use-case replay contract.** Use cases must be deterministic and side-effect-free until the transaction commits, so they can be called fresh on the engine side when the workflow approves. Most TechHub use cases are already close to this, but not all (see §4).
4. **An admin UI to toggle gating per action.** A "gated actions" settings page listing every gateable use case with a toggle and a target workflow picker.
5. **A form/field auto-mapping convention.** When `CreateAssetAssignmentUseCase(assetId, personId, startDate)` is gated, the engine needs a Form definition compatible with those fields so approvers see the request in terms they understand. This could be seeded per action, or auto-derived from the use-case DTO.

None of these are in Phases 00–05. They are the subject of a future phase, tentatively **Phase 06 — Action Gateway**, documented in §5 below.

---

## 2. Integration-Ready Features (Tier 1)

Features whose existing use cases are clean enough to accept Mode A integration today and Mode B integration after Phase 06 ships. Deep inventory from TechHub reconnaissance:

| # | Feature | Use Cases | Why Gate It | Today's Situation |
|---|---|---|---|---|
| 1 | **Asset Assignment** | `CreateAssetAssignmentUseCase`, `UpdateAssetAssignmentUseCase` at [src/core/use-cases/asset/asset-assignment/](../../../src/core/use-cases/asset/asset-assignment/) | Hardware handout control, cost, auditability. **The canonical example.** | Clean single-DTO use case. No external coupling. Trivially interceptable. |
| 2 | **License Allocation** | `CreateLicenseAllocationUseCase`, `DeallocateLicenseAllocationUseCase`, `ReactivateLicenseAllocationUseCase` at [src/core/use-cases/license-allocation/](../../../src/core/use-cases/license-allocation/) | SAM governance, true-up control, compliance audit trail. | Clean. Domain-only validation. Ready. |
| 3 | **RBAC Role Assignment** | `AssignRoleToUserUseCase`, `RevokeRoleFromUserUseCase` at [src/core/use-cases/rbac/](../../../src/core/use-cases/rbac/) | Segregation of duties, privileged access management. | Clean. Permission cache invalidation is already handled post-transaction. |
| 4 | **CMDB CI Relationships** | `CreateCIRelationshipUseCase`, `UpdateCIRelationshipUseCase`, `DeleteCIRelationshipUseCase` at [src/core/use-cases/cmdb/ci-relationship/](../../../src/core/use-cases/cmdb/ci-relationship/) | CMDB data quality, change management integration (edits to critical CIs trigger a CR). | Clean CRUD. Ready. |
| 5 | **Service Relationships** | `CreateServiceRelationshipUseCase` family at [src/core/use-cases/service-relationship/](../../../src/core/use-cases/service-relationship/) | Service dependency integrity. | Same pattern as CI relationships. Ready. |
| 6 | **Asset Reservations** | `CreateReservationUseCase`, `ConfirmReservationUseCase` at [src/core/use-cases/reservations/](../../../src/core/use-cases/reservations/) | Inventory control, prevent hoarding of scarce hardware. | Already has a lightweight state machine; approval hook would be additive. |
| 7 | **Asset Disposals** *(already has its own approval chain)* | Full use case family at [src/core/use-cases/disposal/](../../../src/core/use-cases/disposal/) | Regulatory compliance, data sanitization verification, financial. | **Already implements its own multi-approver workflow.** Integration here is *replacement*, not *addition* — see §3. |

**Recommended pilot targets after Phase 06 lands:** Asset Assignment + License Allocation. Both are common, low-risk, clean, and together prove the Action Gateway pattern end-to-end before expanding to RBAC and CMDB.

---

## 3. Partial & Special Cases (Tier 2)

### Asset Disposals — replace, don't add

The disposal module already has `PENDING_APPROVAL → APPROVED → IN_PROGRESS → SANITIZED → COMPLETED` with multi-approver logic, rejection, and certificate generation. This is **exactly what the workflow engine does generically.**

Two options for the future:

- **Option A — leave it alone.** Disposal keeps its bespoke chain; the engine ignores it. Pro: no risk. Con: two parallel approval systems in the codebase forever.
- **Option B — migrate it.** After Phase 06 ships, reimplement the disposal approval chain as a seeded Form + Workflow on the engine. The disposal entity keeps its domain-specific fields (disposal method, certificate, sanitization log) as engine form fields. The approval chain moves into the engine. [src/core/domain/entities/asset-disposal.entity.ts](../../../src/core/domain/entities/asset-disposal.entity.ts) becomes a pure data record; [src/core/use-cases/disposal/](../../../src/core/use-cases/disposal/) shrinks to the non-approval operations.

**Recommendation: Option B, scheduled after the engine proves itself on assets and licenses.** Having two approval systems indefinitely is a DRY/SOLID violation the whole engine refactor was meant to fix.

### Governance Campaigns — likely defer

Governance already ships a multi-step verification workflow (DRAFT → SCHEDULED → IN_PROGRESS → COMPLETED with per-item PENDING → VERIFIED/EXCEPTION). See [docs/features/GOVERNANCE_SYSTEM.md](../../../docs/features/GOVERNANCE_SYSTEM.md). Integration here is uncertain:

- Governance is not an action gate — it's a *periodic audit cycle*. The engine doesn't obviously replace it.
- It could theoretically be modeled as a recurring engine workflow with "entry automation" (PRD §13 future enhancements: scheduled rules acting on requests matching a filter), but that's Phase 04+ territory plus new concepts not in the PRD.
- **Recommendation:** leave Governance self-contained. Revisit only if a later version of the engine adds recurring/campaign-style workflows.

### External API Sync (Intune, Azure AD, OCI)

- `SyncUsersFromGraphUseCase` (foundation/person)
- `SyncDevicesFromIntuneUseCase`, `LinkIntuneDeviceToAssetUseCase` (intune)
- `SyncOciResourcesUseCase` (oci-sync)

These call external APIs **mid-transaction** and cannot be held pending without refactoring. But the *sync operation itself* is the wrong gating target — it's system housekeeping, not user intent.

**The right gating target** is the **acceptance step**: "Intune discovered a new device linked to person X — approve linking it to asset Y?" That step is a pure DB mutation that could be gated.

**Status:** forward work. Requires splitting sync jobs from acceptance jobs first, which is outside the engine's scope.

---

## 4. Features NOT Suitable for Gating

- **Task Management** ([src/core/use-cases/task/](../../../src/core/use-cases/task/)) — tasks are *outputs* of workflows, not inputs. The engine creates tasks as part of Execution steps; gating task creation would create a circular dependency.
- **Database Backups, Maintenance Jobs** — scheduled/automatic operations, not user-initiated.
- **Email / Notification sending** — these are engine outputs (PRD §7.5 Notification step, PRD §14), not gateable actions.
- **System configuration (feature flag toggles, system settings)** — admin-only, low-volume, already audited.
- **Read operations** of any kind — obvious but worth stating.

---

## 5. The Action Gateway Gap — What Phase 06 Would Build

The PRD does not describe Mode B action gating. If you want the canonical "assign asset → hold until approval → replay" behavior, a **Phase 06 — Action Gateway** would add the following. This is a sketch, not a spec.

### 5.1 New engine concepts

| Concept | Purpose |
|---|---|
| **`GatedActionDefinition`** | Admin-managed config row: `{ useCaseKey, formId, workflowDefinitionId, enabled, appliesWhen? }`. One per gateable use case. Seeded initially; editable in an admin UI. |
| **`PendingAction`** | Runtime row: `{ id, useCaseKey, payload (JSON), actorUserId, requestId, status }`. Holds the serialized DTO until the workflow decides. |
| **`IActionGateway` service** | Called by gateable use cases at their entry point. Looks up the `GatedActionDefinition`, serializes the DTO, creates a `Request` in the engine, persists the `PendingAction`, throws a typed `ActionHeldError` the controller catches and returns to the UI as "pending approval." |
| **`ReplayActionUseCase`** | Engine-side automation handler. When a workflow reaches its terminal successful step, this handler deserializes the `PendingAction.payload`, resolves the original use case from the DI container by `useCaseKey`, and calls it inside a transaction. On `REJECTED` / `CANCELLED`, it discards the payload and emits a notification. |
| **`GatedActionRegistry`** | DI-registered map of `useCaseKey → use case class`. New gateable use cases opt in by registering themselves here. Compile-time type safety via a branded discriminated union. |

### 5.2 Contract every gateable use case must meet

- **Deterministic and idempotent.** Running the same DTO twice (engine replay after approval) must produce the same result as running it once.
- **Transaction-scoped side effects only.** No external API calls, no email sends, no webhook fires inside the use case's own transaction. Side effects are queued to background jobs post-commit (see §6 infrastructure gaps).
- **Serializable DTO.** The input DTO must round-trip through JSON losslessly. No `Date` objects without ISO strings, no `Map`/`Set`, no class instances as inputs.
- **Fail-closed permissions.** The use case re-validates permissions on replay — the engine does not bypass RBAC just because a workflow approved the action.

### 5.3 Admin UI — "Gated Actions"

A new settings page lists every use case registered in `GatedActionRegistry`. Each row: use case name, description, current state (off / gated by workflow X), toggle, workflow picker, optional condition ("only when asset value > 10,000 SAR"). Saves to `GatedActionDefinition`. Permission: `GATED_ACTIONS_MANAGE`.

### 5.4 Form auto-derivation (optional)

To avoid hand-authoring a Form for every gateable action, Phase 06 could generate a minimal Form from the use case's Zod DTO: each DTO field becomes a form field with its Zod type mapped to the nearest engine field type. Admins then customize (add sections, visibility rules, per-step states). This is ambitious; a simpler V1 is "seed one Form per gateable action by hand."

### 5.5 What Phase 06 explicitly does NOT include

- Replacing the Mode A flow. Both modes coexist.
- Retrofitting Tier 2 (Intune/OCI sync) — those need their own refactor first.
- Migrating Asset Disposal to the engine — optional follow-up.

---

## 6. Infrastructure Gaps to Close Before Phase 06

TechHub's code is mostly ready. Three gaps must be closed before gating can ship.

### 6.1 Transaction wrapping on gateable use cases

Most use cases today write via repository methods that use the Prisma singleton directly, not a transaction client passed in. For replay to be atomic (especially on multi-entity actions), the gateable use cases must accept an optional `tx: PrismaClient` parameter and thread it to their repositories.

**Refactor scope:** the 7 Tier 1 use cases. Mechanical change: add `tx?: Prisma.TransactionClient` to the use case signature; have repositories accept it; wrap the engine's `ReplayActionUseCase` in `prisma.$transaction`.

### 6.2 Transactional outbox for side effects

Any gateable use case with a side effect (email, webhook, external API) today fires it inline and cannot be held. The fix is standard: **transactional outbox**. Write the intended side effect to an `outbox_events` table in the same transaction as the state change; a background worker drains the outbox and fires the real side effect post-commit. This decouples the transaction from the side effect and makes replay safe.

**Refactor scope:** defined per-use-case. None of the Tier 1 seven have inline side effects that block this — this is infrastructure groundwork for Tier 2 and future gateable actions.

See [roadmap/BACKGROUND_JOB_HANDLERS.md](../../BACKGROUND_JOB_HANDLERS.md) — the job runner for draining the outbox could reuse that infrastructure.

### 6.3 Permission cache invalidation on replay

`AssignRoleToUserUseCase` invalidates the permission cache. On engine replay, the replay transaction succeeds but the cache invalidation runs in whichever context fires it. Confirm the invalidation path works the same way whether the use case is called from a controller or from the engine's `ReplayActionUseCase`.

**Refactor scope:** testing and possibly a small wrapper. Not a blocker — worth verifying.

---

## 7. Pilot Proposal After Phase 06 Lands

1. **Week 1 — Asset Assignment**
   Seed a "Asset Assignment Approval" Form + a 1-step approval Workflow. Flip the gate on. Every new assignment from the UI routes through a single approver. Measure: UX friction, approval turnaround time, error rate.
2. **Week 2 — License Allocation**
   Same pattern on license grants. Validates that a second independent use case works with no new engine code.
3. **Month 2 — RBAC Role Assignment**
   Two-step workflow (manager + security team) because privilege escalation is higher risk. Tests multi-step action gating.
4. **Month 3 — CMDB CI Relationships (critical CIs only)**
   Conditional gate: `appliesWhen: { "field": "sourceCI.criticality", "op": "==", "value": "CRITICAL" }`. Validates conditional gating. Non-critical edits keep flowing without approval.
5. **Quarter 2 — Disposal migration**
   Reimplement the bespoke disposal chain as a seeded Workflow; delete the old approval code. This is the DRY/SOLID cleanup the whole architecture was built to enable.

Each pilot phase is independently reversible — flip the gate off and the module reverts to unmediated action.

---

## 8. Decision Points for the User

These are choices the product owner needs to make before Phase 06 planning actually starts. Noting them so they don't get lost:

1. **Phase 06 priority.** Does Action Gateway land before or after Phase 04 (notifications / SLA cron)? Action Gateway arguably delivers more user value; notifications are technically simpler.
2. **Auto-derive forms vs. hand-seed forms.** The first version can hand-seed one Form per gateable action. Auto-derivation from DTOs is a nice-to-have that could wait.
3. **Global admin toggle vs. per-tenant.** TechHub is single-tenant per install, so this is probably a non-issue, but confirm before designing the config surface.
4. **Disposal migration scheduling.** Commit to eventually migrating disposal, or explicitly leave it bespoke forever? The ambiguity is worse than either choice.
5. **Mode A vs. Mode B for Access Requests.** The access-request pilot ([reference/access-request-pilot.md](./access-request-pilot.md)) assumes Mode A (user submits a Form). If TechHub grows a "click here to request access to system X" button somewhere in the existing UI that currently calls a use case directly, that becomes a Mode B gate. Both can coexist.

---

## 9. What This Document Does NOT Change

- The sealed PRD stands. Phases 00–05 proceed as planned.
- No source code changes flow from this doc. It's pure forward planning.
- The feature catalog here is informational — no commitment to integrating any specific module on any specific timeline.
- The "Phase 06" naming is a placeholder. Whatever ships first after the engine is production-stable inherits whichever number makes sense then.

When Phase 06 (or its real equivalent) is ready to plan, start here, then turn sections §5 and §6 into a real spec with its own folder under `roadmap/workflow-engine/06-action-gateway/` — mirroring the existing phase structure.
