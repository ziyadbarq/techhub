# Workflow Engine — TechHub Integration Map

How the workflow engine maps onto TechHub's existing architecture, conventions, and infrastructure. Phase docs should **not** restate this information — they should link here.

All paths below have been verified against the current repository.

---

## 1. Clean Architecture Layer Mapping

TechHub uses a 5-layer Clean Architecture (see [docs/architecture/ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) and [docs/guides/DEVELOPER_GUIDE.md](../../../docs/guides/DEVELOPER_GUIDE.md)). The engine fits as follows:

| Layer | Engine Concepts | Typical Path |
|---|---|---|
| **1. Presentation** | `RequestList`, `RequestDetail`, `WorkflowTimeline`, `ActionPanel`, `FormRenderer`, `FieldRenderer`, `Dashboard`, `WatcherPanel` (see [03-ui/ui-plan.md](../03-ui/ui-plan.md)) | `src/app/(dashboard)/requests/...`, `src/components/workflow/...` |
| **2. Interface Adapters** | Server action controllers (`workflow-engine.controller.ts`), DTOs (Zod), Presenters (entity → DTO), Query composers for list/detail views | `src/interface-adapters/controllers/workflow-engine/`, `src/interface-adapters/dtos/workflow-engine/`, `src/interface-adapters/presenters/workflow-engine/`, `src/interface-adapters/queries/workflow-engine/` |
| **3. Use Cases** | `SubmitRequestUseCase`, `TakeActionUseCase`, `PlaceOnHoldUseCase`, etc. (full list in [01-engine-core/engine-core.md §13](../01-engine-core/engine-core.md)). Each file + mandatory `index.ts` barrel. | `src/core/use-cases/workflow-engine/` |
| **4. Domain** | Entities (`Request`, `Form`, `FormVersion`, `WorkflowDefinition`, `WorkflowVersion`, `StepInstance`, `AuditEntry`, `FieldHistoryEntry`, `AssigneeSnapshot`, `Delegation`, `Watcher`). Repository interfaces. Value objects. Domain errors. | `src/core/domain/entities/workflow-engine/`, `src/core/domain/repositories/workflow-engine/`, `src/core/domain/errors/workflow-engine/` |
| **5. Infrastructure** | Prisma repositories, expression evaluator, SLA calculator, assignee resolvers, automation handlers, lookup resolver, notification dispatcher (Phase 04) | `src/infrastructure/repositories/workflow-engine/`, `src/infrastructure/services/workflow-engine/` |

**Dependency rule:** outer layers depend on inner; inner never imports from outer. The engine service lives in Infrastructure; use cases own orchestration; domain owns invariants.

---

## 2. DI Container Placement

TechHub uses a three-tier DI system: **CORE** (always loaded), **DASHBOARD** (authenticated users), **HEAVY** (lazy-loaded).

See [src/di/modules/](../../../src/di/modules/) and [src/di/module-definitions.ts](../../../src/di/module-definitions.ts).

- **Engine module:** `WORKFLOW_ENGINE_MODULE` → register in **CORE** tier (per [01-engine-core/engine-core.md §14](../01-engine-core/engine-core.md)). The engine has no optional/lazy behavior — it underpins any module that ships forms, so it loads with the container. Feature-flag gating happens at the route/controller layer via `requireFeature("WORKFLOW_ENGINE")`, not at the DI layer.
- **No `CHANGE_MANAGEMENT_MODULE`.** Change Management has zero runtime code, so it has no DI module. (This is the entire point of the architecture.)
- **File:** `src/di/modules/workflow-engine.module.ts` (new).
- **Registration:** add to `src/di/module-definitions.ts` alongside existing modules.

### Bindings the module registers

From [01-engine-core/engine-core.md §14](../01-engine-core/engine-core.md):

- `IWorkflowEngineService` → `WorkflowEngineServiceImpl`
- `IAssigneeResolverRegistry` → `AssigneeResolverRegistryImpl` (all 9 strategies from PRD §12)
- `IConditionEvaluator` → `ConditionEvaluatorImpl` (the shared JSON DSL from engine-core.md §4)
- `ISLACalculator` → `SLACalculatorImpl`
- `IStepExecutorRegistry` → `StepExecutorRegistryImpl` (all 8 step-type executors)
- `IAutomationHandlerRegistry` → `AutomationHandlerRegistryImpl` (built-in handlers)
- One repository binding per entity from [00-foundation/database-schema.md](../00-foundation/database-schema.md)

---

## 3. Prisma Schema

Follow [docs/guides/PRISMA_GUIDE.md](../../../docs/guides/PRISMA_GUIDE.md):

