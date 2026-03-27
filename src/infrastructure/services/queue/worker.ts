#!/usr/bin/env node
/**
 * Background Job Worker
 *
 * Standalone Node.js process for processing background jobs.
 * Starts workers for all configured queues and registers job handlers.
 *
 * Usage:
 * - Development: npm run worker:dev (loads .env.local via dotenv-cli)
 * - Production: npm run worker:start (loads .env.local via dotenv-cli)
 *
 * Note: Environment variables are loaded via dotenv-cli in package.json scripts
 */

import "reflect-metadata";
import { initContainer, getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { logger } from "@/lib/logger";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import { setupScheduledJobs } from "./scheduled-jobs";
import { BaseWorker } from "./base-worker";
import {
  QUEUE_NAMES,
  TASK_JOBS,
  MAINTENANCE_JOBS,
  RESERVATION_JOBS,
} from "@/core/domain/jobs/job-names";
import {
  handleTaskCompletedNotification,
  handleCleanupOldTasks,
  handleSendTaskReminder,
  handleWarrantyExpirationCheck,
  handleActivateReadyReservations,
  handleCompleteExpiredReservations,
  handleSendReservationReminders,
  handleUserSyncFromGraph,
  handleIntuneDeviceSync,
  handleOciResourceSync,
  handleDetectStaleCIs,
  handleDatabaseCleanup,
  handleDataExport,
  handleHealthCheck,
} from "./handlers";
import {
  handleDatabaseBackup,
  handleDatabaseRestore,
} from "./handlers/database-backup.handler";

/**
 * Worker instances
 */
const workers: BaseWorker[] = [];
const log = logger.scope("Worker");

/**
 * Initialize DI container
 */
async function initializeDependencies(): Promise<void> {
  log.info(
    "initializeDependencies",
    "Initializing dependency injection container...",
  );
  await initContainer();
  log.info("initializeDependencies", "Container initialized");

  // Load heavy modules needed by workers
  const { loadHeavyModule } = await import("@/di/container");

  // Load Intune module for device sync jobs
  await loadHeavyModule("intune");
  log.info("initializeDependencies", "Intune module loaded");

  // Load OCI Sync module for cloud resource sync jobs
  await loadHeavyModule("oci-sync");
  log.info("initializeDependencies", "OCI Sync module loaded");

  // Load other heavy modules as needed
  // await loadHeavyModule("service");
  // await loadHeavyModule("licenses");
}

/**
 * Create and configure task queue worker
 */
function createTaskWorker(): BaseWorker {
  const worker = new BaseWorker({
    queueName: QUEUE_NAMES.TASKS,
    concurrency: 5, // Process up to 5 jobs concurrently
    settings: {
      lockDuration: 30000, // 30 seconds
      stalledInterval: 5000, // Check for stalled jobs every 5 seconds
    },
  });

  // Register task job handlers
  worker.registerHandler(
    TASK_JOBS.TASK_COMPLETED_NOTIFICATION,
    handleTaskCompletedNotification,
  );
  worker.registerHandler(TASK_JOBS.CLEANUP_OLD_TASKS, handleCleanupOldTasks);
  worker.registerHandler(TASK_JOBS.TASK_REMINDER, handleSendTaskReminder);

  return worker;
}

/**
 * Create and configure email queue worker (example)
 */
function createEmailWorker(): BaseWorker {
  const worker = new BaseWorker({
    queueName: QUEUE_NAMES.EMAIL,
    concurrency: 10, // Email sending can be more concurrent
    settings: {
      lockDuration: 30000,
    },
  });

  /**
   * TODO: Register email job handlers
   *
   * Implementation steps:
   * 1. Create EMAIL_JOBS constant in @/core/domain/jobs/job-names
   * 2. Implement handlers in src/infrastructure/services/queue/handlers/
   *    - handleSendWelcomeEmail.handler.ts
   *    - handleSendTaskNotification.handler.ts
   * 3. Import handlers and register them here:
   *    worker.registerHandler(EMAIL_JOBS.SEND_WELCOME_EMAIL, handleSendWelcomeEmail);
   *    worker.registerHandler(EMAIL_JOBS.SEND_TASK_NOTIFICATION, handleSendTaskNotification);
   */

  return worker;
}

/**
 * Create and configure maintenance queue worker
 */
function createMaintenanceWorker(): BaseWorker {
  const worker = new BaseWorker({
    queueName: QUEUE_NAMES.MAINTENANCE,
    concurrency: 1, // Maintenance jobs run sequentially
    settings: {
      lockDuration: 60000, // 1 minute (longer for maintenance tasks)
    },
  });

  // Register warranty expiration check (runs daily at 9 AM)
  worker.registerHandler(
    MAINTENANCE_JOBS.WARRANTY_EXPIRATION_CHECK,
    handleWarrantyExpirationCheck,
  );

  // Register reservation background job handlers
  worker.registerHandler(
    RESERVATION_JOBS.ACTIVATE_READY,
    handleActivateReadyReservations,
  );
  worker.registerHandler(
    RESERVATION_JOBS.COMPLETE_EXPIRED,
    handleCompleteExpiredReservations,
  );
  worker.registerHandler(
    RESERVATION_JOBS.SEND_REMINDERS,
    handleSendReservationReminders,
  );

  // Register Microsoft Graph user sync handler
  worker.registerHandler(
    MAINTENANCE_JOBS.USER_SYNC_FROM_GRAPH,
    handleUserSyncFromGraph,
  );

  // Register Microsoft Intune device sync handler
  worker.registerHandler(
    MAINTENANCE_JOBS.INTUNE_DEVICE_SYNC,
    handleIntuneDeviceSync,
  );

  // Register OCI cloud resource sync handlers (tiered strategy)
  worker.registerHandler(
    MAINTENANCE_JOBS.OCI_CRITICAL_SYNC,
    handleOciResourceSync,
  );
  worker.registerHandler(
    MAINTENANCE_JOBS.OCI_RESOURCE_SYNC,
    handleOciResourceSync,
  );

  // Register stale CI detection handler
  worker.registerHandler(
    MAINTENANCE_JOBS.DETECT_STALE_CIS,
    handleDetectStaleCIs,
  );

  // Register database backup/restore handlers
  worker.registerHandler(
    MAINTENANCE_JOBS.DATABASE_BACKUP,
    handleDatabaseBackup,
  );
  worker.registerHandler(
    MAINTENANCE_JOBS.DATABASE_RESTORE,
    handleDatabaseRestore,
  );

  // Register database cleanup handler (old completed tasks)
  worker.registerHandler(
    MAINTENANCE_JOBS.DATABASE_CLEANUP,
    handleDatabaseCleanup,
  );

  // Register data export handler (CSV/JSON)
  worker.registerHandler(MAINTENANCE_JOBS.DATA_EXPORT, handleDataExport);

  // Register infrastructure health check handler
  worker.registerHandler(MAINTENANCE_JOBS.HEALTH_CHECK, handleHealthCheck);

  return worker;
}

/**
 * Start all workers
 */
async function startWorkers(): Promise<void> {
  log.info("startWorkers", "Starting workers...");

  // Create workers
  const taskWorker = createTaskWorker();
  const emailWorker = createEmailWorker();
  const maintenanceWorker = createMaintenanceWorker();

  workers.push(taskWorker, emailWorker, maintenanceWorker);

  // Start all workers
  await Promise.all(workers.map((worker) => worker.start()));

  log.info("startWorkers", `All workers started successfully`, {
    workerCount: workers.length,
  });
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  log.info("shutdown", `Received ${signal}, starting graceful shutdown...`);

  // Stop all workers
  await Promise.all(workers.map((worker) => worker.stop()));

  log.info("shutdown", "All workers stopped. Exiting.");
  process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    log.info("main", "Background Job Worker Starting");
    log.info("main", "=".repeat(50));

    // Initialize dependencies
    await initializeDependencies();

    // Start workers
    await startWorkers();

    // Setup scheduled (recurring) jobs
    const container = getContainer();
    const jobQueueService = container.get<IJobQueueService>(
      DI_TOKENS.IJobQueueService,
    );
    await setupScheduledJobs(jobQueueService);
    const isHealthy = await jobQueueService.isHealthy();
    const activeQueues = jobQueueService.getActiveQueues();
    log.info("main", "Scheduled jobs initialized", {
      queueServiceHealthy: isHealthy,
      activeQueues,
    });

    // Setup graceful shutdown
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Process-level error handlers - prevent silent crashes
    process.on("uncaughtException", (error: Error) => {
      log.error(
        "uncaughtException",
        "Fatal: Uncaught exception in worker process",
        error,
        {
          pid: process.pid,
          uptime: process.uptime(),
        },
      );
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason: unknown) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      log.error(
        "unhandledRejection",
        "Fatal: Unhandled promise rejection in worker process",
        error,
        {
          pid: process.pid,
          uptime: process.uptime(),
        },
      );
      shutdown("unhandledRejection");
    });

    log.info("main", "Ready to process jobs");
    log.info("main", "Press Ctrl+C to stop");
  } catch (error) {
    log.error("main", "Fatal error during startup", error);
    process.exit(1);
  }
}

// Start the worker
main();
