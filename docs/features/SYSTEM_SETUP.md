# System Setup

**Status**: ✅ Complete
**Layer**: Infrastructure
**Introduced**: November 2025

## Overview

The System Setup feature provides a comprehensive solution for first-time installation and ongoing system administration. It includes a multi-step wizard for initial setup and an admin dashboard for post-installation operations.

**Key Features:**
- First-time setup wizard for zero-user installations
- System health monitoring (database, Redis, environment, migrations)
- RBAC data seeding (269 permissions + 10 roles)
- First administrator account creation with Better Auth integration
- Database operations (seed, reset)
- System diagnostics and information display
- Real-time RBAC count updates during seeding

**Implementation**: Single-file MinimalWizard component for maintainability and reduced complexity.

## Architecture

### Components

**Backend (Domain Layer)**
- DTOs: `system-setup.dto.ts` - Data transfer objects for all operations
- Use Cases: 6 use cases for setup operations
- Repositories: `ISystemSetupRepository` for system diagnostics
- Controllers: `setup.controller.ts` with 6 server actions

**Frontend**
- Public Setup Wizard: `/app/(public)/setup/page.tsx` using `MinimalWizard`
- Admin Dashboard: `/app/(dashboard)/admin/system-setup/page.tsx`
- System Health API: `/app/api/system-health/route.ts`
- 4 wizard steps (self-contained in MinimalWizard) + 3 admin panels

### Database Schema

No dedicated tables - uses existing User, Role, and Permission tables.

## First-Time Setup Wizard

### Access

**Route**: `/setup`
**Visibility**: Public (no authentication required)
**Behavior**: Auto-redirects to `/login` if users already exist

### Workflow

The wizard guides new installations through 4 sequential steps:

#### Step 1: System Health Check

**Purpose**: Verify all system requirements before proceeding

**Checks Performed:**
- ✅ **Database Connection**: PostgreSQL connectivity via Prisma
- ✅ **Redis Connection**: Redis connectivity and ping test
- ✅ **Environment Variables**: Required vars (DATABASE_URL, REDIS_URL, OPENAI_API_KEY)
- ✅ **Database Migrations**: All migrations applied, no pending changes

**Auto-Execution**: Health check runs automatically on step load

**Continue Condition**: All checks must pass to proceed

#### Step 2: Initialize Database

**Purpose**: Seed RBAC foundation data

**What Gets Seeded:**
- 269 Permissions (organized into 10 logical groups)
- 10 System Roles:
  - System Administrator (full access)
  - IT Help Desk Technician
  - Asset Manager
  - Procurement Specialist
  - IT Auditor
  - Finance Officer
  - Data Steward
  - Service Owner
  - Read Only User
  - Contract Manager

**Safety**: Operation is idempotent - safe to run multiple times (skips existing data)

**User Action**: Click "Seed RBAC Data" button

#### Step 3: Create Administrator

**Purpose**: Create the very first user account with full permissions

**Form Fields:**
- **Name**: Full name (minimum 2 characters)
- **Email**: Valid email address (used for login)
- **Password**: Strong password requirements
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

**Password Security:**
- Hashed using Argon2 (memory-hard algorithm)
- Configuration: 19456 KB memory, 2 iterations, 32-byte output
- Stored in Better Auth's Account table (separate from User table)

**Permissions Assignment:**
- User assigned to "system-administrator" role
- All 269 permissions automatically assigned to role
- User can immediately manage all aspects of the system

**Better Auth Integration:**
- Creates User record in `user` table
- Creates Account record in `account` table with providerId "credential"
- Password stored securely in Account table

#### Step 4: Completion

**Purpose**: Confirm successful setup and guide next steps

**Display:**
- Success confirmation
- Summary of actions completed
- Next steps guide

**Next Steps Suggested:**
1. **Login**: Use the credentials just created
2. **Configure Users**: Add additional users at `/admin/users`
3. **Explore Documentation**: Read guides at `/docs`
4. **Optional Seeding**: Run `npm run seed` for test data (Foundation + Asset layers)