- **New schema file:** `prisma/schema/workflow-engine.prisma` (one file for all engine models; keeps the refactor isolated).
- **Migrations:** edit `.prisma` → `npx prisma migrate dev --name workflow_engine_foundation` → `npm run db:generate`. Never create migrations manually.
- **Imports:** browser-safe code uses `@/generated/prisma`; server-only code uses `@/generated/prisma/server`. Never import from `@prisma/client` (ESLint-enforced).
- **Singleton:** server code resolves `PrismaClient` from `@/infrastructure/database/prisma/client`. No `new PrismaClient()`.
- **ID generation:** all entities use the CUID2 `IIdGenerator` from [docs/architecture/ID_GENERATION.md](../../../docs/architecture/ID_GENERATION.md) via DI. Entities call `Entity.create(props, idGenerator)`. DTOs validate internal IDs with `z.string().min(24).max(25)`.
- **Append-only tables** (`AuditEntry`, `FieldHistoryEntry`, `AssigneeSnapshot`, `HoldEvent`, `SLAEvent`) and **immutable published versions** are enforced by database triggers — see [00-foundation/database-triggers.md](../00-foundation/database-triggers.md).

---

## 4. Permissions

TechHub has 276 permissions in 15 groups. See [src/core/domain/value-objects/permission-key.ts](../../../src/core/domain/value-objects/permission-key.ts) and [src/lib/rbac/permission-groups.ts](../../../src/lib/rbac/permission-groups.ts).

### Engine-level permission keys (add to `permission-key.ts`)

From PRD §24.1, owned by Phase 00:

```ts
// Forms
FORMS_VIEW: "forms:view",
FORMS_CREATE: "forms:create",
FORMS_UPDATE: "forms:update",
FORMS_DELETE: "forms:delete",
FORMS_PUBLISH: "forms:publish",

// Workflow definitions
WORKFLOW_DEFINITIONS_VIEW: "workflow-definitions:view",
WORKFLOW_DEFINITIONS_CREATE: "workflow-definitions:create",
WORKFLOW_DEFINITIONS_UPDATE: "workflow-definitions:update",
WORKFLOW_DEFINITIONS_DELETE: "workflow-definitions:delete",
WORKFLOW_DEFINITIONS_PUBLISH: "workflow-definitions:publish",

// Workflow instances (Requests)
WORKFLOW_INSTANCES_VIEW: "workflow-instances:view",
WORKFLOW_INSTANCES_CREATE: "workflow-instances:create",
WORKFLOW_INSTANCES_UPDATE: "workflow-instances:update",
WORKFLOW_INSTANCES_ADMIN_OVERRIDE: "workflow-instances:admin-override",

// Reference data
CALENDARS_MANAGE: "calendars:manage",
MAINTENANCE_WINDOWS_MANAGE: "maintenance-windows:manage",
BLACKOUT_PERIODS_MANAGE: "blackout-periods:manage",
EMAIL_TEMPLATES_MANAGE: "email-templates:manage",
HOLD_REASONS_MANAGE: "hold-reasons:manage",
REJECTION_POLICIES_MANAGE: "rejection-policies:manage",

// Delegations
DELEGATIONS_VIEW: "delegations:view",
DELEGATIONS_MANAGE: "delegations:manage",

// Dashboards
DASHBOARDS_VIEW: "dashboards:view",
DASHBOARDS_MANAGE: "dashboards:manage",
```

Add a new permission group entry `workflow-engine` to `src/lib/rbac/permission-groups.ts` containing all of the above.

### Module-declared permissions (Phase 02)

CM permissions (`CHANGES_VIEW`, `CHANGES_CREATE`, `CHANGES_APPROVE`, `CHANGES_IMPLEMENT`, …) are declared by the **seed layer**, not the engine. They map to built-in roles from [02-seed-and-cm/workflow-seed.md §10](../02-seed-and-cm/workflow-seed.md). Future modules (Access Requests, Vendor Onboarding) add their own permission groups the same way.

### Checking pattern

Server-side (see [src/lib/permissions/check-permission.ts](../../../src/lib/permissions/check-permission.ts)):

```ts
await requireFeature("WORKFLOW_ENGINE");           // 1. feature flag FIRST
await requirePermission(PERMISSIONS.FORMS_VIEW);   // 2. permission SECOND
```

This order is non-negotiable. If the feature is off, permission checks must never run.

Client-side (UX only; server check is authoritative): `usePermissions()` hook + `useIsFeatureEnabled()` hook.

---

