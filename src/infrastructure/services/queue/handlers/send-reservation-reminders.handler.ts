/**
 * Send Reservation Reminders Handler
 *
 * Processes job to send reminder notifications for upcoming reservations.
 * Notifies users about reservations starting soon or ending soon.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { SendReminderNotificationsUseCase } from "@/core/use-cases/reservations";
import type { ILoggerService } from "@/core/services";

/**
 * Job data type for send reservation reminders
 */
export interface SendReservationRemindersJobData {
  // No specific data needed - runs as a scheduled job
  triggeredAt?: string;
}

/**
 * Handles send reservation reminders job.
 *
 * Responsibilities:
 * - Find reservations starting within reminder threshold (e.g., 24 hours)
 * - Find reservations ending within reminder threshold
 * - Send notifications to reservation owners
 * - Log notification results
 *
 * @param job - BullMQ job instance
 */
export async function handleSendReservationReminders(
  job: Job<SendReservationRemindersJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const sendReminderNotificationsUseCase =
    container.get<SendReminderNotificationsUseCase>(
      DI_TOKENS.SendReminderNotificationsUseCase,
    );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting send reservation reminders job", {
    jobId: job.id,
    triggeredAt: job.data.triggeredAt,
  });

  await job.updateProgress(10);

  try {
    // Execute reminder sending (check for reservations starting in the next 1 day)
    const result = await sendReminderNotificationsUseCase.execute({
      daysBeforeStart: 1,
    });

    await job.updateProgress(70);

    // Log summary
    logger.info("Send reservation reminders completed", {
      jobId: job.id,
      notificationsSent: result.notificationsSent,
      reservationIds: result.reservationIds,
    });

    await job.updateProgress(100);

    logger.info("Send reservation reminders job completed successfully", {
      jobId: job.id,
    });
  } catch (error) {
    logger.error(
      "Send reservation reminders job failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
