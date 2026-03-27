/**
 * Check System Health Use Case
 * Verifies that all system requirements are met
 */

import { injectable, inject, optional } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services";
import type { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { SystemHealthCheckDto } from "@/core/dtos/system-setup.dto";
import { QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import { LogExecution } from "@/lib/decorators";

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
  ) {}

  private getBuildInfo() {
    const projectUrl = process.env.PROJECT_URL || undefined;
    const gitCommitFull = process.env.GIT_COMMIT_FULL ?? process.env.GIT_COMMIT;

    return {
      version: process.env.APP_VERSION ?? "dev",
      gitCommit: process.env.GIT_COMMIT ?? "local",
      gitCommitFull: gitCommitFull ?? "local",
      gitRef: process.env.GIT_REF ?? "local",
      buildDate: process.env.BUILD_DATE ?? "unknown",
      imageTag: process.env.IMAGE_TAG ?? "local",
      pipelineId: process.env.PIPELINE_ID ?? "local",
      pipelineUrl: process.env.PIPELINE_URL || undefined,
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

    // Check MS Graph SSO connection
    let msGraphSSOConfigured = false;
    let msGraphSSOConnected = false;
    let msGraphSSOError: string | undefined;
    let msGraphSSOResponseTime: number | undefined;
    try {
      // Check if credentials are configured
      const hasCredentials = !!(
        process.env.AZURE_TENANT_ID &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET
      );
      msGraphSSOConfigured = hasCredentials;

      if (hasCredentials && this.graphService) {
        const msGraphStart = performance.now();
        msGraphSSOConnected = await this.graphService.testConnection();
        msGraphSSOResponseTime = Math.round(performance.now() - msGraphStart);
      }
    } catch (error) {
      msGraphSSOError =
        error instanceof Error ? error.message : "Unknown MS Graph error";
    }

    // Check Intune connection
    let intuneConfigured = false;
    let intuneConnected = false;
    let intuneError: string | undefined;
    let intuneResponseTime: number | undefined;
    try {
      // Intune uses same Graph credentials
      const hasCredentials = !!(
        process.env.AZURE_TENANT_ID &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET
      );
      intuneConfigured = hasCredentials;

      if (hasCredentials && this.graphService) {
        const intuneStart = performance.now();
        intuneConnected = await this.graphService.testIntuneConnection();
        intuneResponseTime = Math.round(performance.now() - intuneStart);
      }
    } catch (error) {
      intuneError =
        error instanceof Error ? error.message : "Unknown Intune error";
    }

    // Check Email service connection
    let emailConfigured = false;
    let emailConnected = false;
    let emailError: string | undefined;
    let emailResponseTime: number | undefined;
    try {
      // Check if email credentials are configured
      const hasCredentials = !!(
        process.env.AZURE_EMAIL_TENANT_ID &&
        process.env.AZURE_EMAIL_CLIENT_ID &&
        process.env.AZURE_EMAIL_CLIENT_SECRET &&
        process.env.AZURE_EMAIL_FROM
      );
      emailConfigured = hasCredentials;

      if (hasCredentials && this.emailService) {
        const emailStart = performance.now();
        emailConnected = await this.emailService.testConnection();
        emailResponseTime = Math.round(performance.now() - emailStart);
      }
    } catch (error) {
      emailError =
        error instanceof Error ? error.message : "Unknown email error";
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
          ? "Not configured (optional)"
          : msGraphSSOConnected
            ? "Connected"
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
          ? "Not configured (optional)"
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
          ? "Not configured (optional)"
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