## 5. Feature Flag

Feature flag keys live in [src/lib/features/feature-flag-keys.ts](../../../src/lib/features/feature-flag-keys.ts).

Add to the `FEATURE_FLAGS` const:

```ts
WORKFLOW_ENGINE: "WORKFLOW_ENGINE",
```

Server-side guard: [src/lib/features/feature-permission-guard.ts](../../../src/lib/features/feature-permission-guard.ts) — `requireFeature("WORKFLOW_ENGINE")`.

Default state: **off**. Flip on only after Phase 03 is production-stable.

---

## 6. Seeding

Follow [docs/guides/DATABASE_SEEDING.md](../../../docs/guides/DATABASE_SEEDING.md) and the hard rules in [02-seed-and-cm/seed-idempotency.md](../02-seed-and-cm/seed-idempotency.md):

- Fully idempotent: `npm run db:seed` must be safe to re-run. Never wipes user-generated data.
- New seed factories live alongside existing ones: `src/infrastructure/database/seed/factories/workflow-engine/` and `.../change-management/`.
- The engine permission group + `WORKFLOW_ENGINE` feature flag are seeded in Phase 00's seed contribution.
- The CM forms, workflows, calendars, windows, blackouts, rejection policies, email templates, permissions, and roles are seeded in Phase 02. All values come from [02-seed-and-cm/workflow-seed.md](../02-seed-and-cm/workflow-seed.md).

---

## 7. Patterns to Reuse — Do NOT Re-invent

Every one of these already exists in TechHub and is enforced by convention or ESLint. The engine consumes them as-is.

| Concern | What to reuse | Source |
|---|---|---|
| Structured logging | Inject `ILoggerService` via DI; use `@LogExecution('workflow-engine.submit')` on use-case `execute()` methods. Never `console.log`. | [docs/guides/DEVELOPER_GUIDE.md](../../../docs/guides/DEVELOPER_GUIDE.md) |
| Use-case barrel exports | Every `src/core/use-cases/workflow-engine/*` folder **must** have `index.ts`. Pre-commit fails without it. | CLAUDE.md |
| DTO validation | Zod at the controller boundary. Internal IDs: `z.string().min(24).max(25)`. No `any`. | [docs/guides/DEVELOPER_GUIDE.md](../../../docs/guides/DEVELOPER_GUIDE.md) |
| Route protection | Server component → `requireFeature` → `requirePermission` → render client component. `export const dynamic = "force-dynamic"` on every protected page. Register routes in `protected-routes.ts`. | CLAUDE.md "Route Protection" |
| Next.js 16 async APIs | Server code: `await props.params`, `await cookies()`, `await headers()`. Client code: `useParams()`. Use `proxy.ts` (not `middleware.ts`). | [docs/guides/NEXTJS_16_GUIDE.md](../../../docs/guides/NEXTJS_16_GUIDE.md) |
| Session (client, inside dashboard) | `useSessionContext()` from `@/contexts/session-context` | CLAUDE.md |
| Permissions (client, UX) | `usePermissions()` hook | CLAUDE.md |
| Feature flags (client, UX) | `useIsFeatureEnabled("WORKFLOW_ENGINE")` hook | CLAUDE.md |
| Toasts | `toast.success()` / `toast.error()` via Sonner. Never shadcn `useToast`. | CLAUDE.md |
| Dates & badges | `formatDate()`, `getStatusBadgeClasses()` | CLAUDE.md |
| Tables | Standardized hooks/components. Add `"use no memo";` to TanStack Table components. | [docs/guides/TABLE_COMPONENTS_GUIDE.md](../../../docs/guides/TABLE_COMPONENTS_GUIDE.md) |
| Query composition (list/detail) | View composers in `src/interface-adapters/queries/` with DataLoader batching to avoid N+1 | [docs/architecture/ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) |
| File uploads | Polymorphic `Attachment` system with MIME + extension + magic-number validation | `src/core/domain/entities/attachment.entity.ts` |
| Rate limiting | Existing `ioredis` + `rate-limiter-flexible`. **Never** `@upstash/*`. | CLAUDE.md |

**If a pattern already exists in TechHub, the engine uses it unchanged.** Re-implementing any of the above is a review-blocker.

---

## 8. Existing Modules the Engine Integrates With

Read-only dependencies at runtime:

