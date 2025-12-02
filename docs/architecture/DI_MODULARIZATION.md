# DI Container Modularization

**Status**: Implemented (Phase 3 Complete)
**Version**: 1.0.0
**Last Updated**: 2025-12-02

## Overview

The DI container has been refactored into a three-tier modular system to support lazy loading, reduce startup overhead, and enable feature-based module loading.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Module Registry                                                  │
│ - Tracks all registered modules                                  │
│ - Validates dependencies                                          │
│ - Provides load order (topological sort)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Module Loader                                                    │
│ - Loads modules by tier                                          │
│ - Resolves dependencies automatically                            │
│ - Runs health checks                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ DI Container (InversifyJS)                                       │
│ - Single container instance                                      │
│ - Lazy module registration                                       │
│ - Service resolution                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Module Tiers

### CORE Tier (Always Loaded)

**Purpose**: Essential services required for application to function

**Modules**:
- `logger` - Structured logging with Pino
- `file-storage` - Local file storage service
- `code-generator` - QR code and barcode generation
- `database` - Prisma database client and base repositories
- `rbac` - Role-based access control
- `user-provisioning` - User account creation and password reset
- `system-setup` - System health checks and setup utilities
- `database-backup` - Database backup and restore
- `feature-flags` - Feature flag management
- `foundation` - Core entities (Person, Location, Vendor, Lifecycle, etc.)
- `email` - Email sending via Resend
- `realtime` - SSE and Partykit real-time features
- `queue` - BullMQ background job processing
- `csv` - CSV parsing and generation

**Load Time**: ~100-200ms
**Always Loaded**: Yes

### DASHBOARD Tier (Loaded for Dashboard Users)

**Purpose**: Common ITAM features used by most users

**Modules**:
- `asset` - Asset lifecycle, categories, models, assignments
- `inventory` - Stock locations, movements, reservations
- `cmdb` - Configuration items and relationships
- `contracts` - Contract types, contracts, linked objects
- `governance` - Data domains, ownership, verification campaigns
- `attachments` - File attachments for entities
- `disposal` - Asset disposal workflow with approvals
- `asset-kits` - Asset kit management and checkout
- `reservations` - Asset reservation and conflict detection
- `search` - Global search across entities
- `use-cases` - Cross-cutting business logic

**Load Time**: ~200-400ms (cumulative with CORE)
**Loaded By Default**: Yes (when user accesses dashboard)

### HEAVY Tier (Lazy Loaded on Demand)

**Purpose**: Feature-specific modules with external dependencies

**Modules**:
- `microsoft-graph` - Azure AD user sync via Microsoft Graph API
- `intune` - Microsoft Intune device management and compliance
- `service` - IT service catalog, ownership, SLA tracking
- `licenses` - Software license products, entitlements, cost tracking

**Load Time**: ~50-100ms per module
**Loaded By Default**: No (lazy loaded when feature is accessed)
**Feature Flags**: Most heavy modules are gated by feature flags

## Module Dependencies

### Dependency Graph

```
logger (no deps)
  ├─> file-storage
  ├─> code-generator
  ├─> database
  │    ├─> rbac
  │    │    └─> user-provisioning
  │    ├─> system-setup
  │    ├─> database-backup
  │    ├─> feature-flags
  │    └─> foundation
  │         ├─> asset
  │         │    ├─> inventory
  │         │    ├─> disposal
  │         │    ├─> asset-kits
  │         │    └─> reservations
  │         ├─> cmdb
  │         ├─> contracts
  │         └─> governance
  ├─> email
  ├─> realtime
  ├─> queue
  └─> csv

microsoft-graph (no heavy deps)
  └─> intune (depends on asset, foundation)

service (depends on cmdb, asset, foundation)
licenses (depends on foundation)
```

### Critical Paths

1. **Logger → Database → Foundation → Asset** - Core ITAM functionality
2. **Logger → RBAC → User Provisioning** - Authentication/authorization
3. **Microsoft Graph → Intune** - Device management
4. **CMDB → Service** - Service catalog

## Initialization Modes

### Mode 1: Minimal (CORE Only)

**Use Case**: Public pages, marketing site, unauthenticated users

```typescript
import { initContainer, ModuleTier } from '@/di/container';

// Load only CORE modules
await initContainer(ModuleTier.CORE);
```

**Modules Loaded**: 14 CORE modules
**Load Time**: ~100-200ms
**Memory**: Minimal

### Mode 2: Dashboard (CORE + DASHBOARD)

**Use Case**: Authenticated users accessing dashboard (default)

