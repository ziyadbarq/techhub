/**
 * Check System Health Use Case
 * Verifies that all system requirements are met
 */

import { injectable, inject, optional } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services";
import type { IConfigService } from "@/core/services/config.service.interface";
import type { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { SystemHealthCheckDto } from "@/core/dtos/system-setup.dto";
import { QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import { LogExecution } from "@/lib/decorators";

type ConfigReadiness = {
  configured: boolean;
  message?: string;
  missingKeys: string[];
  placeholderKeys: string[];
};

const PLACEHOLDER_PATTERNS = [
  /^your[-_]/i,
  /^change[-_]me/i,
  /^example$/i,
  /^placeholder$/i,
  /yourdomain\.com/i,
];

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().replace(/^["']|["']$/g, "");
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function getConfigReadiness(
  configService: IConfigService,
  keys: string[],
): Promise<ConfigReadiness> {
  const values = await Promise.all(
    keys.map(async (key) => [key, await configService.get(key)] as const),
  );
  const missingKeys = values
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);
  const placeholderKeys = values
    .filter(([, value]) => value !== undefined && isPlaceholderValue(value))
    .map(([key]) => key);

  const invalidKeys = [...missingKeys, ...placeholderKeys];

  return {
    configured: invalidKeys.length === 0,
    missingKeys,
    placeholderKeys,
    message:
      invalidKeys.length > 0
        ? `Not configured (optional). Set ${invalidKeys.join(", ")} to real values to enable this integration.`
        : undefined,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function stripProviderNoise(message: string): string {
  return message
    .replace(/\s*Trace ID:\s*[\w-]+/gi, "")
    .replace(/\s*Correlation ID:\s*[\w-]+/gi, "")
    .replace(/\s*Timestamp:\s*[\dT:.+-]+Z?/gi, "")
    .replace(/\s*Error\(s\):\s*\d+\s*-\s*/gi, "")
    .replace(/\s*Description:\s*/gi, "")
    .replace(/\s+-\s+-\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toIntegrationErrorMessage(error: unknown, integrationName: string) {
  const rawMessage = getErrorMessage(error, `${integrationName} check failed`);
  const message = stripProviderNoise(rawMessage);

  if (/AADSTS900023/i.test(message) || /tenant identifier/i.test(message)) {
    return `${integrationName} is configured with an invalid Microsoft tenant. Use a real tenant ID or verified tenant domain.`;
  }

  if (/invalid_client/i.test(message)) {
    return `${integrationName} credentials were rejected. Verify the client ID and client secret.`;
  }

  if (/unauthorized_client|admin consent|consent_required/i.test(message)) {
    return `${integrationName} is missing required Microsoft Graph permissions or admin consent.`;
  }

  if (/\b403\b|Forbidden/i.test(message)) {
    return `${integrationName} permission denied by Microsoft Graph. Verify API permissions and admin consent.`;
  }

  if (/\b401\b|Unauthorized/i.test(message)) {
    return `${integrationName} authentication failed. Verify the tenant, client ID, and client secret.`;
  }

  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch failed/i.test(message)) {
    return `${integrationName} could not reach Microsoft Graph. Check network connectivity and proxy/firewall settings.`;
  }

  if (/Missing .*configuration|Required environment variables/i.test(message)) {
    return `${integrationName} is not fully configured. Add the required settings before enabling this integration.`;
  }

  return message || `${integrationName} check failed`;
}

@injectable()
export class CheckSystemHealthUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueueService: IJobQueueService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IMicrosoftGraphService)
    @optional()
    private readonly graphService: IMicrosoftGraphService | null,
    @inject(DI_TOKENS.IEmailService)
    @optional()
    private readonly emailService: IEmailService | null,
    @inject(DI_TOKENS.IConfigService)
    private readonly configService: IConfigService,
  ) {}

  private getBuildInfo() {
    const projectUrl = process.env.PROJECT_URL || undefined;
    const gitCommitFull = process.env.GIT_COMMIT_FULL ?? process.env.GIT_COMMIT;
    const pipelineId = process.env.PIPELINE_ID ?? "local";
    const jobId = process.env.GITLAB_JOB_ID ?? "local";

    return {
      version: process.env.APP_VERSION ?? "dev",
      gitCommit: process.env.GIT_COMMIT ?? "local",
      gitCommitFull: gitCommitFull ?? "local",
      gitRef: process.env.GIT_REF ?? "local",
      buildDate: process.env.BUILD_DATE ?? "unknown",
      imageTag: process.env.IMAGE_TAG ?? "local",
      pipelineId,
      pipelineUrl:
        process.env.PIPELINE_URL ||
        (projectUrl && pipelineId !== "local"
          ? `${projectUrl}/-/pipelines/${pipelineId}`
          : undefined),
      jobId,
      jobUrl:
        process.env.GITLAB_JOB_URL ||
        (projectUrl && jobId !== "local"
          ? `${projectUrl}/-/jobs/${jobId}`
          : undefined),
      projectUrl,
    };
  }

  @LogExecution("system.health.check")
  async execute(): Promise<SystemHealthCheckDto> {
    this.logger.debug("System health check started");

    // Check database connection
    let databaseConnected = false;
    let databaseError: string | undefined;
    let databaseResponseTime: number | undefined;
    try {
      const dbStart = performance.now();
      databaseConnected =
        await this.systemSetupRepository.checkDatabaseConnection();
      databaseResponseTime = Math.round(performance.now() - dbStart);
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Unknown database error";
    }

    // Check Redis connection
    let redisConnected = false;
    let redisError: string | undefined;
    let redisResponseTime: number | undefined;
    try {
      const redisStart = performance.now();
      redisConnected = await this.systemSetupRepository.checkRedisConnection();
      redisResponseTime = Math.round(performance.now() - redisStart);
    } catch (error) {
      redisError =
        error instanceof Error ? error.message : "Unknown Redis error";
    }

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
    ];
    const missingEnvVars: string[] = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );
    const environmentValid = missingEnvVars.length === 0;
    this.logger.debug("Environment validation completed", {
      environmentValid,
      missingEnvVarsCount: missingEnvVars.length,
    });

    // Check migrations
    let migrationsApplied = false;
    let pendingMigrationsCount = 0;
    let migrationsError: string | undefined;
    try {
      migrationsApplied =
        await this.systemSetupRepository.areMigrationsApplied();
      pendingMigrationsCount =
        await this.systemSetupRepository.getPendingMigrationsCount();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown migrations error";
      // Simplify error message for missing migrations table
      if (
        errorMsg.includes("_prisma_migrations") &&
        errorMsg.includes("does not exist")
      ) {
        migrationsError = "Migrations not yet applied. Run: npm run db:migrate";
      } else {
        migrationsError = errorMsg;
      }
    }

    // Check seed status using foundational/config records
    let seedStatus = {
      organizationUnits: 0,
      locations: 0,
      vendors: 0,
      featureFlags: 0,
      services: 0,
    };
    try {
      seedStatus = await this.systemSetupRepository.getSeedStatus();
    } catch (_error) {
      // Ignore seed status errors - runtime health should still be reported
    }

    const seedingInitialized =
      seedStatus.featureFlags > 0 && seedStatus.organizationUnits > 0;

    // Check worker status (maintenance queue)
    let maintenanceWorkerActive = false;
    let workerError: string | undefined;
    try {
      maintenanceWorkerActive = await this.jobQueueService.hasActiveWorkers(
        QUEUE_NAMES.MAINTENANCE,
      );
    } catch (error) {
      workerError =
        error instanceof Error ? error.message : "Unknown worker error";
    }

    // Check Microsoft SSO connection (Better Auth uses MICROSOFT_* credentials)
    let msGraphSSOConfigured = false;
    let msGraphSSOConnected = false;
    let msGraphSSOError: string | undefined;
    let msGraphSSOResponseTime: number | undefined;
    try {
      const readiness = await getConfigReadiness(this.configService, [
        "MICROSOFT_CLIENT_ID",
        "MICROSOFT_CLIENT_SECRET",
      ]);

      // Better Auth falls back to "common" when tenant ID is not configured.
      // Treat client credentials as the real readiness signal here.
      msGraphSSOConfigured = readiness.configured;
      msGraphSSOError = readiness.message;

      // There is no dedicated server-side SSO probe today. Once credentials
      // are present, Better Auth can initialize successfully on restart.
      msGraphSSOConnected = readiness.configured;
    } catch (error) {
      msGraphSSOError = toIntegrationErrorMessage(error, "Microsoft Graph SSO");
    }

    // Check Intune connection (uses AZURE_* credentials)
    let intuneConfigured = false;
    let intuneConnected = false;
    let intuneError: string | undefined;
    let intuneResponseTime: number | undefined;
    try {
      const readiness = await getConfigReadiness(this.configService, [
        "AZURE_TENANT_ID",
        "AZURE_CLIENT_ID",
        "AZURE_CLIENT_SECRET",
      ]);
      intuneConfigured = readiness.configured;
      intuneError = readiness.message;

      if (readiness.configured && !this.graphService) {
        intuneError =
          "Microsoft Graph integration service is not loaded in this runtime.";
      }

      if (readiness.configured && this.graphService) {
        const intuneStart = performance.now();
        intuneConnected = await this.graphService.testIntuneConnection();
        intuneResponseTime = Math.round(performance.now() - intuneStart);

        if (!intuneConnected) {
          intuneError =
            "Intune is configured, but the connectivity check did not succeed.";
        }
      }
    } catch (error) {
      intuneError = toIntegrationErrorMessage(error, "Intune");
    }

    // Check Email service connection
    let emailConfigured = false;
    let emailConnected = false;
    let emailError: string | undefined;
    let emailResponseTime: number | undefined;
    try {
      const readiness = await getConfigReadiness(this.configService, [
        "AZURE_EMAIL_TENANT_ID",
        "AZURE_EMAIL_CLIENT_ID",
        "AZURE_EMAIL_CLIENT_SECRET",
        "AZURE_EMAIL_FROM",
      ]);
      emailConfigured = readiness.configured;
      emailError = readiness.message;

      if (readiness.configured && !this.emailService) {
        emailError = "Email integration service is not loaded in this runtime.";
      }

      if (readiness.configured && this.emailService) {
        const emailStart = performance.now();
        emailConnected = await this.emailService.testConnection();
        emailResponseTime = Math.round(performance.now() - emailStart);
      }
    } catch (error) {
      emailError = toIntegrationErrorMessage(error, "Email");
    }

    // Core services health (deployment gate - excludes worker)
    const coreServicesHealthy =
      databaseConnected &&
      redisConnected &&
      environmentValid &&
      migrationsApplied;

    // Overall health (includes worker for monitoring/alerts)
    const overall = coreServicesHealthy && maintenanceWorkerActive;

    const integrationsHealthy =
      (!msGraphSSOConfigured || msGraphSSOConnected) &&
      (!intuneConfigured || intuneConnected) &&
      (!emailConfigured || emailConnected);

    this.logger.debug("System health check summary", {
      databaseConnected,
      redisConnected,
      environmentValid,
      migrationsApplied,
      pendingMigrationsCount,
      seedingInitialized,
      seedStatus,
      maintenanceWorkerActive,
      coreServicesHealthy,
      integrationsHealthy,
      overall,
    });

    return {
      database: {
        connected: databaseConnected,
        error: databaseError,
        message: databaseConnected ? "Connected" : "Disconnected",
        responseTimeMs: databaseResponseTime,
      },
      redis: {
        connected: redisConnected,
        error: redisError,
        message: redisConnected ? "Connected" : "Disconnected",
        responseTimeMs: redisResponseTime,
      },
      environment: {
        valid: environmentValid,
        missing: missingEnvVars,
      },
      migrations: {
        applied: migrationsApplied,
        pending: pendingMigrationsCount,
        error: migrationsError,
        message: migrationsApplied
          ? "All migrations applied"
          : `${pendingMigrationsCount} pending migrations`,
      },
      seeding: {
        initialized: seedingInitialized,
        organizationUnits: seedStatus.organizationUnits,
        locations: seedStatus.locations,
        vendors: seedStatus.vendors,
        featureFlags: seedStatus.featureFlags,
        services: seedStatus.services,
      },
      worker: {
        active: maintenanceWorkerActive,
        queue: QUEUE_NAMES.MAINTENANCE,
        error: workerError,
        message: maintenanceWorkerActive
          ? "Maintenance worker connected"
          : workerError
            ? `Worker check failed: ${workerError}`
            : "No active maintenance worker detected. Start with: npm run worker:start",
      },
      msGraphSSO: {
        configured: msGraphSSOConfigured,
        connected: msGraphSSOConnected,
        error: msGraphSSOError,
        message: !msGraphSSOConfigured
          ? (msGraphSSOError ?? "Not configured (optional)")
          : msGraphSSOConnected
            ? "Configured (no active connectivity probe available)"
            : msGraphSSOError
              ? `Connection failed: ${msGraphSSOError}`
              : "Configured, but the Graph connectivity check did not succeed",
        responseTimeMs: msGraphSSOResponseTime,
      },
      intune: {
        configured: intuneConfigured,
        connected: intuneConnected,
        error: intuneError,
        message: !intuneConfigured
          ? (intuneError ?? "Not configured (optional)")
          : intuneConnected
            ? "Connected"
            : intuneError
              ? `Connection failed: ${intuneError}`
              : "Configured, but the Intune connectivity check did not succeed",
        responseTimeMs: intuneResponseTime,
      },
      email: {
        configured: emailConfigured,
        connected: emailConnected,
        error: emailError,
        message: !emailConfigured
          ? (emailError ?? "Not configured (optional)")
          : emailConnected
            ? "Connected"
            : emailError
              ? `Connection failed: ${emailError}`
              : "Not connected",
        responseTimeMs: emailResponseTime,
      },
      buildInfo: this.getBuildInfo(),
      overall,
      coreServicesHealthy,
      integrationsHealthy,
    };
  }
}