**Action**: "Go to Login" button navigates to `/login`

### Technical Implementation

**Components:**

```
src/components/setup/
└── MinimalWizard.tsx              # Self-contained wizard (all 4 steps)
```

**Architecture Decision**: Consolidated into single component for:
- Easier state management (no prop drilling)
- Better maintainability (all logic in one place)
- Reduced complexity (no step coordinator needed)
- Dynamic RBAC count updates (shared state)

**State Management:**
- Current step tracking
- Completed steps array
- Processing state (loading indicators)
- Step-specific result data

**Progress Tracking:**
- Visual progress bar (0% → 100%)
- Step indicators with checkmarks
- Back navigation (except from completion step)

## Admin System Setup Dashboard

### Access

**Route**: `/admin/system-setup`
**Permission**: `USERS_MANAGE`
**Redirect**: `/unauthorized` if permission denied

### Navigation

Located in **Administration** section:
- Title: "System Setup"
- Icon: ServerCog
- Description: "System health, diagnostics, and database operations"

### Dashboard Layout

Tabbed interface with 3 panels:

#### Tab 1: System Health

**Purpose**: Real-time system health monitoring

**Health Checks:**
- Database Connection (PostgreSQL via Prisma)
- Redis Connection (with ping test)
- Environment Variables (required vars present)
- Database Migrations (all applied, none pending)

**Visual Indicators:**
- ✅ Green checkmark: Healthy
- ❌ Red X: Unhealthy
- ⏳ Spinner: Checking

**Overall Status:**
- Alert box at top showing "All systems operational" or "Some systems require attention"
- Variant changes based on status (default/destructive)

**Actions:**
- Refresh button to manually re-check health
- Auto-checks on initial load

**Component**: `SystemHealthPanel.tsx`

#### Tab 2: System Info

**Purpose**: Display comprehensive system diagnostics

**System Information:**
- **Node.js Version**: Runtime version
- **Platform**: Operating system (darwin, linux, win32)
- **Environment**: Deployment mode (development, production)

**Database Statistics:**
- **Database Size**: Total storage in bytes (formatted as KB/MB/GB)
- **Table Count**: Number of database tables
- **Users**: Total user accounts
- **Roles**: System roles count
- **Permissions**: Total RBAC permissions
- **Org Units**: Organization units count

**Visual Design:**
- Grid layout (3 columns on large screens)
- Icon indicators for each metric
- Large numbers with descriptive labels
- Refresh button for updated counts

**Component**: `SystemInfoPanel.tsx`

#### Tab 3: Database Operations

**Purpose**: Perform database seeding and reset operations

##### Seed RBAC Data

**What It Does:**
- Seeds 269 permissions (10 logical groups)
- Seeds 10 system roles
- Creates role-permission assignments

**Safety:**
- Idempotent operation (safe to run multiple times)
- Skips existing data, only creates missing items
- Shows success feedback with counts

**UI Elements:**
- Description of what will be seeded
- Blue info box: "Safe to run multiple times"
- Seed button with loading state
- Success/error alert with details

##### Reset Database (Danger Zone)

**What It Does:**
- Completely wipes ALL data from database
- Optionally reseeds RBAC data after reset

**Environment Protection:**
- ❌ **Production**: Completely disabled (safety check)
- ✅ **Development**: Enabled with safeguards

**Safety Measures:**
- Red border and warning styling
- Comprehensive warning message listing what will be deleted:
  - All users and authentication data
  - All assets, warranties, maintenance records
  - All roles, permissions, and assignments
  - All foundation data (org units, people, vendors)
  - All CMDB, contracts, licenses, governance data
- Typed confirmation required: "CONFIRM RESET"
- Checkbox for reseed option

**Confirmation Dialog:**
- Red warning title with AlertTriangle icon
- Explanation of irreversibility
- Text input requiring exact match: "CONFIRM RESET"
- Continue button disabled until correct text entered
- Visual indication of reseed option if checked

