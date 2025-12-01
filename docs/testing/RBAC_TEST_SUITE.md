# RBAC Test Suite Documentation

## Overview

This document provides a comprehensive overview of the RBAC (Role-Based Access Control) test suite created for the barq-assets project. The test suite covers all layers of the Clean Architecture implementation, from permission utilities to controllers.

## Test Coverage Summary

### Test Files Created

1. **Unit Tests - Permission Checking Utilities**
   - **File**: `src/lib/permissions/__tests__/check-permission.test.ts`
   - **Coverage**: Permission checking functions (hasPermission, requirePermission, hasAllPermissions, hasAnyPermission)
   - **Test Count**: 25+ tests

2. **Unit Tests - RBAC Use Cases**
   - `src/core/use-cases/rbac/__tests__/check-permission.use-case.test.ts`
   - `src/core/use-cases/rbac/__tests__/assign-role-to-user.use-case.test.ts`
   - `src/core/use-cases/rbac/__tests__/revoke-role-from-user.use-case.test.ts`
   - `src/core/use-cases/rbac/__tests__/create-role.use-case.test.ts`
   - `src/core/use-cases/rbac/__tests__/assign-permissions-to-role.use-case.test.ts`
   - **Total Test Count**: 100+ tests

3. **Integration Tests - Repositories**
   - `src/infrastructure/repositories/__tests__/prisma-role.repository.test.ts`
   - **Coverage**: Database operations, CRUD, queries
   - **Test Count**: 20+ tests

4. **Integration Tests - Controllers**
   - `src/interface-adapters/controllers/__tests__/rbac.controller.test.ts`
   - **Coverage**: Server actions, error handling, response formatting
   - **Test Count**: 20+ tests

5. **Test Helpers**
   - `tests/helpers/rbac-test.helper.ts`
   - **Utilities**: Test data factories, assertion helpers, mock builders

## Test Organization

```
barq-assets/
├── src/
│   ├── lib/permissions/__tests__/
│   │   └── check-permission.test.ts
│   ├── core/use-cases/rbac/__tests__/
│   │   ├── check-permission.use-case.test.ts
│   │   ├── assign-role-to-user.use-case.test.ts
│   │   ├── revoke-role-from-user.use-case.test.ts
│   │   ├── create-role.use-case.test.ts
│   │   └── assign-permissions-to-role.use-case.test.ts
│   ├── infrastructure/repositories/__tests__/
│   │   └── prisma-role.repository.test.ts
│   └── interface-adapters/controllers/__tests__/
│       └── rbac.controller.test.ts
└── tests/
    └── helpers/
        └── rbac-test.helper.ts
```

## Running Tests

### Run All RBAC Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test src/lib/permissions/__tests__/check-permission.test.ts

# Run tests in watch mode
npm test -- --watch

# Run use case tests only
npm test src/core/use-cases/rbac/__tests__
```

### Run Specific Test Suites

```bash
# Unit tests only
npm test -- --grep "Unit Tests"

# Integration tests only
npm test -- --grep "Integration Tests"

