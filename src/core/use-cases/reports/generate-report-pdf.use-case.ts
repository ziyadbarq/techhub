/**
 * Generate Report PDF Use Case
 *
 * Generates report data and renders it as a branded PDF.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IReportPdfService } from "@/core/services/report-pdf.service.interface";
import { LogExecution } from "@/lib/decorators";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import type { ReportFilterValues } from "@/core/domain/reports/report-types";
import type { GenerateReportDataUseCase } from "./generate-report-data.use-case";

@injectable()
export class GenerateReportPdfUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IReportPdfService)
    private readonly pdfService: IReportPdfService,
    @inject(DI_TOKENS.GenerateReportDataUseCase)
    private readonly generateData: GenerateReportDataUseCase,
  ) {}

  @LogExecution("reports.pdf.generate")
  async execute(
    reportId: string,
    filters: ReportFilterValues,
    generatedBy: string,
  ): Promise<{ pdfBuffer: Buffer; filename: string }> {
    const definition = getReportDefinition(reportId);
    if (!definition) {
      throw new ValidationError(`Unknown report: ${reportId}`);
    }

    // Generate report data
    const result = await this.generateData.execute(reportId, filters);

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateReportPdf({
      title: definition.name,
      description: definition.description,
      filters: result.appliedFilters,
      columns: definition.columns,
      rows: result.rows,
      summaryStats: result.summaryStats,
      generatedAt: result.generatedAt,
      generatedBy,
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${reportId}-${dateStr}.pdf`;

    this.logger.info("Report PDF generated", {
      reportId,
      rows: result.rows.length,
      sizeBytes: pdfBuffer.length,
    });

    return { pdfBuffer, filename };
  }
}