| Module | How the engine uses it | Entry point |
|---|---|---|
| **CMDB** (Configuration Items) | `LOOKUP` fields with `source: 'cmdb'`; CI Owner assignee strategy | CMDB DI module, CI entities |
| **Service Catalog** | `LOOKUP` fields with `source: 'service'`; Service Owner assignee strategy | Service DI module |
| **Person / User Directory** | Requestor, Assignee, Requestor's Manager assignee strategy, Delegation user lookup | Existing Person entity + manager relation |
| **RBAC** | Permission checks, role expansion for assignee resolution and watcher subscriptions | `permission-key.ts`, `permission-groups.ts`, role repositories |
| **Attachments** | Polymorphic attachments on Requests and Comments | `attachment.entity.ts` |
| **Email service** (Phase 04) | Outbound notifications + action-token links | Existing email infrastructure |
| **Background jobs** (Phase 04) | SLA escalation cron | [roadmap/BACKGROUND_JOB_HANDLERS.md](../../BACKGROUND_JOB_HANDLERS.md) |

The engine **does not modify** any of these modules. It only reads from them through existing repositories.

---

## 9. Existing Modules the Engine Could Eventually Replace

Informational only — **not a v1 goal**. Listed so future migration plans have a starting point.

| Existing module | What it duplicates | File paths |
|---|---|---|
| **Asset Disposals approval chain** | Multi-step approval + rejection policy + field locking. Closest existing analog to the engine. | `src/core/domain/entities/asset-disposal.entity.ts`, `src/core/use-cases/asset-disposals/`, `prisma/schema/disposal.prisma` |
| **Service SLA & Health Monitoring escalation** | SLA tracking + escalation chain on service metrics | [docs/features/SERVICE_SLA_HEALTH_MONITORING.md](../../../docs/features/SERVICE_SLA_HEALTH_MONITORING.md), `src/core/use-cases/services/` |
| **Governance verification campaigns** | Multi-step verification workflow (campaign → section → item) | [docs/features/GOVERNANCE_SYSTEM.md](../../../docs/features/GOVERNANCE_SYSTEM.md), `prisma/schema/governance.prisma` |

Each of these could become seeded Forms + Workflows after the engine lands. None of them block engine delivery.

---

## 10. Navigation and Routes

- **Sidebar:** register the engine's nav group in the routes manifest and run `npm run generate:routes`. Per-form sidebar entries come from seed data (Phase 02), not hardcoded.
- **Routes:** generic `/requests/[formSlug]/...` routes from [03-ui/ui-plan.md §1](../03-ui/ui-plan.md). CM aliases (`/change-management/*`) are route aliases, not separate pages.
- **Register in** `src/lib/auth/protected-routes.ts` with the correct permission key.
- **Every page** uses `export const dynamic = "force-dynamic"`.

---

## 11. Testing

Follow the testing strategy from [01-engine-core/engine-core.md §16](../01-engine-core/engine-core.md):

- **Unit tests** per step executor, condition evaluator, assignee resolver, SLA calculator, policy evaluator.
- **Integration tests** against a real Postgres for submit → advance → close. Test workflow is hand-seeded — **not one of the CM workflows** (those are Phase 02).
- **Invariant tests** for every PRD §22 invariant.
- **Cascade tests** for parent cancellation against IN_PROGRESS children.
- **`npm run validate`** (type-check + lint + tests) must pass for every phase's acceptance.

---

## 12. Checklist Before Merging Phase 00

Maps to the CLAUDE.md "Adding a New Feature" checklist:

- [ ] Prisma model added to `prisma/schema/workflow-engine.prisma`
- [ ] `npx prisma migrate dev --name workflow_engine_foundation && npm run db:generate`
- [ ] Domain entities created in `src/core/domain/entities/workflow-engine/`
- [ ] Repository interfaces + Prisma implementations created
- [ ] Use cases created in `src/core/use-cases/workflow-engine/` with mandatory `index.ts` barrels
- [ ] `WorkflowEngineModule` registered in `src/di/modules/workflow-engine.module.ts` and `module-definitions.ts`
- [ ] Controllers created in `src/interface-adapters/controllers/workflow-engine/`
- [ ] Engine permissions added to `permission-key.ts` + new group in `permission-groups.ts` + seeded
- [ ] `WORKFLOW_ENGINE` flag added to `feature-flag-keys.ts` + seeded (default: off)
- [ ] Pages use `requireFeature` **then** `requirePermission`, with `export const dynamic = "force-dynamic"`
- [ ] Routes registered in `protected-routes.ts`
- [ ] Sidebar manifest updated + `npm run generate:routes` run
- [ ] Viewer account cannot see engine routes
- [ ] `@LogExecution('workflow-engine.…')` decorators on every use case
- [ ] `ILoggerService` injected; no `console.log`
- [ ] `npm run validate` passes
