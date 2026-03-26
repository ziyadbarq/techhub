/**
 * Analyze Upstream Dependencies Use Case
 *
 * Reverse BFS traversal of the CI relationship graph.
 * Answers: "What does this CI depend on?"
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface AnalyzeUpstreamRequest {
  ciId: string;
  maxDepth?: number; // Default 5, max 10
}

export interface UpstreamDependency {
  id: string;
  name: string;
  ciKey: string | null;
  ciClassId: string;
  criticality: string | null;
  environment: string | null;
  depth: number;
  relationshipTypeName: string;
  relationshipTypeCode: string;
}

export interface UpstreamAnalysisResult {
  sourceCi: {
    id: string;
    name: string;
    ciKey: string | null;
    criticality: string | null;
    environment: string | null;
  };
  dependencies: UpstreamDependency[];
  totalDependencies: number;
  criticalDependencies: number;
}

const DEFAULT_MAX_DEPTH = 5;
const ABSOLUTE_MAX_DEPTH = 10;

@injectable()
export class AnalyzeUpstreamDependenciesUseCase {
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

  @LogExecution("cmdb.impact-analysis.upstream")
  async execute(
    request: AnalyzeUpstreamRequest,
  ): Promise<UpstreamAnalysisResult> {
    const { ciId } = request;
    const maxDepth = Math.min(
      Math.max(1, request.maxDepth ?? DEFAULT_MAX_DEPTH),
      ABSOLUTE_MAX_DEPTH,
    );

    // Validate source CI exists
    const sourceCi = await this.ciRepository.findById(ciId);
    if (!sourceCi) {
      throw new Error(`Configuration Item not found: ${ciId}`);
    }

    // BFS traversal (reverse direction — follow impacting relationships)
    const visited = new Set<string>();
    visited.add(ciId);

    const dependencies: UpstreamDependency[] = [];

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

      // Find CIs that this CI depends on (upstream — impacting relationships)
      const impactingRelationships =
        await this.ciRelationshipRepository.findImpactingRelationships(
          currentCiId,
        );

      for (const relationship of impactingRelationships) {
        // Only follow active relationships
        if (!relationship.isActive) {
          continue;
        }

        const upstreamCiId = relationship.fromCiId;

        // Skip already visited CIs (cycle prevention)
        if (visited.has(upstreamCiId)) {
          continue;
        }
        visited.add(upstreamCiId);

        // Load upstream CI details
        const upstreamCi = await this.ciRepository.findById(upstreamCiId);
        if (!upstreamCi) {
          this.logger.warn(
            `CI referenced in relationship not found: ${upstreamCiId}`,
          );
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

        dependencies.push({
          id: upstreamCi.id,
          name: upstreamCi.name,
          ciKey: upstreamCi.ciKey,
          ciClassId: upstreamCi.ciClassId,
          criticality: upstreamCi.criticality,
          environment: upstreamCi.environment,
          depth,
          relationshipTypeName: relType.name,
          relationshipTypeCode: relType.code,
        });

        // Continue BFS from this upstream CI
        queue.push([upstreamCiId, depth]);
      }
    }

    // Count critical dependencies
    const criticalDependencies = dependencies.filter(
      (dep) => dep.criticality === "CRITICAL",
    ).length;

    return {
      sourceCi: {
        id: sourceCi.id,
        name: sourceCi.name,
        ciKey: sourceCi.ciKey,
        criticality: sourceCi.criticality,
        environment: sourceCi.environment,
      },
      dependencies,
      totalDependencies: dependencies.length,
      criticalDependencies,
    };
  }
}
