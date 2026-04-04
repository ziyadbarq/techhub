# Testing Strategy — Comprehensive Test Coverage

**Status**: Planned
**Priority**: High
**Complexity**: Large (ongoing)
**Estimated Effort**: Ongoing — start with high-value targets, expand incrementally
**Last Updated**: 2026-03-27

> Extracted from architecture-hardening-plan.md Phases 5-6. This is a "can of worms" —
> large, cross-cutting work that touches every module. Approach incrementally.

## Current State

The codebase has **minimal test coverage**:
- `src/core/use-cases/intune/__tests__/sync-devices-from-intune.use-case.test.ts` — Intune sync rollback scenario
- `tests/use-cases/database-backup.use-case.test.ts` — Database backup/restore
- `tests/di/module-loading.test.ts` — DI module smoke tests
- `src/interface-adapters/queries/__tests__/` — N+1 watch tests (10 tests)
- A few other scattered test files

**Test command**: `npm run validate` (type-check + lint + test)

## Strategy: Prioritized Test Layers

### Layer 1: Use Case Tests (Highest Value)

Test business logic with mocked repositories. These catch logic bugs without database setup.

**Priority targets** (complex business logic):
1. Intune sync — re-enrollment, constraint violations, rollback (partially done)
2. Asset kit checkout — quantity validation, item assignment
3. Maintenance record — state machine transitions (scheduled → in-progress → completed/cancelled)
4. License allocation — quantity tracking, over-allocation prevention
5. Asset reservation — activation, expiration, conflict detection
6. Data import processor — validation, fuzzy matching, batch processing

**Pattern**: Each use case test file:
- Mocks repository interfaces
- Tests happy path + error cases + edge cases
- Validates business rules are enforced

### Layer 2: Architecture Boundary Tests

Enforce Clean Architecture layer boundaries via automated tests.

**Tests to write** (`tests/architecture/import-boundaries.test.ts`):
- Core domain has zero `lib/` imports
- Core domain has zero `infrastructure/` imports
- Queries never import repositories directly
- Use cases never import Prisma directly
- DI modules respect lazy loading boundaries

**Tools**: `dependency-cruiser`, `madge`, or custom import parser

### Layer 3: Contract Tests

Ensure use case + repository adapter contracts are maintained.

**Approach**:
- One test per module verifying the contract between use case and repository
- Catches breaking changes when repository implementations change
- Minimal: test method signatures and return types

### Layer 4: End-to-End Tests

Thin happy-path tests for critical flows against a test database.

**Priority flows**:
1. Asset lifecycle: create → assign → move stock → dispose
2. Intune sync: trigger → devices created → linked to assets
3. Reservation: create → activate → complete
4. Data import: upload CSV → validate → import → verify records

**Approach**:
- Use test database (not mocks)
- Keep fast (<30s total)
- Focus on integration points
- Run in CI

### Layer 5: Performance Tests

N+1 watch tests for data-heavy screens.

**Existing**: Stock movements, asset reservations (in `queries/__tests__/`)
**Add**: Assets table, persons table, CI table, license table

## Phase 6: ESLint Hardening (from architecture-hardening-plan)

### 6.1 Switch ESLint Boundary Rules to Error Mode
- **Current**: Rules in "warn" mode
- **Action**: Switch to "error" after addressing 3 known warnings in auth layer
- **Impact**: CI fails on architectural boundary violations

### 6.2 CI Import Graph Smoke Test
- Parse import graph and validate layer boundaries in CI
- Catch violations ESLint might miss (runtime imports, conditional requires)
- Tools: `dependency-cruiser` or custom parser

## Recommended Approach

**Do NOT try to add tests everywhere at once.** Instead:

1. **When fixing a bug**: Add a test that reproduces the bug before fixing it
2. **When adding a feature**: Write tests for the new use cases
3. **Dedicated sprints**: Pick one "priority target" from Layer 1, write tests for that module
4. **Architecture tests**: Set up once, run forever — high ROI

## Files to Create

| File | Purpose |
|------|---------|
| `tests/architecture/import-boundaries.test.ts` | Layer boundary enforcement |
| `tests/use-cases/maintenance-record.test.ts` | State machine transitions |
| `tests/use-cases/asset-reservation.test.ts` | Reservation lifecycle |
| `tests/use-cases/license-allocation.test.ts` | Allocation business rules |
| `tests/use-cases/asset-kit-checkout.test.ts` | Checkout validation |
| (more as needed) | |

## Verification

- `npm run validate` passes (includes all tests)
- CI pipeline runs tests on every push
- Architecture boundary tests catch violations before merge
