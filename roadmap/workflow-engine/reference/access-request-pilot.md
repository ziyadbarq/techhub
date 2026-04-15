# Access Request — Engine Validation Pilot
**TechHub — Internal IT Platform**
**Companion document to** [PRD.md](../PRD.md) **and** [workflow-seed.md](../02-seed-and-cm/workflow-seed.md)
**Status:** Pilot · Not for production

---

## 1. Purpose

This document is **not** a real seed file. It is a thought-experiment pilot whose only job is to test whether the sealed Workflow Engine PRD actually generalizes beyond Change Management.

The test is simple: **can a complete Access Request flow be expressed using only the generic engine features described in PRD Part One, with no CM-specific features and no new engine code?**

If yes → the architecture holds up, and Phase 02's "no CM-specific runtime code" rule is realistic.

If no → there are gaps in the PRD that need to be flagged before code is written against it.

The verdict and gap list live in §6 and §7 below.

---

## 2. The Use Case

An employee needs to access a system, application, or dataset they do not currently have access to. Examples: *"I need read access to the Finance dashboard,"* *"I need admin on the staging Kubernetes cluster,"* *"I need to query the customer database."*

A typical flow:

1. The requestor fills in what they need and why.
2. Their direct manager approves (or rejects).
3. The owner of the target system approves.
4. If the system or access level is sensitive, security reviews.
5. IT provisions the access.
6. The requestor is notified.
7. The request closes.

Some access is **temporary** (request ends on a specific date). Some is **permanent**. Some systems require security review; some don't. Some access tiers require additional scrutiny; some don't.

This is generic, not Barq-specific. Every IT shop runs some version of it.

---

## 3. Form Definition (high level)

**Form name:** Access Request
**Reference number format:** `AR-YYYYMMDD-NNNNN` (per PRD §21 — wait, this collides with the CM Application Release prefix; pilot uses `ACR-YYYYMMDD-NNNNN`)

| Field | Type | Required | Notes |
|---|---|---|---|
| Requestor | User picker | Auto | Set to submitting user |
| Target System | Dropdown (from CMDB CIs) | Yes | Filtered to Application / Database / Service CIs |
| Access Type | Dropdown | Yes | READ / WRITE / ADMIN |
| Access Tier | Computed | Auto | Derived from Target System sensitivity × Access Type — yields LOW / MEDIUM / HIGH / CRITICAL |
| Duration Type | Dropdown | Yes | PERMANENT / TEMPORARY |
| Start Date | Date | Conditional | Required if Duration Type = TEMPORARY |
| End Date | Date | Conditional | Required if Duration Type = TEMPORARY; must be > Start Date |
| Business Justification | Long text | Yes | |
| Affects Production Data | Checkbox | Yes | |
| Compliance Notes | Long text | Conditional | Required if Affects Production Data = Yes; only editable at the Security Review step (per-step field state, PRD §5.5) |
| Approving Manager | User picker | Auto | Resolved from Requestor's manager (assignment strategy, not a stored field) |
| Attachments | File upload | No | |

**Engine features used so far:**
- Field types: User picker, Dropdown (from CMDB), Computed field, Long text, Date, Checkbox, File upload — all in PRD §5.3 ✓
- Conditional visibility on Start Date / End Date / Compliance Notes (PRD §5.4) ✓
- Per-step field state for Compliance Notes (PRD §5.5) ✓
- Computed field for Access Tier (PRD §5.3) ✓

---

## 4. Workflow Definition

**Workflow name:** Standard Access Request
**Business calendar:** Saudi Standard (already seeded for CM, reused here)
**Rejection Policy:** A new "Access Correction" policy — clone of "Standard Correction" with different reason codes

