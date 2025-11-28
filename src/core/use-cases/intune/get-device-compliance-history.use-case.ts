/**
 * Get Device Compliance History Use Case
 *
 * Retrieves the compliance history for a specific Intune device.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IIntuneComplianceHistoryRepository,
  PaginationOptions,
} from "@/core/repositories/intune-device.repository.interface";
import type { IntuneComplianceHistory } from "@/core/domain/entities/intune-compliance-history.entity";

export interface GetDeviceComplianceHistoryInput {
  deviceId: string;
  pagination?: PaginationOptions;
  /** Maximum age in days - defaults to 30 */
  maxAgeDays?: number;
}

export interface GetDeviceComplianceHistoryOutput {
  history: IntuneComplianceHistory[];
  total: number;
}

@injectable()
export class GetDeviceComplianceHistoryUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneComplianceHistoryRepository)
    private readonly historyRepository: IIntuneComplianceHistoryRepository,
  ) {
    this.logger = logger.child({
      useCase: "GetDeviceComplianceHistoryUseCase",
    });
  }

  async execute(
    input: GetDeviceComplianceHistoryInput,
  ): Promise<GetDeviceComplianceHistoryOutput> {
    this.logger.debug("Getting compliance history for device", {
      deviceId: input.deviceId,
      maxAgeDays: input.maxAgeDays,
    });

    // Calculate date range if maxAgeDays is specified
    const maxAgeDays = input.maxAgeDays ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxAgeDays);

    // Get history and count in parallel
    const [history, total] = await Promise.all([
      this.historyRepository.findByDeviceId(input.deviceId, input.pagination),
      this.historyRepository.countByDeviceId(input.deviceId),
    ]);

    // Filter by date if needed (repository might not support date filtering on findByDeviceId)
    const filteredHistory = history.filter((h) => h.changedAt >= startDate);

    this.logger.debug("Retrieved compliance history", {
      deviceId: input.deviceId,
      count: filteredHistory.length,
      total,
    });

    return {
      history: filteredHistory,
      total,
    };
  }
}
