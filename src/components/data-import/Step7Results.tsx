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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  RotateCcw,
  PartyPopper,
  Clock,
  Zap,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  entity: EntityConfig;
  result: ImportResult;
  onReset: () => void;
}

export function Step7Results({ entity, result, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<string>("summary");

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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
              <Plus className="h-4 w-4 text-green-600" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {result.createCount}
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
              {result.updateCount}
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

      {/* Detailed Results Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Details</CardTitle>
          <CardDescription>
            View detailed breakdown of all imported records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="created" className="gap-2">
                <Plus className="h-4 w-4" />
                Created
                {result.createCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {result.createCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="updated" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Updated
                {result.updateCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {result.updateCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="skipped" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Skipped
                {result.skipCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {result.skipCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-2">
                <XCircle className="h-4 w-4" />
                Failed
                {result.failureCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {result.failureCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Created Records Tab */}
            <TabsContent value="created" className="mt-4">
              {result.createCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Plus className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No records were created
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.createdRecords.slice(0, 100).map((record, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {record.assetTag ||
                                record.code ||
                                record.id ||
                                `Record ${i + 1}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {record.serialNumber &&
                              `Serial: ${record.serialNumber}`}
                            {record.name && record.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.createdRecords.length > 100 && (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      Showing first 100 of {result.createdRecords.length}{" "}
                      created records
                    </p>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            {/* Updated Records Tab */}
            <TabsContent value="updated" className="mt-4">
              {result.updateCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No records were updated
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.updatedRecords.slice(0, 100).map((record, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {record.assetTag ||
                                record.code ||
                                record.id ||
                                `Record ${i + 1}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {record.serialNumber &&
                              `Serial: ${record.serialNumber}`}
                            {record.name && record.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.updatedRecords.length > 100 && (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      Showing first 100 of {result.updatedRecords.length}{" "}
                      updated records
                    </p>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            {/* Skipped Rows Tab */}
            <TabsContent value="skipped" className="mt-4">
              {result.skipCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No records were skipped
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-80">
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
              )}
            </TabsContent>

            {/* Failed Rows Tab */}
            <TabsContent value="failed" className="mt-4">
              {result.failureCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
                  <p className="text-muted-foreground">
                    No failures - all records processed successfully!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
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
                  <ScrollArea className="h-72">
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
                                  <Badge variant="secondary">
                                    {fail.field}
                                  </Badge>
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
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
