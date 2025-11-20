import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PermissionDeniedProps {
  /**
   * The permission key that was required (e.g., "tasks:create")
   */
  requiredPermission?: string;

  /**
   * Additional description or context about why this permission is needed
   */
  description?: string;

  /**
   * Custom title (defaults to "Access Denied")
   */
  title?: string;

  /**
   * Whether to show a link back to the dashboard
   */
  showBackButton?: boolean;

  /**
   * Custom back button text
   */
  backButtonText?: string;

  /**
   * Custom back button URL
   */
  backButtonUrl?: string;
}

/**
 * Reusable component for displaying permission denial messages
 * Used by unauthorized pages and PermissionGuard fallbacks
 */
export function PermissionDenied({
  requiredPermission,
  description,
  title = "Access Denied",
  showBackButton = true,
  backButtonText = "Return to Dashboard",
  backButtonUrl = "/",
}: PermissionDeniedProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <ShieldAlert className="text-destructive h-12 w-12" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold">{title}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-4">
          {description ||
            "You don't have the necessary permissions to access this resource."}
        </p>

        {/* Required Permission */}
        {requiredPermission && (
          <div className="bg-muted mb-6 rounded-lg p-3">
            <p className="text-muted-foreground mb-1 text-sm">
              Required Permission:
            </p>
            <code className="font-mono text-sm font-medium">
              {requiredPermission}
            </code>
          </div>
        )}

        {/* Help Text */}
        <p className="text-muted-foreground mb-6 text-sm">
          If you believe you should have access, please contact your
          administrator.
        </p>

        {/* Back Button */}
        {showBackButton && (
          <Button asChild>
            <Link href={backButtonUrl}>{backButtonText}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
