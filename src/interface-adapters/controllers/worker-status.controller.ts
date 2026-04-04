"use server";

/**
 * Worker Status Controller
 *
 * Server actions for monitoring background job queues and workers.
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import {
  QUEUE_NAMES,
  TASK_JOBS,
  MAINTENANCE_JOBS,
  RESERVATION_JOBS,
} from "@/core/domain/jobs/job-names";

// ========================================
// Types
// ========================================

export type QueueStatusDto = {
  name: string;
  metrics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  hasWorkers: boolean;
  isPaused: boolean;
};

export type ScheduledJobDto = {
  queueName: string;
  key: string;
  name: string;
  pattern: string | null;
  timezone: string | null;
  nextRun: number;
};

export type FailedJobDto = {
  queueName: string;
  id: string;
  name: string;
  failedReason?: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
};

export type WorkerDashboardDto = {
  healthy: boolean;
  queues: QueueStatusDto[];
  scheduledJobs: ScheduledJobDto[];
  recentFailedJobs: FailedJobDto[];
};

// ========================================
// Server Actions
// ========================================

export async function getWorkerDashboardAction(): Promise<
  ActionResponse<WorkerDashboardDto>
> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const container = getContainer();
    const jobQueue = container.get<IJobQueueService>(
      DI_TOKENS.IJobQueueService,
    );

    const queueNames = Object.values(QUEUE_NAMES);

    // Health check
    const healthy = await jobQueue.isHealthy();

    // Per-queue status
    const queues: QueueStatusDto[] = await Promise.all(
      queueNames.map(async (name) => {
        const [metrics, hasWorkers, isPaused] = await Promise.all([
          jobQueue.getQueueMetrics(name),
          jobQueue.hasActiveWorkers(name),
          jobQueue.isQueuePaused(name),
        ]);
        return { name, metrics, hasWorkers, isPaused };
      }),
    );

    // Scheduled jobs across all queues
    const scheduledJobArrays = await Promise.all(
      queueNames.map(async (name) => {
        const jobs = await jobQueue.getRepeatableJobs(name);
        return jobs.map((job) => ({
          queueName: name,
          key: job.key,
          name: job.name,
          pattern: job.pattern,
          timezone: job.tz,
          nextRun: job.next,
        }));
      }),
    );
    const scheduledJobs = scheduledJobArrays.flat();

    // Recent failures across all queues
    const failedJobArrays = await Promise.all(
      queueNames.map(async (name) => {
        const jobs = await jobQueue.getRecentFailedJobs(name, 10);
        return jobs.map((job) => ({
          queueName: name,
          id: job.id,
          name: job.name,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          finishedOn: job.finishedOn,
        }));
      }),
    );
    const recentFailedJobs = failedJobArrays
      .flat()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      success: true,
      data: { healthy, queues, scheduledJobs, recentFailedJobs },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "worker-status.getDashboard" },
      "Failed to fetch worker dashboard",
    );
  }
}

/**
 * Returns the default payload for a scheduled job, matching what
 * scheduled-jobs.ts registers. This ensures "Run Now" executes
 * the same work as the cron-triggered run.
 */
function getDefaultJobData(jobName: string): Record<string, unknown> {
  switch (jobName) {
    case TASK_JOBS.CLEANUP_OLD_TASKS:
      return { olderThanDays: 30, batchSize: 100 };
    case MAINTENANCE_JOBS.INTUNE_DEVICE_SYNC:
      return {
        autoLinkToAssets: true,
        autoLinkToPersons: true,
        trackComplianceHistory: true,
        deactivateMissing: true,
        dryRun: false,
      };
    case MAINTENANCE_JOBS.OCI_CRITICAL_SYNC:
      return {
        serviceKeys: ["compute", "lb", "nlb", "dbsystems"],
        dryRun: false,
      };
    case MAINTENANCE_JOBS.OCI_RESOURCE_SYNC:
      return { dryRun: false };
    case MAINTENANCE_JOBS.DETECT_STALE_CIS:
      return { thresholdDays: 90 };
    // Jobs that use empty/minimal payloads
    case RESERVATION_JOBS.ACTIVATE_READY:
    case RESERVATION_JOBS.COMPLETE_EXPIRED:
    case RESERVATION_JOBS.SEND_REMINDERS:
    default:
      return {};
  }
}

export async function triggerJobAction(
  queueName: string,
  jobName: string,
): Promise<ActionResponse<{ jobId: string }>> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const validQueues = Object.values(QUEUE_NAMES) as string[];
    if (!validQueues.includes(queueName)) {
      return { success: false, error: `Invalid queue name: ${queueName}` };
    }

    const container = getContainer();
    const jobQueue = container.get<IJobQueueService>(
      DI_TOKENS.IJobQueueService,
    );

    const jobData = {
      ...getDefaultJobData(jobName),
      triggeredManually: true,
      triggeredAt: new Date().toISOString(),
      createdAt: Date.now(),
    };

    const jobId = await jobQueue.addJob(queueName, jobName, jobData);

    return { success: true, data: { jobId } };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "worker-status.triggerJob" },
      "Failed to trigger job",
    );
  }
}

export async function toggleQueuePauseAction(
  queueName: string,
  pause: boolean,
): Promise<ActionResponse<{ paused: boolean }>> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const validQueues = Object.values(QUEUE_NAMES) as string[];
    if (!validQueues.includes(queueName)) {
      return { success: false, error: `Invalid queue name: ${queueName}` };
    }

    const container = getContainer();
    const jobQueue = container.get<IJobQueueService>(
      DI_TOKENS.IJobQueueService,
    );

    if (pause) {
      await jobQueue.pauseQueue(queueName);
    } else {
      await jobQueue.resumeQueue(queueName);
    }

    return { success: true, data: { paused: pause } };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "worker-status.toggleQueuePause" },
      "Failed to toggle queue pause",
    );
  }
}
