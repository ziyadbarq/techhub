/**
 * Maintenance Priority Value Object
 * Represents the urgency level of maintenance tasks
 */

export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export const MAINTENANCE_PRIORITY_VALUES = Object.values(MaintenancePriority);

/**
 * Get human-readable label for maintenance priority
 */
export function getMaintenancePriorityLabel(
  priority: MaintenancePriority,
): string {
  const labels: Record<MaintenancePriority, string> = {
    [MaintenancePriority.LOW]: "Low",
    [MaintenancePriority.MEDIUM]: "Medium",
    [MaintenancePriority.HIGH]: "High",
    [MaintenancePriority.CRITICAL]: "Critical",
  };
  return labels[priority];
}

/**
 * Get badge color class for priority
 */
export function getPriorityBadgeColor(priority: MaintenancePriority): string {
  const colors: Record<MaintenancePriority, string> = {
    [MaintenancePriority.LOW]:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    [MaintenancePriority.MEDIUM]:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    [MaintenancePriority.HIGH]:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    [MaintenancePriority.CRITICAL]:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };
  return colors[priority];
}

/**
 * Get numeric weight for sorting (higher = more urgent)
 */
export function getPriorityWeight(priority: MaintenancePriority): number {
  const weights: Record<MaintenancePriority, number> = {
    [MaintenancePriority.LOW]: 1,
    [MaintenancePriority.MEDIUM]: 2,
    [MaintenancePriority.HIGH]: 3,
    [MaintenancePriority.CRITICAL]: 4,
  };
  return weights[priority];
}

/**
 * Validate if string is a valid Maintenance Priority
 */
export function isValidMaintenancePriority(
  value: string,
): value is MaintenancePriority {
  return MAINTENANCE_PRIORITY_VALUES.includes(value as MaintenancePriority);
}
