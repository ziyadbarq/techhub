/**
 * DI Module Loading Tests
 *
 * Smoke tests for modular DI container initialization.
 * Tests module loading, dependency resolution, and health checks.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  initContainer,
  resetContainer,
  getContainer,
  loadHeavyModule,
  isModuleLoaded,
  getModuleStats,
  checkModuleHealth,
  ModuleTier,
  ModuleHealthStatus,
} from "@/di/container";
import { moduleRegistry } from "@/di/module-registry";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";

describe("DI Module Loading", () => {
  afterEach(() => {
    resetContainer();
  });

  describe("Module Registry", () => {
    it("should register all modules on initialization", async () => {
      await initContainer(ModuleTier.CORE);

      const stats = getModuleStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byTier[ModuleTier.CORE]).toBeGreaterThan(0);
      expect(stats.byTier[ModuleTier.DASHBOARD]).toBeGreaterThan(0);
      expect(stats.byTier[ModuleTier.HEAVY]).toBeGreaterThan(0);
    });

    it("should validate module dependencies on registration", async () => {
      await initContainer(ModuleTier.CORE);

      // All modules should have valid dependencies
      const errors = moduleRegistry.validateAll();
      expect(errors.size).toBe(0);
    });
  });

  describe("CORE Tier Loading", () => {
    it("should load CORE tier modules", async () => {
      await initContainer(ModuleTier.CORE);

      const stats = getModuleStats();
      expect(stats.loaded).toBeGreaterThan(0);

      // Verify essential modules are loaded
      expect(isModuleLoaded("logger")).toBe(true);
      expect(isModuleLoaded("database")).toBe(true);
      expect(isModuleLoaded("rbac")).toBe(true);
      expect(isModuleLoaded("foundation")).toBe(true);
    });

    it("should resolve CORE dependencies from container", async () => {
      await initContainer(ModuleTier.CORE);

      const container = getContainer();

      // Logger should be available
      const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
      expect(logger).toBeDefined();
      expect(logger.info).toBeInstanceOf(Function);

      // RBAC dependencies should be available
      const roleRepo = container.get(DI_TOKENS.IRoleRepository);
      expect(roleRepo).toBeDefined();
    });

    it("should not load DASHBOARD modules in CORE-only mode", async () => {
      await initContainer(ModuleTier.CORE);

      expect(isModuleLoaded("asset")).toBe(false);
      expect(isModuleLoaded("inventory")).toBe(false);
      expect(isModuleLoaded("cmdb")).toBe(false);
    });

    it("should not load HEAVY modules in CORE-only mode", async () => {
      await initContainer(ModuleTier.CORE);

      expect(isModuleLoaded("intune")).toBe(false);
      expect(isModuleLoaded("service")).toBe(false);
      expect(isModuleLoaded("licenses")).toBe(false);
    });
  });

  describe("DASHBOARD Tier Loading", () => {
    it("should load CORE + DASHBOARD tiers", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Verify stats are correct
      const stats = getModuleStats();
      expect(stats.loaded).toBeGreaterThan(0);

      // CORE modules should be loaded
      expect(isModuleLoaded("logger")).toBe(true);
      expect(isModuleLoaded("rbac")).toBe(true);

      // DASHBOARD modules should be loaded
      expect(isModuleLoaded("asset")).toBe(true);
      expect(isModuleLoaded("inventory")).toBe(true);
      expect(isModuleLoaded("cmdb")).toBe(true);
    });

    it("should resolve DASHBOARD dependencies from container", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      const container = getContainer();

      // Asset dependencies should be available
      const assetRepo = container.get(DI_TOKENS.IAssetRepository);
      expect(assetRepo).toBeDefined();

      // Inventory dependencies should be available
      const stockLocationRepo = container.get(
        DI_TOKENS.IStockLocationRepository,
      );
      expect(stockLocationRepo).toBeDefined();
    });

    it("should not load HEAVY modules in DASHBOARD mode", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      expect(isModuleLoaded("intune")).toBe(false);
      expect(isModuleLoaded("service")).toBe(false);
      expect(isModuleLoaded("licenses")).toBe(false);
    });
  });

  describe("HEAVY Tier Lazy Loading", () => {
    it("should lazy load heavy module on demand", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Intune should not be loaded initially
      expect(isModuleLoaded("intune")).toBe(false);

      // Load Intune module
      await loadHeavyModule("intune");

      // Intune should now be loaded
      expect(isModuleLoaded("intune")).toBe(true);

      // Intune dependencies should be available
      const container = getContainer();
      const intuneRepo = container.get(DI_TOKENS.IIntuneDeviceRepository);
      expect(intuneRepo).toBeDefined();
    });

    it("should load microsoft-graph dependency when loading intune", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Microsoft Graph should not be loaded initially
      expect(isModuleLoaded("microsoft-graph")).toBe(false);

      // Load Intune (depends on Microsoft Graph)
      await loadHeavyModule("intune");

      // Microsoft Graph should be loaded as a dependency
      expect(isModuleLoaded("microsoft-graph")).toBe(true);
      expect(isModuleLoaded("intune")).toBe(true);
    });

    it("should handle loading same heavy module twice", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Load Intune twice
      await loadHeavyModule("intune");
      await loadHeavyModule("intune");

      // Should be loaded once
      expect(isModuleLoaded("intune")).toBe(true);
    });

    it("should throw error when loading non-heavy module", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      await expect(loadHeavyModule("asset")).rejects.toThrow(
        "is not a heavy module",
      );
    });

    it("should throw error when loading non-existent module", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      await expect(loadHeavyModule("nonexistent")).rejects.toThrow(
        "not found in registry",
      );
    });
  });

  describe("Module Health Checks", () => {
    it("should run health checks for loaded modules", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Load a heavy module with health check
      await loadHeavyModule("intune");

      const healthResults = await checkModuleHealth();

      expect(healthResults).toBeInstanceOf(Array);
      expect(healthResults.length).toBeGreaterThan(0);

      // Find Intune health check
      const intuneHealth = healthResults.find((r) => r.moduleName === "intune");
      expect(intuneHealth).toBeDefined();
      expect(intuneHealth?.status).toBeDefined();
      expect(intuneHealth?.timestamp).toBeInstanceOf(Date);
    });

    it("should report health status for modules", async () => {
      await initContainer(ModuleTier.DASHBOARD);
      await loadHeavyModule("microsoft-graph");

      const healthResults = await checkModuleHealth();

      // Microsoft Graph should have a health check
      const graphHealth = healthResults.find(
        (r) => r.moduleName === "microsoft-graph",
      );
      expect(graphHealth).toBeDefined();

      // Status should be one of the valid statuses
      const validStatuses = [
        ModuleHealthStatus.HEALTHY,
        ModuleHealthStatus.DEGRADED,
        ModuleHealthStatus.UNHEALTHY,
        ModuleHealthStatus.UNKNOWN,
      ];
      expect(validStatuses).toContain(graphHealth?.status);
    });
  });

  describe("Dependency Resolution", () => {
    it("should respect load order based on dependencies", async () => {
      await initContainer(ModuleTier.CORE);

      // Logger should be loaded before database
      const loggerModule = moduleRegistry.get("logger");
      const databaseModule = moduleRegistry.get("database");

      expect(loggerModule?.isLoaded).toBe(true);
      expect(databaseModule?.isLoaded).toBe(true);

      // Logger should load before database (dependency)
      if (loggerModule?.loadedAt && databaseModule?.loadedAt) {
        expect(loggerModule.loadedAt.getTime()).toBeLessThanOrEqual(
          databaseModule.loadedAt.getTime(),
        );
      }
    });

    it("should load dependencies transitively", async () => {
      await initContainer(ModuleTier.DASHBOARD);

      // Inventory depends on asset, which depends on foundation
      expect(isModuleLoaded("foundation")).toBe(true);
      expect(isModuleLoaded("asset")).toBe(true);
      expect(isModuleLoaded("inventory")).toBe(true);
    });
  });

  describe("getContainer() Backward Compatibility", () => {
    it("should initialize container synchronously if not initialized", () => {
      const container = getContainer();

      expect(container).toBeDefined();
      expect(isModuleLoaded("logger")).toBe(true);
      expect(isModuleLoaded("asset")).toBe(true);
    });

    it("should return existing container if already initialized", async () => {
      await initContainer(ModuleTier.CORE);
      const container1 = getContainer();
      const container2 = getContainer();

      expect(container1).toBe(container2);
    });
  });

  describe("Container Reset", () => {
    it("should reset container and module registry", async () => {
      await initContainer(ModuleTier.DASHBOARD);
      expect(isModuleLoaded("asset")).toBe(true);

      resetContainer();

      // After reset, container should be null
      expect(isModuleLoaded("asset")).toBe(false);
      expect(moduleRegistry.getAll()).toHaveLength(0);
    });

    it("should allow re-initialization after reset", async () => {
      await initContainer(ModuleTier.CORE);
      resetContainer();

      await initContainer(ModuleTier.DASHBOARD);
      expect(isModuleLoaded("asset")).toBe(true);
    });
  });

  describe("Module Statistics", () => {
    it("should track module loading statistics", async () => {
      await initContainer(ModuleTier.CORE);

      const stats = getModuleStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.loaded).toBeGreaterThan(0);
      expect(stats.unloaded).toBeGreaterThan(0);
      expect(stats.loaded + stats.unloaded).toBe(stats.total);
    });

    it("should update statistics as modules are loaded", async () => {
      await initContainer(ModuleTier.CORE);

      const statsBeforeHeavy = getModuleStats();

      await loadHeavyModule("intune");

      const statsAfterHeavy = getModuleStats();

      expect(statsAfterHeavy.loaded).toBeGreaterThan(statsBeforeHeavy.loaded);
      expect(statsAfterHeavy.unloaded).toBeLessThan(statsBeforeHeavy.unloaded);
    });
  });
});
