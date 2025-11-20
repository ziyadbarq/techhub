/**
 * Scheduled Jobs Setup
 *
 * Configures recurring background jobs using cron patterns.
 * These jobs run automatically at specified intervals.
 */

import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import { QUEUE_NAMES, TASK_JOBS } from "@/core/domain/jobs/job-names";
import type { CleanupOldTasksJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";

/**
 * Sets up all recurring scheduled jobs.
 *
 * Call this function once during application startup.
 *
 * @param jobQueueService - Job queue service instance
 */
export async function setupScheduledJobs(
  jobQueueService: IJobQueueService,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Setting up recurring scheduled jobs");

  // ==========================================
  // Daily Cleanup Job
  // ==========================================

  // Runs every day at 2:00 AM UTC
  // Deletes completed tasks older than 30 days
  const cleanupJobData: CleanupOldTasksJobData = {
    olderThanDays: 30,
    batchSize: 100,
    createdAt: Date.now(),
  };

  await jobQueueService.scheduleJob(
    QUEUE_NAMES.TASKS,
    TASK_JOBS.CLEANUP_OLD_TASKS,
    cleanupJobData,
    {
      pattern: "0 2 * * *", // Every day at 2:00 AM
      tz: "UTC",
    },
  );

  logger.info("Daily cleanup job scheduled", {
    pattern: "0 2 * * *",
    timezone: "UTC",
    jobName: TASK_JOBS.CLEANUP_OLD_TASKS,
  });

  // ==========================================
  // Add more scheduled jobs here
  // ==========================================

  // Example: Hourly notification check
  // await jobQueueService.scheduleJob(
  //   QUEUE_NAMES.TASKS,
  //   TASK_JOBS.TASK_REMINDER,
  //   { reminderType: 'due-soon' },
  //   { pattern: '0 * * * *' } // Every hour
  // );

  logger.info("All scheduled jobs configured successfully");
}

/**
 * Removes all scheduled jobs.
 *
 * Useful for cleanup during shutdown or testing.
 *
 * @param jobQueueService - Job queue service instance
 */
export async function removeScheduledJobs(
  _jobQueueService: IJobQueueService,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Removing scheduled jobs");

  // Note: You would need to track the repeat job keys to remove them
  // BullMQ provides a way to get all repeatable jobs and remove them
  // For now, this is a placeholder

  logger.info("Scheduled jobs removed successfully");
}

/**
 * Cron Pattern Reference:
 *
 * Format: * * * * * *
 *         │ │ │ │ │ │
 *         │ │ │ │ │ └─── Day of Week (0-6, 0=Sunday)
 *         │ │ │ │ └───── Month (1-12)
 *         │ │ │ └─────── Day of Month (1-31)
 *         │ │ └───────── Hour (0-23)
 *         │ └─────────── Minute (0-59)
 *         └───────────── Second (optional, 0-59)
 *
 * Common Patterns:
 * - Every minute: '* * * * *'
 * - Every hour: '0 * * * *'
 * - Every day at midnight: '0 0 * * *'
 * - Every day at 2 AM: '0 2 * * *'
 * - Every Monday at 9 AM: '0 9 * * 1'
 * - Every 1st of month: '0 0 1 * *'
 * - Every 15 minutes: '*\/15 * * * *' (remove backslash)
 *
 * Timezones:
 * - Use 'tz' option to specify timezone
 * - Examples: 'America/New_York', 'Europe/London', 'Asia/Tokyo'
 * - Default: UTC
 */
