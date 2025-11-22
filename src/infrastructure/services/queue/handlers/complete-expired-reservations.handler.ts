/**
 * Complete Expired Reservations Handler
 *
 * Processes job to complete reservations that have passed their end date.
 * Changes status from ACTIVE → COMPLETED when end date is passed.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CompleteExpiredReservationsUseCase } from "@/core/use-cases/reservations";
import type { ILoggerService } from "@/core/services";

/**
 * Job data type for complete expired reservations
 */
export interface CompleteExpiredReservationsJobData {
  // No specific data needed - runs as a scheduled job
  triggeredAt?: string;
}

/**
 * Handles complete expired reservations job.
 *
 * Responsibilities:
 * - Find all ACTIVE reservations where endDate < now
 * - Change status from ACTIVE → COMPLETED
 * - Log completion results
 *
 * @param job - BullMQ job instance
 */
export async function handleCompleteExpiredReservations(
  job: Job<CompleteExpiredReservationsJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const completeExpiredReservationsUseCase =
    container.get<CompleteExpiredReservationsUseCase>(
      DI_TOKENS.CompleteExpiredReservationsUseCase,
    );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting complete expired reservations job", {
    jobId: job.id,
    triggeredAt: job.data.triggeredAt,
  });

  await job.updateProgress(10);

  try {
    // Execute completion
    const result = await completeExpiredReservationsUseCase.execute();

    await job.updateProgress(70);

    // Log summary
    logger.info("Complete expired reservations completed", {
      jobId: job.id,
      completedCount: result.completedCount,
      completedIds: result.completedIds,
    });

    await job.updateProgress(100);

    logger.info("Complete expired reservations job completed successfully", {
      jobId: job.id,
    });
  } catch (error) {
    logger.error(
      "Complete expired reservations job failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
