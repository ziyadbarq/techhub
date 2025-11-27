# System Setup

**Status**: ✅ Complete
**Layer**: Infrastructure
**Introduced**: November 2025
**Updated**: November 2025 (Refactored to CLI-based setup)

## Overview

The System Setup feature provides a streamlined solution for first-time installation and ongoing system administration. It includes a status page for health monitoring and CLI commands for initial setup.

**Key Features:**
- System health status page at `/setup`
- System health monitoring (database, Redis, migrations, RBAC)
- CLI-based database seeding (269 permissions + 10 roles)
- UI-based administrator account creation (Better Auth) with manual promotion to system-administrator role
- Admin dashboard for post-installation operations
- Database operations (seed, reset)
- System diagnostics and information display

**Design Philosophy**: CLI-based setup for explicit control and transparency

## Architecture

### Components

**Backend (Domain Layer)**
- DTOs: `system-setup.dto.ts` - Data transfer objects for health checks and diagnostics
- Use Cases: 4 use cases for setup operations (CheckSystemHealth, GetMigrationStatus, ResetDatabase, GetSystemInfo)
- Repositories: `ISystemSetupRepository` for system diagnostics
- Controllers: `setup.controller.ts` with server actions for health checks

**Frontend**
- System Status Page: `/app/(public)/setup/page.tsx` using `SystemStatusPage`
- Admin Dashboard: `/app/(dashboard)/admin/system-setup/page.tsx`
- Single-file component for maintainability

**CLI Scripts**
- `npm run db:seed` - Seed database with RBAC and foundation data
- `npm run db:studio` - Open Prisma Studio (use to promote first admin)

### Database Schema

No dedicated tables - uses existing User, Role, and Permission tables.

## First-Time Setup Process

### Step 1: Check System Status

**Route**: `/setup`
**Visibility**: Public (no authentication required)

Navigate to `/setup` to view system health status:

**Health Checks Displayed:**
- ✅ **Database Connection**: PostgreSQL connectivity via Prisma
- ✅ **Redis Connection**: Redis connectivity and ping test
- ✅ **Database Migrations**: All migrations applied, no pending changes
- ✅ **RBAC Configuration**: Roles and permissions seeded

**Visual Indicators:**
- 🟢 Green checkmark: Healthy
- 🔴 Red X: Unhealthy
- ⏳ Spinner: Checking

### Step 2: Seed Database

If the RBAC Configuration check shows "unhealthy", run the database seed command:

```bash
npm run db:seed
```

**What Gets Seeded:**
- 269 Permissions (organized into 14 logical groups)
- 10 System Roles:
  - System Administrator (full access)
  - IT Admin
  - Asset Manager
  - Inventory Manager
  - Service Desk
  - Compliance Officer
  - Contract Manager
  - CMDB Admin
  - Read-Only Auditor
  - Viewer (baseline role for all users)
- Foundation data (organization units, vendors, locations)
- Asset categories and models
- Sample test data (if in development mode)

**Safety**: Operation is idempotent - safe to run multiple times (skips existing data)

**Time Required**: ~5-10 seconds for RBAC data, ~30-60 seconds for full seed

### Step 3: Create Administrator Account

After seeding completes, create the first administrator account through the UI and promote it to the `system-administrator` role.

1. Visit `/register` and create the initial user (Better Auth handles password hashing).
2. Promote that user to the `system-administrator` role using Prisma Studio or SQL.

**Promote via Prisma Studio**

```bash
npm run db:studio
```

- Open the `user_roles` table.
- Add a row linking your new user's `id` to the `system-administrator` role `id` (set `createdBy` to `system` or your email).

**⚠️ IMPORTANT**: Use a strong password when registering the first admin.

### Step 4: Login

Navigate to `/login` and sign in with the newly registered admin credentials.

After login, you will have full system access.

### Step 5: Next Steps

