/**
 * PropertyTable Component
 * Displays entity/API properties in a structured table format
 *
 * Usage in MDX:
 * <PropertyTable>
 *   <Property name="id" type="string" required>
 *     Unique identifier for the entity
 *   </Property>
 *   <Property name="status" type="enum" default="active">
 *     Current status. One of: `active`, `inactive`, `pending`
 *   </Property>
 * </PropertyTable>
 */

"use client";

import { cn } from "@/lib/utils";

interface PropertyTableProps {
  children: React.ReactNode;
  className?: string;
  /** Title for the property table section */
  title?: string;
  /** Optional description below the title */
  description?: string;
}

export function PropertyTable({
  children,
  className,
  title,
  description,
}: PropertyTableProps) {
  return (
    <div className={cn("my-6", className)}>
      {title && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold">{title}</h4>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="border-border divide-border divide-y rounded-lg border">
        {children}
      </div>
    </div>
  );
}

interface PropertyProps {
  /** Property/field name */
  name: string;
  /** Data type (string, number, boolean, enum, Date, etc.) */
  type: string;
  /** Whether the property is required */
  required?: boolean;
  /** Default value if not provided */
  default?: string;
  /** Mark as deprecated */
  deprecated?: boolean;
  /** Mark as read-only */
  readOnly?: boolean;
  /** Minimum value/length constraint */
  min?: string | number;
  /** Maximum value/length constraint */
  max?: string | number;
  /** Regex pattern for validation */
  pattern?: string;
  /** Description of the property */
  children: React.ReactNode;
  className?: string;
}

export function Property({
  name,
  type,
  required = false,
  default: defaultValue,
  deprecated = false,
  readOnly = false,
  min,
  max,
  pattern,
  children,
  className,
}: PropertyProps) {
  return (
    <div
      className={cn(
        "hover:bg-muted/30 px-4 py-4 transition-colors",
        deprecated && "opacity-60",
        className,
      )}
    >
      {/* Property header row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Property name */}
        <code className="bg-muted rounded px-2 py-1 font-mono text-sm font-semibold">
          {name}
        </code>

        {/* Type badge */}
        <span className="text-muted-foreground rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
          {type}
        </span>

        {/* Required badge */}
        {required && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            required
          </span>
        )}

        {/* Read-only badge */}
        {readOnly && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            read-only
          </span>
        )}

        {/* Deprecated badge */}
        {deprecated && (
          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            deprecated
          </span>
        )}
      </div>

      {/* Property description */}
      <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {children}
      </div>

      {/* Constraints row */}
      {(defaultValue !== undefined ||
        min !== undefined ||
        max !== undefined ||
        pattern) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {defaultValue !== undefined && (
            <span className="text-muted-foreground">
              Default:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono">
                {defaultValue}
              </code>
            </span>
          )}
          {min !== undefined && (
            <span className="text-muted-foreground">
              Min:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono">
                {min}
              </code>
            </span>
          )}
          {max !== undefined && (
            <span className="text-muted-foreground">
              Max:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono">
                {max}
              </code>
            </span>
          )}
          {pattern && (
            <span className="text-muted-foreground">
              Pattern:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono">
                {pattern}
              </code>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
