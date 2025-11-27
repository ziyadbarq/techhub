/**
 * Get Intune Compliance Stats Use Case
 *
 * Retrieves compliance statistics for dashboard display.
 * Used for SAMA governance reporting and compliance monitoring.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IIntuneDeviceRepository,
  ComplianceStats,
  OwnershipStats,
  LinkStats,
} from "@/core/repositories/intune-device.repository.interface";

export interface IntuneStatsOutput {
  compliance: ComplianceStats;
  ownership: OwnershipStats;
  linkStatus: LinkStats;
  byOperatingSystem: Record<string, number>;
}

@injectable()
export class GetIntuneComplianceStatsUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
  ) {
    this.logger = logger.child({ useCase: "GetIntuneComplianceStatsUseCase" });
  }

  async execute(): Promise<IntuneStatsOutput> {
    this.logger.debug("Getting Intune compliance statistics");

    const [compliance, ownership, linkStatus, byOperatingSystem] =
      await Promise.all([
        this.deviceRepository.getComplianceStats(),
        this.deviceRepository.getOwnershipStats(),
        this.deviceRepository.getLinkStats(),
        this.deviceRepository.countByOperatingSystem(),
      ]);

    this.logger.debug("Retrieved Intune stats", {
      totalDevices: compliance.total,
      compliantRate:
        compliance.total > 0
          ? ((compliance.compliant / compliance.total) * 100).toFixed(1)
          : 0,
    });

    return {
      compliance,
      ownership,
      linkStatus,
      byOperatingSystem,
    };
  }
}