```typescript
import { initContainer, ModuleTier } from '@/di/container';

// Load CORE + DASHBOARD modules (default)
await initContainer(ModuleTier.DASHBOARD);
// or simply: await initContainer();
```

**Modules Loaded**: 14 CORE + 11 DASHBOARD = 25 modules
**Load Time**: ~300-500ms
**Memory**: Moderate

### Mode 3: Full (All Tiers)

**Use Case**: Administrative tools, system status pages (rare)

```typescript
import { initContainer, ModuleTier } from '@/di/container';

// Load all modules including HEAVY
await initContainer(ModuleTier.HEAVY);
```

**Modules Loaded**: 14 CORE + 11 DASHBOARD + 4 HEAVY = 29 modules
**Load Time**: ~500-800ms
**Memory**: High

## Lazy Loading Heavy Modules

Heavy modules are not loaded by default. Load them on-demand when users access specific features:

```typescript
import { loadHeavyModule, isModuleLoaded } from '@/di/container';

// Check if Intune module is loaded
if (!isModuleLoaded('intune')) {
  // Lazy load Intune module when user accesses Intune page
  await loadHeavyModule('intune');
}

// Now Intune dependencies are available
const container = getContainer();
const intuneRepo = container.get(DI_TOKENS.IIntuneDeviceRepository);
```

**Benefits**:
- Faster initial page load
- Reduced memory footprint for users not accessing heavy features
- Feature flags can gate module loading

## Health Checks

Heavy modules can implement health checks to validate external dependencies:

```typescript
import { checkModuleHealth } from '@/di/container';

// Check health of all loaded modules
const healthResults = await checkModuleHealth();

for (const result of healthResults) {
  console.log(`${result.moduleName}: ${result.status}`);
  // HEALTHY | DEGRADED | UNHEALTHY | UNKNOWN
}
```

**Health Check Results**:
- `HEALTHY` - Module is operational
- `DEGRADED` - Module has warnings but is functional
- `UNHEALTHY` - Module is not operational
- `UNKNOWN` - Health check not implemented

### Implementing Health Checks

```typescript
// src/di/health-checks/my-module.health.ts
import { ModuleHealthStatus, type ModuleHealthCheck } from "../module-registry";

export function createMyModuleHealthCheck() {
  return async (): Promise<ModuleHealthCheck> => {
    try {
      // Validate external API connectivity
      await externalAPI.ping();

      return {
        moduleName: "my-module",
        status: ModuleHealthStatus.HEALTHY,
        message: "External API is accessible",
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        moduleName: "my-module",
        status: ModuleHealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date(),
      };
    }
  };
}

// Add to module definition
export const MY_MODULE: DIModule = {
  name: "my-module",
  displayName: "My Module",
  tier: ModuleTier.HEAVY,
  description: "My heavy module with external dependencies",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: bindMyModuleDependencies,
  healthCheck: createMyModuleHealthCheck,
};
```

## Module Statistics

Track module loading status and statistics:

```typescript
import { getModuleStats } from '@/di/container';

const stats = getModuleStats();
console.log(`Loaded: ${stats.loaded}/${stats.total} modules`);
console.log(`By tier:`, stats.byTier);
// {
//   CORE: 14,
//   DASHBOARD: 11,
//   HEAVY: 4
// }
```

## Adding New Modules

### Step 1: Create Module Binding Function

```typescript
// src/di/modules/my-feature.module.ts
import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

export function bindMyFeatureDependencies(container: Container): void {
  // Bind repositories
  container
    .bind(DI_TOKENS.IMyFeatureRepository)
    .to(PrismaMyFeatureRepository)
    .inSingletonScope();

  // Bind use cases
  container
    .bind(DI_TOKENS.CreateMyFeatureUseCase)
    .to(CreateMyFeatureUseCase)
    .inSingletonScope();
}
```

### Step 2: Add Module Definition

```typescript
// src/di/module-definitions.ts
export const MY_FEATURE_MODULE: DIModule = {
  name: "my-feature",
  displayName: "My Feature",
  tier: ModuleTier.DASHBOARD, // or CORE or HEAVY
  description: "My feature description",
  featureFlag: "MY_FEATURE", // optional
  dependencies: ["logger", "database", "foundation"], // list dependencies
  isLoaded: false,
  bindFunction: bindMyFeatureDependencies,
  healthCheck: createMyFeatureHealthCheck, // optional
};

// Add to ALL_MODULES array
export const ALL_MODULES: DIModule[] = [
  // ... existing modules
  MY_FEATURE_MODULE,
];
```

### Step 3: Test Module Loading

