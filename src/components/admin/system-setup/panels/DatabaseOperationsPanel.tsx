"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Database, Loader2, AlertTriangle } from "lucide-react";
import { resetDatabaseAction } from "@/interface-adapters/controllers/setup.controller";
import { toast } from "sonner";

export function DatabaseOperationsPanel() {
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [reseedAfterReset, setReseedAfterReset] = useState(true);

  const isDevelopment = process.env.NODE_ENV === "development";

  // Note: Database seeding is now handled via CLI command: npm run db:seed
  // This provides better transparency and error handling

  const handleResetDatabase = async () => {
    if (resetConfirmation !== "CONFIRM RESET") {
      toast.error("Please type 'CONFIRM RESET' to proceed");
      return;
    }

    setIsResetting(true);
    setShowResetDialog(false);
    setResetConfirmation("");
    try {
      const result = await resetDatabaseAction(reseedAfterReset);
      if (result.success && result.data.success) {
        toast.success(result.data.message);
      } else {
        const errorMessage =
          (result.success ? result.data.message : result.error) ||
          "Failed to reset database";
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment Warning */}
      {!isDevelopment && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Environment Detected</strong>
            <p className="mt-1 text-sm">
              Database reset operations are disabled in production for safety.
              Seeding operations are still available.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Seed RBAC Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Seed RBAC Data
          </CardTitle>
          <CardDescription>
            Initialize or refresh the database with RBAC (Role-Based Access
            Control) data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <h4 className="mb-2 font-semibold">What will be seeded:</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• 269 Permissions (organized into 10 logical groups)</li>
              <li>
                • 10 System Roles (System Administrator, IT Help Desk, Auditor,
                etc.)
              </li>
              <li>• Role-Permission assignments</li>
            </ul>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
              <strong>
                💡 Database seeding is now handled via CLI for better
                transparency and control.
              </strong>
            </p>
            <div className="bg-muted/50 rounded p-3 font-mono text-sm">
              npm run db:seed
            </div>
            <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              This operation is safe to run multiple times. Existing data will
              be skipped.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Database (Danger Zone) */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone: Reset Database
          </CardTitle>
          <CardDescription>
            Completely wipe all data from the database and optionally reseed
            RBAC data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ WARNING: This action cannot be undone!</strong>
              <p className="mt-2 text-sm">
                This will permanently delete ALL data from your database,
                including:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• All users and authentication data</li>
                <li>• All assets, warranties, and maintenance records</li>
                <li>• All roles, permissions, and assignments</li>
                <li>
                  • All foundation data (org units, people, vendors, etc.)
                </li>
                <li>• All CMDB, contracts, licenses, and governance data</li>
              </ul>
            </AlertDescription>
          </Alert>

          {isDevelopment ? (
            <>
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="reseed"
                    checked={reseedAfterReset}
                    onCheckedChange={(checked) =>
                      setReseedAfterReset(checked === true)
                    }
                  />
                  <div>
                    <Label
                      htmlFor="reseed"
                      className="cursor-pointer font-medium"
                    >
                      Reseed RBAC data after reset
                    </Label>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Automatically seed permissions and roles after wiping the
                      database
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                variant="destructive"
                className="w-full"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Database...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reset Database
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                Database reset is only available in development environment for
                safety reasons.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Database Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                You are about to <strong>permanently delete all data</strong>{" "}
                from your database. This action cannot be undone.
              </p>
              <p>
                To confirm, please type{" "}
                <strong className="text-red-600">CONFIRM RESET</strong> below:
              </p>
              <Input
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="Type 'CONFIRM RESET' here"
                className="font-mono"
              />
              {reseedAfterReset && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✓ RBAC data will be automatically seeded after the reset
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetConfirmation("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              disabled={resetConfirmation !== "CONFIRM RESET"}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
