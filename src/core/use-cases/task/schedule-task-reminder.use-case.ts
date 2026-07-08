/**
 * Schedule Task Reminder Use Case
 *
 * Schedules a background job to send a reminder for a task.
 * Demonstrates integration with job queue service.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { QUEUE_NAMES, TASK_JOBS } from "@/core/domain/jobs/job-names";
import type { SendTaskReminderJobData } from "@/core/domain/jobs/job-data.types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

/**
 * Input for scheduling a task reminder
 */
export interface ScheduleTaskReminderInput {
  taskId: string;
  reminderDate: Date;
}

/**
 * Output of scheduling a task reminder
 */
export interface ScheduleTaskReminderOutput {
  jobId: string;
  taskId: string;
  scheduledFor: Date;
}

@injectable()
export class ScheduleTaskReminderUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueueService: IJobQueueService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  /**
   * Schedules a reminder for a task.
   *
   * @param input - Task ID and reminder date
   * @returns Job details and scheduling info
   * @throws {NotFoundError} If task doesn't exist
   */
  async execute(
    input: ScheduleTaskReminderInput,
  ): Promise<ScheduleTaskReminderOutput> {
    const { taskId, reminderDate } = input;

    // Validate task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    // Don't schedule reminders for completed tasks
    if (task.status === "COMPLETED") {
      throw new ValidationError("Cannot schedule reminder for completed task");
    }

    // Calculate delay until reminder should be sent
    const delay = reminderDate.getTime() - Date.now();

    if (delay < 0) {
      throw new ValidationError("Reminder date must be in the future");
    }

    // Create job data
    const jobData: SendTaskReminderJobData = {
      taskId: task.id,
      userId: "user-123", // TODO: Get from user repository
      email: "user@example.com", // TODO: Get from user repository
      taskTitle: task.title,
      dueDate: new Date(), // TODO: Add dueDate field to Task entity
      entityId: task.id,
      createdAt: Date.now(),
    };

    // Schedule the job
    const jobId = await this.jobQueueService.addJob(
      QUEUE_NAMES.TASKS,
      TASK_JOBS.TASK_REMINDER,
      jobData,
      {
        delay,
        attempts: 3,
        priority: 5,
      },
    );

    this.logger.info("Scheduled task reminder", {
      taskId,
      jobId,
      scheduledFor: reminderDate.toISOString(),
    });

    return {
      jobId,
      taskId,
      scheduledFor: reminderDate,
    };
  }
}
