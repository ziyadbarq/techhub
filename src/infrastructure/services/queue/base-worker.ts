/**
 * Base Worker Class
 *
 * Provides a reusable foundation for creating BullMQ workers.
 * Handles connection management, error handling, and lifecycle events.
 */

import { Worker, type Job } from "bullmq";
import IORedis, { type Redis } from "ioredis";
import { env } from "@/infrastructure/config/env";
import { logger } from "@/lib/logger";
import type { JobHandler, JobHandlerRegistry, WorkerConfig } from "./types";

/**
 * Base worker class for processing background jobs.
 *
 * Features:
 * - Automatic job handler registration
 * - Error handling and logging
 * - Graceful shutdown
 * - Progress tracking support
 * - Connection pooling
 *
 * Usage:
 * ```typescript
 * const worker = new BaseWorker({
 *   queueName: 'email',
 *   concurrency: 5
 * });
 *
 * worker.registerHandler('send-welcome-email', async (job) => {
 *   // Process job
 * });
 *
 * await worker.start();
 * ```
 */
export class BaseWorker {
  private worker: Worker | null = null;
  private handlers: JobHandlerRegistry = new Map();
  private redisConnection: Redis | null = null;
  private readonly config: Required<
    Omit<WorkerConfig, "limiter" | "settings">
  > & {
    limiter?: WorkerConfig["limiter"];
    settings?: WorkerConfig["settings"];
  };
  private readonly redisUrl: string;
  private readonly log: ReturnType<typeof logger.scope>;

  constructor(config: WorkerConfig) {
    this.config = {
      queueName: config.queueName,
      concurrency: config.concurrency || 1,
      limiter: config.limiter,
      settings: config.settings,
    };
    this.redisUrl = env.REDIS_URL;
    this.log = logger.scope(`Worker:${config.queueName}`);
  }

  // ========================================
  // Handler Registration
  // ========================================

  /**
   * Registers a handler for a specific job type.
   *
   * @param jobName - Name of the job type
   * @param handler - Handler function to process the job
   */
  registerHandler<T = unknown, R = unknown>(
    jobName: string,
    handler: JobHandler<T, R>,
  ): void {
    this.handlers.set(jobName, handler as JobHandler<unknown, unknown>);
    this.log.info("registerHandler", `Registered handler for job: ${jobName}`);
  }

  /**
   * Registers multiple handlers at once.
   *
   * @param handlers - Map of job names to handler functions
   */
  registerHandlers(handlers: JobHandlerRegistry): void {
    handlers.forEach((handler, jobName) => {
      this.registerHandler(jobName, handler);
    });
  }

  // ========================================
  // Worker Lifecycle
  // ========================================

  /**
   * Starts the worker to begin processing jobs.
   */
  async start(): Promise<void> {
    if (this.worker) {
      this.log.warn("start", "Worker already started");
      return;
    }

    const connection = this.getRedisConnection();

    this.worker = new Worker(
      this.config.queueName,
      this.processJob.bind(this),
      {
        connection,
        concurrency: this.config.concurrency,
        limiter: this.config.limiter,
      },
    );

    this.setupEventHandlers();

    this.log.info(
      "start",
      `Worker started with concurrency: ${this.config.concurrency}`,
    );
  }

  /**
   * Stops the worker gracefully.
   * Waits for active jobs to complete before closing.
   */
  async stop(): Promise<void> {
    if (!this.worker) {
      return;
    }

    this.log.info("stop", "Stopping worker gracefully...");

    await this.worker.close();
    this.worker = null;

    if (this.redisConnection) {
      await this.redisConnection.quit();
      this.redisConnection = null;
    }

    this.log.info("stop", "Worker stopped");
  }

  // ========================================
  // Job Processing
  // ========================================

  /**
   * Main job processing function.
   * Routes jobs to their registered handlers.
   */
  private async processJob(job: Job): Promise<unknown> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      throw new Error(
        `No handler registered for job type: ${job.name} in queue: ${this.config.queueName}`,
      );
    }

    this.log.info("processJob", `Processing job '${job.name}'`, {
      jobId: job.id,
    });

    try {
      const result = await handler(job);
      this.log.info("processJob", `Job '${job.name}' completed successfully`, {
        jobId: job.id,
      });
      return result;
    } catch (error) {
      this.log.error("processJob", `Job '${job.name}' failed`, error, {
        jobId: job.id,
      });
      throw error; // Re-throw to trigger BullMQ retry mechanism
    }
  }

  // ========================================
  // Event Handlers
  // ========================================

  /**
   * Sets up event listeners for worker lifecycle events.
   */
  private setupEventHandlers(): void {
    if (!this.worker) {
      return;
    }

    this.worker.on("completed", (job: Job) => {
      this.log.info("onCompleted", `✓ Job completed: ${job.name}`, {
        jobId: job.id,
      });
    });

    this.worker.on("failed", (job: Job | undefined, error: Error) => {
      this.log.error("onFailed", `✗ Job failed: ${job?.name}`, error, {
        jobId: job?.id,
      });
    });

    this.worker.on("error", (error: Error) => {
      this.log.error("onError", "Worker error", error);
    });

    this.worker.on("stalled", (jobId: string) => {
      this.log.warn("onStalled", `Job stalled: ${jobId}`);
    });

    // Handle progress updates (if jobs report progress)
    this.worker.on("progress", (job: Job, progress: unknown) => {
      if (typeof progress === "number") {
        this.log.info(
          "onProgress",
          `Job progress: ${job.name} - ${progress}%`,
          { jobId: job.id },
        );
      }
    });
  }

  // ========================================
  // Connection Management
  // ========================================

  /**
   * Gets or creates Redis connection.
   */
  private getRedisConnection(): Redis {
    if (!this.redisConnection) {
      const connection: Redis = new IORedis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      connection.on("error", (error) => {
        this.log.error("getRedisConnection", "Redis connection error", error);
      });

      this.redisConnection = connection;
    }

    return this.redisConnection;
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Checks if worker is running.
   */
  isRunning(): boolean {
    return this.worker !== null;
  }

  /**
   * Gets the number of registered handlers.
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }
}
