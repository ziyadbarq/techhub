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

import { useState, useEffect, useCallback, useRef } from "react";
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
import { ensureFeatureEnabledForImportAction } from "@/interface-adapters/controllers/data-import.controller";
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
  Plus,
  RefreshCw,
  Info,
  AlertTriangle,
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
  // Guard against React Strict Mode double-execution
  const importStartedRef = useRef(false);

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

  // Separate state for skipped rows (not in ImportProgress type)
  const [skippedRows, setSkippedRows] = useState<
    Array<{ rowNumber: number; reason: string }>
  >([]);

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
    // Prevent double-execution in React Strict Mode
    if (importStartedRef.current) {
      return;
    }
    importStartedRef.current = true;

    const runImport = async () => {
      try {
        // Check if the feature is enabled before importing
        const featureGuardResult = await ensureFeatureEnabledForImportAction(
          entity.featureFlag,
        );
        if (!featureGuardResult.success) {
          throw new Error(
            featureGuardResult.error ??
              `${entity.name} import is unavailable because its feature is disabled.`,
          );
        }

        let result: ImportResult;

        if (isUniversalAssetsImport) {
          // Use Universal Assets specific import
          const rows = validRows.map((r) => r.data);
          const columnHeaders = Object.keys(validRows[0]?.data || {});

          const response = await processUniversalAssetsImportAction(
            rows,
            columnHeaders,
            {
              // Universal-specific settings (hardcoded defaults)
              autoCreateMissingEntities: true,
              skipRowOnAutoCreateFailure: true,
              handleAssignmentChanges: true,
              closeOldAssignmentsOnReassign: true,
              requirePersonForImport: false, // Allow assets without assignment
              // Standard import settings from Step 2
              duplicateStrategy: settings.duplicateStrategy,
              autoTrimWhitespace: settings.autoTrimWhitespace,
              normalizeText: settings.normalizeText,
              skipEmptyRows: settings.skipEmptyRows,
              autoFixCommonErrors: settings.autoFixCommonErrors,
              dryRun: settings.dryRun,
              stopOnFirstError: settings.stopOnFirstError,
              maxErrorsBeforeAbort: settings.maxErrorsBeforeAbort,
            },
          );

          if (!response) {
            throw new Error("No response received from server");
          }

          // Handle case where import completed but all rows were skipped/failed
          if (!response.success && response.data) {
            const data = response.data;

            // Store skipped rows for display
            setSkippedRows(
              data.skipped.map((s) => ({
                rowNumber: s.rowNumber,
                reason: s.reason,
              })),
            );

            // Determine status: "completed" for skips only, "failed" for actual errors
            const hasOnlySkips = data.failureCount === 0 && data.skipCount > 0;

            // Update progress with the actual counts
            updateProgress({
              status: hasOnlySkips ? "completed" : "failed",
              processedRows: data.totalRows,
              successCount: data.successCount,
              skipCount: data.skipCount,
              failureCount: data.failureCount,
              createCount: data.assetsCreated,
              updateCount: data.assetsUpdated,
              errors: data.errors.map((e) => ({
                rowNumber: e.rowNumber,
                message: e.error,
              })),
              recentActivity: data.skipped.slice(0, 5).map((s) => ({
                timestamp: new Date(),
                type: "skip" as const,
                message: s.reason,
                rowNumber: s.rowNumber,
              })),
            });

            // For all-skipped (no actual failures), proceed to results page
            // This shows the user what happened without treating it as an error
            if (hasOnlySkips) {
              const result: ImportResult = {
                success: false,
                totalRows: data.totalRows,
                successCount: data.successCount,
                skipCount: data.skipCount,
                failureCount: data.failureCount,
                createCount: data.assetsCreated,
                updateCount: data.assetsUpdated,
                duration: data.duration,
                throughput: data.throughput,
                createdRecords: [],
                updatedRecords: [],
                skippedRows: data.skipped.map((s) => ({
                  rowNumber: s.rowNumber,
                  message: s.reason,
                })),
                failedRows: [],
              };

              // Proceed to results after brief delay
              setTimeout(() => {
                onImportComplete(result);
              }, 2000);
              return;
            }

            // For actual failures, throw error
            const errorDetails =
              data.errors
                ?.slice(0, 3)
                .map((e) => e.error)
                .join("; ") || "";
            throw new Error(
              `Import failed: ${data.failureCount} row(s) had errors${errorDetails ? `: ${errorDetails}` : "."}`,
            );
          }

          if (!response.success || !response.data) {
            // Log full response for debugging
            console.error("Universal Assets Import failed:", {
              success: response.success,
              error: response.error,
              hasData: !!response.data,
            });
            throw new Error(
              response.error ||
                "Universal Assets Import failed - check server logs",
            );
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
            createdRecords: universalResult.createdAssets.map((asset) => ({
              id: asset.id,
              assetTag: asset.assetTag,
              serialNumber: asset.serialNumber,
              rowNumber: asset.rowNumber,
            })),
            updatedRecords: universalResult.updatedAssets.map((asset) => ({
              id: asset.id,
              assetTag: asset.assetTag,
              serialNumber: asset.serialNumber,
              rowNumber: asset.rowNumber,
            })),
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
              // Show duplicate warnings if any
              ...(universalResult.warnings?.filter(
                (w) => w.type === "duplicate_serial_number",
              ).length
                ? [
                    {
                      timestamp: new Date(),
                      type: "skip" as const,
                      message: `Warning: ${universalResult.warnings.filter((w) => w.type === "duplicate_serial_number").length} duplicate serial number(s) in file`,
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
        console.error("Import failed:", error);

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
    // Only run timer while importing
    if (progress.status !== "importing") {
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor(
          (Date.now() - prev.startTime.getTime()) / 1000,
        ),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.status]);

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
   * Get comprehensive status info based on outcome
   */
  const getStatusInfo = () => {
    if (progress.status === "importing") {
      return {
        label: "Importing...",
        color: "text-blue-600",
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
      };
    }

    const { successCount, skipCount, failureCount, totalRows } = progress;

    // Full success: all rows imported
    if (successCount === totalRows && totalRows > 0) {
      return {
        label: "Import Complete!",
        color: "text-green-600",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      };
    }

    // Partial success: some rows imported, some skipped/failed
    if (successCount > 0 && (skipCount > 0 || failureCount > 0)) {
      return {
        label: "Import Complete with Issues",
        color: "text-yellow-600",
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      };
    }

    // All skipped: no imports, but validation issues (not errors)
    if (skipCount > 0 && failureCount === 0 && successCount === 0) {
      return {
        label: "No Assets Imported",
        color: "text-yellow-600",
        icon: <Info className="h-5 w-5 text-yellow-600" />,
      };
    }

    // All failed: actual errors
    if (failureCount > 0) {
      return {
        label: "Import Failed",
        color: "text-red-600",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      };
    }

    // System error or unknown state
    return {
      label: "Import Error",
      color: "text-red-600",
      icon: <XCircle className="h-5 w-5 text-red-600" />,
    };
  };

  const statusInfo = getStatusInfo();

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
                {statusInfo.icon}
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </CardTitle>
              <CardDescription>
                {progress.status === "importing"
                  ? `Processing batch ${progress.currentBatch} of ${progress.totalBatches}`
                  : `Processed ${progress.processedRows} row(s)`}
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4 text-green-600" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {progress.createCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">New records</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {progress.updateCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Existing records modified
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {progress.skipCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Duplicates or filtered
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {progress.failureCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Validation or import errors
            </p>
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

      {/* Skipped Rows */}
      {skippedRows.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Skipped Rows ({skippedRows.length})
            </CardTitle>
            <CardDescription>
              These rows were not imported due to validation issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {skippedRows.slice(0, 10).map((skip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Row {skip.rowNumber}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {skip.reason}
                      </p>
                    </div>
                  </div>
                ))}
                {skippedRows.length > 10 && (
                  <p className="text-muted-foreground pt-2 text-center text-sm">
                    ...and {skippedRows.length - 10} more skipped rows
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Errors - only show for actual failures, not skips */}
      {progress.failureCount > 0 && progress.errors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <XCircle className="h-4 w-4" />
              Errors ({progress.errors.length})
            </CardTitle>
            <CardDescription>
              These rows failed to import due to errors
            </CardDescription>
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
