/**
 * Health Check Handler
 *
 * Verifies connectivity to critical infrastructure: database and Redis.
 * Designed to run as a periodic scheduled job for proactive monitoring.
 */

import type { Job } from "bullmq";
import type { HealthCheckJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services";

interface HealthCheckResult {
  database?: boolean;
  redis?: boolean;
  allHealthy: boolean;
  checkedAt: string;
}

const SUPPORTED_CHECKS = ["database", "redis"] as const;
type SupportedCheck = (typeof SUPPORTED_CHECKS)[number];

/**
 * Handles infrastructure health check job.
 *
 * Only checks the services explicitly listed in job.checks.
 * Unsupported check types (e.g. "api") cause the job to fail
 * so callers don't get a false-positive "all healthy".
 *
 * @param job - BullMQ job instance
 * @returns Health check results
 */
export async function handleHealthCheck(
  job: Job<HealthCheckJobData>,
): Promise<HealthCheckResult> {
  const { checks, notifyOnFailure } = job.data;

  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  // Reject unsupported check types early
  const unsupported = checks.filter(
    (c) => !SUPPORTED_CHECKS.includes(c as SupportedCheck),
  );
  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported health check types: ${unsupported.join(", ")}. Supported: ${SUPPORTED_CHECKS.join(", ")}`,
    );
  }

  logger.info("Starting infrastructure health check", {
    jobId: job.id,
    checks,
  });

  await job.updateProgress(10);

  const result: HealthCheckResult = {
    allHealthy: true,
    checkedAt: new Date().toISOString(),
  };

  try {
    // Database check
    if (checks.includes("database")) {
      try {
        const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);
        await prisma.$queryRaw`SELECT 1`;
        result.database = true;
        logger.debug("Database health check passed", { jobId: job.id });
      } catch (error) {
        result.database = false;
        result.allHealthy = false;
        logger.error(
          "Database health check failed",
          error instanceof Error ? error : new Error(String(error)),
          { jobId: job.id },
        );
      }
    }

    await job.updateProgress(50);

    // Redis check (via job queue service)
    if (checks.includes("redis")) {
      try {
        const jobQueueService = container.get<IJobQueueService>(
          DI_TOKENS.IJobQueueService,
        );
        const healthy = await jobQueueService.isHealthy();
        if (!healthy) {
          result.redis = false;
          result.allHealthy = false;
          logger.error(
            "Redis health check failed",
            new Error("Redis unhealthy"),
            {
              jobId: job.id,
            },
          );
        } else {
          result.redis = true;
          logger.debug("Redis health check passed", { jobId: job.id });
        }
      } catch (error) {
        result.redis = false;
        result.allHealthy = false;
        logger.error(
          "Redis health check failed",
          error instanceof Error ? error : new Error(String(error)),
          { jobId: job.id },
        );
      }
    }

    await job.updateProgress(90);

    // Log final result
    if (result.allHealthy) {
      logger.info("All health checks passed", {
        jobId: job.id,
        result,
      });
    } else {
      logger.warn("Health check detected failures", {
        jobId: job.id,
        result,
        notifyOnFailure,
      });
    }

    await job.updateProgress(100);

    return result;
  } catch (error) {
    logger.error(
      "Health check handler failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id },
    );
    throw error;
  }
}
