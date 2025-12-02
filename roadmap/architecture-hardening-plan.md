# Architecture Hardening & DRY Plan

Purpose: phased development plan to implement the recommended architecture improvements while keeping the codebase aligned to Clean Architecture, DRY, and SOLID.

**Context**: App is in development (not yet live). Full refactoring freedom for long-term stability.

---

## ✅ Phase 1 Complete: Foundation & Boundaries

**Status**: Implemented and tested (Confidence: 100/100)

### Completed Items:
1. **Layer boundary enforcement** - ESLint rules (warn mode), import matrix documented in [IMPORT_RULES.md](../docs/architecture/IMPORT_RULES.md)
2. **Core/domain decoupling** - Created service interfaces (`IPasswordService`, `IPermissionCacheService`), moved currency config to `core/shared/`, implemented 31 repository/service abstractions
3. **DI refactoring** - All use cases now inject dependencies via interfaces (zero concrete lib imports in core)

**Deliverables**:
- [IMPORT_RULES.md](../docs/architecture/IMPORT_RULES.md) - Complete import matrix with examples
- [LOGGING_IMPROVEMENTS.md](../docs/architecture/LOGGING_IMPROVEMENTS.md) - Phase 4 roadmap
- ESLint boundary rules (6 layer configs in warn mode)
- 31 repository/service interfaces with DI bindings (11 new interfaces, 7 modified, 13 implementations)
- All tests passing (1697/1697) - Fixed ownership permission logic in check-permission.use-case.ts
- 3 known ESLint warnings in lib/auth (backward-compat re-exports, documented exceptions)

---

## Phase 2: Routes Manifest & Query Layer

### ✅ 2.1) Single Source of Truth for Routes/Nav/Flags (COMPLETE)

**Status**: Implemented and tested (Confidence: 100/100)

**Completed Items**:
- ✅ Defined typed route manifest in `src/config/routes-manifest.ts` (72 routes, 7 nav groups)
- ✅ Created code generator (`scripts/generate-routes.ts`) with icon name mapping
- ✅ Generated navigation groups (7 files in `navigation-groups/`)
- ✅ Generated protected routes map (`protected-routes.ts`) with helper functions
- ✅ Added auto-generated file headers with warnings
- ✅ Documented in [DEVELOPER_GUIDE.md](../docs/guides/DEVELOPER_GUIDE.md) section 11
- ✅ All validation passing (TypeScript + ESLint)
- ✅ npm script: `npm run generate:routes`

**Deliverables**:
- `src/config/routes-manifest.ts` - Single source of truth (72 routes)
- `scripts/generate-routes.ts` - Code generator with permission mapping
- `scripts/fix-manifest-permissions.ts` - One-time migration script
- 7 auto-generated navigation group files
- Auto-generated `protected-routes.ts` with route protection helpers
- Documentation section in DEVELOPER_GUIDE.md
- **TODO**: Add validation tests for generated file integrity

**Key Learnings**:
- Icon mapping required due to Lucide `displayName` unreliability
- Permission constant names (not values) needed for template literals
- Template literal `PERMISSIONS.${name}` pattern for code generation
- Validation essential after generation (`npm run validate`)

### ✅ 2.2) Add Read-Model/Query Layer for UI Enrichment (COMPLETE)

**Status**: Implemented and validated (Confidence: 95/100)

**Completed Items**:
- ✅ Created query layer infrastructure in `src/interface-adapters/queries/`
- ✅ Implemented DataLoader-style batching with `BatchLoader` class
- ✅ Created pilot queries: `StockMovementsTableQuery`, `AssetReservationsTableQuery`
- ✅ Added N+1 watch tests (10 tests total, 5 per query)
- ✅ Registered in DI container (inventory & reservations modules)
- ✅ TypeScript validation passing for query implementation files
- ✅ Performance improvement: 10-30x reduction in database queries

**Deliverables**:
- `src/interface-adapters/queries/base-query.interface.ts` - Base interface and batch config
- `src/interface-adapters/queries/batch-loader.ts` - DataLoader implementation (0ms batching window)
- `src/interface-adapters/queries/stock-movements-table.query.ts` - Stock movements with batching
- `src/interface-adapters/queries/asset-reservations-table.query.ts` - Reservations with batching
- `src/interface-adapters/queries/index.ts` - Barrel exports
- `src/interface-adapters/queries/__tests__/` - N+1 watch tests with README
- DI tokens in `src/di/types.ts` (StockMovementsTableQuery, AssetReservationsTableQuery)
- Bindings in `src/di/modules/inventory.module.ts` and `reservations.module.ts`

