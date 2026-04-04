/**
 * Get CMDB Health Metrics Use Case
 *
 * Computes aggregate CMDB health statistics using the CMDB health repository.
 * Metrics include completeness, freshness, orphan rate, and ownership compliance.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type { ICMDBHealthRepository } from "@/core/repositories/cmdb-health.repository.interface";
import { LogExecution } from "@/lib/decorators";

export interface CMDBHealthMetrics {
  // Overall stats
  totalCIs: number;
  totalRelationships: number;
  totalCIClasses: number;

  // Completeness metrics
  cisWithoutOwner: number;
  cisWithoutLifecycleState: number;
  cisWithoutCriticality: number;
  cisMissingRequiredFields: number;
  completenessScore: number;

  // Freshness metrics
  staleOver30Days: number;
  staleOver60Days: number;
  staleOver90Days: number;
  freshnessScore: number;

  // Relationship metrics
  orphanCIs: number;
  orphanRate: number;

  // Breakdown by class
  cisByClass: Array<{ ciClassId: string; ciClassName: string; count: number }>;
  // Breakdown by criticality
  cisByCriticality: Array<{ criticality: string | null; count: number }>;
  // Breakdown by environment
  cisByEnvironment: Array<{ environment: string | null; count: number }>;

  // Ownership compliance
  ownershipComplianceRate: number;

  // Computed at
  computedAt: Date;
}

@injectable()
export class GetCMDBHealthMetricsUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.ICMDBHealthRepository)
    private readonly healthRepo: ICMDBHealthRepository,
  ) {}

  @LogExecution("cmdb.data-quality.get-health-metrics")
  async execute(): Promise<CMDBHealthMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Run all independent queries in parallel for performance
    const [
      totalCIs,
      totalRelationships,
      totalCIClasses,
      cisWithoutOwner,
      cisWithoutLifecycleState,
      cisWithoutCriticality,
      staleOver30Days,
      staleOver60Days,
      staleOver90Days,
      orphanCICount,
      cisByClassRaw,
      cisByCriticalityRaw,
      cisByEnvironmentRaw,
      cisMissingRequiredFields,
    ] = await Promise.all([
      this.healthRepo.countActiveCIs(),
      this.healthRepo.countActiveRelationships(),
      this.healthRepo.countActiveCIClasses(),
      this.healthRepo.countCIsWithoutOwner(),
      this.healthRepo.countCIsWithoutLifecycleState(),
      this.healthRepo.countCIsWithoutCriticality(),
      this.healthRepo.countStaleCIs(thirtyDaysAgo),
      this.healthRepo.countStaleCIs(sixtyDaysAgo),
      this.healthRepo.countStaleCIs(ninetyDaysAgo),
      this.healthRepo.countOrphanCIs(),
      this.healthRepo.getCIsByClass(),
      this.healthRepo.getCIsByCriticality(),
      this.healthRepo.getCIsByEnvironment(),
      this.healthRepo.countCIsMissingRequiredFields(),
    ]);

    // Compute scores
    const completenessScore = this.computeCompletenessScore(
      totalCIs,
      cisWithoutOwner,
      cisWithoutLifecycleState,
      cisWithoutCriticality,
      cisMissingRequiredFields,
    );

    const freshnessScore =
      totalCIs > 0
        ? Math.round(((totalCIs - staleOver30Days) / totalCIs) * 100)
        : 100;

    const orphanRate =
      totalCIs > 0 ? Math.round((orphanCICount / totalCIs) * 100 * 10) / 10 : 0;

    const ownershipComplianceRate =
      totalCIs > 0
        ? Math.round(((totalCIs - cisWithoutOwner) / totalCIs) * 100 * 10) / 10
        : 100;

    // Format breakdowns
    const cisByCriticality = cisByCriticalityRaw.map((row) => ({
      criticality: row.key,
      count: row.count,
    }));

    const cisByEnvironment = cisByEnvironmentRaw.map((row) => ({
      environment: row.key,
      count: row.count,
    }));

    this.logger.info("CMDB health metrics computed", {
      totalCIs,
      completenessScore,
      freshnessScore,
      orphanRate,
      ownershipComplianceRate,
    });

    return {
      totalCIs,
      totalRelationships,
      totalCIClasses,
      cisWithoutOwner,
      cisWithoutLifecycleState,
      cisWithoutCriticality,
      cisMissingRequiredFields,
      completenessScore,
      staleOver30Days,
      staleOver60Days,
      staleOver90Days,
      freshnessScore,
      orphanCIs: orphanCICount,
      orphanRate,
      cisByClass: cisByClassRaw,
      cisByCriticality,
      cisByEnvironment,
      ownershipComplianceRate,
      computedAt: now,
    };
  }

  /**
   * Compute completeness score (0-100%) based on four quality dimensions
   * Each dimension is equally weighted at 25%
   */
  private computeCompletenessScore(
    totalCIs: number,
    cisWithoutOwner: number,
    cisWithoutLifecycleState: number,
    cisWithoutCriticality: number,
    cisMissingRequiredFields: number,
  ): number {
    if (totalCIs === 0) return 100;

    const ownerScore = ((totalCIs - cisWithoutOwner) / totalCIs) * 25;
    const lifecycleScore =
      ((totalCIs - cisWithoutLifecycleState) / totalCIs) * 25;
    const criticalityScore =
      ((totalCIs - cisWithoutCriticality) / totalCIs) * 25;
    const requiredFieldsScore =
      ((totalCIs - cisMissingRequiredFields) / totalCIs) * 25;

    return Math.round(
      ownerScore + lifecycleScore + criticalityScore + requiredFieldsScore,
    );
  }
}
