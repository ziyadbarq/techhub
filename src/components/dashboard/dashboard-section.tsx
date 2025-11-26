/**
 * Dashboard Section
 * Wrapper for grouping related widgets with optional permission/feature gating
 * Sections automatically hide if all child widgets would be hidden
 */

"use client";

import type { ReactNode } from "react";
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

interface DashboardSectionProps {
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional feature flag - section hidden if feature is disabled */
  featureFlag?: string;
  /** Optional permission - section hidden if user lacks permission */
  permission?: PermissionKey;
  /** Child widgets */
  children: ReactNode;
  /** Optional className */
  className?: string;
  /** Grid columns configuration */
  columns?: 1 | 2 | 3 | 4;
}

export function DashboardSection({
  title,
  description,
  featureFlag,
  permission,
  children,
  className = "",
  columns = 2,
}: DashboardSectionProps) {
  const isFeatureEnabled = useIsFeatureEnabled(featureFlag ?? "");
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  // Hide section if feature flag is specified and disabled
  if (featureFlag && !isFeatureEnabled) {
    return null;
  }

  // Hide section if permission is specified and user lacks it
  if (permission && !permissionsLoading && !hasPermission(permission)) {
    return null;
  }

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={`space-y-4 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className={`grid gap-4 ${gridCols[columns]}`}>{children}</div>
    </section>
  );
}
