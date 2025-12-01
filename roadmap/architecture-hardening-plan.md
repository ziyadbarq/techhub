# Architecture Hardening & DRY Plan

Purpose: phased development plan to implement the recommended architecture improvements while keeping the codebase aligned to Clean Architecture, DRY, and SOLID.

**Context**: App is in development (not yet live). Full refactoring freedom for long-term stability.

## 1) Enforce Layer Boundaries (Linting)
- Document import rules matrix in `docs/architecture/IMPORT_RULES.md` (who can import whom, treatment of config/types/generated)
- Choose boundary tooling (e.g., `eslint-plugin-boundaries` or `@typescript-eslint/no-restricted-imports` with path groups) to codify allowed imports: `core → interface-adapters → infrastructure → app`, plus `config`/`lib` rules
- Add a single flat config entry for boundaries; include exceptions for generated types and DI tokens; block `lib` imports inside `core` unless explicitly allowed
- Add CI smoke test that inspects import graph (not just ESLint) - fails on violations before they reach production
- Incremental: Land rules in "warn", fix all violations, switch to "error"

## 2) Decouple Domain/Core From `lib`
- Audit `core` for imports from `src/lib` (permission cache, password utils, currency config, etc.) and classify:
  - Pure, domain-safe utilities → move into `core/shared` (no framework/runtime dependencies)
  - Imperative/runtime concerns → define interfaces in `core/services` and implement adapters in `infrastructure` or `lib`
- Update DI bindings and use cases/entities to consume interfaces
- Add test that enforces core has zero `lib` dependencies (fails CI if violated)
- Goal: Domain layer is pure business logic with no framework coupling

## 3) Single Source of Truth for Routes/Nav/Flags
- Define a typed route manifest (path, label, icon ref, permission(s), feature flag, visibility) in `src/config/routes.ts`
- **Generate** (not manually sync) derived artifacts:
  - Navigation groups (`navigation-groups/*.ts`)
  - Protected routes map (`protected-routes.ts`)
  - Optional sitemap/feature-flag aware menus for the dashboard
- Add file header to generated files: `// AUTO-GENERATED - DO NOT EDIT - Source: src/config/routes.ts`
- Add validation test that fails if generated files are manually modified (checksum or timestamp verification)
- Add manifest changes to "add a page" checklist in DEVELOPER_GUIDE.md
- Manifest is the single source of truth; all other route configs are code-generated

## 4) Add Read-Model/Query Layer for UI Enrichment
- **Location**: `src/interface-adapters/queries/` (fits Clean Architecture, sits above use cases)
- **Naming conventions**:
  - Table views: `listStockMovementsTableView()`, `listReservationsTableView()`
  - Detail views: `getAssetDetailsView()`, `getPersonDetailsView()`
  - Single entities: `getStockMovementView()`
- **Critical architectural constraint**: Queries are **view composers** that delegate to use cases:
  - Use for read-only, UI-specific aggregations (joins, counts, enrichment)
  - Business logic stays in use cases
  - Queries handle presentation concerns only (batching, formatting, joining)
  - Example: `listStockMovementsTableView()` calls use cases but handles batching/joining
  - Never bypass use cases for direct database access
- **Performance patterns**:
  - Implement DataLoader-style batching for entity lookups (avoid N+1)
  - Add caching layer for frequently accessed reference data (categories, locations, etc.)
  - For heavy lists: Consider materialized views via Prisma raw reads (infra adapter), keep write-path invariants in use cases
- **Testing**:
  - Add N+1 watch tests for hot screens (stock movements, reservations, kits)
  - Test that queries never call repositories directly (architectural boundary check)
- **Rollout**: Start with 1-2 high-traffic screens (stock movements, reservations), validate pattern, then extend to other modules

## 5) Modularize DI Container & Lazy Bindings
- **Architecture**: Single container instance with lazy module registration (avoids cross-scope issues)
- **Simplified approach**: Split container bindings into three tiers:
  - **Core** (always-on): RBAC, Foundation entities, base infrastructure
  - **Dashboard** (common): Assets, Inventory, CMDB, core ITAM features
  - **Heavy** (lazy): Intune, Service Management, Licenses (external APIs, heavy dependencies)
- Gate "Heavy" modules behind feature flags and route detection; support late binding for marketing/public pages to minimize startup overhead
- Defer per-feature splitting until proven necessary; start with simple three-tier approach
- **Module dependencies**: Document initialization order and cross-module dependencies to prevent circular issues
- **Testing**: Add smoke test that boots the minimal container plus each module individually (catches missing bindings early)
- **Health checks**: Modules that need DB readiness or external service checks should implement health check interfaces

## 6) Observability & Monitoring

### A) Fix Logging DRY Violations
- **Eliminate child logger duplication** (HIGH PRIORITY):
  - Current: `PinoLoggerChildService` duplicates 90% of parent class code (violates DRY)
  - Solution: Use composition pattern - inject parent service, delegate complex methods
  - Extract `getSlowOperationThreshold()` to `src/infrastructure/services/logger/timing-utils.ts`
  - Extract timing logic to shared utilities
  - Benefit: Single source of truth for timing/threshold logic

