# Feature Flag System

**Version**: 1.0.0
**Status**: Production-Ready
**Last Updated**: 2025-11-24

## Overview

The Feature Flag System provides **master toggle control** for the entire application, allowing system administrators to enable or disable major modules (Layer 1, 2, and 3 features) at runtime without code deployments. This is a **system-level control layer** that sits above RBAC permissions.

### Key Characteristics

- **Coarse-Grained**: Module-level toggles (e.g., "CONTRACTS", "LICENSES", "CMDB"), not per-route
- **Admin Enforcement**: System administrators are subject to the same feature flags as other roles
- **Dependency Enforcement**: Features can depend on other features (e.g., SERVICES requires CMDB + FOUNDATION)
- **Maintenance Mode**: Global killswitch that disables all features for all users
- **Default State**: All features are **disabled by default** - admin must manually enable
- **Security**: Server-side enforcement with Redis caching for performance
- **Dual-Layer Security**: Feature flags (system-level) + RBAC permissions (user-level)

## Architecture

### Database Schema

#### FeatureFlag Table

```prisma
// Enums for type safety
enum FeatureFlagCategory {
  SYSTEM
  LAYER_1
  LAYER_2
  LAYER_3
}

enum FeatureFlagAction {
  ENABLED
  DISABLED
}

model FeatureFlag {
  id          String              @id @default(cuid())
  name        String              @unique             // e.g., "CONTRACTS", "LICENSES"
  displayName String                                  // e.g., "Contract Management"
  description String              @db.Text
  category    FeatureFlagCategory                     // Type-safe enum
  isEnabled   Boolean             @default(false)     // Default: DISABLED
  isSystem    Boolean             @default(false)     // System flags (e.g., MAINTENANCE_MODE)
  dependsOn   String[]            @default([])        // Dependency array
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([isEnabled])
  @@index([category])
  @@map("feature_flags")
}
```

#### FeatureFlagAuditLog Table

```prisma
model FeatureFlagAuditLog {
  id          String            @id @default(cuid())
  featureName String
  action      FeatureFlagAction                       // Type-safe enum
  userId      String
  userEmail   String
  reason      String?           @db.Text              // Optional reason for toggle
  createdAt   DateTime          @default(now())

  @@index([featureName])
  @@index([userId])
  @@index([createdAt])
  @@map("feature_flag_audit_logs")
}
```

### Component Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Admin UI (/admin/features)                                   │
│ - Grouped by category (SYSTEM, LAYER_1, LAYER_2, LAYER_3)   │
│ - Toggle controls with confirmation dialogs                  │
│ - Dependency warnings                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Controllers (Server Actions)                                 │
│ - listFeatureFlagsAction()                                   │
│ - toggleFeatureFlagAction() with audit logging               │
│ - Cache invalidation                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Use Cases (Business Logic)                                   │
│ - ListFeatureFlagsUseCase                                    │
│ - GetFeatureFlagUseCase                                      │
│ - ToggleFeatureFlagUseCase (dependency validation)           │
│ - CheckFeatureEnabledUseCase                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Domain Layer                                                 │
│ - FeatureFlag entity with business methods                   │
│ - IFeatureFlagRepository interface                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Infrastructure                                               │
│ - PrismaFeatureFlagRepository                                │
│ - Redis caching (5-minute TTL)                               │
└─────────────────────────────────────────────────────────────┘
```

### Security Flow

```
User Request
     ↓
[Page/Route] → requireFeature("CONTRACTS")
     ↓
[Server-Side Check]
     ├── Is maintenance mode enabled? → Redirect to /maintenance
     └── Is feature enabled? → Check Redis cache → Database
           ├── YES → Continue to permission check
           └── NO → Redirect to /feature-disabled?feature=CONTRACTS
     ↓
[Permission Check] → requirePermission(PERMISSIONS.CONTRACTS_VIEW)
     ├── Has permission? → ALLOW
     └── No permission? → Redirect to /unauthorized
     ↓
