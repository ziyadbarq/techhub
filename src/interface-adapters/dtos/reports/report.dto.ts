/**
 * Report DTOs
 * Zod schemas for report-related server action inputs
 */

import { z } from "zod";

/**
 * Run Report DTO
 */
export const RunReportDto = z.object({
  reportId: z.string().min(1),
  filters: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export type RunReportInput = z.infer<typeof RunReportDto>;

/**
 * Export Report DTO (supports column filtering)
 */
export const ExportReportDto = z.object({
  reportId: z.string().min(1),
  filters: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
  hiddenColumns: z.array(z.string()).optional(),
  sortKey: z.string().optional(),
  sortAsc: z.boolean().optional(),
});

export type ExportReportInput = z.infer<typeof ExportReportDto>;
