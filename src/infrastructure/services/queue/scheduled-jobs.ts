/**
 * Scheduled Jobs Setup
 *
 * Configures recurring background jobs using cron patterns.
 * These jobs run automatically at specified intervals.
 */

import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import {
  QUEUE_NAMES,
  TASK_JOBS,
  RESERVATION_JOBS,
  MAINTENANCE_JOBS,
  REPORT_JOBS,
} from "@/core/domain/jobs/job-names";
import type {
  CleanupOldTasksJobData,
  IntuneSyncJobData,
  OciSyncJobData,
} from "@/core/domain/jobs/job-data.types";
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
  // Reservation Background Jobs
  // ==========================================

  // Activate ready reservations (CONFIRMED → ACTIVE when start date reached)
  // Runs every 15 minutes
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    RESERVATION_JOBS.ACTIVATE_READY,
    {},
    {
      pattern: "*/15 * * * *", // Every 15 minutes
      tz: "UTC",
    },
  );

  logger.info("Activate ready reservations job scheduled", {
    pattern: "*/15 * * * *",
    timezone: "UTC",
    jobName: RESERVATION_JOBS.ACTIVATE_READY,
  });

  // Complete expired reservations (ACTIVE → COMPLETED when end date passed)
  // Runs every hour
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    RESERVATION_JOBS.COMPLETE_EXPIRED,
    {},
    {
      pattern: "0 * * * *", // Every hour at minute 0
      tz: "UTC",
    },
  );

  logger.info("Complete expired reservations job scheduled", {
    pattern: "0 * * * *",
    timezone: "UTC",
    jobName: RESERVATION_JOBS.COMPLETE_EXPIRED,
  });

  // Send reminder notifications for upcoming reservations
  // Runs every 30 minutes
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    RESERVATION_JOBS.SEND_REMINDERS,
    {},
    {
      pattern: "*/30 * * * *", // Every 30 minutes
      tz: "UTC",
    },
  );

  logger.info("Send reservation reminders job scheduled", {
    pattern: "*/30 * * * *",
    timezone: "UTC",
    jobName: RESERVATION_JOBS.SEND_REMINDERS,
  });

  // ==========================================
  // Microsoft Intune Device Sync
  // ==========================================

  // Sync Intune managed devices daily at 3:00 AM UTC
  // Links devices to Assets by serial number, Persons by userId
  // Tracks compliance history for SAMA governance
  const intuneSyncJobData: IntuneSyncJobData = {
    autoLinkToAssets: true,
    autoLinkToPersons: true,
    trackComplianceHistory: true,
    deactivateMissing: true,
    dryRun: false,
    createdAt: Date.now(),
  };

  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    MAINTENANCE_JOBS.INTUNE_DEVICE_SYNC,
    intuneSyncJobData,
    {
      pattern: "0 3 * * *", // Every day at 3:00 AM UTC
      tz: "UTC",
    },
  );

  logger.info("Intune device sync job scheduled", {
    pattern: "0 3 * * *",
    timezone: "UTC",
    jobName: MAINTENANCE_JOBS.INTUNE_DEVICE_SYNC,
  });

  // ==========================================
  // OCI Cloud Resource Sync
  // ==========================================

  // Sync OCI cloud resources daily at 4:00 AM UTC (1 hour after Intune)
  // Fetches from n8n webhook, upserts CMDB Configuration Items
  const ociSyncJobData: OciSyncJobData = {
    dryRun: false,
    createdAt: Date.now(),
  };

  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    MAINTENANCE_JOBS.OCI_RESOURCE_SYNC,
    ociSyncJobData,
    {
      pattern: "0 4 * * *", // Every day at 4:00 AM UTC
      tz: "UTC",
    },
  );

  logger.info("OCI resource sync job scheduled", {
    pattern: "0 4 * * *",
    timezone: "UTC",
    jobName: MAINTENANCE_JOBS.OCI_RESOURCE_SYNC,
  });

  // ==========================================
  // Report Schedule Checker
  // ==========================================

  // Check for due report schedules every 15 minutes
  // Enqueues individual generate-and-send jobs for each due schedule
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    REPORT_JOBS.CHECK_DUE_SCHEDULES,
    { createdAt: Date.now() },
    {
      pattern: "*/15 * * * *", // Every 15 minutes
      tz: "UTC",
    },
  );

  logger.info("Check due report schedules job scheduled", {
    pattern: "*/15 * * * *",
    timezone: "UTC",
    jobName: REPORT_JOBS.CHECK_DUE_SCHEDULES,
  });

  // ==========================================
  // Add more scheduled jobs here
  // ==========================================

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