**Component**: `DatabaseOperationsPanel.tsx`

## Use Cases

### 1. CheckSystemHealthUseCase

**Purpose**: Verify all system requirements

**Dependencies:**
- `ISystemSetupRepository`

**Process:**
1. Check database connection
2. Check Redis connection
3. Validate environment variables
4. Check for pending migrations
5. Calculate overall health status

**Returns**: `SystemHealthCheckDto`

```typescript
{
  database: { connected: true, message: "Connected" },
  redis: { connected: true, message: "Connected" },
  environment: { valid: true, missing: [] },
  migrations: { applied: true, pendingCount: 0 },
  overall: true
}
```

### 2. GetMigrationStatusUseCase

**Purpose**: Get detailed migration status

**Returns**: `MigrationStatusDto`

```typescript
{
  applied: true,
  pendingCount: 0,
  message: "All migrations applied"
}
```

### 3. CreateFirstUserUseCase

**Purpose**: Create initial administrator account

**Dependencies:**
- `IUserRepository`
- `IRoleRepository`
- `IPermissionRepository`

**Validation:**
1. Check if users already exist (fail if any exist)
2. Verify "system-administrator" role exists
3. Validate email format and password strength

**Process:**
1. Hash password with Argon2
2. Create User record
3. Create Better Auth Account record
4. Assign user to "system-administrator" role
5. Fetch all permissions
6. Assign all permissions to the role

**Security:**
- Argon2 hashing: `memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1`
- Separate account table for credentials
- Provider ID: "credential" (Better Auth password provider)

**Returns**: `CreateFirstUserResult`

```typescript
{
  success: true,
  message: "First administrator account created successfully",
  user: { id, email, name },
  permissionsAssigned: 269
}
```

### 4. SeedMinimalDataUseCase

**Purpose**: Seed RBAC foundation data

**Process:**
1. Call `seedRBAC()` function from `seed-rbac.ts`
2. Seeds 269 permissions across 10 groups
3. Seeds 10 system roles
4. Creates role-permission mappings

**Returns**: `SeedMinimalDataResult`

```typescript
{
  success: true,
  message: "Minimal RBAC data seeded successfully",
  details: {
    rolesCreated: 10,
    permissionsCreated: 269
  }
}
```

**Idempotency**: Uses Prisma `upsert` - safe to run multiple times

### 5. ResetDatabaseUseCase

**Purpose**: Completely wipe database and optionally reseed

**Dependencies:**
- `IUserRepository`
- `IRoleRepository`
- `IPermissionRepository`

**Environment Protection:**
```typescript
if (process.env.NODE_ENV === "production") {
  return { success: false, message: "Only available in development" };
}
```

**Process:**
1. Environment check (fail in production)
2. Delete all users
3. Delete all roles
4. Delete all permissions
5. Delete all other entities (cascade)
6. If reseed flag: call `seedRBAC()`

**Returns**: `ResetDatabaseResult`

```typescript
{
  success: true,
  message: "Database reset successfully",
  reseeded: true
}
```

### 6. GetSystemInfoUseCase

**Purpose**: Gather comprehensive system diagnostics

**Data Collected:**
- Node.js version: `process.version`
- Platform: `process.platform`
- Environment: `process.env.NODE_ENV`
- Database size: PostgreSQL query
- Table count: Information schema query
- User count: Prisma count
- Role count: Prisma count
- Permission count: Prisma count
- Org unit count: Prisma count

**Returns**: `SystemInfoDto`

```typescript
{
  nodeVersion: "v20.11.0",
  platform: "darwin",
  environment: "development",
  databaseSize: 12582912, // bytes
  tableCount: 45,
  userCount: 5,
  roleCount: 10,
  permissionCount: 269,
  orgUnitCount: 8
}
```

