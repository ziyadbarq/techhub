/**
 * Service Display Utilities
 *
 * Pure functions for service display logic including badge variants,
 * date formatting, and data grouping.
 */

import { format } from "date-fns";
import type { ServiceStatus, CriticalityLevel } from "@/generated/prisma/enums";

export interface ServiceOwnerLike {
  id: string;
  name: string;
  role: string;
  ownershipType: string;
}

/**
 * Badge variant types from shadcn/ui
 */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Get badge variant for service status
 *
 * Maps service status to appropriate badge styling for consistent visual representation.
 *
 * @param status - Service status enum value
 * @returns Badge variant string
 */
export function getStatusBadgeVariant(status: ServiceStatus): BadgeVariant {
  switch (status) {
    case "PRODUCTION":
      return "default";
    case "RETIRED":
      return "secondary";
    case "UAT":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get badge variant for criticality level
 *
 * Maps criticality levels to appropriate badge styling with visual hierarchy.
 *
 * @param criticality - Criticality level enum value
 * @returns Badge variant string
 */
export function getCriticalityBadgeVariant(
  criticality: CriticalityLevel,
): BadgeVariant {
  switch (criticality) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "outline";
    case "LOW":
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * Group service owners by ownership type
 *
 * Organizes owners into technical, product, and business categories
 * for better presentation in the UI.
 *
 * @param owners - Array of service owners
 * @returns Record of ownership types to owner arrays
 */
export function groupOwnersByType(
  owners: ServiceOwnerLike[],
): Record<string, ServiceOwnerLike[]> {
  const grouped: Record<string, ServiceOwnerLike[]> = {
    TECHNICAL: [],
    PRODUCT: [],
    BUSINESS: [],
  };

  owners.forEach((owner) => {
    if (grouped[owner.ownershipType]) {
      grouped[owner.ownershipType].push(owner);
    }
  });

  return grouped;
}

/**
 * Format service date (date only, no time)
 *
 * @param date - Date string or null/undefined
 * @param fallback - Fallback text when date is null (default: "—")
 * @returns Formatted date string or fallback
 *
 * @example
 * ```ts
 * formatServiceDate("2024-03-15") // => "Mar 15, 2024"
 * formatServiceDate(null) // => "—"
 * formatServiceDate(null, "Not set") // => "Not set"
 * ```
 */
export function formatServiceDate(
  date: string | null | undefined,
  fallback: string = "—",
): string {
  if (!date) return fallback;
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return fallback;
  }
}

/**
 * Format service datetime (includes time)
 *
 * @param date - Date string or null/undefined
 * @param fallback - Fallback text when date is null (default: "—")
 * @returns Formatted datetime string or fallback
 *
 * @example
 * ```ts
 * formatServiceDateTime("2024-03-15T14:30:00Z") // => "Mar 15, 2024 14:30"
 * formatServiceDateTime(null) // => "—"
 * ```
 */
export function formatServiceDateTime(
  date: string | null | undefined,
  fallback: string = "—",
): string {
  if (!date) return fallback;
  try {
    return format(new Date(date), "MMM d, yyyy HH:mm");
  } catch {
    return fallback;
  }
}

/**
 * Format enum value for display
 *
 * Converts SCREAMING_SNAKE_CASE enum values to Title Case for better readability.
 *
 * @param value - Enum value string or number
 * @returns Formatted string with spaces instead of underscores
 *
 * @example
 * ```ts
 * formatEnumValue("DATA_CONFIDENTIALITY") // => "Data Confidentiality"
 * formatEnumValue("BUSINESS_IMPACT_LEVEL") // => "Business Impact Level"
 * ```
 */
export function formatEnumValue(value: string | number): string {
  return String(value).replace(/_/g, " ");
}
