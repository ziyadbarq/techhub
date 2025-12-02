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

  log.info("main", "Initializing DI container for health check...");
  await initContainer();

  const container = getContainer();
  const jobQueueService = container.get<IJobQueueService>(
    DI_TOKENS.IJobQueueService,
  );

  log.info("main", "Checking job queue service health...");
  const healthy = await jobQueueService.isHealthy();
  const activeQueues = jobQueueService.getActiveQueues();

  log.info("main", "Job queue service status", {
    healthy,
    activeQueues,
  });

  const queuesToCheck = [
    QUEUE_NAMES.TASKS,
    QUEUE_NAMES.EMAIL,
    QUEUE_NAMES.MAINTENANCE,
  ];

  try {
    for (const queueName of queuesToCheck) {
      try {
        const metrics = await jobQueueService.getQueueMetrics(queueName);
        const hasWorkers = await jobQueueService.hasActiveWorkers(queueName);

        log.info("queueStatus", `Queue '${queueName}'`, {
          hasWorkers,
          metrics,
        });
      } catch (error) {
        log.warn(
          "queueStatus",
          `Failed to fetch status for queue '${queueName}'`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    if (!healthy) {
      log.warn(
        "main",
        "Job queue service reported as UNHEALTHY - check Redis and worker processes",
      );
      process.exitCode = 1;
    } else {
      log.info("main", "Worker and queues health check completed");
    }
  } finally {
    await jobQueueService.close();
    resetContainer();
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