# Specific use case
npm test -- --grep "CheckPermissionUseCase"
```

## Test Coverage by Component

### 1. Permission Checking Utilities (`check-permission.test.ts`)

**Tests Cover:**

- ✅ Basic permission checking (user has/lacks permission)
- ✅ Ownership-based permissions (tasks:update:own)
- ✅ Multiple permission checks (hasAllPermissions, hasAnyPermission)
- ✅ Error handling and propagation
- ✅ requirePermission throwing InsufficientPermissionsError
- ✅ Context passing for ownership checks

**Key Test Cases:**

- User has permission → returns true
- User lacks permission → returns false
- Ownership checks with matching/mismatching owners
- All permissions required (AND logic)
- Any permission required (OR logic)
- Error propagation from use case layer

### 2. CheckPermissionUseCase (`check-permission.use-case.test.ts`)

**Tests Cover:**

- ✅ Basic permission checking (exact matches)
- ✅ Cache behavior (hits and misses)
- ✅ Ownership-based permissions with context
- ✅ Cache invalidation
- ✅ executeOrThrow method
- ✅ Database query performance logging

**Key Test Cases:**

- Cache miss on first call, cache hit on second
- Ownership validation (user owns resource)
- Ownership denial (user doesn't own resource)
- Permission matching with :own suffix
- Logging of cache statistics
- Edge cases (many permissions, special characters)

### 3. AssignRoleToUserUseCase (`assign-role-to-user.use-case.test.ts`)

**Tests Cover:**

- ✅ Successful role assignment
- ✅ Role validation (RoleNotFoundError)
- ✅ Duplicate assignment prevention (RoleAlreadyAssignedError)
- ✅ Expired role handling (allows re-assignment)
- ✅ Audit logging
- ✅ Cache invalidation
- ✅ Expiration date handling

**Key Test Cases:**

- Assign role with expiration date
- Assign role without expiration (permanent)
- Prevent duplicate active assignments
- Allow assignment if previous is expired
- Multiple users with same role
- Same user with multiple roles
- Audit log includes role name and details

### 4. RevokeRoleFromUserUseCase (`revoke-role-from-user.use-case.test.ts`)

**Tests Cover:**

- ✅ Successful role revocation
- ✅ Role validation (RoleNotFoundError)
- ✅ Idempotent behavior (safe to call multiple times)
- ✅ Audit logging with before/after state
- ✅ Cache invalidation
- ✅ Active/expired assignment logging

**Key Test Cases:**

- Revoke active assignment
- Revoke expired assignment
- Idempotent revocation (no error if already revoked)
- No audit log if assignment doesn't exist
- Multiple users with same role (independent revocation)
- User with multiple roles (selective revocation)
- Logging of assignment activity status

### 5. CreateRoleUseCase (`create-role.use-case.test.ts`)

**Tests Cover:**

- ✅ Successful role creation
- ✅ System vs non-system roles
- ✅ Duplicate prevention (DuplicateRoleError)
- ✅ Audit logging
- ✅ Name normalization (lowercase)
- ✅ Optional fields handling

**Key Test Cases:**

- Create role with all fields
- Create system role (isSystem=true)
- Create non-system role by default
- Prevent duplicate role names
- Name normalization to lowercase
- Creation without description
- Creation without createdBy

### 6. AssignPermissionsToRoleUseCase (`assign-permissions-to-role.use-case.test.ts`)

**Tests Cover:**

- ✅ Successful permission assignment
- ✅ Replace semantics (removes deselected permissions)
- ✅ Role validation (RoleNotFoundError)
- ✅ System role protection (SystemRoleModificationError)
- ✅ Permission validation (PermissionNotFoundError)
- ✅ Audit logging with before/after state
- ✅ Global cache invalidation

**Key Test Cases:**

- Assign multiple permissions to role
- Replace permissions (remove missing, add new)
- Prevent modification of system roles
- Validate all permissions exist before assignment
- Empty permission list handling
- Large number of permissions (50+)
- Audit log includes added/removed permissions
- Cache invalidation for all users

### 7. PrismaRoleRepository (`prisma-role.repository.test.ts`)

**Tests Cover:**

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Query methods (findById, findByName, findAll, findByIds)
- ✅ Active/inactive role filtering
- ✅ Role existence checking
- ✅ Permission assignment/removal
- ✅ Sorting (system roles first, then alphabetically)

**Key Test Cases:**

- Find by ID (exists and not exists)
- Find by name (exists and not exists)
- Find all with active filter
- Include inactive roles when specified
- Correct sorting (isSystem desc, name asc)
- Create with all properties
- Update mutable properties (displayName, description, isActive)
- Delete role
- Assign/remove permissions
- Check existence by name

**Note**: Current tests use mock Prisma client. For full integration tests, consider using Testcontainers:

```typescript
import { PostgreSqlContainer } from "@testcontainers/postgresql";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUrl();
  prisma = new PrismaClient();
  // Run migrations
});
```

### 8. RBAC Controller (`rbac.controller.test.ts`)

**Tests Cover:**

- ✅ checkPermissionAction (permission checking server action)
- ✅ getMyPermissionsAction (current user permissions)
- ✅ getUserPermissionsAction (admin: any user permissions)
- ✅ Error handling and response formatting
- ✅ Discriminated union responses

**Key Test Cases:**

- Check permission returns correct hasPermission boolean
- Get permissions for current user
- Get permissions for specific user (admin operation)
- Empty permissions when user has no roles
- Error responses with success=false
- Correct response format (ActionResponse<T>)
- Error propagation from use case layer

## Test Patterns and Best Practices

### 1. **Mocking Strategy**

```typescript
// Mock dependencies using Partial<Interface>
class MockUserRoleRepository implements Partial<IUserRoleRepository> {
  private userRoles = new Map<string, UserRole>();

  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    return this.userPermissions.get(userId) || [];
  }

  // Test helpers
  setUserPermissions(userId: string, permissions: PermissionKey[]): void {
    this.userPermissions.set(userId, permissions);
  }

  clear(): void {
    this.userPermissions.clear();
  }
}
```

### 2. **Test Structure (AAA Pattern)**

```typescript
it("should create a role with valid data", async () => {
  // Arrange
  const role = Role.create({
    name: "editor",
    displayName: "Editor",
  });

  // Act
  const result = await useCase.execute({
    name: "editor",
    displayName: "Editor",
  });

  // Assert
  expect(result).toBeDefined();
  expect(result.name).toBe("editor");
});
```

### 3. **Testing Async Operations**

```typescript
// Use async/await with expect().rejects
await expect(useCase.execute({ roleId: "invalid" })).rejects.toThrow(
  RoleNotFoundError,
);

