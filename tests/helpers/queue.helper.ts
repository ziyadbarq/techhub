/**
 * Job Queue Test Helpers
 *
 * Provides mock implementations and utilities for testing job queue functionality.
 */

import type {
  IJobQueueService,
  JobOptions,
  JobStatus,
  RepeatableJobOptions,
} from "@/core/services/job-queue.service.interface";

/**
 * Mock job queue service for testing.
 *
 * Stores jobs in memory instead of Redis.
 * Useful for unit tests that don't need actual queue processing.
 */
export class MockJobQueueService implements IJobQueueService {
  private jobs: Map<string, JobStatus> = new Map();
  private jobCounter = 0;
  private queueMetrics: Map<
    string,
    {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }
  > = new Map();

  async addJob<T = unknown>(
    _queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string> {
    const jobId = `mock-job-${++this.jobCounter}`;

    const job: JobStatus = {
      id: jobId,
      name: jobName,
      data,
      progress: 0,
      attemptsMade: 0,
      timestamp: Date.now(),
    };

    this.jobs.set(jobId, job);

    // Update queue metrics
    const metrics = this.getQueueMetricsSync(_queueName);
    if (options?.delay) {
      metrics.delayed++;
    } else {
      metrics.waiting++;
    }
    this.queueMetrics.set(_queueName, metrics);

    return jobId;
  }

  async scheduleJob<T = unknown>(
    _queueName: string,
    jobName: string,
    data: T,
    _repeatOptions: RepeatableJobOptions,
  ): Promise<void> {
    // For testing, just add a single job
    await this.addJob(_queueName, jobName, data);
  }

  async removeJob(_queueName: string, jobId: string): Promise<void> {
    this.jobs.delete(jobId);

    const metrics = this.getQueueMetricsSync(_queueName);
    metrics.waiting = Math.max(0, metrics.waiting - 1);
    this.queueMetrics.set(_queueName, metrics);
  }

  async removeRepeatableJob(
    _queueName: string,
    _repeatJobKey: string,
  ): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async getJobStatus(
    _queueName: string,
    jobId: string,
  ): Promise<JobStatus | null> {
    return this.jobs.get(jobId) || null;
  }

  async getQueueMetrics(_queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return this.getQueueMetricsSync(_queueName);
  }

  private getQueueMetricsSync(queueName: string): {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } {
    if (!this.queueMetrics.has(queueName)) {
      this.queueMetrics.set(queueName, {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
    }
    return this.queueMetrics.get(queueName)!;
  }

  async pauseQueue(_queueName: string): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async resumeQueue(_queueName: string): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async close(): Promise<void> {
    this.jobs.clear();
    this.queueMetrics.clear();
  }

  // ========================================
  // Test Helpers
  // ========================================

  /**
   * Gets all jobs for testing assertions
   */
  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Gets jobs by name for testing
   */
  getJobsByName(jobName: string): JobStatus[] {
    return this.getAllJobs().filter((job) => job.name === jobName);
  }

  /**
   * Simulates job completion
   */
  async completeJob(jobId: string, result?: unknown): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = 100;
      job.returnValue = result;
      job.finishedOn = Date.now();
    }
  }

  /**
   * Simulates job failure
   */
  async failJob(jobId: string, reason: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.failedReason = reason;
      job.attemptsMade++;
    }
  }

  /**
   * Clears all jobs (for test cleanup)
   */
  clear(): void {
    this.jobs.clear();
    this.queueMetrics.clear();
    this.jobCounter = 0;
  }
}

/**
 * Creates a mock job queue service for testing
 */
export function createMockJobQueue(): MockJobQueueService {
  return new MockJobQueueService();
}

/**
 * Waits for a job to be added to the queue
 */
export async function waitForJob(
  mockQueue: MockJobQueueService,
  jobName: string,
  timeout = 1000,
): Promise<JobStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const jobs = mockQueue.getJobsByName(jobName);
    if (jobs.length > 0) {
      return jobs[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(`Job '${jobName}' not found within ${timeout}ms`);
}
