/**
 * Database Cleanup Handler
 *
 * Deletes old completed tasks in batches.
 * Designed for on-demand admin-triggered cleanup jobs.
 *
 * Also exports `batchDeleteOldTasks` for reuse by the scheduled
 * CLEANUP_OLD_TASKS handler to avoid duplicating the batch loop.
 */

import type { Job } from "bullmq";
import type { DatabaseCleanupJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { ILoggerService } from "@/core/services";

const SUPPORTED_CLEANUP_TABLES = ["tasks"] as const;
type SupportedCleanupTable = (typeof SUPPORTED_CLEANUP_TABLES)[number];

interface BatchDeleteProgressError extends Error {
  deletedCount: number;
  processedBatches: number;
}

function annotateBatchDeleteError(
  error: unknown,
  deletedCount: number,
  processedBatches: number,
): BatchDeleteProgressError {
  const baseError = error instanceof Error ? error : new Error(String(error));

  return Object.assign(baseError, {
    deletedCount,
    processedBatches,
  });
}

export function getBatchDeleteErrorContext(
  error: unknown,
): Partial<
  Pick<BatchDeleteProgressError, "deletedCount" | "processedBatches">
> {
  if (
    error instanceof Error &&
    "deletedCount" in error &&
    "processedBatches" in error
  ) {
    return {
      deletedCount: Number(error.deletedCount),
      processedBatches: Number(error.processedBatches),
    };
  }

  return {};
}

/**
 * Batch-delete old completed tasks, processing in fixed-size batches.
 * Shared by both DATABASE_CLEANUP and CLEANUP_OLD_TASKS handlers.
 */
export async function batchDeleteOldTasks(
  taskRepository: ITaskRepository,
  cutoffDate: Date,
  batchSize: number,
  logger: ILoggerService,
  job: Pick<Job, "id" | "updateProgress">,
): Promise<{ deletedCount: number; processedBatches: number }> {
  let deletedCount = 0;
  let processedBatches = 0;

  try {
    let batchDeleted: number;
    do {
      batchDeleted = await taskRepository.deleteOldCompleted(
        cutoffDate,
        batchSize,
      );
      deletedCount += batchDeleted;
      processedBatches++;

      if (batchDeleted > 0) {
        logger.debug("Cleanup batch processed", {
          jobId: job.id,
          batch: processedBatches,
          batchDeleted,
          totalDeleted: deletedCount,
        });
      }

      // Cap progress at 90% during deletion loop
      const progress = Math.min(10 + processedBatches * 10, 90);
      await job.updateProgress(progress);
    } while (batchDeleted === batchSize);
  } catch (error) {
    throw annotateBatchDeleteError(error, deletedCount, processedBatches);
  }

  return { deletedCount, processedBatches };
}

/**
 * Handles database cleanup by batch-deleting old completed tasks.
 * Currently only task cleanup is implemented.
 *
 * @param job - BullMQ job instance
 * @returns Cleanup statistics
 */
export async function handleDatabaseCleanup(
  job: Job<DatabaseCleanupJobData>,
): Promise<{ deletedCount: number; processedBatches: number }> {
  const { olderThanDays, tables } = job.data;
  const requestedTables = tables?.length ? tables : ["tasks"];

  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const taskRepository = container.get<ITaskRepository>(
    DI_TOKENS.ITaskRepository,
  );

  const unsupportedTables = requestedTables.filter(
    (table) =>
      !SUPPORTED_CLEANUP_TABLES.includes(table as SupportedCleanupTable),
  );
  if (unsupportedTables.length > 0) {
    throw new Error(
      `Unsupported database cleanup tables: ${unsupportedTables.join(", ")}. Supported: ${SUPPORTED_CLEANUP_TABLES.join(", ")}`,
    );
  }

  logger.info("Starting database cleanup", {
    jobId: job.id,
    olderThanDays,
    tables: requestedTables,
  });

  await job.updateProgress(10);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const result = await batchDeleteOldTasks(
      taskRepository,
      cutoffDate,
      500,
      logger,
      job,
    );

    await job.updateProgress(100);

    logger.info("Database cleanup completed", {
      jobId: job.id,
      deletedCount: result.deletedCount,
      processedBatches: result.processedBatches,
      cutoffDate: cutoffDate.toISOString(),
    });

    return result;
  } catch (error) {
    const batchDeleteContext = getBatchDeleteErrorContext(error);
    logger.error(
      "Database cleanup failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id, ...batchDeleteContext },
    );
    throw error;
  }
}
