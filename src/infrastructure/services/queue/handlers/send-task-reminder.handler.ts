/**
 * Send Task Reminder Handler
 *
 * Processes task reminder jobs.
 * Sends reminder notifications to users about upcoming or overdue tasks.
 */

import type { Job } from "bullmq";
import type { SendTaskReminderJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { IEmailService, ILoggerService } from "@/core/services";

/**
 * Handles send task reminder job.
 *
 * Responsibilities:
 * - Fetch task details
 * - Format reminder message
 * - Send email/notification
 *
 * @param job - BullMQ job instance
 */
export async function handleSendTaskReminder(
  job: Job<SendTaskReminderJobData>,
): Promise<void> {
  const { taskId, email, taskTitle, dueDate } = job.data;

  // Get services from DI container
  const container = getContainer();
  const taskRepository = container.get<ITaskRepository>(
    DI_TOKENS.ITaskRepository,
  );
  const emailService = container.get<IEmailService>(DI_TOKENS.IEmailService);
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Processing task reminder", {
    jobId: job.id,
    taskId,
    taskTitle,
  });

  await job.updateProgress(20);

  // Fetch task details
  const task = await taskRepository.findById(taskId);

  if (!task) {
    logger.warn("Task not found, skipping reminder", { taskId });
    return; // Silently exit if task doesn't exist
  }

  if (task.status === "COMPLETED") {
    logger.info("Task already completed, skipping reminder", {
      taskId,
      status: task.status,
    });
    return; // Don't send reminders for completed tasks
  }

  await job.updateProgress(50);

  // Format reminder message
  const daysUntilDue = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  let reminderMessage: string;
  if (daysUntilDue < 0) {
    reminderMessage = `Your task "${taskTitle}" is overdue by ${Math.abs(daysUntilDue)} days.`;
  } else if (daysUntilDue === 0) {
    reminderMessage = `Your task "${taskTitle}" is due today!`;
  } else {
    reminderMessage = `Your task "${taskTitle}" is due in ${daysUntilDue} days.`;
  }

  logger.debug("Reminder message prepared", {
    taskId,
    reminderMessage,
    daysUntilDue,
  });

  await job.updateProgress(75);

  // Send reminder email using templated email
  const emailResult = await emailService.sendTemplatedEmail(
    email,
    "task-reminder",
    {
      userName: "User", // TODO: Get actual user name from user repository
      taskTitle,
      dueDate: new Date(dueDate).toLocaleDateString(),
      reminderMessage,
      taskLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${taskId}`,
    },
  );

  if (!emailResult.success) {
    logger.error("Failed to send task reminder email", undefined, {
      taskId,
      email,
      error: emailResult.error,
    });
    throw new Error(`Email send failed: ${emailResult.error}`);
  }

  logger.info("Task reminder email sent successfully", {
    taskId,
    taskTitle,
    email,
    messageId: emailResult.messageId,
  });

  await job.updateProgress(100);
}
