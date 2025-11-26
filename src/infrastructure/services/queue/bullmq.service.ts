/**
 * BullMQ Job Queue Service Implementation
 *
 * Provides production-ready background job processing using BullMQ and Redis.
 * Supports multiple queues, job scheduling, retries, and monitoring.
 */

import { inject, injectable } from "inversify";
import type { QueueOptions, JobsOptions } from "bullmq";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { Redis } from "ioredis";
import { env } from "@/infrastructure/config/env";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type {
  IJobQueueService,
  JobOptions,
  JobStatus,
  RepeatableJobOptions,
} from "@/core/services/job-queue.service.interface";

/**
 * BullMQ implementation of job queue service.
 *
 * Features:
 * - Multiple named queues with independent configurations
 * - Automatic retries with exponential backoff
 * - Job priority and scheduling
 * - Cron-based recurring jobs
 * - Graceful shutdown handling
 * - Connection pooling and health checks
 *
 * Architecture:
 * - Singleton pattern for queue instances
 * - Shared Redis connection across queues
 * - Lazy queue initialization
 * - Proper resource cleanup on shutdown
 */
@injectable()
export class BullMQService implements IJobQueueService {
  private queues: Map<string, Queue> = new Map();
  private redisConnection: Redis | null = null;
  private readonly redisUrl: string;
  private isShuttingDown = false;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,
  ) {
    this.redisUrl = env.REDIS_URL;
    this.setupShutdownHandlers();
  }

  // ========================================
  // Connection & Initialization
  // ========================================

  /**
   * Gets or creates Redis connection.
   * Uses a shared connection for all queues.
   */
  private getRedisConnection(): Redis {
    if (!this.redisConnection) {
      try {
        const connection: Redis = new IORedis(this.redisUrl, {
          maxRetriesPerRequest: null, // Required for BullMQ
          enableReadyCheck: false,
          enableOfflineQueue: true,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        connection.on("error", (error) => {
          this.logger.error("[JobQueue] Redis connection error", error);
        });

        connection.on("connect", () => {
          this.logger.info("[JobQueue] Connected to Redis");
        });

        connection.on("ready", () => {
          this.logger.info("[JobQueue] Redis connection ready");
        });

        connection.on("close", () => {
          this.logger.warn("[JobQueue] Redis connection closed");
        });

        connection.on("reconnecting", () => {
          this.logger.info("[JobQueue] Reconnecting to Redis...");
        });

        this.redisConnection = connection;
      } catch (error) {
        this.logger.error(
          "[JobQueue] Failed to create Redis connection",
          error as Error,
        );
        throw error;
      }
    }

    return this.redisConnection;
  }

  /**
   * Gets or creates a queue instance.
   * Queues are created lazily on first access.
   */
  private getQueue(queueName: string): Queue {
    if (this.isShuttingDown) {
      throw new Error("Cannot get queue during shutdown");
    }

    let queue = this.queues.get(queueName);

    if (!queue) {
      try {
        const queueOptions: QueueOptions = {
          connection: this.getRedisConnection(),
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
            removeOnComplete: {
              count: 100, // Keep last 100 completed jobs
              age: 24 * 60 * 60, // Remove after 24 hours
            },
            removeOnFail: {
              count: 1000, // Keep last 1000 failed jobs for debugging
            },
          },
        };

        queue = new Queue(queueName, queueOptions);

        // Set up queue event listeners
        queue.on("error", (error) => {
          this.logger.error(`[JobQueue] Queue '${queueName}' error`, error);
        });

        this.queues.set(queueName, queue);
        this.logger.info(`[JobQueue] Queue '${queueName}' initialized`);
      } catch (error) {
        this.logger.error(
          `[JobQueue] Failed to create queue '${queueName}'`,
          error as Error,
        );
        throw error;
      }
    }

    return queue;
  }

  /**
   * Sets up graceful shutdown handlers.
   */
  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      if (!this.isShuttingDown) {
        this.logger.info("[JobQueue] Shutdown signal received");
        await this.close();
      }
    };

    // Only set up handlers in Node.js environment
    if (typeof process !== "undefined" && process.on) {
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    }
  }

  // ========================================
  // Job Management
  // ========================================

  async addJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string> {
    try {
      const queue = this.getQueue(queueName);

      const jobOptions: JobsOptions = {
        priority: options?.priority,
        delay: options?.delay,
        attempts: options?.attempts,
        backoff: options?.backoff,
        removeOnComplete:
          options?.removeOnComplete !== undefined
            ? typeof options.removeOnComplete === "boolean"
              ? options.removeOnComplete
              : { count: options.removeOnComplete }
            : undefined,
        removeOnFail:
          options?.removeOnFail !== undefined
            ? typeof options.removeOnFail === "boolean"
              ? options.removeOnFail
              : { count: options.removeOnFail }
            : undefined,
      };

      const job = await queue.add(jobName, data, jobOptions);

      this.logger.info(
        `[JobQueue] Job '${jobName}' added to queue '${queueName}'`,
        { jobId: job.id, priority: options?.priority },
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to add job '${jobName}' to queue '${queueName}'`,
        error as Error,
      );
      throw error;
    }
  }

  async scheduleJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    repeatOptions: RepeatableJobOptions,
  ): Promise<void> {
    try {
      const queue = this.getQueue(queueName);

      await queue.add(jobName, data, {
        repeat: {
          pattern: repeatOptions.pattern,
          tz: repeatOptions.tz,
          limit: repeatOptions.limit,
          endDate: repeatOptions.endDate,
        },
      });

      this.logger.info(
        `[JobQueue] Scheduled job '${jobName}' in queue '${queueName}'`,
        { pattern: repeatOptions.pattern, tz: repeatOptions.tz },
      );
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to schedule job '${jobName}' in queue '${queueName}'`,
        error as Error,
      );
      throw error;
    }
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (job) {
        await job.remove();
        this.logger.info(`[JobQueue] Job removed from queue '${queueName}'`, {
          jobId,
        });
      } else {
        this.logger.warn(`[JobQueue] Job not found in queue '${queueName}'`, {
          jobId,
        });
      }
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to remove job from queue '${queueName}'`,
        error as Error,
        { jobId },
      );
      throw error;
    }
  }

  async removeRepeatableJob(
    queueName: string,
    repeatJobKey: string,
  ): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const removed = await queue.removeRepeatableByKey(repeatJobKey);

      if (removed) {
        this.logger.info(
          `[JobQueue] Repeatable job removed from queue '${queueName}'`,
          { repeatJobKey },
        );
      } else {
        this.logger.warn(
          `[JobQueue] Repeatable job not found in queue '${queueName}'`,
          { repeatJobKey },
        );
      }
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to remove repeatable job from queue '${queueName}'`,
        error as Error,
        { repeatJobKey },
      );
      throw error;
    }
  }

  // ========================================
  // Job Status & Monitoring
  // ========================================

  async getJobStatus(
    queueName: string,
    jobId: string,
  ): Promise<JobStatus | null> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return null;
      }

      const _state = await job.getState();
      const progress = job.progress as number;

      return {
        id: job.id!,
        name: job.name,
        data: job.data,
        progress: typeof progress === "number" ? progress : 0,
        returnValue: job.returnvalue,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      };
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to get job status from queue '${queueName}'`,
        error as Error,
        { jobId },
      );
      throw error;
    }
  }

  async getQueueMetrics(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const queue = this.getQueue(queueName);
      const counts = await queue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
      );

      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      };
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to get queue metrics for '${queueName}'`,
        error as Error,
      );
      throw error;
    }
  }

  // ========================================
  // Queue Control
  // ========================================

  async pauseQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      this.logger.info(`[JobQueue] Queue '${queueName}' paused`);
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to pause queue '${queueName}'`,
        error as Error,
      );
      throw error;
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      this.logger.info(`[JobQueue] Queue '${queueName}' resumed`);
    } catch (error) {
      this.logger.error(
        `[JobQueue] Failed to resume queue '${queueName}'`,
        error as Error,
      );
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn("[JobQueue] Shutdown already in progress");
      return;
    }

    this.isShuttingDown = true;
    this.logger.info("[JobQueue] Starting graceful shutdown...");

    try {
      // Close all queue instances in parallel
      const closePromises: Promise<void>[] = [];

      for (const [name, queue] of this.queues.entries()) {
        closePromises.push(
          queue.close().then(() => {
            this.logger.info(`[JobQueue] Queue '${name}' closed`);
          }),
        );
      }

      await Promise.all(closePromises);

      // Close Redis connection
      if (this.redisConnection) {
        await this.redisConnection.quit();
        this.logger.info("[JobQueue] Redis connection closed");
      }

      this.queues.clear();
      this.redisConnection = null;

      this.logger.info("[JobQueue] Graceful shutdown complete");
    } catch (error) {
      this.logger.error("[JobQueue] Error during shutdown", error as Error);
      throw error;
    }
  }

  // ========================================
  // Health & Diagnostics
  // ========================================

  /**
   * Checks if the queue service is healthy.
   * Can be used for health checks and monitoring.
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (this.isShuttingDown) {
        return false;
      }

      const redis = this.getRedisConnection();
      await redis.ping();

      return true;
    } catch (error) {
      this.logger.error("[JobQueue] Health check failed", error as Error);
      return false;
    }
  }

  /**
   * Gets a list of all active queue names.
   */
  getActiveQueues(): string[] {
    return Array.from(this.queues.keys());
  }
}
