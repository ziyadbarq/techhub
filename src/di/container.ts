/**
 * Dependency Injection Container
 *
 * This file configures and exports the InversifyJS container instance with
 * support for modular lazy loading.
 *
 * Architecture:
 * - Three-tier module system: Core (always-on), Dashboard (common), Heavy (lazy)
 * - Follows SOLID principles, particularly Dependency Inversion Principle
 * - Uses constructor injection for explicit dependencies
 * - Supports singleton and transient scopes
 * - Enables testability through interface-based design
 * - Lazy loading for heavy modules (Intune, Services, Licenses)
 *
 * Module Tiers:
 * - CORE: RBAC, Foundation, base infrastructure (always loaded)
 * - DASHBOARD: Assets, Inventory, CMDB (loaded for dashboard users)
 * - HEAVY: Intune, Services, Licenses (lazy loaded on demand)
 *
 * Usage:
 * 1. Import getContainer() to access the configured container
 * 2. Call initContainer(tier?) once at application startup
 * 3. Use container.get(DI_TOKENS.ServiceName) to resolve dependencies
 * 4. Call loadHeavyModule(name) to lazy load heavy modules
 */

// IMPORTANT: Must import reflect-metadata before any InversifyJS usage
// This enables TypeScript decorators and metadata reflection
import "reflect-metadata";
import { Container } from "inversify";
import { logger } from "@/lib/logger";
import { markContainerInitialized, resetLoggerState } from "@/lib/logger-state";
import { moduleRegistry, ModuleLoader, ModuleTier } from "./module-registry";
import { ALL_MODULES } from "./module-definitions";
import { DI_TOKENS } from "./types";
import type { ILoggerService } from "@/core/services";

/**
 * Global container instance
 * Singleton pattern ensures one container per application
 */
let container: Container | null = null;

/**
 * Module loader instance (created after container initialization)
 */
let moduleLoader: ModuleLoader | null = null;

/**
 * Registers all modules in the module registry
 *
 * This function is called once at application startup to populate
 * the module registry with all available modules.
 */
function registerModules(): void {
  // Register all modules from module-definitions
  for (const diModule of ALL_MODULES) {
    moduleRegistry.register(diModule);
  }

  // Validate module dependencies
  const errors = moduleRegistry.validateAll();
  if (errors.size > 0) {
    const containerLogger = logger.scope("DIContainer");
    errors.forEach((moduleErrors, moduleName) => {
      containerLogger.error(
        "validateModuleDependencies",
        `Module dependency validation errors in ${moduleName}`,
        undefined,
        { errors: moduleErrors },
      );
    });
    throw new Error("Module dependency validation failed");
  }
}

/**
 * Creates and configures the DI container (without loading modules)
 *
 * This function creates an empty container. Modules are loaded separately
 * via the ModuleLoader.
 *
 * @returns Empty Container instance
 */
function createContainer(): Container {
  const newContainer = new Container({
    // Strict mode options for better error detection
    defaultScope: "Singleton", // Default to singleton lifecycle
  });

  return newContainer;
}

/**
 * Initializes the DI container with modular loading
 *
 * Should be called once at application startup. Supports three initialization modes:
 * - CORE: Load only core modules (minimal, for public pages)
 * - DASHBOARD: Load core + dashboard modules (default, for authenticated users)
 * - HEAVY: Load all modules including heavy ones (for specific feature access)
 *
 * @param tier - Module tier to load (defaults to DASHBOARD)
 * @returns The initialized container instance
 *
 * @example
 * ```typescript
 * // In app/layout.tsx - load core + dashboard
 * import { initContainer } from '@/di/container';
 *
 * export default function RootLayout() {
 *   useEffect(() => {
 *     initContainer(); // Loads CORE + DASHBOARD tiers
 *   }, []);
 *
 *   return <html>...</html>;
 * }
 *
 * // For public pages - minimal container
 * initContainer(ModuleTier.CORE);
 *
 * // For specific features - load heavy modules
 * await loadHeavyModule('intune');
 * ```
 */
