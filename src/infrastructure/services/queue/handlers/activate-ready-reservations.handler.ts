/**
 * Activate Ready Reservations Handler
 *
 * Processes job to activate reservations that have reached their start date.
 * Changes status from CONFIRMED → ACTIVE when start date is reached.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActivateReadyReservationsUseCase } from "@/core/use-cases/reservations";
import type { ILoggerService } from "@/core/services";

/**
 * Job data type for activate ready reservations
 */
export interface ActivateReadyReservationsJobData {
  // No specific data needed - runs as a scheduled job
  triggeredAt?: string;
}

/**
 * Handles activate ready reservations job.
 *
 * Responsibilities:
 * - Find all CONFIRMED reservations where startDate <= now
 * - Change status from CONFIRMED → ACTIVE
 * - Log activation results
 *
 * @param job - BullMQ job instance
 */
export async function handleActivateReadyReservations(
  job: Job<ActivateReadyReservationsJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const activateReadyReservationsUseCase =
    container.get<ActivateReadyReservationsUseCase>(
      DI_TOKENS.ActivateReadyReservationsUseCase,
    );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting activate ready reservations job", {
    jobId: job.id,
    triggeredAt: job.data.triggeredAt,
  });

  await job.updateProgress(10);

  try {
    // Execute activation
    const result = await activateReadyReservationsUseCase.execute();

    await job.updateProgress(70);

    // Log summary
    logger.info("Activate ready reservations completed", {
      jobId: job.id,
      activatedCount: result.activatedCount,
      activatedIds: result.activatedIds,
    });

    await job.updateProgress(100);

    logger.info("Activate ready reservations job completed successfully", {
      jobId: job.id,
    });
  } catch (error) {
    logger.error(
      "Activate ready reservations job failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
