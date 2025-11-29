/**
 * Centralized Status Color Mapping
 *
 * Provides consistent status colors across the application.
 * Use these utilities for Badge components, indicators, and status displays.
 *
 * Color Semantics:
 * - Green: Active, Success, Approved, Completed, Available
 * - Blue: Confirmed, In Progress, Info, Synced
 * - Amber/Yellow: Pending, Warning, Waiting, Partial
 * - Red: Failed, Error, Cancelled, Inactive, Overdue
 * - Gray: Inactive, Unknown, Draft, N/A
 * - Purple: Reserved, Special
 *
 * @example
 * ```tsx
 * import { getStatusColor, getStatusBadgeClasses } from "@/lib/utils/status-colors";
 *
 * // Get Tailwind classes for a Badge
 * <Badge className={getStatusBadgeClasses("active")}>Active</Badge>
 *
 * // Get color for custom styling
 * <div className={`text-${getStatusColor("pending")}-500`}>Pending</div>
 * ```
 */

export type StatusType =
  // Success states
  | "active"
  | "success"
  | "approved"
  | "completed"
  | "available"
  | "healthy"
  | "compliant"
  | "enabled"
  // Info/Progress states
  | "confirmed"
  | "in_progress"
  | "in-progress"
  | "info"
  | "synced"
  | "processing"
  // Warning states
  | "pending"
  | "warning"
  | "waiting"
  | "partial"
  | "expiring"
  | "due"
  // Error states
  | "failed"
  | "error"
  | "cancelled"
  | "inactive"
  | "overdue"
  | "expired"
  | "rejected"
  | "disabled"
  | "non_compliant"
  | "non-compliant"
  // Neutral states
  | "draft"
  | "unknown"
  | "na"
  | "none"
  // Special states
  | "reserved"
  | "checked_out"
  | "checked-out";

type ColorName = "green" | "blue" | "amber" | "red" | "gray" | "purple";

/**
 * Map status to color name
 */
export function getStatusColor(status: StatusType | string): ColorName {
  const normalizedStatus = status.toLowerCase().replace(/_/g, "-");

  switch (normalizedStatus) {
    // Success (green)
    case "active":
    case "success":
    case "approved":
    case "completed":
    case "available":
    case "healthy":
    case "compliant":
    case "enabled":
    case "good":
    case "new":
      return "green";

    // Info/Progress (blue)
    case "confirmed":
    case "in-progress":
    case "info":
    case "synced":
    case "processing":
    case "ready":
      return "blue";

    // Warning (amber)
    case "pending":
    case "warning":
    case "waiting":
    case "partial":
    case "expiring":
    case "due":
    case "fair":
      return "amber";

    // Error (red)
    case "failed":
    case "error":
    case "cancelled":
    case "inactive":
    case "overdue":
    case "expired":
    case "rejected":
    case "disabled":
    case "non-compliant":
    case "poor":
      return "red";

    // Special (purple)
    case "reserved":
    case "checked-out":
      return "purple";

    // Default (gray)
    default:
      return "gray";
  }
}

/**
 * Get Tailwind CSS classes for a status badge
 * Returns: background with opacity + text color + hover state
 */
export function getStatusBadgeClasses(status: StatusType | string): string {
  const color = getStatusColor(status);

  const colorClasses: Record<ColorName, string> = {
    green:
      "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
    blue: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    amber:
      "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
    gray: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 dark:text-gray-400",
    purple:
      "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
  };

  return colorClasses[color];
}

/**
 * Get Tailwind CSS classes for a solid status badge
 * Returns: solid background + white text
 */
export function getStatusBadgeSolidClasses(
  status: StatusType | string,
): string {
  const color = getStatusColor(status);

  const colorClasses: Record<ColorName, string> = {
    green: "bg-green-600 text-white hover:bg-green-700",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    amber: "bg-amber-500 text-white hover:bg-amber-600",
    red: "bg-red-600 text-white hover:bg-red-700",
    gray: "bg-gray-500 text-white hover:bg-gray-600",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
  };

  return colorClasses[color];
}

/**
 * Get dot/indicator color classes
 * Use for small status dots/circles
 */
export function getStatusDotClasses(status: StatusType | string): string {
  const color = getStatusColor(status);

  const colorClasses: Record<ColorName, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    gray: "bg-gray-400",
    purple: "bg-purple-500",
  };

  return colorClasses[color];
}

/**
 * Get text color classes
 */
export function getStatusTextClasses(status: StatusType | string): string {
  const color = getStatusColor(status);

  const colorClasses: Record<ColorName, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-500 dark:text-gray-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return colorClasses[color];
}

/**
 * Asset condition specific colors
 */
export function getConditionBadgeClasses(
  condition: "NEW" | "GOOD" | "FAIR" | "POOR" | string,
): string {
  switch (condition.toUpperCase()) {
    case "NEW":
      return getStatusBadgeClasses("success");
    case "GOOD":
      return getStatusBadgeClasses("info");
    case "FAIR":
      return getStatusBadgeClasses("warning");
    case "POOR":
      return getStatusBadgeClasses("error");
    default:
      return getStatusBadgeClasses("unknown");
  }
}

/**
 * Reservation status specific colors
 */
export const reservationStatusColors: Record<string, string> = {
  PENDING: getStatusBadgeClasses("pending"),
  CONFIRMED: getStatusBadgeClasses("confirmed"),
  ACTIVE: getStatusBadgeClasses("active"),
  COMPLETED: getStatusBadgeClasses("completed"),
  CANCELLED: getStatusBadgeClasses("cancelled"),
  EXPIRED: getStatusBadgeClasses("expired"),
};

/**
 * Disposal status specific colors
 */
export const disposalStatusColors: Record<string, string> = {
  DRAFT: getStatusBadgeClasses("draft"),
  PENDING_APPROVAL: getStatusBadgeClasses("pending"),
  APPROVED: getStatusBadgeClasses("approved"),
  IN_PROGRESS: getStatusBadgeClasses("in_progress"),
  COMPLETED: getStatusBadgeClasses("completed"),
  REJECTED: getStatusBadgeClasses("rejected"),
  CANCELLED: getStatusBadgeClasses("cancelled"),
};

/**
 * Compliance status specific colors
 */
export const complianceStatusColors: Record<string, string> = {
  COMPLIANT: getStatusBadgeClasses("compliant"),
  NON_COMPLIANT: getStatusBadgeClasses("non_compliant"),
  UNKNOWN: getStatusBadgeClasses("unknown"),
  NOT_EVALUATED: getStatusBadgeClasses("unknown"),
};
