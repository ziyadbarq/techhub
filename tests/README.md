# Testing Guide

This directory contains integration tests for the Barq Assets using Vitest and Testcontainers.

## Overview

Our testing strategy focuses on **integration tests** that verify the entire stack against a real PostgreSQL database. No mocking - real database operations that give you confidence your code works in production.

**Key Technologies:**

- **Vitest 4.0.10** - Fast, modern test runner with great DX
- **Testcontainers** - Spins up real PostgreSQL containers for testing
- **PostgreSQL 16 Alpine** - Lightweight, production-like database

## Project Structure

```
tests/
├── setup/
│   ├── database.ts         # Testcontainers setup utilities
│   └── vitest.setup.ts     # Global Vitest configuration
└── integration/
    └── repositories/
        └── task.repository.test.ts  # Task repository integration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- task.repository.test

# Run tests with coverage
npm test -- --coverage
```

## Test Structure

### Integration Tests

Integration tests verify that your repositories work correctly against a real database:

**Example:**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from "../../setup/database";

describe("MyRepository Integration Tests", () => {
  let repository: MyRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    prisma = setup.prisma;
    repository = new MyRepository(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should create a record", async () => {
    const result = await repository.create({ ... });
    expect(result).toBeTruthy();
  });
});
```

## Database Setup Utilities

### `setupTestDatabase()`

Starts a PostgreSQL container, runs migrations, and returns a connected Prisma Client.

**Usage:**

```typescript
const { prisma, container } = await setupTestDatabase();
```

**What it does:**

1. Starts PostgreSQL 16 Alpine container
2. Exposes port 5432
3. Runs Prisma migrations (`db:push`)
4. Returns connected PrismaClient

### `teardownTestDatabase()`

Disconnects Prisma and stops the PostgreSQL container.

**Usage:**

```typescript
await teardownTestDatabase();
```

### `cleanDatabase()`

Deletes all data from all tables. Use in `beforeEach()` for test isolation.

**Usage:**

```typescript
beforeEach(async () => {
  await cleanDatabase();
});
```

**Deletion order:**

```typescript
// Deletes in reverse dependency order:
1. PromptCompositionBlock
2. PromptComposition
3. PromptBlock
4. Task
```

### `getTestPrisma()`

Returns the current Prisma client instance. Throws if database not initialized.

**Usage:**

```typescript
const prisma = getTestPrisma();
```

## Test Isolation

Each test should be completely isolated from others. We achieve this through:

1. **Fresh Database**: Each test suite gets a new PostgreSQL container
2. **Clean Data**: `cleanDatabase()` wipes all data before each test
3. **No Shared State**: Tests don't depend on each other

**Example:**

```typescript
beforeEach(async () => {
  await cleanDatabase(); // Start fresh every test
});

it("test 1", async () => {
  // This test's data won't affect test 2
});

it("test 2", async () => {
  // Clean slate - no data from test 1
});
```

## Writing Good Tests

### ✅ DO

- **Test against real database** - No mocking repositories
- **Use descriptive test names** - "should create task with all fields"
- **Arrange-Act-Assert pattern** - Clear test structure
- **Test edge cases** - Null values, empty arrays, max lengths
- **Verify persistence** - Check database state after operations
- **Clean up** - Use `beforeEach` to clean database

### ❌ DON'T

- **Don't mock database** - Defeats the purpose of integration tests
- **Don't share state** - Each test should be independent
- **Don't skip cleanup** - Always clean database between tests
- **Don't test implementation** - Test behavior, not internals
- **Don't commit .only** - Keep all tests running

### Example Test Pattern

```typescript
describe("create", () => {
  it("should create a record with all fields", async () => {
    // Arrange
    const data = { title: "Test", description: "Test Description" };

    // Act
    const result = await repository.create(data);

    // Assert
    expect(result.id).toBeTruthy();
    expect(result.title).toBe("Test");
    expect(result.description).toBe("Test Description");

    // Verify persistence
    const found = await prisma.myModel.findUnique({ where: { id: result.id } });
    expect(found).toBeTruthy();
  });
});
```

## Configuration

### `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    testTimeout: 30000, // 30s for container startup
    hookTimeout: 30000,
    pool: "forks", // Sequential execution
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### `tests/setup/vitest.setup.ts`

