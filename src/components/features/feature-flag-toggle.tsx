/**
 * Feature Flag Toggle Component
 * Switch component with loading state and confirmation dialog
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toggleFeatureFlagAction } from "@/interface-adapters/controllers/feature-flags/feature-flag.controller";

import type { FeatureFlagResponseDTO } from "@/interface-adapters/dtos/feature-flags/feature-flag.dto";

interface FeatureFlagToggleProps {
  featureFlag: FeatureFlagResponseDTO;
  onToggleSuccess: () => void;
}

export function FeatureFlagToggle({
  featureFlag,
  onToggleSuccess,
}: FeatureFlagToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "enable" | "disable" | null
  >(null);

  const handleToggleClick = (checked: boolean) => {
    const action = checked ? "enable" : "disable";

    // Always show confirmation for maintenance mode (both enable and disable)
    if (featureFlag.name === "MAINTENANCE_MODE") {
      setPendingAction(action);
      setShowConfirmDialog(true);
      return;
    }

    if (checked) {
      // Enabling - proceed directly for non-maintenance features
      handleToggle("enable");
    } else {
      // Disabling - show confirmation
      setPendingAction("disable");
      setShowConfirmDialog(true);
    }
  };

  const handleToggle = async (action: "enable" | "disable") => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const result = await toggleFeatureFlagAction({
        name: featureFlag.name,
        reason:
          action === "disable"
            ? "Disabled via admin UI"
            : "Enabled via admin UI",
      });

      if (result.success && result.data) {
        const actionText =
          result.data.action === "ENABLED" ? "enabled" : "disabled";
        toast.success(`Feature ${actionText} successfully`, {
          description: `${featureFlag.displayName} is now ${actionText}.`,
        });

        // Show warnings if any
        if (result.data.warnings && result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning("Warning", {
              description: warning,
              duration: 6000,
            });
          });
        }

        onToggleSuccess();
      } else {
        toast.error("Failed to toggle feature", {
          description: !result.success
            ? result.error
            : "An unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast.error("Failed to toggle feature", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const getImpactMessage = () => {
    const isEnabling = pendingAction === "enable";

    if (featureFlag.name === "MAINTENANCE_MODE") {
      if (isEnabling) {
        return "This will lock out ALL non-administrator users from the system. Only system administrators will be able to access the application.";
      }
      return "This will restore normal access to the system. All users will be able to access enabled features based on their permissions.";
    }

    if (isEnabling) {
      if (featureFlag.dependsOn.length > 0) {
        return `This feature depends on: ${featureFlag.dependsOn.join(", ")}. Make sure those features are enabled first.`;
      }
      return `This will enable the ${featureFlag.displayName} feature for all users with appropriate permissions.`;
    }

    if (featureFlag.isSystem) {
      return "This is a system-level feature flag. Disabling it may affect multiple features.";
    }

    return `This will disable the ${featureFlag.displayName} feature for all users.`;
  };

  const getDialogTitle = () => {
    const isEnabling = pendingAction === "enable";
    const action = isEnabling ? "Enable" : "Disable";
    return `${action} ${featureFlag.displayName}?`;
  };

  const getActionButtonText = () => {
    const isEnabling = pendingAction === "enable";
    if (featureFlag.name === "MAINTENANCE_MODE" && isEnabling) {
      return "Enable Maintenance Mode";
    }
    return isEnabling ? "Enable Feature" : "Disable Feature";
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          checked={featureFlag.isEnabled}
          onCheckedChange={handleToggleClick}
          disabled={isLoading}
          aria-label={`Toggle ${featureFlag.displayName}`}
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={
                  featureFlag.name === "MAINTENANCE_MODE" &&
                  pendingAction === "enable"
                    ? "text-destructive h-5 w-5"
                    : "h-5 w-5 text-yellow-500"
                }
              />
              {getDialogTitle()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getImpactMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {featureFlag.name === "MAINTENANCE_MODE" &&
            pendingAction === "enable" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical Warning:</strong> This will immediately lock
                  out ALL non-administrator users. They will see a maintenance
                  mode message and will not be able to access any features.
                </AlertDescription>
              </Alert>
            )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && handleToggle(pendingAction)}
              className={
                featureFlag.name === "MAINTENANCE_MODE" &&
                pendingAction === "enable"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {getActionButtonText()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
