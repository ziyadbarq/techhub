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
    expect(result.intune.error).toContain("permission denied");
    expect(result.intune.message).toContain("permission denied");
  });

  it("treats copied Intune placeholder values as not configured and skips the probe", async () => {
    const graphService = {
      testIntuneConnection: vi.fn(),
    };

    const useCase = new CheckSystemHealthUseCase(
      systemSetupRepository as never,
      jobQueueService as never,
      createMockLogger(),
      graphService as never,
      null,
      createMockConfigService({
        AZURE_TENANT_ID: "your-tenant-id",
        AZURE_CLIENT_ID: "client-id",
        AZURE_CLIENT_SECRET: "client-secret",
      }),
    );

    const result = await useCase.execute();

    expect(graphService.testIntuneConnection).not.toHaveBeenCalled();
    expect(result.intune.configured).toBe(false);
    expect(result.intune.connected).toBe(false);
    expect(result.intune.message).toContain("AZURE_TENANT_ID");
    expect(result.integrationsHealthy).toBe(true);
  });

  it("sanitizes Microsoft provider errors before returning health messages", async () => {
    const graphService = {
      testIntuneConnection: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Failed to connect to Intune via Microsoft Graph: invalid_request: Error(s): 900023 - Timestamp: 2026-06-30 09:16:44Z - Description: AADSTS900023: Specified tenant identifier 'your-tenant-id' is neither a valid DNS name, nor a valid external domain. Trace ID: cccf88ca-ba54-4efb-80e7-273a05863800 Correlation ID: a88406bf-ea0d-4dfb-92fc-8edd0612b153",
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
        AZURE_TENANT_ID: "13826052-38a1-4044-856f-f6b6c1edf081",
        AZURE_CLIENT_ID: "client-id",
        AZURE_CLIENT_SECRET: "client-secret",
      }),
    );

    const result = await useCase.execute();

    expect(result.intune.error).toBe(
      "Intune is configured with an invalid Microsoft tenant. Use a real tenant ID or verified tenant domain.",
    );
    expect(result.intune.message).not.toContain("Trace ID");
    expect(result.intune.message).not.toContain("Correlation ID");
    expect(result.intune.message).not.toContain("Timestamp");
  });

  it("treats copied email placeholder values as not configured and skips the probe", async () => {
    const emailService = {
      testConnection: vi.fn(),
    };

    const useCase = new CheckSystemHealthUseCase(
      systemSetupRepository as never,
      jobQueueService as never,
      createMockLogger(),
      null,
      emailService as never,
      createMockConfigService({
        AZURE_EMAIL_TENANT_ID: "your-email-tenant-id",
        AZURE_EMAIL_CLIENT_ID: "your-email-client-id",
        AZURE_EMAIL_CLIENT_SECRET: "your-email-client-secret",
        AZURE_EMAIL_FROM: "noreply@yourdomain.com",
      }),
    );

    const result = await useCase.execute();

    expect(emailService.testConnection).not.toHaveBeenCalled();
    expect(result.email.configured).toBe(false);
    expect(result.email.message).toContain("AZURE_EMAIL_TENANT_ID");
    expect(result.email.message).toContain("AZURE_EMAIL_FROM");
  });
});
