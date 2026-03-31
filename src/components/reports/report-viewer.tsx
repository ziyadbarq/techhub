/**
 * Report Viewer Component
 *
 * Displays report data in a sortable table with summary stats
 * and customizable column visibility.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Columns3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { runReportAction } from "@/interface-adapters/controllers/reports/report.controller";
import { ReportFilterBar } from "./report-filter-bar";
import { ReportExportToolbar } from "./report-export-toolbar";
import { ReportScheduleDialog } from "./report-schedule-dialog";
import type {
  ReportDefinition,
  ReportResult,
  ReportColumnDefinition,
  ReportSummaryStat,
} from "@/core/domain/reports/report-types";
import { formatDate } from "@/lib/utils/date-format";

interface ReportViewerProps {
  definition: ReportDefinition;
}

export function ReportViewer({ definition }: ReportViewerProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => {
      const defaults: Record<string, string> = {};
      for (const f of definition.filters) {
        if (f.defaultValue && typeof f.defaultValue === "string") {
          defaults[f.key] = f.defaultValue;
        }
      }
      return defaults;
    },
  );

  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Column visibility: persisted in localStorage per report
  const storageKey = `report-hidden-cols:${definition.id}`;

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = localStorage.getItem(storageKey);
      return stored
        ? new Set(JSON.parse(stored) as string[])
        : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const visibleColumns = useMemo(
    () => definition.columns.filter((col) => !hiddenColumns.has(col.key)),
    [definition.columns, hiddenColumns],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        } catch {
          /* quota exceeded — ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRun = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runReportAction({
        reportId: definition.id,
        filters: filterValues,
      });
      if (res.success) {
        setResult(res.data);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to run report");
    } finally {
      setLoading(false);
    }
  }, [definition.id, filterValues]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortAsc(!sortAsc);
      } else {
        setSortKey(key);
        setSortAsc(true);
      }
    },
    [sortKey, sortAsc],
  );

  // Sort rows
  const sortedRows = result?.rows
    ? [...result.rows].sort((a, b) => {
        if (!sortKey) return 0;
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortAsc ? 1 : -1;
        if (bVal == null) return sortAsc ? -1 : 1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        const strA = String(aVal);
        const strB = String(bVal);
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      })
    : [];

  // Filter summary stats by visible columns
  const visibleColumnKeys = new Set(visibleColumns.map((c) => c.key));
  const visibleStats =
    result?.summaryStats.filter(
      (stat) => !stat.columnKey || visibleColumnKeys.has(stat.columnKey),
    ) ?? [];

  // Dynamic description based on visible columns
  const dynamicDescription =
    hiddenColumns.size > 0
      ? `Showing: ${visibleColumns.map((c) => c.label).join(", ")}.`
      : definition.description;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ReportFilterBar
            filters={definition.filters}
            values={filterValues}
            onChange={handleFilterChange}
            onRun={handleRun}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary Stats */}
          {visibleStats.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleStats.map((stat) => (
                <SummaryStatCard key={stat.label} stat={stat} />
              ))}
            </div>
          )}

          {/* Export toolbar + column picker + data table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{definition.name}</CardTitle>
                  <CardDescription>
                    {dynamicDescription}
                    {" · "}
                    {result.totalRows} row{result.totalRows !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Column Picker */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Columns3 className="mr-1 h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {definition.columns.map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={!hiddenColumns.has(col.key)}
                          onCheckedChange={() => toggleColumn(col.key)}
                        >
                          {col.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ReportExportToolbar
                    reportId={definition.id}
                    reportName={definition.name}
                    filters={filterValues}
                    hiddenColumns={Array.from(hiddenColumns)}
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                    hasData={result.rows.length > 0}
                  />
                  <ReportScheduleDialog
                    reportId={definition.id}
                    reportName={definition.name}
                    currentFilters={filterValues}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.map((col) => (
                          <TableHead
                            key={col.key}
                            className={
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            }
                          >
                            {col.sortable ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="-ml-3 h-8"
                                onClick={() => handleSort(col.key)}
                              >
                                {col.label}
                                <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            ) : (
                              col.label
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRows.map((row, i) => (
                        <TableRow key={i}>
                          {visibleColumns.map((col) => (
                            <TableCell
                              key={col.key}
                              className={
                                col.align === "right"
                                  ? "text-right"
                                  : col.align === "center"
                                    ? "text-center"
                                    : ""
                              }
                            >
                              <CellValue value={row[col.key]} column={col} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-32 items-center justify-center">
                  No data found for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Initial state */}
      {!result && !loading && (
        <div className="text-muted-foreground flex h-32 items-center justify-center">
          Configure filters and click &quot;Run Report&quot; to generate data
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryStatCard({ stat }: { stat: ReportSummaryStat }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{stat.label}</p>
        <p className="text-2xl font-bold">{String(stat.value)}</p>
      </CardContent>
    </Card>
  );
}

function CellValue({
  value,
  column,
}: {
  value: unknown;
  column: ReportColumnDefinition;
}) {
  if (value == null || value === "")
    return <span className="text-muted-foreground">—</span>;

  switch (column.type) {
    case "badge":
      return <Badge variant="outline">{String(value)}</Badge>;
    case "currency":
      return (
        <span className="font-mono">
          {typeof value === "number"
            ? value.toLocaleString("en-SA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : String(value)}
        </span>
      );
    case "date":
      return <span>{formatDate(String(value))}</span>;
    case "number":
      return (
        <span className="font-mono">
          {typeof value === "number" ? value.toLocaleString() : String(value)}
        </span>
      );
    case "percentage":
      return <span>{String(value)}%</span>;
    default:
      return <span>{String(value)}</span>;
  }
}