[Render Page]
```

## Feature Definitions

### 18 Features Across 4 Categories

#### SYSTEM (1 feature)

1. **MAINTENANCE_MODE** - Global maintenance mode killswitch
   - When enabled, all users are redirected to `/maintenance` page

#### LAYER_1 (Foundation - 4 features)

1. **FOUNDATION** - Core foundation entities
   - OrganizationUnits, Persons, Roles, Locations, Vendors, Lifecycle, Fields
2. **DATA_IMPORT** - Universal data importer
   - Depends on: FOUNDATION
3. **EXCHANGE_RATES** - Multi-currency exchange rate management
   - Independent feature
4. **RBAC_ADMIN** - Advanced RBAC administration
   - Permission dependencies, role conflicts, bulk operations
   - Independent feature

#### LAYER_2 (Asset Management - 4 features)

1. **ASSETS** - Core asset management
   - Depends on: FOUNDATION
2. **INVENTORY** - Stock management and movements
   - Depends on: ASSETS
3. **MAINTENANCE** - Preventive maintenance schedules and records
   - Depends on: ASSETS
4. **WARRANTIES** - Warranty tracking and expiration alerts
   - Depends on: ASSETS

#### LAYER_3 (Advanced ITAM - 11 features)

1. **ASSET_DISPOSALS** - Asset disposal workflow with approvals
   - Depends on: ASSETS
2. **ASSET_KITS** - Predefined asset bundles with checkout tracking
   - Depends on: ASSETS
3. **ASSET_RESERVATIONS** - Future asset reservations with conflict detection
   - Depends on: ASSETS
4. **CMDB** - Configuration Management Database
   - Depends on: FOUNDATION
5. **CONTRACTS** - Contract management with linked objects
   - Depends on: FOUNDATION
6. **LICENSES** - License product entitlements and allocations
   - Depends on: FOUNDATION
7. **SERVICES** - IT service catalog and ownership tracking
   - Depends on: CMDB, FOUNDATION
8. **SERVICE_HEALTH_SLA** - Service health monitoring and SLA compliance tracking
   - Depends on: SERVICES
9. **GOVERNANCE** - Data governance, ownership, and verification campaigns
   - Depends on: FOUNDATION
10. **ATTACHMENTS** - Polymorphic file attachments for all entities
   - Depends on: FOUNDATION
11. **INTUNE** - Microsoft Intune/MDM device sync with compliance monitoring
   - Depends on: FOUNDATION, ASSETS

### Feature Dependency Graph

```
MAINTENANCE_MODE (standalone)

FOUNDATION
  ├── DATA_IMPORT
  ├── CMDB
  │   └── SERVICES
  │       └── SERVICE_HEALTH_SLA
  ├── CONTRACTS
  ├── LICENSES
  ├── GOVERNANCE
  └── ATTACHMENTS

EXCHANGE_RATES (standalone)

RBAC_ADMIN (standalone)

ASSETS
  ├── INVENTORY
  ├── MAINTENANCE
  ├── WARRANTIES
  ├── ASSET_DISPOSALS
  ├── ASSET_KITS
  └── ASSET_RESERVATIONS

FOUNDATION + ASSETS
  └── INTUNE
```

## Usage

### Server-Side: Protecting Routes

All protected pages MUST include both feature flag check and permission check:

```typescript
// src/app/(dashboard)/contracts/page.tsx
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  // Step 1: Feature flag check (system-level) - FIRST
  await requireFeature("CONTRACTS");

  // Step 2: Permission check (user-level) - SECOND
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts");
    throw error;
  }

  return <ContractsPageClient />;
}
```

### Client-Side: Conditional Rendering

Use React hooks to conditionally render UI elements:

```typescript
"use client";

import { useFeatureFlags, useIsFeatureEnabled } from "@/hooks/use-feature-flags";