export async function initContainer(
  tier: ModuleTier = ModuleTier.DASHBOARD,
): Promise<Container> {
  const scopedLogger = logger.scope("DIContainer");

  if (!container) {
    // Register all modules in the registry
    registerModules();

    // Create empty container
    container = createContainer();

    // Mark container as initialized so logger can start using DI
    // This must happen before loading modules
    markContainerInitialized(() => container!);

    // Create module loader
    moduleLoader = new ModuleLoader(container);

    // Load CORE modules (always required)
    scopedLogger.info("initContainer", "Loading CORE tier modules...");
    await moduleLoader.loadTier(ModuleTier.CORE);

    // Get logger from container (now available after CORE tier loaded)
    const diLogger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    moduleRegistry.setLogger(diLogger);
    moduleLoader = new ModuleLoader(container, diLogger);

    // Log statistics after CORE tier
    const coreStats = moduleRegistry.getStats();
    diLogger.info("CORE tier loaded", {
      loaded: coreStats.loaded,
      total: coreStats.total,
    });

    // Load DASHBOARD modules if requested
    if (tier === ModuleTier.DASHBOARD || tier === ModuleTier.HEAVY) {
      diLogger.info("Loading DASHBOARD tier modules...");
      await moduleLoader.loadTier(ModuleTier.DASHBOARD);

      const dashboardStats = moduleRegistry.getStats();
      diLogger.info("DASHBOARD tier loaded", {
        loaded: dashboardStats.loaded,
        total: dashboardStats.total,
      });
    }

    // Load HEAVY modules if explicitly requested (rare - usually loaded on demand)
    if (tier === ModuleTier.HEAVY) {
      diLogger.info("Loading HEAVY tier modules...");
      await moduleLoader.loadTier(ModuleTier.HEAVY);

      const heavyStats = moduleRegistry.getStats();
      diLogger.info("HEAVY tier loaded", {
        loaded: heavyStats.loaded,
        total: heavyStats.total,
      });
    }

    // Final statistics
    const finalStats = moduleRegistry.getStats();
    diLogger.info("Container initialization complete", {
      tier,
      loaded: finalStats.loaded,
      total: finalStats.total,
      byTier: finalStats.byTier,
    });
  }

  return container;
}

/**
 * Load a heavy module on demand
 *
 * Heavy modules (Intune, Services, Licenses) are not loaded by default.
 * Call this function to lazy load them when needed.
 *
 * @param moduleName - Name of the heavy module to load
 *
 * @example
 * ```typescript
 * // Load Intune module when user accesses Intune page
 * await loadHeavyModule('intune');
 * ```
 */
export async function loadHeavyModule(moduleName: string): Promise<void> {
  if (!container || !moduleLoader) {
    throw new Error("Container not initialized. Call initContainer() first.");
  }

  const diModule = moduleRegistry.get(moduleName);
  if (!diModule) {
    throw new Error(`Module ${moduleName} not found in registry`);
  }

  if (diModule.tier !== ModuleTier.HEAVY) {
    throw new Error(
      `Module ${moduleName} is not a heavy module (tier: ${diModule.tier})`,
    );
  }

  // Check if already loaded
  if (moduleRegistry.isLoaded(moduleName)) {
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    logger.debug(`Module ${moduleName} already loaded, skipping`);
    return;
  }

  // Load the module
  await moduleLoader.loadModule(moduleName);
}

/**
 * Check if a module is loaded
 *
 * @param moduleName - Name of the module to check
 * @returns true if module is loaded, false otherwise
 */
export function isModuleLoaded(moduleName: string): boolean {
  return moduleRegistry.isLoaded(moduleName);
}

/**
 * Ensure a lazily-loaded (HEAVY tier) module is loaded before resolving
 * its use cases. No-op when already loaded. Replaces the per-controller
 * ensureXModuleLoaded helper copies.
 *
 * @param moduleName - Name of the module to load (e.g. "licenses")
 */
export async function ensureModuleLoaded(moduleName: string): Promise<void> {
  if (!isModuleLoaded(moduleName)) {
    await loadHeavyModule(moduleName);
  }
}

/**
 * Get module statistics
 *
 * Returns information about loaded/unloaded modules by tier
 */
export function getModuleStats() {
  return moduleRegistry.getStats();
}

/**
 * Check health of all loaded modules
 *
 * Runs health checks for all modules that implement them.
 * Useful for system status pages and monitoring.
 */
export async function checkModuleHealth() {
  if (!container || !moduleLoader) {
    throw new Error("Container not initialized. Call initContainer() first.");
  }

  return moduleLoader.checkHealth();
}

/**
 * Initialize container synchronously with CORE + DASHBOARD tiers
 *
 * This is a synchronous wrapper that creates the container and loads modules.
 * Heavy modules are not loaded - use loadHeavyModule() for those.
 *
 * NOTE: This blocks execution. Prefer async initContainer() at app startup.
 *
 * @internal
 */
