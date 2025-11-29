"use client";

/**
 * Step 5: Validation Results
 *
 * Validates imported data and shows results:
 * - Valid vs invalid row counts
 * - Error categorization and summary
 * - Detailed error list with filtering
 * - Downloadable error reports
 * - Option to proceed or go back
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  EntityConfig,
  ImportSettings,
  ParsedFile,
  ColumnMapping,
  RowValidationResult,
  LookupMap,
  DuplicatePreview,
} from "@/lib/data-import/entity-config.types";
import { importProcessor } from "@/lib/data-import/import-processor";
import { templateGenerator } from "@/lib/data-import/template-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Search,
  ChevronRight,
  RefreshCw,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  entity: EntityConfig;
  settings: ImportSettings;
  parsedFile: ParsedFile;
  columnMappings: ColumnMapping[];
  lookupMaps: Map<string, LookupMap>;
  onValidationComplete: (
    validRows: RowValidationResult[],
    invalidRows: RowValidationResult[],
  ) => void;
  onBack: () => void;
}

export function Step5ValidationResults({
  entity,
  settings,
  parsedFile,
  columnMappings,
  lookupMaps,
  onValidationComplete,
  onBack,
}: Props) {
  const [isValidating, setIsValidating] = useState(true);
  const [validRows, setValidRows] = useState<RowValidationResult[]>([]);
  const [invalidRows, setInvalidRows] = useState<RowValidationResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");

  // Duplicate preview state
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicatePreview, setDuplicatePreview] =
    useState<DuplicatePreview | null>(null);

  // Guard against React Strict Mode double-execution
  const validationStartedRef = useRef(false);

  /**
   * Run validation on mount
   */
  useEffect(() => {
    // Prevent double-execution in React Strict Mode
    if (validationStartedRef.current) {
      return;
    }
    validationStartedRef.current = true;

    const runValidation = async () => {
      try {
        // Remap data based on column mappings
        const remappedRows = parsedFile.rows.map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const remapped: Record<string, any> = {};

          for (const mapping of columnMappings) {
            if (mapping.isMapped && mapping.csvColumn) {
              remapped[mapping.entityField] = row[mapping.csvColumn];
            }
          }

          return remapped;
        });

        // Validate data
        const result = await importProcessor.validateData(
          remappedRows,
          entity,
          settings,
          lookupMaps,
        );

        setValidRows(result.validRows);
        setInvalidRows(result.invalidRows);

        if (result.invalidRows.length > 0) {
          toast.warning(
            `Validation complete: ${result.validRows.length} valid, ${result.invalidRows.length} invalid`,
          );
        } else {
          toast.success(
            `Validation complete: ${result.validRows.length} rows valid`,
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to validate data",
        );
      } finally {
        setIsValidating(false);
      }
    };

    runValidation();
  }, [entity, settings, parsedFile, columnMappings, lookupMaps]);

  /**
   * Check for duplicates after validation completes
   */
  const checkDuplicates = useCallback(
    async (rows: RowValidationResult[]) => {
      // Only check if entity has checkDuplicatesAction configured
      if (!entity.checkDuplicatesAction || rows.length === 0) {
        return;
      }

      setIsCheckingDuplicates(true);

      try {
        // Collect unique field values from valid rows
        // For assets, this is typically serialNumber
        const uniqueValues: string[] = [];
        const primaryUniqueField = entity.uniqueFields[0]; // e.g., "serialNumber"

        for (const row of rows) {
          const value = row.data[primaryUniqueField];
          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {
            uniqueValues.push(String(value));
          }
        }

        if (uniqueValues.length === 0) {
          setDuplicatePreview({
            totalRows: rows.length,
            toCreateCount: rows.length,
            toUpdateCount: 0,
            toSkipCount: 0,
            existingRecordsMap: new Map(),
          });
          return;
        }

        // Call the checkDuplicatesAction to find existing records
        const result = await entity.checkDuplicatesAction(uniqueValues);

        if (result.success && result.data) {
          const duplicateSet = new Set<string>();
          const existingRecordsMap = new Map<
            string,
            { id: string; displayValue: string }
          >();

          for (const dup of result.data.duplicates) {
            const value = dup[primaryUniqueField] as string;
            if (value) {
              const normalizedValue = value.toLowerCase();
              duplicateSet.add(normalizedValue);
              existingRecordsMap.set(normalizedValue, {
                id: dup.id,
                displayValue: value,
              });
            }
          }

          // Count how many of our valid rows are duplicates
          let duplicateCount = 0;
          for (const row of rows) {
            const value = row.data[primaryUniqueField];
            if (value && duplicateSet.has(String(value).toLowerCase())) {
              duplicateCount++;
            }
          }

          // Set counts based on duplicate strategy
          const newCount = rows.length - duplicateCount;
          const toUpdateCount =
            settings.duplicateStrategy === "overwrite" ? duplicateCount : 0;
          const toSkipCount =
            settings.duplicateStrategy === "skip" ? duplicateCount : 0;

          setDuplicatePreview({
            totalRows: rows.length,
            toCreateCount: newCount,
            toUpdateCount,
            toSkipCount,
            existingRecordsMap,
          });
        }
      } catch (error) {
        console.error("Failed to check duplicates:", error);
        // Don't show error toast - this is a non-critical feature
      } finally {
        setIsCheckingDuplicates(false);
      }
    },
    [entity, settings.duplicateStrategy],
  );

  // Trigger duplicate check when valid rows are available
  useEffect(() => {
    if (!isValidating && validRows.length > 0) {
      checkDuplicates(validRows);
    }
  }, [isValidating, validRows, checkDuplicates]);

  /**
   * Get error types
   */
  const errorTypes = useMemo(() => {
    const types = new Set<string>();

    for (const row of invalidRows) {
      for (const error of row.errors) {
        // Extract error type from message
        const type = error.field || "Unknown";
        types.add(type);
      }
    }

    return Array.from(types).sort();
  }, [invalidRows]);

  /**
   * Filter invalid rows
   */
  const filteredInvalidRows = useMemo(() => {
    return invalidRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          row.rowNumber.toString().includes(query) ||
          row.errors.some((e) => e.message.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Error type filter
      if (errorTypeFilter !== "all") {
        const hasErrorType = row.errors.some(
          (e) => e.field === errorTypeFilter,
        );
        if (!hasErrorType) return false;
      }

      return true;
    });
  }, [invalidRows, searchQuery, errorTypeFilter]);

  /**
   * Download error report
   */
  const handleDownloadErrors = async () => {
    try {
      const errorData = invalidRows.map((row) => ({
        rowNumber: row.rowNumber,
        field: row.errors.map((e) => e.field).join(", "),
        value: row.errors.map((e) => e.value).join(", "),
        error: row.errors.map((e) => e.message).join("; "),
      }));

      await templateGenerator.exportErrorReport(
        errorData,
        parsedFile.rows,
        `${entity.name.toLowerCase()}_errors`,
      );

      toast.success(
        `Error report downloaded: ${invalidRows.length} error(s) exported`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export errors",
      );
    }
  };

  /**
   * Continue to import
   */
  const handleContinue = () => {
    onValidationComplete(validRows, invalidRows);
  };

  /**
   * Success rate
   */
  const successRate = useMemo(() => {
    const total = validRows.length + invalidRows.length;
    return total > 0 ? Math.round((validRows.length / total) * 100) : 0;
  }, [validRows, invalidRows]);

  if (isValidating) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" />
              <div className="space-y-2 text-center">
                <p className="font-medium">Validating Data...</p>
                <p className="text-muted-foreground text-sm">
                  Checking {parsedFile.rowCount} rows
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions (top) */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={validRows.length === 0}>
          {invalidRows.length > 0
            ? `Import ${validRows.length} Valid Rows`
            : "Continue to Import"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validation Complete</CardTitle>
          <CardDescription>
            {validRows.length} of {validRows.length + invalidRows.length} rows
            passed validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{validRows.length}</div>
                <div className="text-muted-foreground text-sm">Valid Rows</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{invalidRows.length}</div>
                <div className="text-muted-foreground text-sm">
                  Invalid Rows
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Preview */}
      {entity.checkDuplicatesAction && validRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Copy className="h-4 w-4" />
              Duplicate Detection Preview
              {isCheckingDuplicates && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
            <CardDescription>
              Based on your duplicate strategy:{" "}
              <Badge variant="secondary">{settings.duplicateStrategy}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckingDuplicates ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground text-sm">
                  Checking for existing records...
                </div>
              </div>
            ) : duplicatePreview ? (
              <div className="space-y-4">
                {/* Preview Counts */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="text-xl font-bold">
                        {duplicatePreview.toCreateCount}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Will be Created
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                    <Copy className="h-6 w-6 text-amber-600" />
                    <div>
                      <div className="text-xl font-bold">
                        {settings.duplicateStrategy === "overwrite"
                          ? duplicatePreview.toUpdateCount
                          : settings.duplicateStrategy === "skip"
                            ? duplicatePreview.toSkipCount
                            : duplicatePreview.existingRecordsMap.size}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {settings.duplicateStrategy === "overwrite"
                          ? "Will be Updated"
                          : settings.duplicateStrategy === "skip"
                            ? "Will be Skipped"
                            : settings.duplicateStrategy === "fail"
                              ? "Will Fail"
                              : "Will be Appended"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <RefreshCw className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-xl font-bold">
                        {duplicatePreview.totalRows}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Total Valid Rows
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy explanation */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {settings.duplicateStrategy === "overwrite" && (
                      <span>
                        <strong>Overwrite:</strong> Existing records with
                        matching unique identifiers will be updated with the
                        imported data.
                        {duplicatePreview.toUpdateCount > 0 &&
                          ` ${duplicatePreview.toUpdateCount} record(s) will be updated.`}
                      </span>
                    )}
                    {settings.duplicateStrategy === "skip" && (
                      <span>
                        <strong>Skip:</strong> Records with matching unique
                        identifiers will be skipped (not imported).
                        {duplicatePreview.toSkipCount > 0 &&
                          ` ${duplicatePreview.toSkipCount} record(s) will be skipped.`}
                      </span>
                    )}
                    {settings.duplicateStrategy === "fail" && (
                      <span>
                        <strong>Fail:</strong> Import will fail if any
                        duplicates are found.
                        {duplicatePreview.existingRecordsMap.size > 0 && (
                          <span className="text-red-600">
                            {" "}
                            Warning: {
                              duplicatePreview.existingRecordsMap.size
                            }{" "}
                            duplicate(s) detected!
                          </span>
                        )}
                      </span>
                    )}
                    {settings.duplicateStrategy === "append" && (
                      <span>
                        <strong>Append:</strong> Duplicate records will be
                        created with modified identifiers.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Sample duplicates */}
                {duplicatePreview.existingRecordsMap.size > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Sample existing records found:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(duplicatePreview.existingRecordsMap.values())
                        .slice(0, 10)
                        .map((record, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {record.displayValue}
                          </Badge>
                        ))}
                      {duplicatePreview.existingRecordsMap.size > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{duplicatePreview.existingRecordsMap.size - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No duplicate check data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Options */}
      {invalidRows.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2 font-medium">What would you like to do?</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onBack}>
                Go Back & Fix Errors
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadErrors}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Error Report
              </Button>
              {validRows.length > 0 && (
                <Button size="sm" onClick={handleContinue}>
                  Import {validRows.length} Valid Rows
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Details */}
      {invalidRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Details</CardTitle>
            <CardDescription>
              Review validation errors and warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={errorTypeFilter}
                onValueChange={setErrorTypeFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Errors</SelectItem>
                  {errorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="w-32">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvalidRows.slice(0, 50).map((row) =>
                    row.errors.map((error, i) => (
                      <TableRow key={`${row.rowNumber}-${i}`}>
                        <TableCell className="font-mono">
                          <Badge variant="outline">{row.rowNumber}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {error.field}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                            <span className="text-sm">{error.message}</span>
                          </div>
                          {error.suggestion && (
                            <div className="text-muted-foreground mt-1 text-xs">
                              Suggestion: {error.suggestion}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                          {String(error.value || "")}
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredInvalidRows.length > 50 && (
              <p className="text-muted-foreground text-center text-sm">
                Showing first 50 errors. Download the full report for complete
                details.
              </p>
            )}

            {filteredInvalidRows.length === 0 && invalidRows.length > 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No errors match your filters
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
    </div>
  );
}
