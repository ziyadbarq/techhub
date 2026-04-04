/**
 * Detect Stale CIs Use Case
 *
 * Finds Configuration Items that haven't been updated within a threshold period.
 * CIs not updated in 90+ days (default) are flagged as stale, which may
 * indicate outdated records needing verification.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface DetectStaleCIsRequest {
  thresholdDays?: number; // Default 90
  environmentFilter?: string; // Optional: only PROD
  criticalityFilter?: string; // Optional: only CRITICAL/HIGH
}

export interface StaleCIRecord {
  id: string;
  name: string;
  ciKey: string | null;
  ciClassId: string;
  ciClassName: string;
  criticality: string | null;
  environment: string | null;
  lastUpdatedAt: Date;
  daysSinceUpdate: number;
  hasOwner: boolean;
}

export interface DetectStaleCIsResult {
  staleCIs: StaleCIRecord[];
  totalStale: number;
  totalCIs: number;
  stalePercentage: number;
  byEnvironment: Record<string, number>;
  byCriticality: Record<string, number>;
}

@injectable()
export class DetectStaleCIsUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("cmdb.data-quality.detect-stale-cis")
  async execute(
    request: DetectStaleCIsRequest = {},
  ): Promise<DetectStaleCIsResult> {
    const thresholdDays = request.thresholdDays ?? 90;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    this.logger.info("Detecting stale CIs", {
      thresholdDays,
      thresholdDate: thresholdDate.toISOString(),
      environmentFilter: request.environmentFilter ?? "all",
      criticalityFilter: request.criticalityFilter ?? "all",
    });

    // Fetch stale CIs via repository
    const staleCIsRaw = await this.ciRepository.findStale({
      thresholdDate,
      environmentFilter: request.environmentFilter,
      criticalityFilter: request.criticalityFilter,
    });

    // Count total active CIs (with same filters)
    const totalCIs = await this.ciRepository.countActive({
      environmentFilter: request.environmentFilter,
      criticalityFilter: request.criticalityFilter,
    });

    const now = new Date();

    // Map to StaleCIRecord
    const staleCIs: StaleCIRecord[] = staleCIsRaw.map((ci) => {
      const diffMs = now.getTime() - ci.updatedAt.getTime();
      const daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: ci.id,
        name: ci.name,
        ciKey: ci.ciKey,
        ciClassId: ci.ciClassId,
        ciClassName: ci.ciClassName,
        criticality: ci.criticality,
        environment: ci.environment,
        lastUpdatedAt: ci.updatedAt,
        daysSinceUpdate,
        hasOwner: !!(ci.primaryOwnerPersonId || ci.primaryOwnerOrgUnitId),
      };
    });

    // Aggregate by environment
    const byEnvironment: Record<string, number> = {};
    for (const ci of staleCIs) {
      const env = ci.environment ?? "UNSET";
      byEnvironment[env] = (byEnvironment[env] ?? 0) + 1;
    }

    // Aggregate by criticality
    const byCriticality: Record<string, number> = {};
    for (const ci of staleCIs) {
      const crit = ci.criticality ?? "UNSET";
      byCriticality[crit] = (byCriticality[crit] ?? 0) + 1;
    }

    const totalStale = staleCIs.length;
    const stalePercentage =
      totalCIs > 0 ? Math.round((totalStale / totalCIs) * 10000) / 100 : 0;

    this.logger.info("Stale CI detection complete", {
      totalStale,
      totalCIs,
      stalePercentage,
      byEnvironment,
      byCriticality,
    });

    return {
      staleCIs,
      totalStale,
      totalCIs,
      stalePercentage,
      byEnvironment,
      byCriticality,
    };
  }
}