**PostgreSQL Queries:**
- Database size: `SELECT pg_database_size(current_database())`
- Table count: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`

## Server Actions

All server actions in `src/interface-adapters/controllers/setup.controller.ts`:

### 1. checkSystemHealthAction()

**Returns**: `ActionResponse<SystemHealthCheckDto>`

**Errors**: Catches and returns error message in response

### 2. getMigrationStatusAction()

**Returns**: `ActionResponse<MigrationStatusDto>`

### 3. createFirstUserAction(data: CreateFirstUserDto)

**Validation**: Zod schema validation via `createFirstUserDtoSchema`

**Returns**: `ActionResponse<CreateFirstUserResult>`

**Side Effects**:
- Revalidates paths: `/`, `/setup`, `/login`

### 4. seedMinimalDataAction()

**Returns**: `ActionResponse<SeedMinimalDataResult>`

### 5. resetDatabaseAction(reseed: boolean)

**Parameters**:
- `reseed`: Whether to seed RBAC data after reset

**Returns**: `ActionResponse<ResetDatabaseResult>`

**Environment Protection**: Enforced at use case layer

### 6. getSystemInfoAction()

**Returns**: `ActionResponse<SystemInfoDto>`

## DTOs (Data Transfer Objects)

All DTOs in `src/interface-adapters/dtos/system-setup.dto.ts`:

### CreateFirstUserDto

```typescript
{
  email: string;      // Email validation
  password: string;   // Min 8 chars, uppercase, lowercase, number
  name: string;       // Min 2 chars
}
```

**Zod Schema**: `createFirstUserDtoSchema`

### SystemHealthCheckDto

```typescript
{
  database: {
    connected: boolean;
    message: string;
  };
  redis: {
    connected: boolean;
    message: string;
  };
  environment: {
    valid: boolean;
    missing: string[];  // Missing env var names
  };
  migrations: {
    applied: boolean;
    pendingCount: number;
  };
  overall: boolean;    // All checks passed
}
```

### MigrationStatusDto

```typescript
{
  applied: boolean;
  pendingCount: number;
  message: string;
}
```

### SystemInfoDto

```typescript
{
  nodeVersion: string;
  platform: string;
  environment: string;
  databaseSize: number | null;  // bytes
  tableCount: number;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  orgUnitCount: number;
}
```

### Result Types

```typescript
interface CreateFirstUserResult {
  success: boolean;
  message: string;
  user?: { id: string; email: string; name: string };
  permissionsAssigned?: number;
}

interface SeedMinimalDataResult {
  success: boolean;
  message: string;
  details?: {
    rolesCreated: number;
    permissionsCreated: number;
  };
}

interface ResetDatabaseResult {
  success: boolean;
  message: string;
  reseeded?: boolean;
}
```

## Repository Interface

**Interface**: `ISystemSetupRepository`
**Implementation**: `PrismaSystemSetupRepository`

### Methods

```typescript
interface ISystemSetupRepository {
  // Connection checks
  checkDatabaseConnection(): Promise<boolean>;
  checkRedisConnection(): Promise<boolean>;

  // Migration status
  getPendingMigrationsCount(): Promise<number>;

  // Counts
  getUserCount(): Promise<number>;
  getRoleCount(): Promise<number>;
  getPermissionCount(): Promise<number>;
  getOrgUnitCount(): Promise<number>;

