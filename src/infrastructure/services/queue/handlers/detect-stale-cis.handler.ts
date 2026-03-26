/**
 * Detect Stale CIs Handler
 *
 * Processes the daily stale CI detection job.
 * Resolves the use case from the DI container and logs results.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type { DetectStaleCIsUseCase } from "@/core/use-cases/cmdb/data-quality";
import type { DetectStaleCIsJobData } from "@/core/domain/jobs/job-data.types";

/**
 * Handles the stale CI detection job.
 *
 * @param job - BullMQ job instance
 */
export async function handleDetectStaleCIs(
  job: Job<DetectStaleCIsJobData>,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  const detectStaleCIsUseCase = container.get<DetectStaleCIsUseCase>(
    DI_TOKENS.DetectStaleCIsUseCase,
  );

  logger.info("Starting stale CI detection", {
    jobId: job.id,
    thresholdDays: job.data.thresholdDays,
  });

  await job.updateProgress(10);

  try {
    const result = await detectStaleCIsUseCase.execute({
      thresholdDays: job.data.thresholdDays,
    });

    await job.updateProgress(90);

    const summary = {
      totalStale: result.totalStale,
      totalCIs: result.totalCIs,
      stalePercentage: result.stalePercentage,
      byEnvironment: result.byEnvironment,
      byCriticality: result.byCriticality,
    };

    logger.info("Stale CI detection completed", {
      jobId: job.id,
      summary,
    });

    if (result.totalStale > 0) {
      logger.warn("Stale CIs detected requiring attention", {
        jobId: job.id,
        totalStale: result.totalStale,
        stalePercentage: result.stalePercentage,
        topStale: result.staleCIs.slice(0, 10).map((ci) => ({
          id: ci.id,
          name: ci.name,
          ciKey: ci.ciKey,
          daysSinceUpdate: ci.daysSinceUpdate,
          criticality: ci.criticality,
          environment: ci.environment,
          hasOwner: ci.hasOwner,
        })),
      });
    }

    await job.updateProgress(100);
  } catch (error) {
    logger.error(
      "Stale CI detection failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id },
    );
    throw error; // Let BullMQ handle retries
  }
}