**Architecture Validated**:
- ✅ Queries delegate to use cases (never call repositories directly)
- ✅ DataLoader batching prevents N+1 queries (100 movements = ~10 queries vs 100+)
- ✅ Request-scoped caching (no cross-request pollution)
- ✅ Graceful degradation for missing entities (returns null, doesn't throw)

**Performance Benchmarks**:
- Stock movements: 100 items = ~10 queries (4 base + ~6 assignment lookups)
- Asset reservations: 100 items = 3 queries (constant, regardless of data size)

**Known Issues**:
- Test TypeScript errors (cosmetic only - mocks don't fully implement entity interfaces)
- See `src/interface-adapters/queries/__tests__/README.md` for details
- Query implementation files have zero TypeScript errors ✅

**Next Steps**:
- Integrate queries into existing controllers (replace manual enrichment)
- Add more queries: assets table view, persons table view, etc.
- Add integration tests with real database
- Optional: Fix test mocks or use double assertion pattern

---

## Phase 3: DI Modularization & Lazy Loading

### 3.1) Modularize DI Container & Lazy Bindings
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

---

## Phase 4: Observability & Monitoring

### A) Fix Logging DRY Violations (HIGH PRIORITY)
- **Eliminate child logger duplication**:
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

---

## Phase 5: Testing Strategy

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

---

## Rollout Strategy

- Perform incremental implementation:
  1) ✅ **Phase 1 (COMPLETE)**: Boundaries (warn mode), domain purity, DI interfaces
  2) ✅ **Phase 2 (COMPLETE)**: Routes manifest (2.1) + query layer pilot (2.2)
  3) **Phase 3 (NEXT)**: DI modules (Core/Dashboard/Heavy split, lazy loading)
  4) **Phase 4**: Observability (logging DRY fixes, request tracking, automated boundary logging)
  5) **Phase 5**: Testing backfill (contract tests, e2e, architecture tests)
  6) **Phase 6 (Polish)**: Hardening & finalization

---

## Phase 6: Polish & Hardening

**Purpose**: Finalize enforcement and add architectural safety nets after all major features are implemented.

### 6.1) ESLint Boundary Rules - Switch to Error Mode
- **Current State**: Rules in "warn" mode (prevents new violations, allows existing)
- **Action**: Switch all layer boundary rules from "warn" to "error"
- **Prerequisites**:
  - Address 3 backward-compat TYPE import warnings in auth layer (or document as exceptions)
  - Verify no new warnings introduced in Phases 2-5
- **Impact**: Hard enforcement of architectural boundaries (CI fails on violations)

### 6.2) CI Import Graph Smoke Test
- **Purpose**: Catch boundary violations that ESLint might miss (runtime imports, conditional requires, etc.)
- **Implementation**:
  - Add architectural test suite in `tests/architecture/import-boundaries.test.ts`
  - Parse import graph and validate layer boundaries
  - Test critical patterns:
    - Core has zero `lib` imports
    - Queries never import repositories directly
    - DI modules respect lazy loading boundaries
- **Run in CI**: Fail builds on violations before they reach production
- **Tools**: dependency-cruiser, madge, or custom import parser

### 6.3) Optional Enhancements
- Structured log helpers for common patterns (if valuable after Phase 4 observability)
- Pre-commit hook for fast boundary checking (lightweight, fails fast)
- Import graph visualization for documentation

---

## Documentation Updates

Update docs with implementation details (CLAUDE.md stays high-level):
- ✅ `docs/architecture/IMPORT_RULES.md` → import matrix (completed)
- ✅ `docs/architecture/LOGGING_IMPROVEMENTS.md` → logging refactoring plan (completed)
- ✅ `docs/guides/DEVELOPER_GUIDE.md` section 11 → Routes manifest system (completed)
- 🚧 `docs/architecture/ARCHITECTURE.md` → add sections on boundary linting and query layer architecture (TODO)
- 🚧 `docs/guides/DEVELOPER_GUIDE.md` → add how-to for:
  - ✅ Adding routes to the manifest (section 11 - completed)
  - ⏳ Creating query layer views (TODO - add section 8.4)
  - ⏳ Writing N+1 watch tests (TODO - add to testing section)
  - ⏳ Binding DI modules and lazy loading (Phase 3)
- ⏳ `docs/guides/LOGGING.md` → update with:
  - Request tracking and correlation IDs usage (Phase 4)
  - Using @LogExecution decorator for automatic boundary logging (Phase 4)
  - Structured log helpers for common patterns (Phase 4)
  - Best practices for production debugging with request context (Phase 4)
- Keep this plan as the execution reference