export function MyComponent() {
  const { enabledFeatures, isLoading } = useFeatureFlags();
  const isContractsEnabled = useIsFeatureEnabled("CONTRACTS");

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <div>
      {isContractsEnabled && (
        <Link href="/contracts">Contract Management</Link>
      )}

      {enabledFeatures.has("LICENSES") && (
        <Link href="/license-products">License Management</Link>
      )}
    </div>
  );
}
```

### Navigation Filtering

Navigation items are automatically filtered based on both permissions and feature flags:

```typescript
// src/config/navigation.ts
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  featureFlag?: string;  // ← Add this
  children?: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Contracts",
    items: [
      {
        title: "Contract Types",
        href: "/contract-types",
        icon: FileText,
        permission: PERMISSIONS.CONTRACT_TYPES_VIEW,
        featureFlag: "CONTRACTS",  // ← Add this
      },
    ],
  },
];
```

### Admin UI: Managing Feature Flags

1. Navigate to **Admin → Feature Flags** (`/admin/features`)
2. Flags are grouped by category: SYSTEM, LAYER_1, LAYER_2, LAYER_3
3. Toggle switches with confirmation dialogs
4. System displays:
   - **Dependencies**: What other features this feature requires
   - **Dependents**: What other features depend on this feature
   - **Warnings**: When toggling would affect other features

**Example: Enabling SERVICES**

```
1. Admin clicks toggle for "SERVICES"
2. System checks dependencies: CMDB, FOUNDATION
3. If dependencies not enabled:
   - Show error: "Cannot enable: missing dependencies: CMDB, FOUNDATION"
   - Prevent toggle
4. If dependencies enabled:
   - Show confirmation: "Enable IT Service Management?"
   - On confirm: Enable feature, invalidate cache, show success toast
```

**Example: Disabling FOUNDATION**

```
1. Admin clicks toggle for "FOUNDATION"
2. System checks dependents: DATA_IMPORT, CMDB, CONTRACTS, LICENSES, GOVERNANCE, ATTACHMENTS, SERVICES
3. If any dependents are enabled:
   - Show error: "Cannot disable: required by enabled features: CMDB, CONTRACTS, ..."
   - Prevent toggle
4. If no enabled dependents:
   - Show confirmation: "Disable Foundation Layer?"
   - On confirm: Disable feature, invalidate cache, show success toast
```

## API Reference

### Server Utilities (`@/lib/features/server`)

#### `requireFeature(featureName: string): Promise<void>`

Throws redirect if feature is disabled or maintenance mode is active.

```typescript
await requireFeature("CONTRACTS");
```

**Behavior**:
- If maintenance mode enabled → Redirect to `/maintenance`
- If feature disabled → Redirect to `/feature-disabled?feature=CONTRACTS`
- If feature enabled → Continue

#### `isFeatureEnabled(featureName: string): Promise<boolean>`

Check if a feature is enabled.

```typescript
const isEnabled = await isFeatureEnabled("LICENSES");
```

#### `getEnabledFeatures(): Promise<Set<string>>`

Get all enabled feature names.

```typescript
const features = await getEnabledFeatures();
// Set { "FOUNDATION", "ASSETS", "CMDB", ... }
```

#### `invalidateFeatureCache(featureName: string): Promise<void>`

Invalidate Redis cache for a specific feature flag.

```typescript
await invalidateFeatureCache("CONTRACTS");
```

### Client Hooks (`@/hooks/use-feature-flags`)

#### `useFeatureFlags(): FeatureFlagsState`

React hook that fetches enabled features from API.

```typescript
interface FeatureFlagsState {
  enabledFeatures: Set<string>;
  isLoading: boolean;
  error: string | null;
}

