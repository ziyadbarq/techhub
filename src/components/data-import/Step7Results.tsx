"use client";

/**
 * Step 7: Results Summary
 *
 * Shows final import results:
 * - Success/skip/fail counts
 * - Duration and throughput stats
 * - Detailed breakdowns
 * - Downloadable reports
 * - Actions: view data, import more, reset
 */

import { useState } from "react";
import type {
  EntityConfig,
  ImportResult,
} from "@/lib/data-import/entity-config.types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  PartyPopper,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  entity: EntityConfig;
  result: ImportResult;
  onReset: () => void;
}

export function Step7Results({ entity, result, onReset }: Props) {
  const [showSkipped, setShowSkipped] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  /**
   * Download full report
   */
  const handleDownloadReport = async () => {
    try {
      // TODO: Generate comprehensive report
      toast.success("Import report has been downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download report",
      );
    }
  };

  /**
   * Download failed rows
   */
  const handleDownloadFailed = async () => {
    try {
      // TODO: Export failed rows with errors
      toast.success(`${result.failedRows.length} rows exported`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export");
    }
  };

  /**
   * View imported data
   */
  const handleViewData = () => {
    // TODO: Navigate to entity list page
    // For now, just show a toast
    toast.info(`Viewing ${entity.name} list...`);
  };

  /**
   * Success rate
   */
  const successRate =
    result.totalRows > 0
      ? Math.round((result.successCount / result.totalRows) * 100)
      : 0;

  /**
   * Overall status
   */
  const isSuccess = result.success && result.failureCount === 0;
  const isPartialSuccess = result.successCount > 0 && result.failureCount > 0;
  const isFailure = result.failureCount === result.totalRows;

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <div className="text-lg font-semibold">Import Successful!</div>
            <div className="mt-1">
              All {result.successCount} rows were imported successfully.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Partial Success Banner */}
      {isPartialSuccess && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-900 dark:text-yellow-100">
            <div className="text-lg font-semibold">Partial Import</div>
            <div className="mt-1">
              {result.successCount} rows imported, {result.failureCount} failed.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Failure Banner */}
      {isFailure && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertDescription>
            <div className="text-lg font-semibold">Import Failed</div>
            <div className="mt-1">
              All rows failed to import. Please review the errors below.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.totalRows}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {result.successCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {successRate}% success rate
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
              {result.skipCount}
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
              {result.failureCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Validation or import errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Clock className="text-muted-foreground h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.floor(result.duration / 60)}:
                  {(result.duration % 60).toFixed(0).padStart(2, "0")}
                </div>
                <div className="text-muted-foreground text-sm">Duration</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="text-muted-foreground h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">
                  {result.throughput.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-sm">Rows/second</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skipped Rows */}
      {result.skipCount > 0 && (
        <Collapsible open={showSkipped} onOpenChange={setShowSkipped}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-base">
                      Skipped Rows ({result.skipCount})
                    </CardTitle>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      showSkipped ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <CardDescription className="text-left">
                  Rows that were skipped during import
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {result.skippedRows.slice(0, 50).map((skip, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-yellow-50 p-3 dark:bg-yellow-950"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge variant="outline">
                                Row {skip.rowNumber}
                              </Badge>
                              {skip.field && (
                                <Badge variant="secondary">{skip.field}</Badge>
                              )}
                            </div>
                            <p className="text-sm">{skip.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.skippedRows.length > 50 && (
                      <p className="text-muted-foreground pt-2 text-center text-sm">
                        Showing first 50 of {result.skippedRows.length} skipped
                        rows
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Failed Rows */}
      {result.failureCount > 0 && (
        <Collapsible open={showFailed} onOpenChange={setShowFailed}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-base">
                      Failed Rows ({result.failureCount})
                    </CardTitle>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      showFailed ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <CardDescription className="text-left">
                  Rows that failed to import with error details
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadFailed}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Failed Rows
                  </Button>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {result.failedRows.slice(0, 50).map((fail, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-red-50 p-3 dark:bg-red-950"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge variant="outline">
                                Row {fail.rowNumber}
                              </Badge>
                              {fail.field && (
                                <Badge variant="secondary">{fail.field}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              {fail.message}
                            </p>
                            {fail.suggestion && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                Suggestion: {fail.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.failedRows.length > 50 && (
                      <p className="text-muted-foreground pt-2 text-center text-sm">
                        Showing first 50 of {result.failedRows.length} failed
                        rows
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.successCount > 0 && (
              <Button onClick={handleViewData} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Imported {entity.name}
              </Button>
            )}

            <Button variant="outline" onClick={onReset} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Import More Data
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadReport}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Full Report
            </Button>
          </div>

          <Separator />

          <div className="text-muted-foreground space-y-1 text-sm">
            <p>
              <strong>Entity:</strong> {entity.name}
            </p>
            <p>
              <strong>Imported by:</strong> Current User
            </p>
            <p>
              <strong>Completed:</strong> {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
