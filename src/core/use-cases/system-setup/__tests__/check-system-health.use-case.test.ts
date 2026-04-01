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
});
