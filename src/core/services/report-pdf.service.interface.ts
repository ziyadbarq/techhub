/**
 * Report PDF Service Interface
 *
 * Generates branded PDF documents from report data.
 */

import type { ReportColumnDefinition } from "@/core/domain/reports/report-types";

export interface GenerateReportPdfOptions {
  title: string;
  description: string;
  filters: Record<string, string>;
  columns: ReportColumnDefinition[];
  rows: Record<string, unknown>[];
  summaryStats?: { label: string; value: string | number }[];
  generatedAt: Date;
  generatedBy: string;
}

export interface IReportPdfService {
  generateReportPdf(options: GenerateReportPdfOptions): Promise<Buffer>;
}
