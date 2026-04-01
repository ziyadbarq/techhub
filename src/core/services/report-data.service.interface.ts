import type {
  FilterOptionsSource,
  ReportFilterOption,
  ReportFilterValues,
  ReportResult,
} from "@/core/domain/reports/report-types";

/**
 * Query contract for report datasets and dynamic filter options.
 */
export interface IReportDataService {
  generateReport(
    reportId: string,
    filters: ReportFilterValues,
  ): Promise<ReportResult>;

  getFilterOptions(source: FilterOptionsSource): Promise<ReportFilterOption[]>;
}