  // Diagnostics
  getDatabaseSize(): Promise<number | null>;
  getTableCount(): Promise<number>;
}
```

### Implementation Highlights

**Database Connection Check:**
```typescript
async checkDatabaseConnection(): Promise<boolean> {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

**Redis Connection Check:**
```typescript
async checkRedisConnection(): Promise<boolean> {
  const client = createClient({ url: process.env.REDIS_URL });
  try {
    await client.connect();
    await client.ping();
    return true;
  } finally {
    await client.disconnect();
  }
}
```

**Database Size (PostgreSQL):**
```typescript
async getDatabaseSize(): Promise<number | null> {
  const result = await this.prisma.$queryRaw<Array<{ size: bigint }>>`
    SELECT pg_database_size(current_database()) as size
  `;
  return Number(result[0]?.size || 0);
}
```

## Dependency Injection

**Module**: `src/di/modules/system-setup.module.ts`

### Bindings

```typescript
export function bindSystemSetupDependencies(container: Container): void {
  // Repository
  container.bind<ISystemSetupRepository>(DI_TOKENS.ISystemSetupRepository)
    .to(PrismaSystemSetupRepository).inSingletonScope();

  // Use Cases (transient - new instance per request)
  container.bind(DI_TOKENS.CheckSystemHealthUseCase)
    .to(CheckSystemHealthUseCase).inTransientScope();

  container.bind(DI_TOKENS.GetMigrationStatusUseCase)
    .to(GetMigrationStatusUseCase).inTransientScope();

  container.bind(DI_TOKENS.CreateFirstUserUseCase)
    .to(CreateFirstUserUseCase).inTransientScope();

  container.bind(DI_TOKENS.SeedMinimalDataUseCase)
    .to(SeedMinimalDataUseCase).inTransientScope();

  container.bind(DI_TOKENS.ResetDatabaseUseCase)
    .to(ResetDatabaseUseCase).inTransientScope();

  container.bind(DI_TOKENS.GetSystemInfoUseCase)
    .to(GetSystemInfoUseCase).inTransientScope();
}
```

**Registration**: Called in `src/di/container.ts` during container initialization

## Security Considerations

### First User Creation

✅ **Password Security**
- Argon2 hashing (memory-hard, resistant to GPU attacks)
- Configurable parameters for future-proofing
- Separate account table (Better Auth pattern)

✅ **Validation**
- Email format validation
- Strong password requirements (8+ chars, mixed case, numbers)
- Name minimum length

✅ **Authorization**
- Only allowed when zero users exist
- Prevents multiple "first user" creations

### Database Reset

✅ **Environment Protection**
- Hard-coded production check
- No override mechanism (intentional)

✅ **Confirmation**
- Typed confirmation: "CONFIRM RESET"
- Multiple warning messages
- Irreversibility clearly stated

✅ **Permission Gating**
- Requires `USERS_MANAGE` permission
- Only system administrators can access

### Health Checks

✅ **Read-Only**
- All health checks are non-destructive
- No database modifications

✅ **Error Handling**
- Connection failures don't crash the app
- Graceful fallbacks for missing data

## Error Handling

### Connection Errors

```typescript
try {
  const connected = await checkDatabaseConnection();
} catch (error) {
  return {
    database: {
      connected: false,
      message: "Failed to connect to database"
    }
  };
}
```

### Validation Errors

```typescript
// Zod validation in server action
try {
  const validated = createFirstUserDtoSchema.parse(data);
} catch (error) {
  return {
    success: false,
    error: "Invalid input data"
  };
}
```

### Production Reset Attempt

```typescript
if (process.env.NODE_ENV === "production") {
  return {
    success: false,
    message: "Database reset is only available in development environment"
  };
}
```

## UI/UX Patterns

### Loading States

**Pattern**: Disable buttons and show spinner during async operations

```typescript
const [isLoading, setIsLoading] = useState(false);

<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    "Perform Action"
  )}
</Button>
```

### Status Indicators

**Pattern**: Color-coded icons for health status

```typescript
const getStatusIcon = (status: boolean) => {
  return status ? (
    <CheckCircle2 className="h-5 w-5 text-green-600" />
  ) : (
    <XCircle className="h-5 w-5 text-red-600" />
  );
};
```

### Confirmation Dialogs

**Pattern**: AlertDialog with typed confirmation for destructive actions

```typescript
<AlertDialog>
  <AlertDialogContent>
    <Input
      value={confirmation}
      onChange={(e) => setConfirmation(e.target.value)}
      placeholder="Type 'CONFIRM RESET' here"
    />
    <AlertDialogAction
      disabled={confirmation !== "CONFIRM RESET"}
      onClick={handleReset}
    >
      Reset Database
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### Toast Notifications

**Pattern**: Success/error feedback with sonner

```typescript
import { toast } from "sonner";

// Success
toast.success("Operation completed successfully!");

// Error
toast.error("Operation failed: " + errorMessage);
```

## Testing Scenarios

### First-Time Setup Flow

1. **Fresh Installation**
   - Reset database: `npm run reset`
   - Navigate to app root
   - Should auto-redirect to `/setup`
   - Follow 4-step wizard
   - Login with created credentials

2. **Health Check Failures**
   - Stop Redis: Health check should fail
   - Missing env vars: Should be detected
   - Pending migrations: Should be reported

3. **Invalid User Creation**
   - Weak password: Should reject
   - Invalid email: Should reject
   - Duplicate email: Should reject (if users exist)

### Admin Dashboard

1. **Permission Check**
   - Login as user without `USERS_MANAGE`
   - Navigate to `/admin/system-setup`
   - Should redirect to `/unauthorized`

2. **Health Monitoring**
   - Access System Health tab
   - Verify all checks pass
   - Stop Redis, click Refresh
   - Should show Redis failure

3. **System Info**
   - Check all metrics display
   - Verify counts match database
   - Create new user, refresh
   - User count should increment

4. **RBAC Seeding**
   - Click "Seed RBAC Data"
   - Verify success message
   - Click again - should still succeed (idempotent)

5. **Database Reset (Dev Only)**
   - Try in production - should be blocked
   - In dev, type wrong confirmation - button disabled
   - Type "CONFIRM RESET" - should enable
   - Execute reset - verify database empty
   - Check reseed option - RBAC data should exist

## Common Issues

### Issue: Setup page redirects to login

**Cause**: Users already exist in database
**Solution**: This is expected behavior. Setup is only for zero-user installations.
**Workaround**: Use `npm run reset` to wipe database if testing setup flow

### Issue: Health check shows migrations pending

**Cause**: Database schema out of sync
**Solution**: Run `npx prisma migrate deploy` to apply pending migrations

### Issue: Redis connection fails

**Cause**: Redis server not running or wrong URL
**Solution**:
- Start Redis: `redis-server` (or via Homebrew services)
- Check `REDIS_URL` in `.env.local`

### Issue: Database reset button disabled in production

**Cause**: Safety feature - reset only allowed in development
**Solution**: This is intentional. Use database tools for production reset (with proper backups!)

### Issue: Password validation fails

**Cause**: Password doesn't meet requirements
**Solution**: Ensure password has:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Refactoring Lessons Learned

### November 2025 Refactoring

The setup wizard underwent a major refactoring to follow DRY/SOLID principles. Key lessons:

#### 1. DRY Principle: Reuse Working Patterns

**Problem**: Original implementation duplicated user creation logic between setup and normal registration.

**Solution**: Refactored `CreateFirstUserUseCase` to:
- Reuse repository patterns instead of calling Better Auth API directly
- Delegate Person creation to Better Auth hooks (automatic via `ensurePersonLinkedToUser`)
- Follow same flow as normal registration but with admin role assignment

**Result**: Zero duplication, 100% DRY compliance.

#### 2. Component Consolidation

**Problem**: Original setup had multiple step components causing prop drilling and state management complexity.

**Solution**: Consolidated into single `MinimalWizard.tsx` component with:
- All 4 steps self-contained in one file
- Shared state eliminates prop drilling
- Dynamic RBAC count updates across steps
- Easier to understand and maintain

**Result**: ~1,500 lines of code removed, improved maintainability.

#### 3. Better Auth Integration Best Practices

**Key Learnings**:
- Better Auth API calls require Next.js request context (headers)
- Use repository layer for user creation in use cases
- Let Better Auth hooks handle cross-cutting concerns (Person creation)
- Account format must be: `type: "oauth"`, `provider: "credential"`
- Email verification stored as timestamp, not boolean

**Implementation**:
```typescript
// ✅ Correct: Use repository in use case
await this.userRepository.createDirectly({
  email, name, passwordHash, emailVerified: true
});

// ❌ Wrong: Call Better Auth API from use case
// await betterAuth.api.signUpEmail({ ... }) // No request context!
```

#### 4. Organization Unit Validation

**Problem**: OrganizationUnit creation failed with "level must be between 1 and 10" error.

**Solution**:
- Always include `level` field (required, 1-10 range)
- Use enum for `unitType` instead of string literals
- Dynamic imports for entity and enum in use cases

**Correct Pattern**:
```typescript
const { OrganizationUnit } = await import("@/core/domain/entities/organization-unit.entity");
const { OrganizationUnitType } = await import("@/core/domain/value-objects/foundation-enums");

const orgUnit = OrganizationUnit.create({
  name: "Default Organization",
  code: "ORG-DEFAULT",
  unitType: OrganizationUnitType.DEPARTMENT, // ✅ Use enum
  level: 1, // ✅ Required field
  // ...
});
```

#### 5. Redis Connection Fix

**Problem**: Using wrong Redis library (`redis` instead of `ioredis`).

**Solution**: Updated to use `ioredis` consistently:
```typescript
import Redis from "ioredis";

const client = new Redis(redisUrl);
await client.ping();
await client.quit(); // Not disconnect()
```

#### 6. Migration Health Check Enhancement

**Problem**: Migration checks returned 0 pending when table didn't exist (misleading).

**Solution**:
- Throw error in `getPendingMigrationsCount()` if `_prisma_migrations` table missing
- Catch error in `areMigrationsApplied()` and return `false`
- Provides clear feedback about migration status

#### 7. TypeScript Type Safety

**Key Patterns**:
- Use type guards with `ActionResponse<T>`
- Check `result.success` before accessing `result.data` or `result.error`
- Use enums for constants instead of string literals
- Proper async/await with error handling

**Example**:
```typescript
const result = await seedMinimalDataAction();

if (!result.success) {
  throw new Error(result.error); // ✅ Type-safe
}

// ✅ Now TypeScript knows result.data exists
const { rolesCreated, permissionsCreated } = result.data.details;
```

#### 8. React Compiler & Legacy Code

**Lesson**: Legacy components with eslint-disable comments cause React Compiler warnings.

**Solution**:
- Add `"use no memo"` directive to disable React Compiler for legacy code
- Or add `/* eslint-disable react-compiler/react-compiler */` at file top
- Better: Remove legacy code entirely (as we did)

## Related Documentation

- [RBAC_ARCHITECTURE.md](../architecture/RBAC_ARCHITECTURE.md) - RBAC system overview
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [DATABASE_SEEDING.md](../guides/DATABASE_SEEDING.md) - Complete seeding guide
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - General development guide
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Clean Architecture patterns
- [NEXTJS_16_GUIDE.md](../guides/NEXTJS_16_GUIDE.md) - Next.js 16 patterns and best practices

## Future Enhancements

Potential improvements for future iterations:

1. **Setup Wizard Enhancements**
   - Email configuration verification
   - SMTP server testing
   - Initial organization setup (name, logo)
   - Timezone and locale configuration

2. **Admin Dashboard Additions**
   - Cache statistics and clearing
   - Background job monitoring
   - API health endpoints
   - Performance metrics

3. **Advanced Diagnostics**
   - Connection pool stats
   - Query performance metrics
   - Slow query logs
   - Database vacuum/optimize tools

4. **Backup & Restore**
   - Database backup creation
   - Backup scheduling
   - Restore from backup
   - Export/import data

5. **Migration Management**
   - View migration history
   - Rollback capability
   - Dry-run migrations
   - Migration conflict detection

6. **Environment Cloning**
   - Export configuration
   - Import from another instance
   - Data anonymization tools
   - Staging environment sync

## Changelog

**November 2025** - Initial release
- First-time setup wizard (4 steps)
- Admin system setup dashboard (3 tabs)
- 6 use cases for system operations
- System health monitoring
- RBAC seeding automation
- Database reset capability (dev-only)