const { enabledFeatures, isLoading, error } = useFeatureFlags();
```

#### `useIsFeatureEnabled(featureName: string): boolean`

React hook that checks if a specific feature is enabled.

```typescript
const isContractsEnabled = useIsFeatureEnabled("CONTRACTS");
```

### Server Actions (`@/interface-adapters/controllers/feature-flags/feature-flag.controller`)

#### `listFeatureFlagsAction(): Promise<ActionResponse<ListFeatureFlagsResponseDTO>>`

List all feature flags with details.

```typescript
const result = await listFeatureFlagsAction();
if (result.success) {
  console.log(result.data.flags); // Array of FeatureFlagResponseDTO
  console.log(result.data.total); // Total count
}
```

#### `toggleFeatureFlagAction(request: ToggleFeatureFlagRequestDTO): Promise<ActionResponse<ToggleFeatureFlagResponseDTO>>`

Toggle a feature flag on/off with validation and audit logging.

```typescript
const result = await toggleFeatureFlagAction({
  name: "CONTRACTS",
  reason: "Enabling contract management for pilot program",
});

if (result.success) {
  console.log(result.data.action);    // "ENABLED" or "DISABLED"
  console.log(result.data.warnings);  // Array of warning messages
}
```

**Validation**:
- **Enabling**: Checks that all dependencies are enabled
- **Disabling**: Checks that no enabled features depend on this feature
- **Audit**: Creates audit log entry with user ID, email, action, and reason

## Redis Caching

Feature flag state is cached in Redis with a 5-minute TTL for performance:

- **Cache Key**: `feature:{FEATURE_NAME}` (e.g., `feature:CONTRACTS`)
- **Cache Value**: `"1"` (enabled) or `"0"` (disabled)
- **TTL**: 300 seconds (5 minutes)
- **Invalidation**: Manual invalidation after toggle via `invalidateFeatureCache()`

**Cache Flow**:

```
1. Request: isFeatureEnabled("CONTRACTS")
2. Check Redis: GET feature:CONTRACTS
   ├── Cache hit (value exists) → Return cached value
   └── Cache miss (no value) → Fetch from database, cache result, return
3. After toggle: invalidateFeatureCache("CONTRACTS")
   └── Redis: DEL feature:CONTRACTS
```

## Admin Enforcement

System administrators configure feature flags but runtime enforcement applies to every role:

- `isUserSystemAdministrator()` gates management access (e.g., `/admin/features`), not runtime bypass.
- `isFeatureEnabled()` reads cached state for all users with no role-based overrides.

**Admin Behavior**:
- ✅ Can access `/admin/features` to manage feature flags
- ✅ Can toggle features on/off
- ✅ Navigation and routes are filtered by enabled features
- ✅ Redirected to `/feature-disabled` or `/maintenance` when flags are disabled

**Non-Admin Behavior**:
- ❌ Cannot access `/admin/features` (permission denied)
- ❌ Cannot see routes for disabled features
- ❌ Redirected to `/feature-disabled` if accessing disabled feature
- ❌ Redirected to `/maintenance` if maintenance mode enabled
- ❌ Navigation filtered by enabled features only

## Maintenance Mode

Special system flag that acts as a global killswitch:

**When MAINTENANCE_MODE is enabled**:
- ❌ All users are redirected to `/maintenance` page
- Feature states remain unchanged; maintenance redirect happens before other feature checks

**Use Cases**:
- System upgrades or database migrations
- Emergency security patches
- Scheduled maintenance windows
- Testing new features before general availability

**Activation**:
1. Navigate to `/admin/features`
2. Toggle "Maintenance Mode" ON
3. All users will be redirected to `/maintenance` on next request
4. Toggle OFF to restore normal access

## Error Pages

### `/feature-disabled`

Shown when user tries to access a disabled feature.

**Query Parameters**:
- `feature`: The feature name (e.g., "CONTRACTS")

**Content**:
- Error message: "This feature is currently unavailable"
- Feature display name (if available)
- "Back" button to return to previous page

### `/maintenance`

Shown when maintenance mode is enabled.

**Content**:
- Maintenance icon
- Message: "System is under maintenance"
- "We'll be back soon!" message
- No actions available (users cannot proceed)

## Audit Trail

Every feature flag toggle is recorded in the audit log:

```typescript
// Example audit log entry
{
  id: "audit-123",
  featureName: "CONTRACTS",
  action: "ENABLED",
  userId: "user-abc",
  userEmail: "admin@barq.com",
  reason: "Enabling contract management for pilot program",
  createdAt: "2025-11-24T19:00:00.000Z"
}
```

**Audit Log Access**: (Future feature - not yet implemented)
- View audit history at `/admin/features/audit`
- Filter by feature, user, action, date range
- Export audit logs for compliance

## Migration Guide

### Adding a New Feature Flag

1. **Add to seed configuration** (`seed-features.ts`):

```typescript
export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  // ... existing flags
  {
    name: "MY_NEW_FEATURE",
    displayName: "My New Feature",
    description: "Description of what this feature does",
    category: "LAYER_3", // or LAYER_1, LAYER_2, SYSTEM
    isSystem: false,
    dependsOn: ["FOUNDATION"], // Or [] if no dependencies
  },
];
```

2. **Add route mapping** (`feature-mappings.ts`):

```typescript
export const FEATURE_ROUTES: Record<string, string[]> = {
  // ... existing mappings
  MY_NEW_FEATURE: ["/my-feature", "/my-feature/subpage"],
};