function initContainerSync(): Container {
  const scopedLogger = logger.scope("DIContainer");

  if (container) {
    return container;
  }

  scopedLogger.info(
    "initContainerSync",
    "Initializing container synchronously (blocking)...",
  );

  // Register all modules
  registerModules();

  // Create container
  container = createContainer();

  // Mark as initialized
  markContainerInitialized(() => container!);

  // Create loader without logger (core not loaded yet)
  moduleLoader = new ModuleLoader(container);

  // Load CORE tier synchronously (this should be fast ~100ms)
  const coreModules = moduleRegistry.getByTier(ModuleTier.CORE);
  const coreLoadOrder = moduleRegistry.getLoadOrder(
    coreModules.map((m) => m.name),
  );

  for (const moduleName of coreLoadOrder) {
    const diModule = moduleRegistry.get(moduleName)!;
    try {
      diModule.bindFunction(container);
      moduleRegistry.markLoaded(moduleName);
    } catch (error) {
      logger
        .scope("DIContainer")
        .error("loadModule", `Failed to load module ${moduleName}`, error);
      throw error;
    }
  }

  // Get logger from container
  const diLogger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  moduleRegistry.setLogger(diLogger);
  moduleLoader = new ModuleLoader(container, diLogger);

  diLogger.info("CORE tier loaded (sync)", {
    loaded: moduleRegistry.getLoaded().length,
    total: moduleRegistry.getAll().length,
  });

  // Load DASHBOARD tier synchronously
  const dashboardModules = moduleRegistry.getByTier(ModuleTier.DASHBOARD);
  const dashboardLoadOrder = moduleRegistry.getLoadOrder(
    dashboardModules.map((m) => m.name),
  );

  for (const moduleName of dashboardLoadOrder) {
    const diModule = moduleRegistry.get(moduleName)!;
    // Skip if already loaded (from dependencies)
    if (diModule.isLoaded) continue;

    try {
      diModule.bindFunction(container);
      moduleRegistry.markLoaded(moduleName);
    } catch (error) {
      diLogger.error(
        `Failed to load module ${moduleName}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  const finalStats = moduleRegistry.getStats();
  diLogger.info("Container initialized (sync)", {
    loaded: finalStats.loaded,
    total: finalStats.total,
    byTier: finalStats.byTier,
  });

  return container;
}

/**
 * Gets the current container instance
 *
 * Lazily initializes the container if it hasn't been created yet.
 * This synchronous version loads CORE + DASHBOARD tiers.
 * For heavy modules, use loadHeavyModule() explicitly.
 *
 * NOTE: Prefer async initContainer() at application startup to avoid blocking.
 *
 * @returns The active container instance
 *
 * @example
 * ```typescript
 * import { getContainer } from '@/di/container';
 * import { DI_TOKENS } from '@/di/types';
 *
 * const container = getContainer();
 * const repo = container.get<ITaskRepository>(
 *   DI_TOKENS.ITaskRepository
 * );
 * ```
 */
export function getContainer(): Container {
  if (!container) {
    return initContainerSync();
  }
  return container;
}

/**
 * Resets the container (useful for testing)
 *
 * WARNING: Only use this in test environments!
 * Calling this in production will break dependency resolution.
 *
 * @example
 * ```typescript
 * // In test setup
 * import { resetContainer } from '@/di/container';
 *
 * afterEach(() => {
 *   resetContainer();
 * });
 * ```
 */
export function resetContainer(): void {
  if (container) {
    // Log before unbinding (while logger still works)
    logger.scope("DIContainer").debug("resetContainer", "Container reset");

    container.unbindAll();
    container = null;
    moduleLoader = null;

    // Reset module registry
    moduleRegistry.reset();

    // Reset logger's container initialization flag
    resetLoggerState();
  }
}

/**
 * Type-safe dependency resolution helper
 *
 * Provides better TypeScript inference when resolving dependencies
 *
 * @param token - DI token symbol
 * @returns Resolved dependency instance
 *
 * @example
 * ```typescript
 * import { resolve } from '@/di/container';
 * import { DI_TOKENS } from '@/di/types';
 *
 * const repo = resolve<ITaskRepository>(
 *   DI_TOKENS.ITaskRepository
 * );
 * ```
 */
export function resolve<T>(token: symbol): T {
  const currentContainer = getContainer();
  return currentContainer.get<T>(token);
}

/**
 * Export container instance for direct access
 * Prefer using getContainer() for better initialization checks
 */
export { container };

/**
 * Export Container type for type annotations
 */
export type { Container };

/**
 * Export module-related types and utilities
 */
export {
  ModuleTier,
  ModuleHealthStatus,
  type DIModule,
  type ModuleHealthCheck,
} from "./module-registry";
export { moduleRegistry };
