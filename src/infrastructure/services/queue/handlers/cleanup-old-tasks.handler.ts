/**
 * Cleanup Old Tasks Handler
 *
 * Processes cleanup jobs that remove old completed tasks from the database.
 * Designed to run as a scheduled job (e.g., daily at 2 AM).
 *
 * Delegates to batchDeleteOldTasks to share logic with DATABASE_CLEANUP handler.
 */

import type { Job } from "bullmq";
import type { CleanupOldTasksJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { ILoggerService } from "@/core/services";
import {
  batchDeleteOldTasks,
  getBatchDeleteErrorContext,
} from "./database-cleanup.handler";

/**
 * Handles cleanup of old tasks job.
 *
 * Deletes completed tasks older than the configured retention period in batches.
 *
 * @param job - BullMQ job instance
 * @returns Cleanup statistics
 */
export async function handleCleanupOldTasks(
  job: Job<CleanupOldTasksJobData>,
): Promise<{ deletedCount: number; processedBatches: number }> {
  const { olderThanDays, batchSize = 100 } = job.data;

  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const taskRepository = container.get<ITaskRepository>(
    DI_TOKENS.ITaskRepository,
  );

  logger.info("Starting cleanup of old tasks", {
    jobId: job.id,
    olderThanDays,
    batchSize,
  });

  await job.updateProgress(10);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const result = await batchDeleteOldTasks(
      taskRepository,
      cutoffDate,
      batchSize,
      logger,
      job,
    );

    await job.updateProgress(100);

    logger.info("Cleanup job completed successfully", {
      jobId: job.id,
      deletedCount: result.deletedCount,
      processedBatches: result.processedBatches,
      cutoffDate: cutoffDate.toISOString(),
    });

    return result;
  } catch (error) {
    const batchDeleteContext = getBatchDeleteErrorContext(error);
    logger.error(
      "Error during cleanup job",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id, ...batchDeleteContext },
    );
    throw error;
  }
}