```typescript
// tests/di/my-feature-module.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { initContainer, resetContainer, isModuleLoaded } from "@/di/container";

describe("My Feature Module", () => {
  afterEach(() => {
    resetContainer();
  });

  it("should load my-feature module", async () => {
    await initContainer();
    expect(isModuleLoaded("my-feature")).toBe(true);
  });

  it("should resolve my-feature dependencies", async () => {
    await initContainer();
    const container = getContainer();
    const repo = container.get(DI_TOKENS.IMyFeatureRepository);
    expect(repo).toBeDefined();
  });
});
```

## Best Practices

### 1. Choose the Right Tier

- **CORE**: Essential services needed by all features (auth, logging, database)
- **DASHBOARD**: Common features used by most users (assets, inventory)
- **HEAVY**: Specialized features with external dependencies or heavy load (Intune, Services)

### 2. Declare Dependencies Explicitly

Always list module dependencies in the module definition:

```typescript
dependencies: ["logger", "database", "foundation", "asset"]
```

### 3. Use Feature Flags for Heavy Modules

Gate heavy modules behind feature flags to prevent loading when disabled:

```typescript
featureFlag: "INTUNE"
```

### 4. Implement Health Checks for External Dependencies

If your module depends on external APIs or services, implement a health check:

```typescript
healthCheck: createMyModuleHealthCheck
```

### 5. Keep Binding Functions Synchronous

Module binding functions should be synchronous for predictable load order:

```typescript
// ✅ Good - synchronous
export function bindMyModuleDependencies(container: Container): void {
  container.bind(DI_TOKENS.IMyService).to(MyService);
}

// ❌ Bad - async (not supported)
export async function bindMyModuleDependencies(container: Container): Promise<void> {
  await someAsyncInit();
  container.bind(DI_TOKENS.IMyService).to(MyService);
}
```

### 6. Test Module Independence

Each module should be testable in isolation:

```typescript
// Test that module loads without its dependents
it("should load foundation module independently", async () => {
  await initContainer(ModuleTier.CORE);
  expect(isModuleLoaded("foundation")).toBe(true);
  expect(isModuleLoaded("asset")).toBe(false); // not loaded yet
});
```

## Migration from Monolithic Container

### Before (Monolithic)

```typescript
// All modules loaded at once
import { initContainer } from '@/di/container';

// Blocks for 500-800ms loading everything
const container = initContainer();
```

### After (Modular)

```typescript
// Load only what's needed
import { initContainer, ModuleTier, loadHeavyModule } from '@/di/container';

// Fast initial load (200-300ms for CORE + DASHBOARD)
await initContainer(ModuleTier.DASHBOARD);

// Lazy load heavy modules when needed
if (userAccessesIntunePage) {
  await loadHeavyModule('intune');
}
```

### Backward Compatibility

The `getContainer()` function still works synchronously for existing code:

```typescript
// Old code still works (loads CORE + DASHBOARD synchronously)
const container = getContainer();
const repo = container.get(DI_TOKENS.IAssetRepository);
```

**Note**: Prefer async `initContainer()` at application startup for better performance.

## Performance Impact

### Startup Time Improvements

| Mode | Modules Loaded | Load Time | Memory | Use Case |
|------|---------------|-----------|--------|----------|
| **Before** | 29 (all) | 500-800ms | High | N/A |
| **CORE** | 14 | 100-200ms | Low | Public pages |
| **DASHBOARD** | 25 | 300-500ms | Medium | Dashboard users |
| **Lazy (Intune)** | +2 | +50-100ms | +Low | Intune page only |

### Memory Footprint

- **CORE**: ~50MB
- **DASHBOARD**: ~100MB
- **HEAVY (each)**: ~10-20MB

## Troubleshooting

### Module Not Found Error

```
Error: Module my-feature not found in registry
```

**Solution**: Add module to `ALL_MODULES` array in `module-definitions.ts`

### Dependency Validation Error

```
Error: Module my-feature depends on other-module which is not registered
```

**Solution**: Ensure all dependencies are registered before the dependent module

### Circular Dependency Error

```
Error: Circular dependency detected: module-a → module-b → module-a
```

**Solution**: Refactor modules to break circular dependency (extract shared logic to a third module)

### Health Check Fails

```
Status: UNHEALTHY
Message: External API is not accessible
```

**Solution**: Check external service credentials and connectivity

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Development workflows
- [Architecture Hardening Plan](../../roadmap/architecture-hardening-plan.md) - Phase 3 implementation details

## Future Enhancements

- Route-based automatic module loading (detect route, load required modules)
- Module preloading hints (load in background before user navigates)
- Module telemetry (track load times, memory usage, health over time)
- Dynamic module unloading (free memory for unused modules)
