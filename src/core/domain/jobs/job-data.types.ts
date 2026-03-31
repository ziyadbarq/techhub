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

// ========================================
// Backup Jobs
// ========================================

export interface DatabaseBackupJobData extends BaseJobData {
  backupId: string;
  filename: string;
  userId: string;
  notes?: string | null;
}

export interface DatabaseRestoreJobData extends BaseJobData {
  backupId: string;
  userId: string;
  filePath: string;
}

// ========================================
// User Sync Jobs
// ========================================

/**
 * Data for Microsoft Graph user sync job
 */
export interface UserSyncFromGraphJobData extends BaseJobData {
  /**
   * Include disabled users in sync
   * @default false
   */
  includeDisabled?: boolean;

  /**
   * Include guest/external users in sync
   * @default false
   */
  includeGuests?: boolean;

  /**
   * Default organization unit ID for new users
   */
  defaultOrgUnitId: string;

  /**
   * Default primary role ID for new users
   */
  defaultPrimaryRoleId: string;

  /**
   * Whether to deactivate users not found in Graph
   * @default true
   */
  deactivateMissing?: boolean;

  /**
   * User who triggered the sync (for audit logging)
   */
  triggeredBy?: string;
}

// ========================================
// Intune Device Sync Jobs
// ========================================

/**
 * Data for Microsoft Intune device sync job
 */
export interface IntuneSyncJobData extends BaseJobData {
  /**
   * Automatically link devices to Assets by serial number match
   * @default true
   */
  autoLinkToAssets?: boolean;

  /**
   * Automatically link devices to Persons by Intune userId match
   * @default true
   */
  autoLinkToPersons?: boolean;

  /**
   * Track compliance state changes in history table
   * @default true
   */
  trackComplianceHistory?: boolean;

  /**
   * Deactivate devices not found in Intune
   * @default true
   */
  deactivateMissing?: boolean;

  /**
   * Filter by ownership type
   * Note: Graph API uses "company" for corporate-owned devices
   */
  ownershipType?: "company" | "personal";

  /**
   * Filter by compliance state
   */
  complianceState?: "compliant" | "noncompliant";

  /**
   * Filter by operating system (e.g., "Windows", "iOS", "Android")
   */
  operatingSystem?: string;

  /**
   * Dry run mode - preview changes without persisting
   * @default false
   */
  dryRun?: boolean;

  /**
   * User who triggered the sync (for audit logging)
   */
  triggeredBy?: string;
}

// ========================================
// OCI Cloud Sync Jobs
// ========================================

/**
 * Data for OCI cloud resource sync job
 */
export interface OciSyncJobData extends BaseJobData {
  /**
   * Which OCI services to sync (default: all 8)
   */
  serviceKeys?: string[];

  /**
   * Preview changes without persisting
   * @default false
   */
  dryRun?: boolean;

  /**
   * User who triggered the sync (for audit logging)
   */
  triggeredBy?: string;
}

/**
 * Data for checking due report schedules
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CheckDueReportSchedulesJobData extends BaseJobData {}

/**
 * Data for generating and sending a scheduled report
 */
export interface GenerateAndSendReportJobData extends BaseJobData {
  /** The report schedule ID to execute */
  scheduleId: string;
}
