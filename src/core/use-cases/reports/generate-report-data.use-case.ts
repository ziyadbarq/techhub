/**
 * Generate Report Data Use Case
 *
 * Orchestrator that dispatches to specific report data generators by report ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import type {
  ReportResult,
  ReportFilterValues,
} from "@/core/domain/reports/report-types";
import { prisma } from "@/infrastructure/database/prisma/client";
import {
  generateAssetInventorySummary,
  generateAssetFinancialSummary,
  generateAssetsNearingEol,
  generateUnassignedAssets,
  generateWarrantyExpiration,
  generateAssetAssignmentHistory,
  generateStockMovementSummary,
} from "./data-generators/asset-report-generators";
import {
  generateCiInventorySummary,
  generateCiRelationshipOverview,
  generateCiAssetCoverage,
} from "./data-generators/cmdb-report-generators";

/**
 * Map of report ID to data generator function
 */
const REPORT_GENERATORS: Record<
  string,
  (
    filters: ReportFilterValues,
    prismaClient: typeof prisma,
  ) => Promise<ReportResult>
> = {
  "asset-inventory-summary": generateAssetInventorySummary,
  "asset-financial-summary": generateAssetFinancialSummary,
  "assets-nearing-eol": generateAssetsNearingEol,
  "unassigned-assets": generateUnassignedAssets,
  "warranty-expiration": generateWarrantyExpiration,
  "asset-assignment-history": generateAssetAssignmentHistory,
  "stock-movement-summary": generateStockMovementSummary,
  "ci-inventory-summary": generateCiInventorySummary,
  "ci-relationship-overview": generateCiRelationshipOverview,
  "ci-asset-coverage": generateCiAssetCoverage,
};

@injectable()
export class GenerateReportDataUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("reports.data.generate")
  async execute(
    reportId: string,
    filters: ReportFilterValues,
  ): Promise<ReportResult> {
    const definition = getReportDefinition(reportId);
    if (!definition) {
      throw new Error(`Unknown report: ${reportId}`);
    }

    const generator = REPORT_GENERATORS[reportId];
    if (!generator) {
      throw new Error(`No data generator for report: ${reportId}`);
    }

    this.logger.info("Generating report data", {
      reportId,
      filters,
    });

    const result = await generator(filters, prisma);

    this.logger.info("Report data generated", {
      reportId,
      rowCount: result.rows.length,
    });

    return result;
  }
}
