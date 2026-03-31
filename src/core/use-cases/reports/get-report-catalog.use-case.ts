/**
 * Get Report Catalog Use Case
 *
 * Returns available report definitions filtered by enabled feature flags.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators";
import { REPORT_DEFINITIONS } from "@/core/domain/reports/report-definitions";
import type { ReportDefinition } from "@/core/domain/reports/report-types";
import { isFeatureEnabled } from "@/lib/features/server";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";

@injectable()
export class GetReportCatalogUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
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

  private async areAllFlagsEnabled(flags: FeatureFlagKey[]): Promise<boolean> {
    for (const flag of flags) {
      const enabled = await isFeatureEnabled(flag);
      if (!enabled) return false;
    }
    return true;
  }
}
