/**
 * DI Module Registry
 *
 * Provides infrastructure for lazy loading and managing DI modules in three tiers:
 * - Core (always-on): RBAC, Foundation, base infrastructure
 * - Dashboard (common): Assets, Inventory, CMDB
 * - Heavy (lazy): Intune, Services, Licenses (external APIs, heavy dependencies)
 *
 * Architecture:
 * - Single container instance with lazy module registration
 * - Feature flag-based gating for heavy modules
 * - Health checks for modules with external dependencies
 * - Dependency tracking and initialization order enforcement
 */

import type { Container } from "inversify";
import type { ILoggerService } from "@/core/services";

/**
 * Module tier determines when modules are loaded
 */
export enum ModuleTier {
  /**
   * Core modules (always loaded)
   * - RBAC, Foundation entities, base infrastructure
   * - Required for application to function
   */
  CORE = "CORE",

  /**
   * Dashboard modules (loaded on dashboard access)
   * - Assets, Inventory, CMDB, core ITAM features
   * - Common modules used by most users
   */
  DASHBOARD = "DASHBOARD",

  /**
   * Heavy modules (lazy loaded on demand)
   * - Intune, Service Management, Licenses
   * - External API integrations, heavy dependencies
   * - Gated by feature flags
   */
  HEAVY = "HEAVY",
}

/**
 * Module health status
 */
export enum ModuleHealthStatus {
  /** Module is healthy and operational */
  HEALTHY = "HEALTHY",
  /** Module has warnings but is operational */
  DEGRADED = "DEGRADED",
  /** Module is not operational */
  UNHEALTHY = "UNHEALTHY",
  /** Module health check not implemented */
  UNKNOWN = "UNKNOWN",
}

/**
 * Module health check result
 */
export interface ModuleHealthCheck {
  /** Module name */
  moduleName: string;
  /** Health status */
  status: ModuleHealthStatus;
  /** Health check message */
  message: string;
  /** Additional details (errors, warnings, etc.) */
  details?: Record<string, unknown>;
  /** Timestamp of health check */
  timestamp: Date;
}

/**
 * Module metadata and configuration
 */
export interface DIModule {
  /** Unique module identifier */
  name: string;

  /** Display name for logging and UI */
  displayName: string;

  /** Module tier (determines loading strategy) */
  tier: ModuleTier;

  /** Module description */
  description: string;

  /** Feature flag name (for heavy modules) */
  featureFlag?: string;

  /** Dependencies (other modules that must be loaded first) */
  dependencies: string[];

  /** Whether module is currently loaded */
  isLoaded: boolean;

  /** Module binding function */
  bindFunction: (container: Container) => void | Promise<void>;

  /** Optional health check function */
  healthCheck?: () => Promise<ModuleHealthCheck>;

  /** Load timestamp */
  loadedAt?: Date;
}

/**
 * Module registry - manages all DI modules
 */
class ModuleRegistry {
  private modules: Map<string, DIModule> = new Map();
  private logger?: ILoggerService;

  /**
   * Set logger instance (called after logger module is loaded)
   */
  setLogger(logger: ILoggerService): void {
    this.logger = logger;
  }

  /**
   * Register a module
   */
  register(module: DIModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }

    this.modules.set(module.name, { ...module, isLoaded: false });

    if (this.logger) {
      this.logger.debug(`Module registered: ${module.name}`, {
        tier: module.tier,
        dependencies: module.dependencies,
      });
    }
  }

  /**
   * Get module by name
   */
  get(name: string): DIModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all modules by tier
   */
  getByTier(tier: ModuleTier): DIModule[] {
    return Array.from(this.modules.values()).filter((m) => m.tier === tier);
  }

  /**
   * Get all registered modules
   */
  getAll(): DIModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get loaded modules
   */
  getLoaded(): DIModule[] {
    return Array.from(this.modules.values()).filter((m) => m.isLoaded);
  }

  /**
   * Get unloaded modules
   */
  getUnloaded(): DIModule[] {
    return Array.from(this.modules.values()).filter((m) => !m.isLoaded);
  }

  /**
   * Mark module as loaded
   */
  markLoaded(name: string): void {
    const diModule = this.modules.get(name);
    if (diModule) {
      diModule.isLoaded = true;
      diModule.loadedAt = new Date();

      if (this.logger) {
        this.logger.debug(`Module loaded: ${name}`, {
          tier: diModule.tier,
          loadedAt: diModule.loadedAt,
        });
      }
    }
  }

  /**
   * Check if module is loaded
   */
  isLoaded(name: string): boolean {
    return this.modules.get(name)?.isLoaded ?? false;
  }

  /**
   * Get module dependencies (transitive)
   */
  getDependencies(name: string): string[] {
    const diModule = this.modules.get(name);
    if (!diModule) {
      return [];
    }

    const deps = new Set<string>();
    const queue = [...diModule.dependencies];

    while (queue.length > 0) {
      const depName = queue.shift()!;
      if (deps.has(depName)) continue;

      deps.add(depName);
      const depModule = this.modules.get(depName);
      if (depModule) {
        queue.push(...depModule.dependencies);
      }
    }

    return Array.from(deps);
  }

  /**
   * Get load order for modules (topological sort)
   */
  getLoadOrder(moduleNames: string[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;

      const diModule = this.modules.get(name);
      if (!diModule) {
        throw new Error(`Module ${name} not registered`);
      }

      // Visit dependencies first
      for (const dep of diModule.dependencies) {
        visit(dep);
      }

      visited.add(name);
      order.push(name);
    };

    for (const name of moduleNames) {
      visit(name);
    }

    return order;
  }

  /**
   * Validate module dependencies
   */
  validateDependencies(name: string): string[] {
    const diModule = this.modules.get(name);
    if (!diModule) {
      return [`Module ${name} not registered`];
    }

    const errors: string[] = [];

    for (const depName of diModule.dependencies) {
      const dep = this.modules.get(depName);
      if (!dep) {
        errors.push(
          `Module ${name} depends on ${depName} which is not registered`,
        );
      }
    }

    return errors;
  }

  /**
   * Validate all modules
   */
  validateAll(): Map<string, string[]> {
    const errors = new Map<string, string[]>();

    for (const diModule of this.modules.values()) {
      const moduleErrors = this.validateDependencies(diModule.name);
      if (moduleErrors.length > 0) {
        errors.set(diModule.name, moduleErrors);
      }
    }

    return errors;
  }

  /**
   * Get module statistics
   */
  getStats(): {
    total: number;
    loaded: number;
    unloaded: number;
    byTier: Record<ModuleTier, number>;
  } {
    const all = this.getAll();
    return {
      total: all.length,
      loaded: all.filter((m) => m.isLoaded).length,
      unloaded: all.filter((m) => !m.isLoaded).length,
      byTier: {
        [ModuleTier.CORE]: this.getByTier(ModuleTier.CORE).length,
        [ModuleTier.DASHBOARD]: this.getByTier(ModuleTier.DASHBOARD).length,
        [ModuleTier.HEAVY]: this.getByTier(ModuleTier.HEAVY).length,
      },
    };
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.modules.clear();
    this.logger = undefined;
  }
}

