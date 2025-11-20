/**
 * Complete Task Use Case
 *
 * Business logic for marking a task as completed.
 * Demonstrates business rules enforcement in use cases.
 * Also triggers background job for completion notification.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { ValidationError } from "@/core/domain/errors/validation.error";
import type { Task } from "@/core/domain/entities/task.entity";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import { QUEUE_NAMES, TASK_JOBS } from "@/core/domain/jobs/job-names";
import type { TaskCompletedNotificationJobData } from "@/core/domain/jobs/job-data.types";

@injectable()
export class CompleteTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueueService: IJobQueueService,
  ) {}

  /**
   * Execute complete task use case
   *
   * @param id - Task ID to complete
   * @returns Completed task
   * @throws ValidationError if task not found or already completed
   */
  async execute(id: string): Promise<Task> {
    // Fetch existing task
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new ValidationError("Task not found");
    }

    // Use domain method (enforces business rules)
    task.complete();

    // Persist changes
    const completedTask = await this.taskRepository.update(task);

    // Queue background job for completion notification
    // This runs asynchronously without blocking the response
    const jobData: TaskCompletedNotificationJobData = {
      taskId: completedTask.id,
      taskTitle: completedTask.title,
      completedAt: new Date(), // Task completed timestamp
      userId: "user-123", // TODO: Get from user repository
      entityId: completedTask.id,
      createdAt: Date.now(),
    };

    await this.jobQueueService.addJob(
      QUEUE_NAMES.TASKS,
      TASK_JOBS.TASK_COMPLETED_NOTIFICATION,
      jobData,
      {
        priority: 7, // Higher priority for user-facing notifications
        attempts: 3,
      },
    );

    console.log(
      `[CompleteTaskUseCase] Queued completion notification for task: ${completedTask.id}`,
    );

    return completedTask;
  }
}
