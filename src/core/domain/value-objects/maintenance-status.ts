/**
 * Maintenance Status Value Object
 * Represents the current state of a maintenance record
 */

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}

export const MAINTENANCE_STATUS_VALUES = Object.values(MaintenanceStatus);

/**
 * Get human-readable label for maintenance status
 */
export function getMaintenanceStatusLabel(status: MaintenanceStatus): string {
  const labels: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.SCHEDULED]: "Scheduled",
    [MaintenanceStatus.IN_PROGRESS]: "In Progress",
    [MaintenanceStatus.COMPLETED]: "Completed",
    [MaintenanceStatus.CANCELLED]: "Cancelled",
    [MaintenanceStatus.OVERDUE]: "Overdue",
  };
  return labels[status];
}

/**
 * Get badge color class for status
 */
export function getStatusBadgeColor(status: MaintenanceStatus): string {
  const colors: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.SCHEDULED]:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    [MaintenanceStatus.IN_PROGRESS]:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    [MaintenanceStatus.COMPLETED]:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    [MaintenanceStatus.CANCELLED]:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    [MaintenanceStatus.OVERDUE]:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };
  return colors[status];
}

/**
 * Check if status allows transitioning to another status
 */
export function canTransitionTo(
  from: MaintenanceStatus,
  to: MaintenanceStatus,
): boolean {
  const allowedTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
    [MaintenanceStatus.SCHEDULED]: [
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.CANCELLED,
      MaintenanceStatus.OVERDUE,
    ],
    [MaintenanceStatus.IN_PROGRESS]: [
      MaintenanceStatus.COMPLETED,
      MaintenanceStatus.CANCELLED,
    ],
    [MaintenanceStatus.COMPLETED]: [], // Terminal state
    [MaintenanceStatus.CANCELLED]: [], // Terminal state
    [MaintenanceStatus.OVERDUE]: [
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.CANCELLED,
    ],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

/**
 * Check if status is terminal (no further transitions)
 */
export function isTerminalStatus(status: MaintenanceStatus): boolean {
  return (
    status === MaintenanceStatus.COMPLETED ||
    status === MaintenanceStatus.CANCELLED
  );
}

/**
 * Check if status indicates work is pending
 */
export function isPendingStatus(status: MaintenanceStatus): boolean {
  return (
    status === MaintenanceStatus.SCHEDULED ||
    status === MaintenanceStatus.IN_PROGRESS ||
    status === MaintenanceStatus.OVERDUE
  );
}

/**
 * Validate if string is a valid Maintenance Status
 */
export function isValidMaintenanceStatus(
  value: string,
): value is MaintenanceStatus {
  return MAINTENANCE_STATUS_VALUES.includes(value as MaintenanceStatus);
}
