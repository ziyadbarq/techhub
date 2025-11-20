/**
 * Job Queue Type Definitions
 *
 * Defines job handler types and job registry patterns for type-safe job processing.
 */

import type { Job } from "bullmq";

/**
 * Generic job handler function type.
 * Handlers process jobs and can optionally return a result.
 *
 * @param job - BullMQ job instance with typed data
 * @returns Promise that resolves with optional result
 */
export type JobHandler<T = unknown, R = unknown> = (job: Job<T>) => Promise<R>;

/**
 * Job handler registry map.
 * Maps job names to their handler functions for a specific queue.
 */
export type JobHandlerRegistry = Map<string, JobHandler<unknown, unknown>>;

/**
 * Worker configuration options
 */
export interface WorkerConfig {
  /**
   * Queue name this worker processes
   */
  queueName: string;

  /**
   * Number of concurrent jobs to process
   * Default: 1
   */
  concurrency?: number;

  /**
   * Maximum number of jobs per second
   */
  limiter?: {
    max: number;
    duration: number;
  };

  /**
   * Worker settings
   */
  settings?: {
    /**
     * How long to wait for job completion before timing out (ms)
     */
    lockDuration?: number;

    /**
     * How often to renew lock on active job (ms)
     */
    lockRenewTime?: number;

    /**
     * How long to wait before retrying after a connection error (ms)
     */
    stalledInterval?: number;

    /**
     * Maximum number of jobs to fetch in one go
     */
    maxStalledCount?: number;
  };
}

/**
 * Re-export BaseJobData from domain layer.
 * This maintains backwards compatibility while respecting Clean Architecture.
 */
export type { BaseJobData } from "@/core/domain/jobs/job-data.types";
