/**
 * Report Export Toolbar
 *
 * Provides CSV and PDF export buttons for report data.
 * Respects column visibility — hidden columns are excluded from exports.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  exportReportCsvAction,
  exportReportPdfAction,
} from "@/interface-adapters/controllers/reports/report.controller";
import { downloadCSV } from "@/lib/csv-export";
import { formatDateISO } from "@/lib/utils/date-format";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface ReportExportToolbarProps {
  reportId: string;
  reportName: string;
  filters: Record<string, string>;
  hiddenColumns: string[];
  sortKey: string | null;
  sortAsc: boolean;
  hasData: boolean;
}

export function ReportExportToolbar({
  reportId,
  reportName: _reportName,
  filters,
  hiddenColumns,
  sortKey,
  sortAsc,
  hasData,
}: ReportExportToolbarProps) {
  const { hasPermission } = usePermissions();
  const canExport = hasPermission(PERMISSIONS.REPORTS_EXPORT);

  if (!canExport) return null;

  const handleExportCsv = async () => {
    try {
      const result = await exportReportCsvAction({
        reportId,
        filters,
        hiddenColumns,
        sortKey: sortKey ?? undefined,
        sortAsc,
      });
      if (result.success) {
        const filename = `${reportId}-${formatDateISO(new Date())}.csv`;
        downloadCSV(result.data, filename);
        toast.success("Report exported as CSV");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPdf = async () => {
    try {
      const result = await exportReportPdfAction({
        reportId,
        filters,
        hiddenColumns,
        sortKey: sortKey ?? undefined,
        sortAsc,
      });
      if (result.success) {
        const byteCharacters = atob(result.data.base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported as PDF");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        disabled={!hasData}
      >
        <Download className="mr-1 h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={!hasData}
      >
        <Download className="mr-1 h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