/**
 * Singleton module registry instance
 */
export const moduleRegistry = new ModuleRegistry();

/**
 * Module loader - handles lazy loading and dependency resolution
 */
export class ModuleLoader {
  constructor(
    private container: Container,
    private logger?: ILoggerService,
  ) {}

  /**
   * Load modules by tier
   */
  async loadTier(tier: ModuleTier): Promise<void> {
    const modules = moduleRegistry.getByTier(tier);

    if (this.logger) {
      this.logger.info(`Loading ${tier} tier modules`, {
        count: modules.length,
        modules: modules.map((m) => m.name),
      });
    }

    // Get load order (resolve dependencies)
    const loadOrder = moduleRegistry.getLoadOrder(modules.map((m) => m.name));

    // Load modules in order
    for (const moduleName of loadOrder) {
      await this.loadModule(moduleName);
    }
  }

  /**
   * Load a single module (with dependency resolution)
   */
  async loadModule(name: string): Promise<void> {
    const diModule = moduleRegistry.get(name);
    if (!diModule) {
      throw new Error(`Module ${name} not registered`);
    }

    // Skip if already loaded
    if (diModule.isLoaded) {
      if (this.logger) {
        this.logger.debug(`Module already loaded: ${name}`);
      }
      return;
    }

    // Validate dependencies
    const errors = moduleRegistry.validateDependencies(name);
    if (errors.length > 0) {
      throw new Error(
        `Module ${name} has dependency errors: ${errors.join(", ")}`,
      );
    }

    // Load dependencies first
    for (const depName of diModule.dependencies) {
      await this.loadModule(depName);
    }

    // Load module
    if (this.logger) {
      this.logger.info(`Loading module: ${diModule.displayName}`, {
        name: diModule.name,
        tier: diModule.tier,
      });
    }

    const startTime = performance.now();

    try {
      await diModule.bindFunction(this.container);
      moduleRegistry.markLoaded(name);

      const duration = Math.round(performance.now() - startTime);
      if (this.logger) {
        this.logger.info(`Module loaded: ${diModule.displayName}`, {
          name: diModule.name,
          durationMs: duration,
        });
      }
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      if (this.logger) {
        this.logger.error(
          `Failed to load module: ${diModule.displayName}`,
          error instanceof Error ? error : new Error(String(error)),
          { name: diModule.name, durationMs: duration },
        );
      }
      throw error;
    }
  }

  /**
   * Load modules by names
   */
  async loadModules(names: string[]): Promise<void> {
    const loadOrder = moduleRegistry.getLoadOrder(names);

    for (const name of loadOrder) {
      await this.loadModule(name);
    }
  }

  /**
   * Check health of all loaded modules
   */
  async checkHealth(): Promise<ModuleHealthCheck[]> {
    const loadedModules = moduleRegistry.getLoaded();
    const results: ModuleHealthCheck[] = [];

    for (const diModule of loadedModules) {
      if (diModule.healthCheck) {
        try {
          const result = await diModule.healthCheck();
          results.push(result);
        } catch (error) {
          results.push({
            moduleName: diModule.name,
            status: ModuleHealthStatus.UNHEALTHY,
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          });
        }
      } else {
        results.push({
          moduleName: diModule.name,
          status: ModuleHealthStatus.UNKNOWN,
          message: "Health check not implemented",
          timestamp: new Date(),
        });
      }
    }

    return results;
  }
}