Global setup that runs once before all tests:

- Sets `NODE_ENV=test`
- Sets `LOG_LEVEL=error`
- Imports `reflect-metadata` for InversifyJS

## Testcontainers

Testcontainers automatically manages Docker containers for your tests:

**Features:**

- ✅ Automatic container lifecycle (start/stop)
- ✅ Random ports to avoid conflicts
- ✅ Cleanup on exit
- ✅ Support for CI/CD environments
- ✅ Real PostgreSQL (not SQLite)

**Requirements:**

- Docker Desktop running
- Docker daemon accessible

**Troubleshooting:**

```bash
# Check Docker is running
docker ps

# If tests hang, check Docker logs
docker logs $(docker ps -q)

# Clean up dangling containers
docker system prune
```

## Performance

**Typical test execution times:**

- Container startup: ~5-10 seconds (first test suite)
- Container reuse: ~0 seconds (within same suite)
- Single test: ~10-100ms
- Full test suite: ~15-30 seconds

**Optimization tips:**

1. Reuse container within test suite (`beforeAll` vs `beforeEach`)
2. Use `cleanDatabase()` instead of recreating container
3. Run sequential execution for database tests
4. Group related tests in same describe block

## CI/CD Integration

Tests work out-of-the-box in CI environments with Docker:

**GitHub Actions Example:**

```yaml
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/test
```

Testcontainers will automatically detect CI environment and adjust accordingly.

## Debugging Tests

### Run single test with logs

```bash
npm test -- task.repository.test --reporter=verbose
```

### Enable Prisma query logging

```typescript
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

### View Docker container logs

```bash
docker logs <container-id>
```

### Use Vitest UI

```bash
npm run test:ui
# Open http://localhost:51204/__vitest__/
```

## Adding New Tests

1. Create test file: `tests/integration/<domain>/<file>.test.ts`
2. Import setup utilities:
   ```typescript
   import {
     setupTestDatabase,
     teardownTestDatabase,
     cleanDatabase,
   } from "../../setup/database";
   ```
3. Follow the integration test pattern (see examples above)
4. Update `cleanDatabase()` if you add new models
5. Run tests: `npm test`

## Migration from Manual DTOs to Generated

The Task controller has been migrated to use auto-generated Zod schemas:

**Before:**

```typescript
import { CreateTaskSchema } from "../dtos/task.dto";
```

**After:**

```typescript
import { CreateTaskSchema } from "../dtos/generated/task.dto";
```

**Migration Strategy:**

1. Generated schemas in `src/generated/zod/` (auto-generated)
2. Integration layer in `src/interface-adapters/dtos/generated/`
3. Manual DTOs kept for backward compatibility
4. Migrate controllers incrementally
5. Remove manual DTOs once all migrated

## FAQ

**Q: Tests are slow. How can I speed them up?**
A: Container startup takes ~5-10s. Reuse containers with `beforeAll` instead of `beforeEach`.

**Q: Can I run tests in parallel?**
A: Yes, but each test suite should manage its own container to avoid conflicts.

**Q: Do I need Docker installed?**
A: Yes. Testcontainers requires Docker to run containers.

**Q: Can I test against my production database?**
A: **No!** Always use Testcontainers for isolated test databases.

**Q: How do I add a new model to cleanDatabase()?**
A: Update `tests/setup/database.ts` and add delete statement in reverse dependency order.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testcontainers Documentation](https://node.testcontainers.org/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Clean Architecture Testing](https://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html)

## Example: Task Repository Tests

See `tests/integration/repositories/task.repository.test.ts` for a comprehensive example covering:

- ✅ CRUD operations (create, read, update, delete)
- ✅ Filtering and querying
- ✅ Edge cases (not found, validation errors)
- ✅ Domain entity mapping
- ✅ Data integrity across operations
- ✅ Status counting and aggregation

This serves as the template for all repository tests in the assets app.
