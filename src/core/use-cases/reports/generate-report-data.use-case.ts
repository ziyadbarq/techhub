/**
 * Generate Report Data Use Case
 *
 * Orchestrator that dispatches to specific report data generators by report ID.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IReportDataService } from "@/core/services/report-data.service.interface";
import { LogExecution } from "@/lib/decorators";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import type {
  ReportResult,
  ReportFilterValues,
} from "@/core/domain/reports/report-types";

@injectable()
export class GenerateReportDataUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IReportDataService)
    private readonly reportDataService: IReportDataService,
  ) {}

  @LogExecution("reports.data.generate")
  async execute(
    reportId: string,
    filters: ReportFilterValues,
  ): Promise<ReportResult> {
    const definition = getReportDefinition(reportId);
    if (!definition) {
      throw new ValidationError(`Unknown report: ${reportId}`);
    }

    this.logger.info("Generating report data", {
      reportId,
      filters,
    });

    const result = await this.reportDataService.generateReport(
      reportId,
      filters,
    );

    this.logger.info("Report data generated", {
      reportId,
      rowCount: result.rows.length,
    });

    return result;
  }
}