// Use async/await with expect().resolves
await expect(useCase.execute({ roleId: validRoleId })).resolves.toBeUndefined();
```

### 4. **Cache Testing**

```typescript
beforeEach(() => {
  // Clear permission cache before each test
  permissionCache.invalidateAll();
});

// Test cache behavior
it("should use cache on second call", async () => {
  const spy = vi.spyOn(mockRepository, "getUserPermissions");

  // First call - cache miss
  await useCase.execute({ userId: "user-1", permission: "tasks:read" });

  // Second call - cache hit
  await useCase.execute({ userId: "user-1", permission: "tasks:read" });

  // Assert: repository only called once
  expect(spy).toHaveBeenCalledTimes(1);
});
```

### 5. **Error Testing**

```typescript
it("should throw InsufficientPermissionsError with details", async () => {
  mockUseCase.execute.mockResolvedValue(false);

  try {
    await requirePermission("user-1", "tasks:delete");
    expect.fail("Should have thrown error");
  } catch (error) {
    expect(error).toBeInstanceOf(InsufficientPermissionsError);
    expect((error as InsufficientPermissionsError).requiredPermission).toBe(
      "tasks:delete",
    );
    expect((error as InsufficientPermissionsError).userId).toBe("user-1");
  }
});
```

## Test Helpers and Utilities

### RBACTestFactory

```typescript
// Create test roles
const editor = RoleTestFactory.createEditor();
const viewer = RoleTestFactory.createViewer();
const admin = RoleTestFactory.createAdmin();

// Create test permissions
const readPerm = PermissionTestFactory.createTasksRead();
const createPerm = PermissionTestFactory.createTasksCreate();

// Create user roles
const userRole = UserRoleTestFactory.create("user-1", "role-1");
const expiredRole = UserRoleTestFactory.createExpired("user-1", "role-1");
const futureRole = UserRoleTestFactory.createWithExpiry("user-1", "role-1", 7);
```

### Assertion Helpers

```typescript
// Assert permission arrays are equal (order-independent)
RBACAssertions.assertPermissionArraysEqual(actual, expected);

