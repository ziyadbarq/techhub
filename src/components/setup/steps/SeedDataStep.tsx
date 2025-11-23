"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Database, Users, Shield } from "lucide-react";
import { seedMinimalDataAction } from "@/interface-adapters/controllers/setup.controller";
import { toast } from "sonner";

interface SeedDataStepProps {
  onComplete: () => void;
  onProcessing: (processing: boolean) => void;
  onBack: () => void;
}

export function SeedDataStep({
  onComplete,
  onProcessing,
  onBack,
}: SeedDataStepProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    rolesCreated: number;
    permissionsCreated: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    onProcessing(true);
    setError(null);

    try {
      const result = await seedMinimalDataAction();

      if (result.success && result.data.success) {
        setIsSeeded(true);
        setSeedResult(result.data.details || null);
        toast.success("RBAC data seeded successfully!");
      } else {
        const errorMessage =
          (result.success ? result.data.message : result.error) ||
          "Failed to seed data";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSeeding(false);
      onProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Explanation */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Initialization
        </h3>
        <p className="text-sm text-muted-foreground">
          This step will initialize the database with essential RBAC (Role-Based
          Access Control) data required for the system to function properly.
        </p>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>
              <strong>269 Permissions</strong> - Organized into 14 logical groups
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>
              <strong>10 System Roles</strong> - Including System Administrator,
              IT Help Desk, Auditor, and more
            </span>
          </div>
        </div>
      </div>

      {/* Seeding Result */}
      {isSeeded && seedResult && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Database initialized successfully!</p>
              <div className="text-sm text-muted-foreground">
                <p>• {seedResult.permissionsCreated} permissions created</p>
                <p>• {seedResult.rolesCreated} roles created</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if not seeded */}
      {!isSeeded && (
        <Alert variant="default">
          <AlertDescription>
            <p className="font-medium mb-2">⚠️ Important</p>
            <p className="text-sm">
              This operation will create the foundational RBAC structure in your
              database. Make sure your database is empty or ready for seeding.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" disabled={isSeeding}>
          Back
        </Button>

        {!isSeeded ? (
          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex-1"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Database...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Initialize Database
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onComplete} className="flex-1">
            Continue to Next Step
          </Button>
        )}
      </div>
    </div>
  );
}