export const FEATURE_DEPENDENCIES: Record<string, string[]> = {
  // ... existing dependencies
  MY_NEW_FEATURE: ["FOUNDATION"],
};
```

3. **Protect routes** (page files):

```typescript
export default async function MyFeaturePage() {
  await requireFeature("MY_NEW_FEATURE");
  await requirePermission(PERMISSIONS.MY_FEATURE_VIEW);
  return <MyFeaturePageClient />;
}
```

4. **Update navigation** (`navigation.ts`):

```typescript
{
  title: "My Feature",
  href: "/my-feature",
  icon: MyIcon,
  permission: PERMISSIONS.MY_FEATURE_VIEW,
  featureFlag: "MY_NEW_FEATURE",
}
```

5. **Reseed database**:

```bash
npm run db:seed
```

### Removing a Feature Flag

1. Remove from seed configuration
2. Remove route mapping
3. Remove navigation items
4. Remove `requireFeature()` calls from routes
5. Reseed database

## Best Practices

### DO ✅

- **Use coarse-grained flags**: One flag per major module, not per route
- **Define clear dependencies**: Document what features depend on others
- **Test dependency chains**: Ensure enabling/disabling works correctly
- **Add descriptive reasons**: When toggling flags, explain why
- **Monitor audit logs**: Track who changed what and when
- **Use maintenance mode sparingly**: Only for critical system operations
- **Check both flags and permissions**: Always enforce both layers of security

### DON'T ❌

- **Don't create per-route flags**: Too granular, use permissions instead
- **Don't bypass server checks**: Always use `requireFeature()` on server
- **Don't forget dependencies**: Always declare dependencies explicitly
- **Don't hardcode feature names**: Use constants from seed configuration
- **Don't skip cache invalidation**: Always invalidate after toggle
- **Don't toggle during business hours**: Schedule maintenance windows
- **Don't rely on client-side checks alone**: Server-side enforcement is critical

## Troubleshooting

### Issue: Feature disabled but admin can still access

**Expected behavior**: Admins should also be blocked by disabled features.

**Solution**:
1. Invalidate Redis cache for the feature (`invalidateFeatureCache`).
2. Confirm the flag is disabled in the database.
3. Ensure the client has refreshed feature flags (wait for poll or hard refresh).

### Issue: Enabled feature but users still redirected

**Possible causes**:
1. Redis cache not invalidated
2. Permission layer blocking access
3. Maintenance mode enabled

**Solutions**:
1. Check cache: `redis-cli GET feature:FEATURE_NAME` should return `"1"`
2. Check user has required permission
3. Check maintenance mode is disabled

### Issue: Cannot enable feature due to dependencies

**Error**: "Cannot enable: missing dependencies: FOUNDATION"

**Solution**:
1. Check dependency chain: `FEATURE_DEPENDENCIES` in `feature-mappings.ts`
2. Enable dependencies first (in order)
3. Then enable the target feature

### Issue: Cannot disable feature due to dependents

**Error**: "Cannot disable: required by enabled features: SERVICES"

**Solution**:
1. Disable all dependent features first
2. Then disable the target feature
3. Order matters: disable from leaves to root of dependency tree

## Performance Considerations

### Redis Caching

- **Cache Hit Ratio**: Aim for >95% cache hit ratio
- **Cache TTL**: 5 minutes is a balance between freshness and performance
- **Cache Invalidation**: Only invalidate on toggle, not on reads
- **Fallback**: If Redis unavailable, falls back to direct database queries

### Database Queries

- **Indexes**: `isEnabled` and `category` fields are indexed
- **Query Frequency**: Cached queries reduce database load by ~95%
- **Connection Pooling**: Uses Prisma connection pool for database access

### Route Protection

- **Server-Side Only**: Feature checks happen on server, not client
- **Early Exit**: Feature check before permission check (fail fast)
- **Redirect**: Uses Next.js `redirect()` for efficient redirects

## Security Considerations

### Defense in Depth

Feature flags provide **system-level control**, not user-level authorization:

```
Layer 1: Feature Flags (system-level) → Is this module enabled?
Layer 2: RBAC Permissions (user-level) → Does this user have access?
Layer 3: Business Rules (entity-level) → Can this action be performed?
```

**Never rely on feature flags alone for authorization.**

### Bypass Protection

- ✅ Server-side enforcement with `requireFeature()`
- ✅ Cannot be bypassed by client-side manipulation
- ✅ Redis cache cannot be directly manipulated by users
- ✅ Audit trail tracks all changes

### Admin Privilege

- ✅ Only system-administrator role can manage flags
- ✅ Feature flags apply to all roles, including system-administrator
- ✅ All toggles are logged with user ID and reason
- ✅ Cannot escalate privileges via feature flags

## Future Enhancements

### Planned Features

1. **Audit Log UI**: View and filter audit history at `/admin/features/audit`
2. **Scheduled Toggles**: Schedule feature enable/disable at specific times
3. **Feature Rollout**: Gradual rollout to percentage of users
4. **A/B Testing**: Split traffic between feature on/off for testing
5. **Feature Analytics**: Track feature usage, adoption, and performance
6. **Notification Integration**: Notify admins when features are toggled
7. **Bulk Operations**: Enable/disable multiple features at once
8. **Feature Groups**: Group related features for easier management
9. **Environment-Specific Flags**: Different flag states for dev/staging/prod
10. **API Access**: REST API for programmatic feature flag management

### Not Planned

- ❌ **User-Level Toggles**: Use RBAC permissions instead
- ❌ **Route-Level Toggles**: Too granular, use permissions instead
- ❌ **Per-Organization Toggles**: Not applicable (single-tenant system)
- ❌ **Feature Voting**: Admin decision only
- ❌ **Public API**: Security risk

## Related Documentation

- [RBAC_ARCHITECTURE.md](../architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Overview of Layer 3 features
- [SYSTEM_SETUP.md](./SYSTEM_SETUP.md) - System health monitoring dashboard
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Clean Architecture implementation

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Best Practices](#best-practices)
3. Consult [API Reference](#api-reference)
4. Contact DevOps team for Redis/caching issues
5. Contact Security team for permission/authorization issues

---

**Last Updated**: 2025-11-27
**Version**: 1.1.0
**Status**: Production-Ready