### B) Request Tracking & Correlation (HIGH PRIORITY)
- **Current gap**: No request IDs or correlation IDs (hurts production debugging)
- **Implement AsyncLocalStorage-based request context**:
  - Create `src/lib/request-context.ts` with `RequestContext` interface (requestId, userId, path, method)
  - Integrate into `proxy.ts` to generate/extract request IDs from headers
  - Update `PinoLoggerService` to automatically inject request context into all logs
  - Add correlation ID support for distributed tracing
  - Use `x-request-id` header (generate if missing)
- **Benefits**:
  - Correlate all logs within a single request
  - Trace requests across service boundaries
  - Debug production issues faster
  - Support distributed tracing (future)

### C) Automated Boundary Logging
- **Add AOP-style logging decorator** for use case entry/exit:
  - Create `@LogExecution(operationName?)` decorator in `src/lib/decorators/`
  - Automatically logs use case entry, exit, duration, and outcome
  - Replaces manual timing calls in every use case
  - Example: `@LogExecution('users.create')` on `CreateUserUseCase.execute()`
- **Controller logging middleware**:
  - Automatic request/response logging in API routes
  - Capture status code, duration, error type
  - Include user ID and permissions from session

### D) Enhanced Observability
- **Permission/Feature flag metrics**: Track authorization failures for operational visibility
  - Count permission denials by user/permission (top offenders without leaking data)
  - Track feature flag checks and disabled feature attempts
  - Helps identify misconfigured roles or users hitting disabled features
- **Performance monitoring**: Add query duration tracking at query layer
  - Log slow queries (>500ms threshold)
  - Track N+1 patterns in production (count queries per request)
  - Add structured metrics for aggregation (DataLoader hit rate, cache effectiveness)
- **Error aggregation**: Ensure errors bubble up with context (use case → controller → API)
  - Include request ID, user ID, operation type in error logs
  - Use structured logging format for easy parsing/alerting
  - Add error classification (operational vs non-operational)

### E) Structured Log Helpers (Optional)
- Add domain-specific log helpers for common patterns:
  - `logger.logUserAction(action, userId, metadata)` - standardized user action logs
  - `logger.logDatabaseOperation(operation, table, duration, rowCount)` - DB operation patterns
  - `logger.logPermissionCheck(permission, userId, result, resource)` - permission auditing
  - `logger.logFeatureFlagCheck(flag, userId, enabled)` - feature flag usage tracking

## 7) Testing Strategy
- **Layer tests**:
  - Use case tests: Test business logic with mocked repositories
  - Repository tests: Test data access with test database
  - Query layer tests: Test view composition and N+1 detection
  - Controller tests: Test permission checks and error handling
- **Contract tests**: Minimal contract tests per module (use case + adapter)
  - Ensures use case → repository contract is maintained
  - Catches breaking changes in adapters
- **End-to-end tests**: Thin e2e happy paths for critical features
  - Assign asset, move stock, sync Intune device, create reservation
  - Run against test database; keep fast (<30s total)
  - Focus on integration points, not exhaustive scenarios
- **Performance tests**: N+1 watch tests for hot screens
  - Stock movements table, reservations list, asset kits
  - Assert query count stays under threshold
  - Run in CI to catch regressions
- **Architecture tests**: Enforce boundaries via tests
  - Test that core has zero `lib` imports
  - Test that queries never call repositories directly
  - Test that generated files match manifest
- **CI gate**: All tests run via `npm run validate` (single command)

## 8) Rollout Strategy
- Perform incremental implementation:
  1) **Boundaries**: Land lint rules in "warn", fix violations, switch to "error"
  2) **Domain purity**: Migrate `lib` usages out of `core` module-by-module, add zero-dependency test
  3) **Routes manifest**: Implement manifest, generation script, validation tests, update checklist
  4) **Query layer**: Start with stock movements + reservations, add N+1 tests, validate pattern, extend to other modules
  5) **DI modules**: Implement Core/Dashboard/Heavy split with lazy loading, add smoke tests
  6) **Observability**: Implement in phases:
     - Phase 1 (High Priority): Fix logging DRY violations (refactor child logger), implement request tracking (AsyncLocalStorage)
     - Phase 2 (Medium Priority): Add automated boundary logging decorator, extract timing utilities
     - Phase 3 (Optional): Add structured log helpers for common patterns, permission/feature flag metrics
     - Phase 4 (Polish): Enhance error aggregation, add performance metrics aggregation
  7) **Testing**: Backfill contract tests, e2e tests, architecture tests as features stabilize

## 9) Documentation
- Update `CLAUDE.md` references only with high-level pointers; put implementation details in new docs:
  - `docs/architecture/IMPORT_RULES.md` → import matrix (who can import whom)
  - `docs/architecture/ARCHITECTURE.md` → add sections on boundary linting and query layer architecture
  - `docs/guides/DEVELOPER_GUIDE.md` → add how-to for:
    - Adding routes to the manifest (update checklist)
    - Binding DI modules and lazy loading
    - Creating query layer views
    - Writing N+1 watch tests
  - `docs/guides/LOGGING.md` → update with:
    - Request tracking and correlation IDs usage
    - Using @LogExecution decorator for automatic boundary logging
    - Structured log helpers for common patterns
    - Best practices for production debugging with request context
  - Keep this plan as the execution reference
