# Workflow Engine & Change Management — Planning Index

## What We're Building

A **native enterprise workflow engine** inside TechHub, plus **Change Management** as its first consumer. No external tools, no WordPress, no GravityFlow.

The engine is generic and reusable — Change Management is the first module built on it, but procurement approvals, access requests, and any future multi-step process will use the same infrastructure.

## Two-Layer Architecture

```
┌───────────────────────────────────────────────────────┐
│               Change Management Module                │
│  Request forms · Risk · PIR · CAB · Calendar          │
│  (domain-specific UI, forms, dashboards, lifecycle)   │
├───────────────────────────────────────────────────────┤
│              Workflow Engine (Core)                    │
│  Definitions · Instances · Steps · SLA · Actions      │
│  (generic, entity-agnostic, reusable by any module)   │
└───────────────────────────────────────────────────────┘
         ↑ also used by future modules:
         Asset Disposal · Access Requests · Procurement
```

## Why Not GravityFlow / Kissflow / Camunda

| Capability | GravityFlow | Kissflow | Camunda | **TechHub Engine** |
|---|---|---|---|---|
| Parallel branches | ✗ | ✓ | ✓ | ✓ |
| CMDB/CI-aware routing | ✗ | ✗ | ✗ | ✓ |
| Service ownership routing | ✗ | ✗ | ✗ | ✓ |
| Native RBAC integration | ✗ | ✗ | ✗ | ✓ |
| Saudi weekend SLA preset | ✗ | ✗ | ✗ | ✓ |
| SLA pause on info requests | ✗ | ✗ | Partial | ✓ |
| Delegation / OOO fallback | ✗ | ✓ | Partial | ✓ |
| Workflow versioning | ✗ | ✗ | ✓ | ✓ |
| Automation / webhook steps | ✗ | Partial | ✓ | ✓ |
| Loop steps | ✗ | ✗ | ✓ | ✓ |
| Entity-agnostic (reusable) | ✗ | ✗ | ✓ | ✓ |
| Visual designer | ✗ | ✓ | ✓ | Phase 5 |

TechHub also uniquely integrates with its own CMDB, Services, RBAC, audit logging, and notification system — something no external tool can do natively.

## Planning Documents (Read in Order)

| File | Contents |
|---|---|
| **[ENGINE_CORE.md](ENGINE_CORE.md)** | Step types, assignee strategies, condition DSL, SLA, parallel branches, delegation, versioning |
| **[CHANGE_MANAGEMENT.md](CHANGE_MANAGEMENT.md)** | Request types, CR hierarchy, lifecycle state machine, risk matrix, maintenance windows, PIR, CAB |
| **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | Complete Prisma schema for both the engine and change management |
| **[WORKFLOW_DEFINITIONS.md](WORKFLOW_DEFINITIONS.md)** | Built-in seeded workflows (Standard, Normal, Emergency) with full step DSL |
| **[PERMISSIONS.md](PERMISSIONS.md)** | All permissions for both modules with descriptions and groupings |
| **[UI_PLAN.md](UI_PLAN.md)** | Pages, components, routing, UX flows, and dashboard specs |
| **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** | Phase-by-phase plan with exact file paths, dependencies, and acceptance criteria |

## Implementation Order

```
Phase 1 — Workflow Engine Core      (schema + domain + engine service, no UI)
Phase 2 — Change Management Domain  (CR entities, use cases, controller, seed)
Phase 3 — Change Management UI      (pages, components, list/detail/create/dashboard)
Phase 4 — Advanced Engine Features  (delegation, webhooks, versioning, loop steps)
Phase 5 — Visual Workflow Designer  (drag-and-drop step builder)
```

Do not start Phase 2 until Phase 1 engine tests pass.
Do not start Phase 3 until Phase 2 seed and validation pass.

## DI Module Tiers

```typescript
WORKFLOW_ENGINE_MODULE  → HEAVY tier, no feature flag (always available)
CHANGE_MANAGEMENT_MODULE → HEAVY tier, feature flag: "CHANGE_MANAGEMENT"
                           depends on: workflow-engine, cmdb, service, foundation
```
