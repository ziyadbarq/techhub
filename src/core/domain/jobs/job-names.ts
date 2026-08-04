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
  WARRANTY_EXPIRATION_CHECK: "warranty-expiration-check",
  USER_SYNC_FROM_GRAPH: "user-sync-from-graph",
  INTUNE_DEVICE_SYNC: "intune-device-sync",
  OCI_RESOURCE_SYNC: "oci-resource-sync",
  OCI_CRITICAL_SYNC: "oci-critical-sync",
  DATABASE_BACKUP: "database-backup",
  DATABASE_RESTORE: "database-restore",
  DETECT_STALE_CIS: "detect-stale-cis",
} as const;

/**
 * Reservation queue job names
 */
export const RESERVATION_JOBS = {
  ACTIVATE_READY: "activate-ready-reservations",
  COMPLETE_EXPIRED: "complete-expired-reservations",
  SEND_REMINDERS: "send-reservation-reminders",
} as const;

/**
 * Report queue job names
 */
export const REPORT_JOBS = {
  CHECK_DUE_SCHEDULES: "check-due-report-schedules",
  GENERATE_AND_SEND: "generate-and-send-report",
} as const;

/**
 * Workflow engine cron tick job names
 *
 * Three cron-driven jobs power the engine's time-based behavior:
 *   - SLA_TICK: scans active steps + fires escalation rules
 *   - SCHEDULE_TICK: advances SCHEDULE steps when their window opens
 *   - ENTRY_AUTOMATION_TICK: runs entry-automation handlers on matching requests
 *
 * All three are gated at scheduling time by the WORKFLOW_ENGINE feature flag.
 */
export const WORKFLOW_JOBS = {
  SLA_TICK: "workflow-sla-tick",
  SCHEDULE_TICK: "workflow-schedule-tick",
  ENTRY_AUTOMATION_TICK: "workflow-entry-automation-tick",
} as const;

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  EMAIL: "email",
  TASKS: "tasks",
  MAINTENANCE: "maintenance",
  WORKFLOW: "workflow",
} as const;

/**
 * Type helpers for job names
 */
export type EmailJobName = (typeof EMAIL_JOBS)[keyof typeof EMAIL_JOBS];
export type TaskJobName = (typeof TASK_JOBS)[keyof typeof TASK_JOBS];
export type MaintenanceJobName =
  (typeof MAINTENANCE_JOBS)[keyof typeof MAINTENANCE_JOBS];
export type ReservationJobName =
  (typeof RESERVATION_JOBS)[keyof typeof RESERVATION_JOBS];
export type ReportJobName = (typeof REPORT_JOBS)[keyof typeof REPORT_JOBS];
export type WorkflowJobName =
  (typeof WORKFLOW_JOBS)[keyof typeof WORKFLOW_JOBS];
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