**Recommended Actions:**
1. **Rotate Password**: Update admin password at `/settings` after promotion
2. **Add Users**: Register additional users at `/register` (they'll get viewer role)
3. **Configure Roles**: Assign roles to users at `/admin/users`
4. **Explore Documentation**: Read guides at `/docs`

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
- "Refresh" button to re-run health checks

#### Tab 2: Database Operations

**Purpose**: Administrative database operations

**Available Operations:**

**1. Seed Database**
- Button: "Run Database Seed"
- Action: Executes full seeding (RBAC + Foundation + Assets + Layer 3)
- Permission: `USERS_MANAGE`
- Confirmation: Required before execution
- **Note**: CLI command `npm run db:seed` is preferred

**2. Reset Database (Development Only)**
- Button: "Reset Database" (destructive variant)
- Action: Deletes ALL data, optionally re-seeds
- Permission: `USERS_MANAGE`
- Confirmation: Double confirmation required
- Safety: Disabled in production environments
- Options:
  - Reset only (clean slate)
  - Reset + Reseed (fresh start with data)

#### Tab 3: System Information

**Purpose**: Display system diagnostics and version info

**Information Displayed:**
- Node.js version
- Next.js version
- Prisma version
- Environment (development/production)
- Database URL (masked)
- Redis URL (masked)
- Platform (OS)
- Architecture (x64, arm64, etc.)
- Total memory
- Free memory
- Uptime

**Format**: Grid layout with label-value pairs

## Use Cases

### CheckSystemHealthUseCase

**Purpose**: Verify all system requirements

**Checks:**
1. **Database**: Prisma connection test
2. **Redis**: Connection + ping test
3. **Environment**: Required variables present
4. **Migrations**: All applied via introspection

**Response**: HealthCheckDto with status for each component

### GetMigrationStatusUseCase

**Purpose**: Check Prisma migration status

**Returns**:
- List of applied migrations
- List of pending migrations
- Overall status (all applied / pending exists)

### ResetDatabaseUseCase

**Purpose**: Nuclear option for development

**Safety Checks:**
- Environment must be development
- Requires explicit confirmation

**Process:**
1. Disconnect all Prisma clients
2. Execute `prisma migrate reset --force`
3. Optionally run seed script
4. Reconnect clients

### GetSystemInfoUseCase

**Purpose**: Gather system diagnostics

**Data Sources:**
- `process.version` (Node.js)
- `process.platform` (OS)
- `process.arch` (architecture)
- `os` module (memory, uptime)
- Environment variables (versions, URLs)

## Server Actions

All located in `src/interface-adapters/controllers/setup.controller.ts`:

### checkSystemHealthAction()
- Public access (no auth required)
- Returns: SystemHealthCheckDto
- Used by: `/setup` status page, admin dashboard

### getMigrationStatusAction()
- Requires auth
- Returns: MigrationStatusDto
- Used by: Admin dashboard

### resetDatabaseAction(reseed: boolean)
- Requires `USERS_MANAGE` permission
- Development only
- Returns: ResetDatabaseResult
- Used by: Admin dashboard

### getSystemInfoAction()
- Requires auth
- Returns: SystemInfoDto
- Used by: Admin dashboard

## Security Considerations

### Public Status Page
- **Route**: `/setup` is public (no auth required)
- **Rationale**: Needed for initial setup before any users exist
- **Exposure**: Only displays health status (no sensitive data)
- **Protection**: No write operations available

### Admin Dashboard
- **Authentication**: Required
- **Authorization**: `USERS_MANAGE` permission enforced
- **Operations**: All server actions check permissions
- **Audit**: All database operations logged

### Password Security
- **Hashing**: Handled by Better Auth (do not generate hashes manually)
- **Storage**: Password hash stored in the Account table by Better Auth
- **Recommendation**: Create users through Better Auth flows (/register, auth actions) to avoid invalid hashes

### SSO Login Restriction (Microsoft OAuth)

Microsoft OAuth login is restricted to employees who already exist in the Person database. This provides enterprise-grade security by ensuring only known employees can access the system via SSO.

**Requirements for SSO Login:**
1. **Person must exist**: Email must match an existing Person record (synced from MS Graph)
2. **Person must be active**: `isActive === true`
3. **Person must not be excluded**: `isExcluded === false` (not a service account)

**What Happens When Blocked:**
- OAuth User, Account, and Session records are automatically cleaned up
- User is redirected to `/auth/blocked` with an error code
- Error page displays reason: `person-not-found`, `person-inactive`, or `person-excluded`

**Email/Password Login:**
- Still allows Person creation (for initial admin setup before MS Graph sync)
- Required for bootstrapping the first administrator

**Files:**
- `src/lib/auth/better-auth.ts` - SSO validation logic (`validatePersonForSSO()`)
- `src/app/(auth)/auth/blocked/page.tsx` - Error page for blocked SSO attempts

### Setup Approach

**Current Approach**: CLI for data seeding + UI for account creation
- `npm run db:seed` for database operations
- `/setup` shows status only (no forms)
- `/register` creates the first account; promote to `system-administrator` via Prisma Studio/SQL
- Explicit, transparent, and easy to debug

**Benefits:**
1. **Separation of Concerns**: Seeding is an ops task; account creation stays in Better Auth
2. **Transparency**: CLI output shows exactly what's happening
3. **Debugging**: Easier to troubleshoot issues with direct feedback
4. **Consistency**: Same seeding mechanism for dev and production
5. **Safety**: No manual password hashing or ad-hoc scripts

## Refactoring Lessons Learned

### Why CLI + UI?

**Previous Approach**: Multi-step web wizard (`MinimalWizard`)
- User form for creating first admin
- In-browser RBAC seeding
- Complex state management
- Hard to debug issues

**Current Approach**: CLI seeding + UI registration
- `npm run db:seed` for database operations
- `/setup` shows status only (no forms)
- `/register` leverages Better Auth hashing and validation

**Benefits:**
1. **Separation of Concerns**: Data seeding is an ops task; account creation lives in Better Auth UI
2. **Transparency**: CLI output shows exactly what's happening
3. **Debugging**: Easier to troubleshoot issues with direct feedback
4. **Consistency**: Same seeding mechanism for dev and production
5. **Safety**: No accidental re-runs or manual hashing

### Better Auth Hooks vs Direct Creation

**Better Auth Hooks** (`ensurePersonLinkedToUser`):
- Automatically creates Person entity on first login
- Assigns viewer role for baseline permissions
- Handles cross-cutting concerns (Person creation)
- Triggered after sign-in, sign-up, OAuth callback

**Direct Creation**:
- Deprecated for admin bootstrapping; use Better Auth flows to ensure correct hashing and middleware execution

**Key Pattern**: Better Auth handles user creation; hooks handle Person linkage on first authentication

### Account Table Pattern

**Critical**: Better Auth uses specific Account type convention:
- `type: "oauth"` - ALL providers use this (not "email" or "credential")
- `provider: "credential"` - Identifies email/password authentication
- `provider: "microsoft"` - Identifies Microsoft OAuth
- Changing these values breaks authentication!

**Enforcement**: Repository has explicit comments warning against changes

## Error Handling

### Common Issues

**Issue**: "Admin role not found" when promoting first user
**Cause**: Database not seeded
**Solution**: Run `npm run db:seed` first

**Issue**: Setup page shows "Unhealthy" for RBAC
**Cause**: Database not seeded
**Solution**: Run `npm run db:seed`

**Issue**: Can't login with admin credentials
**Cause**: Account created outside Better Auth (invalid hash) or wrong password
**Solution**: Register via `/register` to let Better Auth hash the password

**Issue**: First user lacks admin access
**Cause**: User not linked to `system-administrator` role
**Solution**: Add entry to `user_roles` linking the user to the role via Prisma Studio or SQL

## Development vs Production

### Development Mode
- Reset database enabled in admin dashboard
- Detailed error messages
- Debug logging available (`AUTH_DEBUG_LOGS=true`)
- Full seed data (test data included)

### Production Mode
- Reset database disabled
- Generic error messages
- Minimal logging
- RBAC + Foundation data only (no test data)

## Testing

**Manual Testing Checklist:**
1. Fresh database: `/setup` shows unhealthy RBAC
2. Run `npm run db:seed`: All health checks green
3. Register account at `/register`: Account created successfully
4. Promote that user to `system-administrator` via Prisma Studio/SQL
5. Login with admin credentials: Success
6. Navigate to `/admin/system-setup`: All checks green
7. Run reset database (dev only): Database cleared
8. Re-seed and promote admin: Works again

**Test Files:**
- `src/interface-adapters/controllers/__tests__/setup.controller.test.ts`
- Manual test: `/setup` + `/register` + Prisma Studio promotion

## Related Documentation

- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [RBAC Admin Guide](../guides/RBAC_ADMIN_GUIDE.md) - Admin role management
- [Database Seeding](../guides/DATABASE_SEEDING.md) - Comprehensive seed system guide
- [Database Migrations](../guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow
- [Developer Guide](../guides/DEVELOPER_GUIDE.md) - Development setup

## Quick Reference

### Initial Setup (Zero Users)
```bash
# 1. Check status
# Navigate to /setup in browser

# 2. Seed database
npm run db:seed

# 3. Create admin
# Visit /register to create the first account
# Promote to system-administrator via Prisma Studio (npm run db:studio) or SQL

# 4. Login
# Navigate to /login with the new admin credentials
```

### Reset and Start Over (Development)
```bash
# Reset database
npm run db:reset

# Re-seed
npm run db:seed

# Re-create admin
# Visit /register then promote to system-administrator via Prisma Studio/SQL
```

### Add Additional Users
```bash
# Option 1: Register via web UI
# Navigate to /register
# Fill out form
# New user gets viewer role automatically

# Option 2: Admin dashboard
# Login as admin
# Navigate to /admin/users
# Assign roles as needed
```
