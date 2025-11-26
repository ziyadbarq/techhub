import * as React from "react";

import { cn } from "@/lib/utils";

export interface EntityDisplayProps {
  /** The name/label to display */
  name: string | null | undefined;
  /** Optional icon component to display before the name */
  icon?: React.ComponentType<{ className?: string }>;
  /** Text to show when name is null/undefined (default: "—") */
  fallback?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to truncate long text (default: true) */
  truncate?: boolean;
  /** Maximum width for truncation (default: "150px") */
  maxWidth?: string;
}

/**
 * EntityDisplay - A consistent way to display entity names in tables and lists
 *
 * Used to replace raw CUID displays with human-readable names.
 * Provides consistent styling with optional icon and truncation.
 *
 * @example
 * <EntityDisplay name={row.original.vendorName} icon={Building2} />
 * <EntityDisplay name={row.original.personName} icon={User} fallback="Unassigned" />
 */
export function EntityDisplay({
  name,
  icon: Icon,
  fallback = "—",
  className,
  truncate = true,
  maxWidth = "150px",
}: EntityDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
      <span
        className={cn("text-sm", truncate && "truncate")}
        style={truncate ? { maxWidth } : undefined}
        title={name || undefined}
      >
        {name || <span className="text-muted-foreground">{fallback}</span>}
      </span>
    </div>
  );
}
