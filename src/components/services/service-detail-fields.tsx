/**
 * Service Detail Fields
 *
 * Reusable display field components for service detail views.
 * Eliminates repetitive display patterns and ensures consistent formatting.
 */

"use client";

import { formatServiceDate } from "@/lib/services/service-display-utils";

/**
 * Base detail field props
 */
interface BaseDetailFieldProps {
  label: string;
  className?: string;
}

/**
 * Detail field props for standard text values
 */
interface DetailFieldProps extends BaseDetailFieldProps {
  value: string | number | null | undefined;
  fallback?: string;
  formatValue?: (value: string | number) => string;
}

/**
 * Reusable detail field component
 *
 * Displays a label-value pair with consistent styling.
 * Shows fallback text (default "—") when value is null/undefined.
 *
 * @example
 * ```tsx
 * <DetailField
 *   label="Service Type"
 *   value={service.serviceType}
 *   formatValue={(v) => v.replace(/_/g, " ")}
 * />
 * ```
 */
export function DetailField({
  label,
  value,
  fallback = "—",
  formatValue,
  className,
}: DetailFieldProps) {
  const displayValue =
    value !== null && value !== undefined
      ? formatValue
        ? formatValue(value)
        : String(value)
      : fallback;

  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-sm">{displayValue}</p>
    </div>
  );
}

/**
 * Detail date field props
 */
interface DetailDateFieldProps extends BaseDetailFieldProps {
  date: string | null | undefined;
  fallback?: string;
}

/**
 * Reusable detail date field component
 *
 * Displays a date with consistent formatting (MMM d, yyyy).
 * Shows fallback text (default "—") when date is null/undefined.
 *
 * @example
 * ```tsx
 * <DetailDateField
 *   label="Deployment Date"
 *   date={service.deploymentDate}
 * />
 * ```
 */
export function DetailDateField({
  label,
  date,
  fallback = "—",
  className,
}: DetailDateFieldProps) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-sm">{formatServiceDate(date, fallback)}</p>
    </div>
  );
}

/**
 * Detail link field props
 */
interface DetailLinkFieldProps extends BaseDetailFieldProps {
  url: string | null | undefined;
  fallback?: string;
  displayText?: string;
}

/**
 * Reusable detail link field component
 *
 * Displays a clickable link that opens in a new tab.
 * Shows fallback text (default "—") when URL is null/undefined.
 *
 * @example
 * ```tsx
 * <DetailLinkField
 *   label="GitLab Repository"
 *   url={service.gitlabRepoUrl}
 * />
 * ```
 */
export function DetailLinkField({
  label,
  url,
  fallback = "—",
  displayText,
  className,
}: DetailLinkFieldProps) {
  if (!url) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-sm">{fallback}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-sm hover:underline"
      >
        {displayText || url}
      </a>
    </div>
  );
}

/**
 * Conditional detail field props
 */
interface ConditionalDetailFieldProps extends DetailFieldProps {
  show?: boolean;
}

/**
 * Conditional detail field component
 *
 * Only renders the field if value exists or show prop is true.
 * Useful for optional fields that should be hidden when empty.
 *
 * @example
 * ```tsx
 * <ConditionalDetailField
 *   label="Description"
 *   value={service.description}
 *   className="col-span-2"
 * />
 * ```
 */
export function ConditionalDetailField({
  label,
  value,
  fallback,
  formatValue,
  className,
  show,
}: ConditionalDetailFieldProps) {
  // Only show if explicitly told to or if value exists
  if (!show && (value === null || value === undefined || value === "")) {
    return null;
  }

  return (
    <DetailField
      label={label}
      value={value}
      fallback={fallback}
      formatValue={formatValue}
      className={className}
    />
  );
}

/**
 * Conditional detail link field props
 */
interface ConditionalDetailLinkFieldProps extends DetailLinkFieldProps {
  show?: boolean;
}

/**
 * Conditional detail link field component
 *
 * Only renders the link if URL exists or show prop is true.
 *
 * @example
 * ```tsx
 * <ConditionalDetailLinkField
 *   label="GitLab Repository"
 *   url={service.gitlabRepoUrl}
 *   className="col-span-2"
 * />
 * ```
 */
export function ConditionalDetailLinkField({
  label,
  url,
  fallback,
  displayText,
  className,
  show,
}: ConditionalDetailLinkFieldProps) {
  // Only show if explicitly told to or if URL exists
  if (!show && (!url || url === "")) {
    return null;
  }

  return (
    <DetailLinkField
      label={label}
      url={url}
      fallback={fallback}
      displayText={displayText}
      className={className}
    />
  );
}
