import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import { CheckSystemHealthUseCase } from "../check-system-health.use-case";

function createMockLogger(): ILoggerService {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    audit: vi.fn(),
    withTiming: vi.fn(async (_operation: string, fn: () => Promise<unknown>) =>
      fn(),
    ),
  };

  logger.child.mockReturnValue(logger);

  return logger as unknown as ILoggerService;
}

function createMockConfigService(
  values: Record<string, string | undefined>,
): IConfigService {
  return {
    get: vi.fn(async (key: string) => values[key]),
    getString: vi.fn(async (key: string) => values[key]),
    getNumber: vi.fn(async () => undefined),
    getBoolean: vi.fn(async () => undefined),
    getOrThrow: vi.fn(async (key: string) => {
      const value = values[key];
      if (value === undefined) {
        throw new Error(`Missing setting: ${key}`);
      }
      return value;
    }),
    invalidateCache: vi.fn(),
    getServerStartTimestamp: vi.fn(() => null),
  };
}

describe("CheckSystemHealthUseCase", () => {
  let systemSetupRepository: {
    checkDatabaseConnection: ReturnType<typeof vi.fn>;
    checkRedisConnection: ReturnType<typeof vi.fn>;
    areMigrationsApplied: ReturnType<typeof vi.fn>;
    getPendingMigrationsCount: ReturnType<typeof vi.fn>;
    getSeedStatus: ReturnType<typeof vi.fn>;
  };
  let jobQueueService: {
    hasActiveWorkers: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    systemSetupRepository = {
      checkDatabaseConnection: vi.fn().mockResolvedValue(true),
      checkRedisConnection: vi.fn().mockResolvedValue(true),
      areMigrationsApplied: vi.fn().mockResolvedValue(true),
      getPendingMigrationsCount: vi.fn().mockResolvedValue(0),
      getSeedStatus: vi.fn().mockResolvedValue({
        organizationUnits: 1,
        locations: 1,
        vendors: 1,
        featureFlags: 1,
        services: 1,
      }),
    };

    jobQueueService = {
      hasActiveWorkers: vi.fn().mockResolvedValue(true),
    };
  });

  it("treats configured Microsoft SSO as healthy without a dedicated probe", async () => {
    const useCase = new CheckSystemHealthUseCase(
      systemSetupRepository as never,
      jobQueueService as never,
      createMockLogger(),
      null,
      null,
      createMockConfigService({
        MICROSOFT_CLIENT_ID: "client-id",
        MICROSOFT_CLIENT_SECRET: "client-secret",
      }),
    );

    const result = await useCase.execute();

    expect(result.msGraphSSO.configured).toBe(true);
    expect(result.msGraphSSO.connected).toBe(true);
    expect(result.msGraphSSO.message).toContain("Configured");
    expect(result.integrationsHealthy).toBe(true);
  });

  it("explains when Intune credentials exist but the Graph service is unavailable", async () => {
    const useCase = new CheckSystemHealthUseCase(
      systemSetupRepository as never,
      jobQueueService as never,
      createMockLogger(),
      null,
      null,
      createMockConfigService({
        AZURE_TENANT_ID: "tenant-id",
        AZURE_CLIENT_ID: "client-id",
        AZURE_CLIENT_SECRET: "client-secret",
      }),
    );

    const result = await useCase.execute();

    expect(result.intune.configured).toBe(true);
    expect(result.intune.connected).toBe(false);
    expect(result.intune.error).toContain("not loaded");
    expect(result.intune.message).toContain("Connection failed");
    expect(result.integrationsHealthy).toBe(false);
  });

  it("surfaces Intune probe failures in the health response", async () => {
    const graphService = {
      testIntuneConnection: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Failed to connect to Intune via Microsoft Graph: 403 Forbidden",
          ),
        ),
    };

    const useCase = new CheckSystemHealthUseCase(
      systemSetupRepository as never,
      jobQueueService as never,
      createMockLogger(),
      graphService as never,
      null,
      createMockConfigService({
        AZURE_TENANT_ID: "tenant-id",
        AZURE_CLIENT_ID: "client-id",
        AZURE_CLIENT_SECRET: "client-secret",
      }),
    );

    const result = await useCase.execute();

    expect(graphService.testIntuneConnection).toHaveBeenCalledTimes(1);
    expect(result.intune.connected).toBe(false);
    expect(result.intune.error).toContain("403 Forbidden");
    expect(result.intune.message).toContain("403 Forbidden");
  });
});
