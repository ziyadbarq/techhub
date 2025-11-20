/**
 * Task Completed Notification Handler
 *
 * Processes task completed notification jobs.
 * Sends notification when a task is marked as completed.
 */

import type { Job } from "bullmq";
import type { TaskCompletedNotificationJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IEmailService, ILoggerService } from "@/core/services";

/**
 * Handles task completed notification job.
 *
 * Responsibilities:
 * - Log task completion
 * - Send notification (email, push, etc.)
 * - Update user statistics
 *
 * @param job - BullMQ job instance
 */
export async function handleTaskCompletedNotification(
  job: Job<TaskCompletedNotificationJobData>,
): Promise<void> {
  const { taskId, taskTitle, completedAt, userId } = job.data;

  // Get services from DI container
  const container = getContainer();
  const emailService = container.get<IEmailService>(DI_TOKENS.IEmailService);
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Processing task completed notification", {
    jobId: job.id,
    taskId,
    taskTitle,
    userId,
  });

  // Update progress
  await job.updateProgress(10);

  // Send email notification
  // TODO: Get user email from user repository
  const userEmail = `user-${userId}@example.com`; // Mock email for now

  const emailResult = await emailService.sendTemplatedEmail(
    userEmail,
    "task-notification",
    {
      userName: "User", // TODO: Get actual user name from user repository
      taskTitle,
      message: `Congratulations! You completed your task on ${new Date(completedAt).toLocaleDateString()}.`,
    },
  );

  if (!emailResult.success) {
    logger.error("Failed to send task completed email", undefined, {
      taskId,
      userId,
      error: emailResult.error,
    });
  } else {
    logger.info("Task completed email sent successfully", {
      taskId,
      userId,
      messageId: emailResult.messageId,
    });
  }

  await job.updateProgress(50);

  /**
   * TODO: Send push notification
   *
   * Steps to implement:
   * 1. Create IPushNotificationService interface in src/core/services/
   * 2. Implement service using Firebase Cloud Messaging, OneSignal, or similar
   * 3. Store user device tokens in database (User model)
   * 4. Send push notification
   */
  logger.debug("Push notification would be sent here", {
    userId,
    taskId,
    feature: "TODO",
  });

  await job.updateProgress(80);

  /**
   * TODO: Update user statistics
   *
   * Steps to implement:
   * 1. Create User model in Prisma schema with statistics fields
   * 2. Create IUserStatsService or extend IUserRepository
   * 3. Calculate and update streaks, achievements, etc.
   * 4. Use atomic updates to avoid race conditions
   */
  logger.debug("User statistics would be updated here", {
    userId,
    taskId,
    feature: "TODO",
  });

  await job.updateProgress(100);

  logger.info("Task completed notification processed successfully", {
    taskId,
    taskTitle,
    userId,
  });
}
