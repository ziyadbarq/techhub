#!/usr/bin/env tsx
/**
 * Worker & Queue Health Check Script
 *
 * Provides a CLI for inspecting background worker and queue status.
 *
 * Usage:
 *   npm run worker:health
 *
 * Output:
 *   - Overall queue service health
 *   - Active queues in this process
 *   - Per-queue job counts and worker presence
 */

import "reflect-metadata";
import {
  initContainer,
  getContainer,
  resetContainer,
} from "../src/di/container";
import { DI_TOKENS } from "../src/di/types";
import type { IJobQueueService } from "../src/core/services/job-queue.service.interface";
import { QUEUE_NAMES } from "../src/core/domain/jobs/job-names";
import { logger } from "../src/lib/logger";

async function main(): Promise<void> {
  const log = logger.scope("WorkerHealth");

  // Console output for better UX
  console.log("🔍 Worker & Queue Health Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  log.info("main", "Initializing DI container for health check...");
  await initContainer();

  const container = getContainer();
  const jobQueueService = container.get<IJobQueueService>(
    DI_TOKENS.IJobQueueService,
  );

  log.info("main", "Checking job queue service health...");
  const healthy = await jobQueueService.isHealthy();
  const activeQueues = jobQueueService.getActiveQueues();

  // Console output
  console.log("📊 Queue Service Health");
  console.log(`   Status: ${healthy ? "✅ Healthy" : "❌ Unhealthy"}`);
  console.log(
    `   Active Queues: ${activeQueues.length > 0 ? activeQueues.join(", ") : "None"}`,
  );
  console.log("");

  log.info("main", "Job queue service status", {
    healthy,
    activeQueues,
  });

  const queuesToCheck = [
    QUEUE_NAMES.TASKS,
    QUEUE_NAMES.EMAIL,
    QUEUE_NAMES.MAINTENANCE,
  ];

  console.log("🔧 Queue Metrics & Worker Status");
  console.log("");

  try {
    for (const queueName of queuesToCheck) {
      try {
        const metrics = await jobQueueService.getQueueMetrics(queueName);
        const hasWorkers = await jobQueueService.hasActiveWorkers(queueName);

        // Console output
        console.log(`   ${queueName}:`);
        console.log(
          `      Workers: ${hasWorkers ? "✅ Active" : "❌ No workers connected"}`,
        );
        console.log(
          `      Jobs: ${metrics.waiting} waiting, ${metrics.active} active, ${metrics.delayed} delayed`,
        );
        console.log(
          `      Completed: ${metrics.completed}, Failed: ${metrics.failed}`,
        );
        console.log("");

        log.info("queueStatus", `Queue '${queueName}'`, {
          hasWorkers,
          metrics,
        });
      } catch (error) {
        console.log(`   ${queueName}: ❌ Failed to fetch status`);
        console.log("");

        log.warn(
          "queueStatus",
          `Failed to fetch status for queue '${queueName}'`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    if (!healthy) {
      console.log("⚠️  Queue service is UNHEALTHY");
      console.log("   Check Redis connection and worker processes");
      console.log("");

      log.warn(
        "main",
        "Job queue service reported as UNHEALTHY - check Redis and worker processes",
      );
      process.exitCode = 1;
    } else {
      console.log("✅ Health check completed successfully");
      console.log("");

      log.info("main", "Worker and queues health check completed");
    }
  } finally {
    log.info("main", "Closing connections...");
    await jobQueueService.close();
    resetContainer();

    // Small delay to ensure cleanup logs finish before printing the note
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Print helpful note about cleanup logs
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "ℹ️  Note: Any 'Redis connection closed' messages above are expected.",
    );
    console.log("   They indicate normal cleanup after the health check.");
    console.log("");
  }
}

main().catch((error) => {
  const log = logger.scope("WorkerHealth");
  log.error(
    "main",
    "Worker health check failed with unexpected error",
    error instanceof Error ? error : new Error(String(error)),
  );
  process.exit(1);
});
