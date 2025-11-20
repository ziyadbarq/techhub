/**
 * Job Data Type Definitions
 *
 * Defines type-safe data interfaces for all background jobs.
 * Each job type has a corresponding data interface.
 */

// ========================================
// Base Job Data
// ========================================

/**
 * Base job data interface for all background jobs.
 * Provides common fields for tracking and tracing.
 */
export interface BaseJobData {
  /**
   * Unique identifier for the entity related to this job
   */
  entityId?: string;

  /**
   * Timestamp when job was created (for tracking purposes)
   */
  createdAt?: number;
}

// ========================================
// Email Jobs
// ========================================

/**
 * Data for sending welcome email
 */
export interface SendWelcomeEmailJobData extends BaseJobData {
  userId: string;
  email: string;
  name: string;
}

/**
 * Data for sending task notification
 */
export interface SendTaskNotificationJobData extends BaseJobData {
  taskId: string;
  userId: string;
  email: string;
  taskTitle: string;
  message: string;
}

/**
 * Data for sending task reminder
 */
export interface SendTaskReminderJobData extends BaseJobData {
  taskId: string;
  userId: string;
  email: string;
  taskTitle: string;
  dueDate: Date;
}

// ========================================
// Task Jobs
// ========================================

/**
 * Data for task completed notification
 */
export interface TaskCompletedNotificationJobData extends BaseJobData {
  taskId: string;
  taskTitle: string;
  completedAt: Date;
  userId: string;
}

/**
 * Data for cleanup old tasks job
 */
export interface CleanupOldTasksJobData extends BaseJobData {
  olderThanDays: number;
  batchSize?: number;
}

/**
 * Data for task reminder job
 */
export interface TaskReminderJobData extends BaseJobData {
  taskId: string;
  userId: string;
  reminderType: "due-soon" | "overdue" | "custom";
}

// ========================================
// Maintenance Jobs
// ========================================

/**
 * Data for database cleanup job
 */
export interface DatabaseCleanupJobData extends BaseJobData {
  tables?: string[];
  olderThanDays: number;
}

/**
 * Data for data export job
 */
export interface DataExportJobData extends BaseJobData {
  userId: string;
  exportType: "tasks" | "full" | "custom";
  format: "json" | "csv";
  email: string;
}

/**
 * Data for health check job
 */
export interface HealthCheckJobData extends BaseJobData {
  checks: ("database" | "redis" | "api")[];
  notifyOnFailure: boolean;
}
