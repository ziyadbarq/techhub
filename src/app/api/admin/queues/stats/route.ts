/**
 * Queue Statistics API
 *
 * Returns real-time statistics for all job queues.
 * Used by the Bull Board dashboard for live updates.
 */

import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import { env } from "@/infrastructure/config/env";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/core/domain/jobs/job-names";

// Lazy queue instances
let queues: Map<string, Queue> | null = null;

/**
 * Gets or creates queue instances
 */
function getQueues(): Map<string, Queue> {
  if (!queues) {
    const redisUrl = env.REDIS_URL;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require("ioredis");

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queues = new Map([
      [QUEUE_NAMES.TASKS, new Queue(QUEUE_NAMES.TASKS, { connection })],
      [QUEUE_NAMES.EMAIL, new Queue(QUEUE_NAMES.EMAIL, { connection })],
      [
        QUEUE_NAMES.MAINTENANCE,
        new Queue(QUEUE_NAMES.MAINTENANCE, { connection }),
      ],
    ]);
  }

  return queues;
}

/**
 * GET handler - Returns queue statistics
 */
export async function GET(): Promise<NextResponse> {
  // Security: Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    const queueMap = getQueues();
    const stats = await Promise.all(
      Array.from(queueMap.entries()).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts(
          "waiting",
          "active",
          "completed",
          "failed",
          "delayed",
        );

        return {
          name,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        };
      }),
    );

    return NextResponse.json({ queues: stats });
  } catch (error) {
    logger.scope("QueueStats").error("GET", "Error fetching stats", error);
    return NextResponse.json(
      { error: "Failed to fetch queue statistics" },
      { status: 500 },
    );
  }
}