| # | Step | Type | Assignee | SLA | Actions | Routing |
|---|---|---|---|---|---|---|
| 1 | Self-Review | Info / Ack | Requestor | 4 business hours | Acknowledge | → Step 2 |
| 2 | Manager Approval | Approval | **Requestor's manager** (assignment strategy from PRD §12) | 24 business hours · remind at 12h · add skip-level manager at 24h | Approve, Reject, Request More Info | Approve → Step 3 · Reject → Step 9 |
| 3 | System Owner Approval | Approval | **CI Owner** of Target System (assignment strategy from PRD §12) | 48 business hours · remind at 24h | Approve, Reject, Request More Info | Approve → Step 4 · Reject → Step 9 |
| 4 | Tier Branch | Conditional Branch | — | — | — | Access Tier in (LOW, MEDIUM) → Step 6 · Access Tier in (HIGH, CRITICAL) → Step 5 |
| 5 | Security Review | Approval | `security-team` role (Specific role strategy) | 48 business hours · escalate to security manager at 48h | Approve, Reject, Request More Info | Approve → Step 6 · Reject → Step 9 |
| 6 | IT Provisioning | Execution | `it-access-management` role | 8 business hours | Complete, Request More Info | → Step 7 |
| 7 | Notify Requestor | Notification | — | Instant | — | → Step 8 |
| 8 | Close | Automation | — | Instant | — | Sets outcome SUCCESSFUL · CLOSED |
| 9 | Rejection Handling | Automation | — | — | — | Notifies requestor; awaits resubmit or abandonment |

**Engine features used:**
- Step types: Info/Ack, Approval, Conditional Branch, Execution, Notification, Automation — all in PRD §7 ✓
- Assignment strategies: Form-field user (Requestor), Requestor's manager, CI owner, Specific role — all in PRD §12 ✓
- SLA escalation rules: remind, add assignee, escalate, with thresholds — PRD §13.2 ✓
- Conditional Branch routing on a computed field value — PRD §7.6 ✓
- Rejection routing to a single handling step that supports resubmit on the same record — PRD §11 ✓
- Three-field state model (status / outcome / hold) — PRD §10 ✓
- Audit trail with assignee snapshots and field history — PRD §17 ✓

**No CM-specific feature is used.** No risk matrix, no maintenance windows, no parent/child hierarchy, no PIR step, no Schedule step.

---

## 5. Optional Extensions That Reuse Generic Features

These are not required for the pilot but show the engine flexing further:

### 5.1 Bulk Access Request (parent/child pattern)

A user requests access to 5 systems at once. Modeled as:
- A **Bulk Access Request** parent form with summary fields and a list
- Five **Access Request** child forms, each with its own workflow, linked to the parent via a **Request link** field (PRD §6.4)
- Cancel cascade on the parent: cancelling the bulk request cancels all child requests with outcome SUPERSEDED
- The parent waits in IN_REVIEW until all children reach a final state (close gate)

This exercises the same linked-request mechanism CM uses for CR → AR/IR/CFR. **Same feature, different domain → confirms the abstraction.**

### 5.2 Tiered Approval Routing (Purchase Approval analogy)

Same engine features support purchase requests where amount drives the approval chain:
- Up to $1,000: manager only
- $1,000 – $10,000: manager + finance
- Above $10,000: manager + finance + CFO

Modeled as Conditional Branch steps routing on the Amount field. Identical to the Access Tier branch in §4. **No new engine features needed.**

### 5.3 Multi-Stage Compliance Review (Vendor Onboarding analogy)

A vendor onboarding form with parallel review steps for legal, security, and finance — all required to approve before the vendor is activated. Uses the **Parallel step policy with All merge** (PRD §8). Same feature CM uses for Emergency parallel approvals.

---

## 6. Verdict

**The engine generalizes.** Every required feature of the Access Request use case is already in the sealed PRD. No new step type, no new field type, no new assignment strategy, no new business rule was needed.

The pilot also passes for the three optional extensions in §5, which collectively prove that:
- Linked-request hierarchies are not a CM concept (Bulk Access Request)
- Conditional approval chains are a generic engine pattern (Purchase Approval)
- Parallel-with-All approval is generic (Vendor Onboarding)

**Phase 02's hard rule — no CM-specific runtime code — is realistic.** The pilot was expressible as pure seed data.

---

## 7. Gaps Found

A small number of features came up during the walk-through that the sealed PRD does not fully address. None are blockers for v1 — they are either workaroundable, or known future enhancements already listed in [`workflow-seed.md`](../02-seed-and-cm/workflow-seed.md) §13. Listed here so they're not lost.

