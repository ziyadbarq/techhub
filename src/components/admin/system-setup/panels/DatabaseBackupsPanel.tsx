"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  createDatabaseBackupAction,
  deleteDatabaseBackupAction,
  cancelDatabaseBackupAction,
  listDatabaseBackupsAction,
  restoreDatabaseFromBackupAction,
} from "@/interface-adapters/controllers/database-backup.controller";
import type { DatabaseBackupDto } from "@/interface-adapters/dtos/database-backup.dto";
import { DatabaseBackupsTable } from "@/components/database-backups/DatabaseBackupsTable";
import {
  Loader2,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function formatStage(stage?: string | null) {
  if (!stage) return "—";
  return stage
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function DatabaseBackupsPanel() {
  const [backups, setBackups] = useState<DatabaseBackupDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<DatabaseBackupDto | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<DatabaseBackupDto | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState("");

  const activeJob = useMemo(
    () => backups.find((b) => b.status === "RUNNING" || b.status === "PENDING"),
    [backups],
  );
  const runningBackupId = activeJob?.id ?? null;
  const disableMutations = Boolean(runningBackupId);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listDatabaseBackupsAction();
      if (result.success) {
        setBackups(result.data);
      } else {
        toast.error(result.error || "Failed to load backups");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load backups",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    // Periodic refresh when a backup is running
    const interval = setInterval(() => {
      if (runningBackupId) {
        fetchBackups();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBackups, runningBackupId]);

  useEffect(() => {
    if (!runningBackupId) return;
    const eventSource = new EventSource(
      `/api/backups/${runningBackupId}/progress`,
    );
    eventSource.onmessage = (event) => {
      try {
        const progress = JSON.parse(
          event.data,
        ) as Partial<DatabaseBackupDto> & {
          backupId?: string;
        };
        const targetId = progress.backupId ?? runningBackupId;
        setBackups((prev) =>
          prev.map((backup) =>
            backup.id === targetId
              ? {
                  ...backup,
                  status:
                    (progress as { status?: DatabaseBackupDto["status"] })
                      .status ?? backup.status,
                  stage:
                    (progress as { stage?: DatabaseBackupDto["stage"] })
                      .stage ?? backup.stage,
                  percentage: progress.percentage ?? backup.percentage,
                  currentStep: progress.currentStep ?? backup.currentStep,
                  errorMessage:
                    (progress as { errorMessage?: string }).errorMessage ??
                    backup.errorMessage,
                }
              : backup,
          ),
        );
      } catch (_error) {
        // ignore malformed progress payloads
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => eventSource.close();
  }, [runningBackupId]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const result = await createDatabaseBackupAction({});
      if (result.success) {
        toast.success("Backup started");
        await fetchBackups();
      } else {
        toast.error(result.error || "Failed to create backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create backup",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = (backup: DatabaseBackupDto) => {
    setRestoreTarget(backup);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    if (restoreConfirmation !== "RESTORE DATABASE") {
      toast.error("Please type RESTORE DATABASE to confirm");
      return;
    }

    try {
      const result = await restoreDatabaseFromBackupAction(restoreTarget.id);
      if (result.success) {
        toast.success("Restore started");
        setRestoreDialogOpen(false);
        setRestoreConfirmation("");
        await fetchBackups();
      } else {
        toast.error(result.error || "Failed to start restore");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start restore",
      );
    }
  };

  const handleOpenCancel = (backup: DatabaseBackupDto) => {
    setCancelTarget(backup);
    setCancelConfirmation("");
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    if (cancelConfirmation !== "CANCEL BACKUP") {
      toast.error("Please type CANCEL BACKUP to confirm");
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelDatabaseBackupAction(cancelTarget.id);
      if (result.success) {
        toast.success("Backup cancelled");
        await fetchBackups();
      } else {
        toast.error(result.error || "Failed to cancel backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel backup",
      );
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setCancelTarget(null);
      setCancelConfirmation("");
    }
  };

  const handleDelete = async (backup: DatabaseBackupDto) => {
    try {
      const result = await deleteDatabaseBackupAction(backup.id);
      if (result.success) {
        toast.success("Backup deleted");
        setBackups((prev) => prev.filter((b) => b.id !== backup.id));
      } else {
        toast.error(result.error || "Failed to delete backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete backup",
      );
    }
  };

  const handleDownload = (backup: DatabaseBackupDto) => {
    window.open(`/api/backups/${backup.id}/download`, "_blank");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Database Backups
              </CardTitle>
              <CardDescription>
                Create, download, restore, and manage PostgreSQL backups.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={fetchBackups}
                disabled={isLoading}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={handleCreateBackup}
                disabled={isCreating || disableMutations}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Restoring a backup will overwrite all current data. Ensure you
                have the correct backup selected.
              </span>
            </AlertDescription>
          </Alert>

          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={runningBackupId ? "default" : "secondary"}>
              {runningBackupId ? "Backup in progress" : "Idle"}
            </Badge>
            <Separator
              orientation="vertical"
              className="hidden h-4 sm:inline"
            />
            <span>
              Storage path: local/backups (configurable via BACKUP_STORAGE_PATH)
            </span>
            {disableMutations && (
              <Badge
                variant="outline"
                className="border-amber-200 text-amber-700"
              >
                Actions locked while a job is running
              </Badge>
            )}
          </div>

          {activeJob && (
            <div className="bg-muted/40 rounded-lg border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    Active job
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatStage(activeJob.stage)}
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>{Math.round(activeJob.percentage ?? 0)}% complete</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleOpenCancel(activeJob)}
                    disabled={isCancelling}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Force cancel job
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Progress
                  value={Math.min(100, Math.max(0, activeJob.percentage ?? 0))}
                />
                {activeJob.currentStep && (
                  <p
                    className="text-muted-foreground text-xs"
                    title={activeJob.currentStep}
                  >
                    {activeJob.currentStep}
                  </p>
                )}
                {activeJob.errorMessage && (
                  <p
                    className="text-xs font-medium text-red-600"
                    title={activeJob.errorMessage}
                  >
                    {activeJob.errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 rounded-lg border p-6 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading backups...
            </div>
          ) : (
            <DatabaseBackupsTable
              backups={backups}
              onDownload={handleDownload}
              onRestore={handleRestore}
              onDelete={handleDelete}
              disableMutations={disableMutations}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Restore Database from Backup
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to restore the database from{" "}
                <span className="font-mono text-sm">
                  {restoreTarget?.filename}
                </span>
                . This will overwrite all existing data.
              </p>
              <p className="text-sm font-semibold text-red-600">
                This action cannot be undone. Type RESTORE DATABASE to confirm.
              </p>
              <Input
                value={restoreConfirmation}
                onChange={(e) => setRestoreConfirmation(e.target.value)}
                placeholder="RESTORE DATABASE"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRestoreDialogOpen(false);
                setRestoreConfirmation("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={restoreConfirmation !== "RESTORE DATABASE"}
              className="bg-red-600 hover:bg-red-700"
            >
              Restore Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Force Cancel Backup Job
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will stop processing{" "}
                <span className="font-mono text-sm">
                  {cancelTarget?.filename}
                </span>{" "}
                and mark it as cancelled.
              </p>
              <p className="text-muted-foreground text-sm">
                Use this only when a backup/restore job is stuck or the worker
                is offline.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Type <code>CANCEL BACKUP</code> to confirm.
                </p>
                <Input
                  value={cancelConfirmation}
                  onChange={(e) => setCancelConfirmation(e.target.value)}
                  placeholder="CANCEL BACKUP"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelTarget(null);
                setCancelConfirmation("");
              }}
            >
              Keep Running
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={isCancelling || cancelConfirmation !== "CANCEL BACKUP"}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
