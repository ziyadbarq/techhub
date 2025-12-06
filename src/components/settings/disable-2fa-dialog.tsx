/**
 * Disable 2FA Dialog
 * Confirmation dialog for disabling Two-Factor Authentication
 * Requires password verification
 */

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { disable2FAAction } from "@/interface-adapters/controllers/two-factor.controller";

interface Disable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function Disable2FADialog({
  open,
  onOpenChange,
  onSuccess,
}: Disable2FADialogProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPassword("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await disable2FAAction(password);

      if (!result.success) {
        toast.error(result.error || "Failed to disable 2FA");
        return;
      }

      toast.success("Two-Factor Authentication disabled");
      onOpenChange(false);
      onSuccess();
    } catch (_error) {
      toast.error("Failed to disable 2FA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will make your account less secure. You'll only
                need your password to sign in.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !password}
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