### 7.1 Field-driven Delay duration (small gap)

**The case:** Temporary access expires on a specific date set by the requestor. We want the workflow to wait until that date, then route to a "Revoke Access" execution step.

**What the PRD says:** PRD §7.7 Delay Step "Pauses the workflow for a configured duration before automatically advancing." This reads as a *fixed* duration set at workflow-definition time, not a duration computed from a field value at runtime.

**Workaround for v1:** A scheduled background job scans active provisioned-access requests daily and triggers a revocation workflow when End Date is in the past. This is the standard pattern in most access-management systems and works fine without engine changes.

**Future fix:** Allow Delay step duration to be expressed as either a constant *or* an expression like `until: {{end_date}}`. Tiny extension to PRD §7.7. Worth adding to the future-enhancements list if it isn't already.

### 7.2 Lookup field with cascading source (small gap)

**The case:** Target System is a Dropdown sourced from CMDB. Once selected, the form should auto-populate Access Tier based on the system's sensitivity. PRD §5.3 has a Computed field that "calculates from other fields" — but the calculation source here is not another form field, it's a *property* on the linked CMDB CI.

**What the PRD says:** "Computed field — value calculated from other fields." Doesn't explicitly cover "computed from a property of a linked external entity."

**Workaround for v1:** Make Access Tier a manual Dropdown the requestor (or system owner) sets. Slightly less polished but functional.

**Future fix:** Document in PRD §5.3 that Computed fields can read properties of linked CIs / Services / Users (any entity reachable via a field link). This may already be the implicit intent — the workflow-seed file describes "Application | Dropdown (from CMDB)" without specifying how property lookups work. **Worth a one-line PRD clarification once the seal is broken for an inevitable v1.1.**

### 7.3 Reference number prefix uniqueness (cosmetic)

**The case:** Both Change Management's Application Release and the Access Request pilot want the prefix `AR`. The Reference Number Format spec (PRD §21) does not say prefixes must be unique.

**Workaround:** Pick a different prefix for whichever form is added second (the pilot uses `ACR`). Trivial.

**Future consideration:** The form admin UI could warn on prefix collision, but it does not need to enforce it. Some shops prefer namespaced prefixes per module (`CM-AR-...` vs `ACCESS-AR-...`).

### 7.4 Recertification cycles (known future enhancement, not a new finding)

**The case:** Granted access should be re-approved every quarter. If the recertification is not completed, access is automatically revoked.

**Status:** This is a "scheduled rules acting on requests matching a filter" feature, listed in [`workflow-seed.md`](../02-seed-and-cm/workflow-seed.md) §13 future enhancements as "entry automation." Already known. Not in v1.

### 7.5 Spawn sub-workflow (known future enhancement, not a new finding)

**The case:** A Joiner/Mover/Leaver workflow that automatically creates one Access Request per system the user needs.

**Status:** "Spawn sub-workflow step" — listed in [`workflow-seed.md`](../02-seed-and-cm/workflow-seed.md) §13 future enhancements. Already known. Not in v1.

---

## 8. Net Result

| Question | Answer |
|---|---|
| Does the sealed engine PRD support a non-CM use case end-to-end? | **Yes.** |
| Were any new step types needed? | **No.** |
| Were any new field types needed? | **No.** |
| Were any new assignment strategies needed? | **No.** |
| Were any new business rules / invariants needed? | **No.** |
| Were any genuine gaps found? | **Two small ones (§7.1, §7.2)**, both workaroundable in v1, both fixable with one-line PRD clarifications when v1.1 opens. |
| Is the "no CM-specific runtime code" rule realistic for Phase 02? | **Yes.** |

**The engine architecture holds up.** Phase 02 can proceed with confidence that CM is genuinely just seed data, not a privileged module. The two small gaps are documented for whenever v1.1 opens; until then, both have working workarounds.

The next pilot worth running, if any further confidence is needed, is **Vendor Onboarding** — it would exercise parallel approval with All merge against a non-CM context and confirm that compliance-style flows generalize too. But based on this pilot, that exercise will likely also pass.
