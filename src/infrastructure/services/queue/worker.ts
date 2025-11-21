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
import { initContainer } from "@/di/container";
import { logger } from "@/lib/logger";
import { BaseWorker } from "./base-worker";
import {
  QUEUE_NAMES,
  TASK_JOBS,
  MAINTENANCE_JOBS,
} from "@/core/domain/jobs/job-names";
import {
  handleTaskCompletedNotification,
  handleCleanupOldTasks,
  handleSendTaskReminder,
  handleWarrantyExpirationCheck,
} from "./handlers";

/**
 * Worker instances
 */
const workers: BaseWorker[] = [];
const log = logger.scope("Worker");

/**
 * Initialize DI container
 */
function initializeDependencies(): void {
  log.info(
    "initializeDependencies",
    "Initializing dependency injection container...",
  );
  initContainer();
  log.info("initializeDependencies", "Container initialized");
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

  /**
   * TODO: Register additional maintenance job handlers
   *
   * Implementation steps:
   * 1. Implement handlers in src/infrastructure/services/queue/handlers/
   *    - handleDatabaseCleanup.handler.ts - Clean up old records, optimize tables
   *    - handleDataExport.handler.ts - Export data for backups or reporting
   * 2. Import handlers and register them here:
   *    worker.registerHandler(MAINTENANCE_JOBS.DATABASE_CLEANUP, handleDatabaseCleanup);
   *    worker.registerHandler(MAINTENANCE_JOBS.DATA_EXPORT, handleDataExport);
   * 3. Schedule recurring jobs via BullMQ scheduleJob() for daily/weekly maintenance
   */

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
    initializeDependencies();

    // Start workers
    await startWorkers();

    // Setup graceful shutdown
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    log.info("main", "Ready to process jobs");
    log.info("main", "Press Ctrl+C to stop");
  } catch (error) {
    log.error("main", "Fatal error during startup", error);
    process.exit(1);
  }
}

// Start the worker
main();
