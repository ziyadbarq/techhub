"use client";

/**
 * Step 6: Import Progress
 *
 * Shows real-time import progress:
 * - Progress bar and percentage
 * - Success/skip/fail counters
 * - Recent activity feed
 * - Time elapsed and estimated remaining
 * - Batch processing status
 */

import { useState, useEffect, useCallback } from "react";
import type {
  EntityConfig,
  ImportSettings,
  RowValidationResult,
  ImportResult,
  ImportProgress,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { importProcessor } from "@/lib/data-import/import-processor";
import { processUniversalAssetsImportAction } from "@/interface-adapters/controllers/universal-assets-import.controller";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  entity: EntityConfig;
  settings: ImportSettings;
  validRows: RowValidationResult[];
  lookupMaps: Map<string, LookupMap>;
  onImportComplete: (result: ImportResult) => void;
}

export function Step6ImportProgress({
  entity,
  settings,
  validRows,
  lookupMaps,
  onImportComplete,
}: Props) {
  const [progress, setProgress] = useState<ImportProgress>({
    status: "importing",
    totalRows: validRows.length,
    processedRows: 0,
    successCount: 0,
    skipCount: 0,
    failureCount: 0,
    createCount: 0,
    updateCount: 0,
    currentBatch: 0,
    totalBatches: Math.ceil(validRows.length / settings.batchSize),
    startTime: new Date(),
    elapsedSeconds: 0,
    recentActivity: [],
    errors: [],
  });

  /**
   * Update progress
   */
  const updateProgress = useCallback((update: Partial<ImportProgress>) => {
    setProgress((prev) => ({ ...prev, ...update }));
  }, []);

  /**
   * Check if this is a Universal Assets import
   */
  const isUniversalAssetsImport = entity.key === "UNIVERSAL_ASSETS";

  /**
   * Run import
   */
  useEffect(() => {
    const runImport = async () => {
      try {
        let result: ImportResult;

        if (isUniversalAssetsImport) {
          // Use Universal Assets specific import
          const rows = validRows.map((r) => r.data);
          const columnHeaders = Object.keys(validRows[0]?.data || {});

          const response = await processUniversalAssetsImportAction(
            rows,
            columnHeaders,
            {
              autoCreateMissingEntities: true,
              skipRowOnAutoCreateFailure: true,
              handleAssignmentChanges: true,
              closeOldAssignmentsOnReassign: true,
            },
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || "Universal Assets Import failed");
          }

          // Convert UniversalImportResult to ImportResult
          const universalResult = response.data;
          result = {
            success: universalResult.success,
            totalRows: universalResult.totalRows,
            successCount: universalResult.successCount,
            skipCount: universalResult.skipCount,
            failureCount: universalResult.failureCount,
            createCount: universalResult.assetsCreated,
            updateCount: universalResult.assetsUpdated,
            duration: universalResult.duration,
            throughput: universalResult.throughput,
            createdRecords: [],
            updatedRecords: [],
            skippedRows: universalResult.skipped.map((s) => ({
              rowNumber: s.rowNumber,
              message: s.reason,
            })),
            failedRows: universalResult.errors.map((e) => ({
              rowNumber: e.rowNumber,
              message: e.error,
              suggestion: e.suggestion,
            })),
          };

          // Update progress with final stats
          updateProgress({
            status: "completed",
            processedRows: universalResult.totalRows,
            successCount: universalResult.successCount,
            skipCount: universalResult.skipCount,
            failureCount: universalResult.failureCount,
            createCount: universalResult.assetsCreated,
            updateCount: universalResult.assetsUpdated,
            recentActivity: [
              {
                timestamp: new Date(),
                type: "success",
                message: `Created ${universalResult.assetsCreated} assets, updated ${universalResult.assetsUpdated}`,
              },
              ...(universalResult.autoCreatedEntities.length > 0
                ? [
                    {
                      timestamp: new Date(),
                      type: "success" as const,
                      message: `Auto-created ${universalResult.autoCreatedEntities.filter((e) => e.action === "created").length} related entities`,
                    },
                  ]
                : []),
              ...(universalResult.assignmentsCreated > 0
                ? [
                    {
                      timestamp: new Date(),
                      type: "success" as const,
                      message: `Created ${universalResult.assignmentsCreated} assignments`,
                    },
                  ]
                : []),
            ],
          });
        } else {
          // Use standard import processor
          result = await importProcessor.processImport(
            validRows,
            entity,
            settings,
            lookupMaps,
            (progressUpdate) => {
              updateProgress(progressUpdate);
            },
          );
        }

        // Auto-advance to results after a brief delay
        setTimeout(() => {
          onImportComplete(result);
        }, 1500);
      } catch (error) {
        updateProgress({
          status: "failed",
          errors: [
            {
              rowNumber: 0,
              message: error instanceof Error ? error.message : "Import failed",
            },
          ],
        });
      }
    };

    runImport();
  }, [
    entity,
    settings,
    validRows,
    lookupMaps,
    onImportComplete,
    updateProgress,
    isUniversalAssetsImport,
  ]);

  /**
   * Update elapsed time
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor(
          (Date.now() - prev.startTime.getTime()) / 1000,
        ),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Progress percentage
   */
  const progressPercentage =
    progress.totalRows > 0
      ? Math.round((progress.processedRows / progress.totalRows) * 100)
      : 0;

  /**
   * Format time
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: ImportProgress["status"]) => {
    switch (status) {
      case "importing":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  /**
   * Get activity icon
   */
  const getActivityIcon = (type: "success" | "skip" | "error") => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "skip":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Loader2
                  className={`h-5 w-5 ${progress.status === "importing" ? "animate-spin" : ""}`}
                />
                <span className={getStatusColor(progress.status)}>
                  {progress.status === "importing" && "Importing..."}
                  {progress.status === "completed" && "Import Complete!"}
                  {progress.status === "failed" && "Import Failed"}
                </span>
              </CardTitle>
              <CardDescription>
                Processing batch {progress.currentBatch} of{" "}
                {progress.totalBatches}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{progressPercentage}%</div>
              <div className="text-muted-foreground text-sm">
                {progress.processedRows} / {progress.totalRows}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="h-2" />

          {/* Time Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Elapsed: {formatTime(progress.elapsedSeconds)}</span>
            </div>
            {progress.estimatedRemainingSeconds !== undefined && (
              <div className="text-muted-foreground">
                Est. remaining: {formatTime(progress.estimatedRemainingSeconds)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {progress.successCount}
                </div>
                <div className="text-muted-foreground text-sm">Created</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{progress.skipCount}</div>
                <div className="text-muted-foreground text-sm">Skipped</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {progress.failureCount}
                </div>
                <div className="text-muted-foreground text-sm">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Live feed of import operations</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {progress.recentActivity.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Starting import...
                </p>
              ) : (
                progress.recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-2 transition-colors"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{activity.message}</p>
                      {activity.rowNumber && (
                        <p className="text-muted-foreground text-xs">
                          Row {activity.rowNumber}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Errors */}
      {progress.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">
              Errors ({progress.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {progress.errors.slice(0, 10).map((error, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-950"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Row {error.rowNumber}
                        {error.field && `: ${error.field}`}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {error.message}
                      </p>
                    </div>
                  </div>
                ))}
                {progress.errors.length > 10 && (
                  <p className="text-muted-foreground pt-2 text-center text-sm">
                    ...and {progress.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Import Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Entity:</span>
              <span className="ml-2 font-medium">{entity.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Batch Size:</span>
              <span className="ml-2 font-medium">{settings.batchSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duplicate Strategy:</span>
              <Badge variant="secondary" className="ml-2">
                {settings.duplicateStrategy}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Dry Run:</span>
              <Badge
                variant={settings.dryRun ? "default" : "secondary"}
                className="ml-2"
              >
                {settings.dryRun ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
