/**
 * Centralized Date Formatting Utilities
 *
 * Provides consistent date formatting across the application.
 * Use these utilities instead of manual .toLocaleDateString() or .toLocaleString() calls.
 *
 * @example
 * ```tsx
 * import { formatDate, formatDateTime, formatDateShort } from "@/lib/utils/date-format";
 *
 * // In components:
 * <span>{formatDate(asset.purchaseDate)}</span>
 * <span>{formatDateTime(log.createdAt)}</span>
 * ```
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Standard date format: "Jan 15, 2024"
 * Use for most date displays (tables, details, forms)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "MMM d, yyyy");
}

/**
 * Short date format: "Jan 15"
 * Use for compact displays where year is implied
 */
export function formatDateShort(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "MMM d");
}

/**
 * Full date format: "January 15, 2024"
 * Use for formal documents, reports, certificates
 */
export function formatDateFull(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "MMMM d, yyyy");
}

/**
 * Date and time format: "Jan 15, 2024 at 2:30 PM"
 * Use for timestamps, logs, activity feeds
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Time only format: "2:30 PM"
 * Use when date context is already established
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "h:mm a");
}

/**
 * Relative time: "2 hours ago", "in 3 days"
 * Use for recent activity, notifications
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * ISO date for forms/inputs: "2024-01-15"
 * Use for date input values
 */
export function formatDateISO(date: Date | string | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "";

  return format(dateObj, "yyyy-MM-dd");
}

/**
 * Numeric date: "01/15/2024"
 * Use sparingly - prefer formatDate for readability
 */
export function formatDateNumeric(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "—";

  return format(dateObj, "MM/dd/yyyy");
}

/**
 * Parse a date string safely
 * Returns null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isValid(dateObj);
}
