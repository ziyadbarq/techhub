/**
 * Widget Container
 * Wrapper component with feature flag and permission guards
 * Widgets wrapped with this container will automatically hide if:
 * - The required feature flag is disabled
 * - The user lacks the required permission
 */

"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

interface WidgetContainerProps {
  /** Optional feature flag - widget hidden if feature is disabled */
  featureFlag?: string;
  /** Optional permission - widget hidden if user lacks permission */
  permission?: PermissionKey;
  /** Widget title displayed in card header */
  title: string;
  /** Optional description displayed below title */
  description?: string;
  /** Optional icon to display next to title */
  icon?: ReactNode;
  /** Widget content */
  children: ReactNode;
  /** Optional className for the card */
  className?: string;
  /** Optional header action (e.g., "View All" button) */
  headerAction?: ReactNode;
}

export function WidgetContainer({
  featureFlag,
  permission,
  title,
  description,
  icon,
  children,
  className,
  headerAction,
}: WidgetContainerProps) {
  const isFeatureEnabled = useIsFeatureEnabled(featureFlag ?? "");
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  // Hide widget if feature flag is specified and disabled
  if (featureFlag && !isFeatureEnabled) {
    return null;
  }

  // Hide widget if permission is specified and user lacks it
  // Wait for permissions to load before hiding
  if (permission && !permissionsLoading && !hasPermission(permission)) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
