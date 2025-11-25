/**
 * Password Reset Dialog Component
 *
 * Displays a dialog for resetting a user's password.
 * Shows the new password only once with copy functionality.
 */

"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { resetUserPasswordAction } from "@/interface-adapters/controllers/user-provisioning.controller";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordResetDialogProps {
  userId: string;
  userEmail: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PASSWORD_RESET_STORAGE_KEY = "user-provisioning/password-reset";

export function PasswordResetDialog({
  userId,
  userEmail,
  trigger,
  open,
  onOpenChange,
}: PasswordResetDialogProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [credentialsOpen, setCredentialsOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState<string | null>(null);
  const [copiedField, setCopiedField] = React.useState<
    "email" | "password" | "both" | null
  >(null);

  const handleResetClick = () => {
    setConfirmOpen(true);
    onOpenChange?.(true);
  };

  const handleCredentialsOpenChange = (open: boolean) => {
    setCredentialsOpen(open);
    if (!open) {
      sessionStorage.removeItem(PASSWORD_RESET_STORAGE_KEY);
      // Refresh the page when dialog closes to update the user list
      router.refresh();
      onOpenChange?.(false);
    }
  };

  React.useLayoutEffect(() => {
    const stored = sessionStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
    if (!stored) return;

    let shouldClear = false;
    try {
      const parsed = JSON.parse(stored) as {
        userId: string;
        password: string;
      };

      if (parsed.userId === userId) {
        setNewPassword(parsed.password);
        setCredentialsOpen(true);
        shouldClear = true;
      }
    } catch {
      // Ignore malformed stored data
      shouldClear = true;
    }

    if (shouldClear) {
      sessionStorage.removeItem(PASSWORD_RESET_STORAGE_KEY);
    }
  }, [userId]);

  React.useEffect(() => {
    if (open) {
      if (!confirmOpen && !credentialsOpen) {
        setConfirmOpen(true);
      }
    } else if (open === false) {
      setConfirmOpen(false);
      setCredentialsOpen(false);
    }
  }, [open, confirmOpen, credentialsOpen]);

  React.useEffect(() => {
    // Clear previous password when switching users
    setNewPassword(null);
  }, [userId]);

  const handleConfirmOpenChange = (openState: boolean) => {
    setConfirmOpen(openState);
    if (!openState && !credentialsOpen) {
      onOpenChange?.(false);
    }
  };

  const confirmReset = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsResetting(true);
    try {
      const result = await resetUserPasswordAction(userId);

      if (!result.success) {
        toast.error(result.error || "Failed to reset password");
        setIsResetting(false);
        return;
      }

      // Store password and close confirmation dialog
      setNewPassword(result.data.password);
      sessionStorage.setItem(
        PASSWORD_RESET_STORAGE_KEY,
        JSON.stringify({ userId, password: result.data.password }),
      );
      setConfirmOpen(false);

      setCredentialsOpen(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
      setIsResetting(false);
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    field: "email" | "password" | "both",
  ) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(
      `${field === "both" ? "Credentials" : field === "email" ? "Email" : "Password"} copied to clipboard`,
    );
  };

  const formatForSlack = () => {
    if (!newPassword) return "";
    return `Password Reset for ${userEmail}

Email: ${userEmail}
New Password: ${newPassword}

User has been logged out from all devices.`;
  };

  return (
    <>
      {trigger ? <div onClick={handleResetClick}>{trigger}</div> : null}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new random password for{" "}
              <strong>{userEmail}</strong> and invalidate all existing sessions.
              The user will need to log in again with the new password.
              <br />
              <br />
              The new password will be displayed only once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <Button type="button" onClick={confirmReset} disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials Display Dialog */}
      <Dialog open={credentialsOpen} onOpenChange={handleCredentialsOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Password Reset Complete</DialogTitle>
            <DialogDescription>
              New password generated for <strong>{userEmail}</strong>. Copy and
              share securely with the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reset-email-display">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="reset-email-display"
                  value={userEmail}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(userEmail, "email")}
                >
                  {copiedField === "email" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="reset-password-display">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="reset-password-display"
                  value={newPassword || ""}
                  readOnly
                  className="border-yellow-200 bg-yellow-50 font-mono text-sm dark:border-yellow-800 dark:bg-yellow-950/20"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    newPassword && copyToClipboard(newPassword, "password")
                  }
                >
                  {copiedField === "password" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                This password will only be shown once. Copy it now!
              </p>
            </div>

            {/* Copy for Slack/Teams */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const message = formatForSlack();
                    if (message) {
                      copyToClipboard(message, "both");
                    }
                  }}
                >
                  {copiedField === "both" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy for Slack/Teams
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleCredentialsOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
