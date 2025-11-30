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
import type { JobType } from "bullmq";

/**
 * Mock job queue service for testing.
 *
 * Stores jobs in memory instead of Redis.
 * Useful for unit tests that don't need actual queue processing.
 */
export class MockJobQueueService implements IJobQueueService {
  private jobs: Map<string, JobStatus> = new Map();
  private jobStates: Map<string, JobType> = new Map();
  private jobQueues: Map<string, string> = new Map();
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
    const state: JobType = options?.delay ? "delayed" : "wait";

    const job: JobStatus = {
      id: jobId,
      name: jobName,
      data,
      progress: 0,
      attemptsMade: 0,
      timestamp: Date.now(),
    };

    this.jobs.set(jobId, job);
    this.jobStates.set(jobId, state);
    this.jobQueues.set(jobId, _queueName);

    this.updateMetrics(_queueName, null, state);

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
    const prevState = this.jobStates.get(jobId) ?? null;
    this.jobs.delete(jobId);
    this.jobStates.delete(jobId);
    this.jobQueues.delete(jobId);

    this.updateMetrics(_queueName, prevState, null);
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

  async hasActiveWorkers(_queueName: string): Promise<boolean> {
    // Simulate at least one worker running in tests
    return true;
  }

  async findJob(
    queueName: string,
    jobName: string,
    states: JobType[],
    predicate?: (data: unknown) => boolean,
  ): Promise<{ id: string; state: string; data: unknown } | null> {
    const jobs = Array.from(this.jobs.entries());
    const match = jobs.find(([jobId, job]) => {
      const state = this.jobStates.get(jobId) ?? "wait";
      const stateMatches = states.length === 0 || states.includes(state);
      const queueMatches = this.jobQueues.get(jobId) === queueName;
      const predicateMatches = !predicate || predicate(job.data as unknown);

      return (
        queueMatches && job.name === jobName && stateMatches && predicateMatches
      );
    });

    if (!match) {
      return null;
    }

    const [jobId, job] = match;
    const state = this.jobStates.get(jobId) ?? "wait";

    return { id: jobId, state, data: job.data };
  }

  async close(): Promise<void> {
    this.jobs.clear();
    this.jobStates.clear();
    this.jobQueues.clear();
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
    if (!job) {
      return;
    }

    job.progress = 100;
    job.returnValue = result;
    job.finishedOn = Date.now();

    const queueName = this.jobQueues.get(jobId);
    const prevState = this.jobStates.get(jobId) ?? "wait";
    this.jobStates.set(jobId, "completed");

    if (queueName) {
      this.updateMetrics(queueName, prevState, "completed");
    }
  }

  /**
   * Simulates job failure
   */
  async failJob(jobId: string, reason: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    job.failedReason = reason;
    job.attemptsMade++;

    const queueName = this.jobQueues.get(jobId);
    const prevState = this.jobStates.get(jobId) ?? "wait";
    this.jobStates.set(jobId, "failed");

    if (queueName) {
      this.updateMetrics(queueName, prevState, "failed");
    }
  }

  /**
   * Clears all jobs (for test cleanup)
   */
  clear(): void {
    this.jobs.clear();
    this.jobStates.clear();
    this.jobQueues.clear();
    this.queueMetrics.clear();
    this.jobCounter = 0;
  }

  private updateMetrics(
    queueName: string,
    prevState: JobType | null,
    nextState: JobType | null,
  ): void {
    const metrics = this.getQueueMetricsSync(queueName);

    const adjust = (state: JobType | null, delta: number) => {
      if (!state) return;
      const key = this.stateToMetricKey(state);
      if (!key) return;
      metrics[key] = Math.max(0, metrics[key] + delta);
    };

    adjust(prevState, -1);
    adjust(nextState, 1);

    this.queueMetrics.set(queueName, metrics);
  }

  private stateToMetricKey(
    state: JobType,
  ): "waiting" | "active" | "completed" | "failed" | "delayed" | null {
    switch (state) {
      case "wait":
      case "waiting":
      case "waiting-children":
      case "paused":
        return "waiting";
      case "active":
        return "active";
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      case "delayed":
        return "delayed";
      default:
        return null;
    }
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
