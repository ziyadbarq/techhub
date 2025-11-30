import type { JobType } from "bullmq";

/**
 * Job Queue Service Interface
 *
 * Provides background job processing capabilities using BullMQ and Redis.
 * Supports job scheduling, retry mechanisms, and priority queuing.
 */

/**
 * Job options for configuring job behavior
 */
export interface JobOptions {
  /**
   * Job priority (1-10, higher = more important)
   * Default: 5
   */
  priority?: number;

  /**
   * Delay before job execution (in milliseconds)
   */
  delay?: number;

  /**
   * Number of retry attempts on failure
   * Default: 3
   */
  attempts?: number;

  /**
   * Backoff strategy for retries
   * - number: Fixed delay in ms
   * - object: Exponential or custom backoff
   */
  backoff?: number | { type: "exponential" | "fixed"; delay: number };

  /**
   * Remove job after completion
   * Default: true
   */
  removeOnComplete?: boolean | number;

  /**
   * Remove job after failure
   * Default: false
   */
  removeOnFail?: boolean | number;
}

/**
 * Repeatable job options for cron scheduling
 */
export interface RepeatableJobOptions {
  /**
   * Cron expression (e.g., "0 0 * * *" for daily at midnight)
   */
  pattern: string;

  /**
   * Timezone for cron execution
   * Default: UTC
   */
  tz?: string;

  /**
   * Maximum number of times to repeat
   */
  limit?: number;

  /**
   * End date for repeating job
   */
  endDate?: Date | string | number;
}

/**
 * Job status information
 */
export interface JobStatus {
  id: string;
  name: string;
  data: unknown;
  progress: number;
  returnValue?: unknown;
  failedReason?: string;
  stacktrace?: string[];
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
  processedOn?: number;
}

/**
 * Service interface for managing background job queues.
 *
 * This service is responsible for:
 * - Adding jobs to queues
 * - Scheduling recurring jobs with cron patterns
 * - Managing job lifecycle (pause, resume, remove)
 * - Retrieving job status and metrics
 *
 * **Features:**
 * - Priority queuing
 * - Automatic retries with backoff
 * - Job scheduling and cron support
 * - Progress tracking
 * - Job idempotency
 *
 * **Implementation:**
 * - Uses BullMQ for robust job processing
 * - Redis as the backing store
 * - Supports multiple named queues
 */
export interface IJobQueueService {
  // ========================================
  // Job Management
  // ========================================

  /**
   * Adds a job to a queue for processing.
   *
   * @param queueName - Name of the queue (e.g., 'email', 'notifications')
   * @param jobName - Name/type of the job (e.g., 'send-welcome-email')
   * @param data - Job payload data
   * @param options - Optional job configuration
   * @returns Promise resolving to the job ID
   *
   * @example
   * ```typescript
   * const jobId = await jobQueue.addJob(
   *   'email',
   *   'send-welcome-email',
   *   { userId: '123', email: 'user@example.com' },
   *   { priority: 8, attempts: 3 }
   * );
   * ```
   */
  addJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string>;

  /**
   * Schedules a recurring job using cron pattern.
   *
   * @param queueName - Name of the queue
   * @param jobName - Name/type of the job
   * @param data - Job payload data
   * @param repeatOptions - Cron configuration
   * @returns Promise that resolves when job is scheduled
   *
   * @example
   * ```typescript
   * // Daily cleanup at 2 AM
   * await jobQueue.scheduleJob(
   *   'maintenance',
   *   'cleanup-old-tasks',
   *   { daysOld: 30 },
   *   { pattern: '0 2 * * *', tz: 'America/New_York' }
   * );
   * ```
   */
  scheduleJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    repeatOptions: RepeatableJobOptions,
  ): Promise<void>;

  /**
   * Removes a job from the queue.
   *
   * @param queueName - Name of the queue
   * @param jobId - ID of the job to remove
   * @returns Promise that resolves when job is removed
   *
   * @example
   * ```typescript
   * await jobQueue.removeJob('email', 'job-123');
   * ```
   */
  removeJob(queueName: string, jobId: string): Promise<void>;

  /**
   * Removes a repeatable job by key.
   *
   * @param queueName - Name of the queue
   * @param repeatJobKey - Key of the repeatable job
   * @returns Promise that resolves when job is removed
   *
   * @example
   * ```typescript
   * await jobQueue.removeRepeatableJob('maintenance', 'cleanup-old-tasks:::0 2 * * *');
   * ```
   */
  removeRepeatableJob(queueName: string, repeatJobKey: string): Promise<void>;

  // ========================================
  // Job Status & Monitoring
  // ========================================

  /**
   * Gets the status of a specific job.
   *
   * @param queueName - Name of the queue
   * @param jobId - ID of the job
   * @returns Promise resolving to job status or null if not found
   *
   * @example
   * ```typescript
   * const status = await jobQueue.getJobStatus('email', 'job-123');
   * if (status && status.failedReason) {
   *   console.error('Job failed:', status.failedReason);
   * }
   * ```
   */
  getJobStatus(queueName: string, jobId: string): Promise<JobStatus | null>;

  /**
   * Gets metrics for a queue.
   *
   * @param queueName - Name of the queue
   * @returns Promise resolving to queue metrics
   *
   * @example
   * ```typescript
   * const metrics = await jobQueue.getQueueMetrics('email');
   * console.log(`Waiting: ${metrics.waiting}, Active: ${metrics.active}`);
   * ```
   */
  getQueueMetrics(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;

  /**
   * Checks if there is at least one active worker processing the queue.
   */
  hasActiveWorkers(queueName: string): Promise<boolean>;

  /**
   * Finds a job by name and optional predicate across queue states.
   */
  findJob(
    queueName: string,
    jobName: string,
    states: JobType[],
    predicate?: (data: unknown) => boolean,
  ): Promise<{ id: string; state: string; data: unknown } | null>;

  // ========================================
  // Queue Control
  // ========================================

  /**
   * Pauses a queue (stops processing new jobs).
   *
   * @param queueName - Name of the queue to pause
   * @returns Promise that resolves when queue is paused
   *
   * @example
   * ```typescript
   * await jobQueue.pauseQueue('email');
   * ```
   */
  pauseQueue(queueName: string): Promise<void>;

  /**
   * Resumes a paused queue.
   *
   * @param queueName - Name of the queue to resume
   * @returns Promise that resolves when queue is resumed
   *
   * @example
   * ```typescript
   * await jobQueue.resumeQueue('email');
   * ```
   */
  resumeQueue(queueName: string): Promise<void>;

  /**
   * Closes connection to Redis and cleans up resources.
   *
   * Should be called during application shutdown.
   *
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   await jobQueue.close();
   * });
   * ```
   */
  close(): Promise<void>;
}
