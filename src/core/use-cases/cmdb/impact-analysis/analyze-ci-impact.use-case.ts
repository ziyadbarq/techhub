/**
 * Analyze CI Impact Use Case
 *
 * BFS traversal of the CI relationship graph following isImpacting=true edges.
 * Answers: "What breaks if this CI goes down?"
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface AnalyzeCIImpactRequest {
  ciId: string;
  maxDepth?: number; // Default 5, max 10
  includeInactive?: boolean; // Default false
  environmentFilter?: string; // Optional: only show impacts in a specific environment (e.g., "PROD")
}

export interface ImpactedCI {
  id: string;
  name: string;
  ciKey: string | null;
  ciClassId: string;
  criticality: string | null;
  environment: string | null;
  depth: number;
  relationshipTypeName: string;
  relationshipTypeCode: string;
  parentCiId: string; // Which CI in the chain impacts this one
}

export interface CIImpactAnalysisResult {
  sourceCi: {
    id: string;
    name: string;
    ciKey: string | null;
    criticality: string | null;
    environment: string | null;
  };
  impactedCIs: ImpactedCI[];
  totalImpacted: number;
  criticalCount: number;
  highCount: number;
  maxDepthReached: number;
}

const DEFAULT_MAX_DEPTH = 5;
const ABSOLUTE_MAX_DEPTH = 10;

@injectable()
export class AnalyzeCIImpactUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,

    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,

    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("cmdb.impact-analysis.downstream")
  async execute(
    request: AnalyzeCIImpactRequest,
  ): Promise<CIImpactAnalysisResult> {
    const { ciId, includeInactive = false, environmentFilter } = request;
    const maxDepth = Math.min(
      Math.max(1, request.maxDepth ?? DEFAULT_MAX_DEPTH),
      ABSOLUTE_MAX_DEPTH,
    );

    // Validate source CI exists
    const sourceCi = await this.ciRepository.findById(ciId);
    if (!sourceCi) {
      throw new Error(`Configuration Item not found: ${ciId}`);
    }

    // BFS traversal
    const visited = new Set<string>();
    visited.add(ciId);

    const impactedCIs: ImpactedCI[] = [];
    let maxDepthReached = 0;

    // Queue entries: [ciId, depth]
    const queue: Array<[string, number]> = [[ciId, 0]];

    // Cache relationship types to avoid repeated lookups
    const relationshipTypeCache = new Map<
      string,
      { name: string; code: string }
    >();

    while (queue.length > 0) {
      const [currentCiId, currentDepth] = queue.shift()!;

      if (currentDepth >= maxDepth) {
        continue;
      }

      // Find CIs that depend on the current CI (downstream impact)
      const dependentRelationships =
        await this.ciRelationshipRepository.findDependentRelationships(
          currentCiId,
        );

      for (const relationship of dependentRelationships) {
        // Skip inactive relationships unless explicitly requested
        if (!includeInactive && !relationship.isActive) {
          continue;
        }

        const dependentCiId = relationship.toCiId;

        // Skip already visited CIs (cycle prevention)
        if (visited.has(dependentCiId)) {
          continue;
        }
        visited.add(dependentCiId);

        // Load dependent CI details
        const dependentCi = await this.ciRepository.findById(dependentCiId);
        if (!dependentCi) {
          this.logger.warn(
            `CI referenced in relationship not found: ${dependentCiId}`,
          );
          continue;
        }

        // Apply environment filter if specified
        if (
          environmentFilter &&
          dependentCi.environment !== environmentFilter
        ) {
          // Still add to visited to avoid re-processing, but don't include in results
          // However, continue traversal through this node as it may lead to matching CIs
          queue.push([dependentCiId, currentDepth + 1]);
          continue;
        }

        // Resolve relationship type (with cache)
        let relType = relationshipTypeCache.get(
          relationship.relationshipTypeId,
        );
        if (!relType) {
          const relTypeEntity = await this.relationshipTypeRepository.findById(
            relationship.relationshipTypeId,
          );
          relType = relTypeEntity
            ? { name: relTypeEntity.name, code: relTypeEntity.code }
            : { name: "Unknown", code: "UNKNOWN" };
          relationshipTypeCache.set(relationship.relationshipTypeId, relType);
        }

        const depth = currentDepth + 1;
        if (depth > maxDepthReached) {
          maxDepthReached = depth;
        }

        impactedCIs.push({
          id: dependentCi.id,
          name: dependentCi.name,
          ciKey: dependentCi.ciKey,
          ciClassId: dependentCi.ciClassId,
          criticality: dependentCi.criticality,
          environment: dependentCi.environment,
          depth,
          relationshipTypeName: relType.name,
          relationshipTypeCode: relType.code,
          parentCiId: currentCiId,
        });

        // Continue BFS from this dependent CI
        queue.push([dependentCiId, depth]);
      }
    }

    // Count criticality levels
    const criticalCount = impactedCIs.filter(
      (ci) => ci.criticality === "CRITICAL",
    ).length;
    const highCount = impactedCIs.filter(
      (ci) => ci.criticality === "HIGH",
    ).length;

    return {
      sourceCi: {
        id: sourceCi.id,
        name: sourceCi.name,
        ciKey: sourceCi.ciKey,
        criticality: sourceCi.criticality,
        environment: sourceCi.environment,
      },
      impactedCIs,
      totalImpacted: impactedCIs.length,
      criticalCount,
      highCount,
      maxDepthReached,
    };
  }
}
