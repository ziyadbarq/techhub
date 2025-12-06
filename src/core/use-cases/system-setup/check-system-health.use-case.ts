/**
 * Check System Health Use Case
 * Verifies that all system requirements are met
 */

import { injectable, inject, optional } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
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
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
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
      "AUTH_SECRET", // Changed from BETTER_AUTH_SECRET
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

    // Check RBAC data
    let rolesCount = 0;
    let permissionsCount = 0;
    try {
      const roles = await this.roleRepository.findAll();
      const permissions = await this.permissionRepository.findAll();
      rolesCount = roles.length;
      permissionsCount = permissions.length;
    } catch (_error) {
      // Ignore RBAC check errors - database may not be seeded yet
      rolesCount = 0;
      permissionsCount = 0;
    }

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

    this.logger.debug("System health check summary", {
      databaseConnected,
      redisConnected,
      environmentValid,
      migrationsApplied,
      pendingMigrationsCount,
      rolesCount,
      permissionsCount,
      maintenanceWorkerActive,
      coreServicesHealthy,
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
      rbac: {
        roles: rolesCount,
        permissions: permissionsCount,
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
              : "Not connected",
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
              : "Not connected",
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
      overall,
      coreServicesHealthy,
    };
  }
}
