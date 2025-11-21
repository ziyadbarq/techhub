/**
 * Schedule Type Value Object
 * Represents the interval type for recurring maintenance schedules
 */

export enum ScheduleType {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM", // Custom number of days
}

export const SCHEDULE_TYPE_VALUES = Object.values(ScheduleType);

/**
 * Get human-readable label for schedule type
 */
export function getScheduleTypeLabel(type: ScheduleType): string {
  const labels: Record<ScheduleType, string> = {
    [ScheduleType.WEEKLY]: "Weekly",
    [ScheduleType.MONTHLY]: "Monthly",
    [ScheduleType.QUARTERLY]: "Quarterly",
    [ScheduleType.YEARLY]: "Yearly",
    [ScheduleType.CUSTOM]: "Custom",
  };
  return labels[type];
}

/**
 * Get description for schedule type with interval
 */
export function getScheduleDescription(
  type: ScheduleType,
  intervalValue: number,
): string {
  switch (type) {
    case ScheduleType.WEEKLY:
      return intervalValue === 1
        ? "Every week"
        : `Every ${intervalValue} weeks`;
    case ScheduleType.MONTHLY:
      return intervalValue === 1
        ? "Every month"
        : `Every ${intervalValue} months`;
    case ScheduleType.QUARTERLY:
      return intervalValue === 1
        ? "Every quarter"
        : `Every ${intervalValue} quarters`;
    case ScheduleType.YEARLY:
      return intervalValue === 1
        ? "Every year"
        : `Every ${intervalValue} years`;
    case ScheduleType.CUSTOM:
      return intervalValue === 1 ? "Every day" : `Every ${intervalValue} days`;
  }
}

/**
 * Validate if string is a valid Schedule Type
 */
export function isValidScheduleType(value: string): value is ScheduleType {
  return SCHEDULE_TYPE_VALUES.includes(value as ScheduleType);
}

/**
 * Calculate next due date based on schedule type
 */
export function calculateNextDueDate(
  currentDueDate: Date,
  type: ScheduleType,
  intervalValue: number,
): Date {
  const next = new Date(currentDueDate);

  switch (type) {
    case ScheduleType.WEEKLY:
      next.setDate(next.getDate() + intervalValue * 7);
      break;
    case ScheduleType.MONTHLY:
      next.setMonth(next.getMonth() + intervalValue);
      break;
    case ScheduleType.QUARTERLY:
      next.setMonth(next.getMonth() + intervalValue * 3);
      break;
    case ScheduleType.YEARLY:
      next.setFullYear(next.getFullYear() + intervalValue);
      break;
    case ScheduleType.CUSTOM:
      next.setDate(next.getDate() + intervalValue);
      break;
  }

  return next;
}