// Assert role properties
RBACAssertions.assertRoleProperties(role, {
  name: "editor",
  displayName: "Editor",
  isSystem: false,
});
```

## Additional Tests to Consider

While the current test suite is comprehensive, here are additional tests you might want to add:

### 1. **Permission Repository Integration Tests**

```bash
src/infrastructure/repositories/__tests__/prisma-permission.repository.test.ts
```

- CRUD operations for permissions
- Query by resource, action, names
- Active/inactive filtering
- System permission protection

### 2. **User Role Repository Integration Tests**

```bash
src/infrastructure/repositories/__tests__/prisma-user-role.repository.test.ts
```

- User role assignment/deletion
- Permission aggregation
- Expiration handling
- Active role queries

### 3. **Audit Log Repository Integration Tests**

```bash
src/infrastructure/repositories/__tests__/prisma-audit-log.repository.test.ts
```

- Audit log creation
- Filtering (user, action, entity, date range)
- Pagination
- Cleanup/retention

### 4. **Additional Use Case Tests**

```bash
src/core/use-cases/rbac/__tests__/get-user-permissions.use-case.test.ts
src/core/use-cases/rbac/__tests__/get-user-roles.use-case.test.ts
src/core/use-cases/rbac/__tests__/update-role.use-case.test.ts
src/core/use-cases/rbac/__tests__/delete-role.use-case.test.ts
```

### 5. **Cache Tests**

```bash
src/lib/permissions/__tests__/cache.test.ts
```

- TTL expiration
- Max size enforcement (LRU)
- Cleanup job
- Statistics

### 6. **End-to-End Tests**

```bash
tests/e2e/rbac-flow.test.ts
```

- Complete permission check flow
- Role assignment and permission propagation
- Cache behavior across requests
- Audit trail verification

## Running Tests with Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Continuous Integration

### GitHub Actions Example

```yaml
name: RBAC Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:rbac
      - run: npm run test:coverage
```

## Debugging Tests

### Vitest UI

```bash
# Run tests with UI
npm test -- --ui

# Open in browser
open http://localhost:51204/__vitest__/
```

### Debug Specific Test

```typescript
import { describe, it, expect } from "vitest";

describe.only("CheckPermissionUseCase", () => {
  it.only("should check permission", async () => {
    // This test runs in isolation
  });
});
```

### Verbose Output

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run with console logs
npm test -- --reporter=verbose --log-level=debug
```

## Best Practices Summary

1. ✅ **Isolation**: Each test is independent (use `beforeEach` to reset state)
2. ✅ **Clarity**: Use descriptive test names ("should X when Y")
3. ✅ **AAA Pattern**: Arrange, Act, Assert
4. ✅ **Mocking**: Mock external dependencies, test units in isolation
5. ✅ **Coverage**: Aim for high coverage but focus on meaningful tests
6. ✅ **Edge Cases**: Test boundary conditions, errors, empty inputs
7. ✅ **Async**: Always use async/await for asynchronous operations
8. ✅ **Cleanup**: Clear caches, reset mocks in `beforeEach`
9. ✅ **Helpers**: Use test factories for common test data
10. ✅ **Documentation**: Document complex test scenarios

## Troubleshooting

### Common Issues

1. **Cache not cleared between tests**

   ```typescript
   beforeEach(() => {
     permissionCache.invalidateAll();
   });
   ```

2. **Mocks not reset**

   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Async tests timing out**

   ```typescript
   // Increase timeout in vitest.config.ts
   testTimeout: 30000, // 30 seconds
   ```

4. **Database connection issues**
   ```typescript
   // Use Testcontainers for isolated database
   import { PostgreSqlContainer } from "@testcontainers/postgresql";
   ```

## Conclusion

This RBAC test suite provides comprehensive coverage of all layers in the Clean Architecture implementation:

- ✅ **Permission Utilities**: Full coverage of helper functions
- ✅ **Use Cases**: Complete business logic testing with mocks
- ✅ **Repositories**: Database operations (with mock Prisma client)
- ✅ **Controllers**: Server action testing and error handling
- ✅ **Helpers**: Reusable test factories and assertions

**Total Test Count**: 170+ tests covering critical RBAC functionality

The test suite follows best practices including:

- Clean separation of concerns
- Comprehensive mocking strategy
- Edge case coverage
- Error handling validation
- Cache behavior testing
- Audit logging verification

For questions or improvements, refer to the existing test files as examples and follow the established patterns.
