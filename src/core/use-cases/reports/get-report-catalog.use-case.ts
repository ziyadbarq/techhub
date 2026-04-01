/**
 * Get Report Catalog Use Case
 *
 * Returns available report definitions filtered by enabled feature flags.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import { LogExecution } from "@/lib/decorators";
import { REPORT_DEFINITIONS } from "@/core/domain/reports/report-definitions";
import type { ReportDefinition } from "@/core/domain/reports/report-types";

@injectable()
export class GetReportCatalogUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  @LogExecution("reports.catalog.get")
  async execute(): Promise<ReportDefinition[]> {
    const availableReports: ReportDefinition[] = [];

    for (const report of REPORT_DEFINITIONS) {
      const allFlagsEnabled = await this.areAllFlagsEnabled(
        report.requiredFeatureFlags,
      );
      if (allFlagsEnabled) {
        availableReports.push(report);
      }
    }

    this.logger.debug("Reports catalog filtered", {
      total: REPORT_DEFINITIONS.length,
      available: availableReports.length,
    });

    return availableReports;
  }

  private async areAllFlagsEnabled(flags: string[]): Promise<boolean> {
    for (const flag of flags) {
      const enabled = await this.featureFlagRepository.isFeatureEnabled(flag);
      if (!enabled) return false;
    }
    return true;
  }
}
