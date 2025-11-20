/**
 * Job Name Constants
 *
 * Centralized definition of all background job types.
 * Using const enums for type safety and autocomplete.
 */

/**
 * Email queue job names
 */
export const EMAIL_JOBS = {
  SEND_WELCOME_EMAIL: "send-welcome-email",
  SEND_TASK_NOTIFICATION: "send-task-notification",
  SEND_TASK_REMINDER: "send-task-reminder",
} as const;

/**
 * Task queue job names
 */
export const TASK_JOBS = {
  TASK_COMPLETED_NOTIFICATION: "task-completed-notification",
  CLEANUP_OLD_TASKS: "cleanup-old-tasks",
  TASK_REMINDER: "task-reminder",
} as const;

/**
 * Maintenance queue job names
 */
export const MAINTENANCE_JOBS = {
  DATABASE_CLEANUP: "database-cleanup",
  DATA_EXPORT: "data-export",
  HEALTH_CHECK: "health-check",
} as const;

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  EMAIL: "email",
  TASKS: "tasks",
  MAINTENANCE: "maintenance",
} as const;

/**
 * Type helpers for job names
 */
export type EmailJobName = (typeof EMAIL_JOBS)[keyof typeof EMAIL_JOBS];
export type TaskJobName = (typeof TASK_JOBS)[keyof typeof TASK_JOBS];
export type MaintenanceJobName =
  (typeof MAINTENANCE_JOBS)[keyof typeof MAINTENANCE_JOBS];
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
