/**
 * DeleteCIWithConfirmation Use Case
 *
 * Application-layer safeguard for Configuration Item deletion with topology impact validation.
 *
 * Business Rules:
 * - Check all CI relationships (both incoming and outgoing)
 * - Validate topology impacts (check for critical dependencies)
 * - Return detailed confirmation info about infrastructure impacts
 * - Prevent deletion if CI has impacting relationships or critical dependencies
 * - Check for child CIs in hierarchy
 *
 * Note: CI does not have soft delete - performs hard delete after confirmation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { Prisma, PrismaClient } from "@/generated/prisma";

export interface DeleteCIConfirmationRequest {
  id: string;
}

export interface CIDependencies {
  relationshipsFrom: number; // Outgoing relationships (this CI depends on others)
  relationshipsTo: number; // Incoming relationships (others depend on this CI)
  impactingRelationshipsTo: number; // Critical: Relationships with impacting types
}

export interface RelationshipImpact {
  relationshipType: string;
  relatedCIKey: string;
  relatedCIName: string;
  isImpacting: boolean;
  isActive: boolean;
}

export interface DeleteCIConfirmationResponse {
  canDelete: boolean;
  ciKey: string;
  ciName: string;
  ciClass: string;
  criticality: string;
  environment: string;
  dependencies: CIDependencies;
  totalDependencies: number;
  impactingRelationships: RelationshipImpact[];
  blockers: string[];
  warnings: string[];
  topologyImpact: string;
  message: string;
}

type ConfigurationItemWithRelations = Prisma.ConfigurationItemGetPayload<{
  include: {
    ciClass: true;
    lifecycleState: true;
  };
}>;

type CIRelationshipWithRelations = Prisma.CIRelationshipGetPayload<{
  include: {
    fromCi: true;
    relationshipType: true;
  };
}>;

@injectable()
export class DeleteCIWithConfirmationUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    request: DeleteCIConfirmationRequest,
  ): Promise<DeleteCIConfirmationResponse> {
    // Check if CI exists
    const ci = await this.prisma.configurationItem.findUnique({
      where: { id: request.id },
      include: {
        ciClass: true,
        lifecycleState: true,
      },
    });

    if (!ci) {
      throw new Error(`Configuration Item with ID "${request.id}" not found`);
    }

    // Check all dependencies
    const dependencies = await this.checkDependencies(request.id);
    const totalDependencies =
      dependencies.relationshipsFrom + dependencies.relationshipsTo;

    // Get detailed relationship impacts
    const impactingRelationships = await this.getImpactingRelationships(
      request.id,
    );

    // Determine blockers and warnings
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Critical blocker: Has impacting relationships (others critically depend on this)
    if (dependencies.impactingRelationshipsTo > 0) {
      blockers.push(
        `${dependencies.impactingRelationshipsTo} CI(s) have critical dependencies on this CI (isImpacting=true).`,
      );

      // Add specific impacting relationships to blockers
      const activeImpacting = impactingRelationships.filter(
        (rel) => rel.isImpacting && rel.isActive,
      );
      if (activeImpacting.length > 0) {
        activeImpacting.slice(0, 3).forEach((rel) => {
          blockers.push(
            `  - ${rel.relatedCIKey} (${rel.relatedCIName}): ${rel.relationshipType}`,
          );
        });
        if (activeImpacting.length > 3) {
          blockers.push(`  ... and ${activeImpacting.length - 3} more`);
        }
      }
    }

    // Critical blocker: Check for active relationships to critical infrastructure
    if (dependencies.relationshipsTo > 0) {
      const activeRelationshipsTo = await this.prisma.cIRelationship.count({
        where: {
          toCiId: request.id,
          isActive: true,
        },
      });
      if (activeRelationshipsTo > 0) {
        warnings.push(
          `${activeRelationshipsTo} active relationship(s) from other CIs. Review topology impacts.`,
        );
      }
    }

    // Warning: Outgoing relationships (this CI depends on others)
    if (dependencies.relationshipsFrom > 0) {
      const activeRelationshipsFrom = await this.prisma.cIRelationship.count({
        where: {
          fromCiId: request.id,
          isActive: true,
        },
      });
      if (activeRelationshipsFrom > 0) {
        warnings.push(
          `${activeRelationshipsFrom} active relationship(s) to other CIs will be removed.`,
        );
      }
    }

    // Check criticality
    if (ci.criticality === "CRITICAL" || ci.criticality === "HIGH") {
      warnings.push(
        `This is a ${ci.criticality} criticality CI. Deletion may impact production systems.`,
      );
    }

    // Check environment
    if (ci.environment && ci.environment === "PROD") {
      warnings.push(
        "This CI is in PROD environment. Ensure proper change management approval.",
      );
    }

    const canDelete = blockers.length === 0;

    // Assess topology impact
    const topologyImpact = this.assessTopologyImpact(ci, dependencies);

    const message = canDelete
      ? totalDependencies > 0
        ? `CI can be deleted, but ${totalDependencies} relationship(s) will be removed. ${topologyImpact}`
        : "CI can be safely deleted with no relationships."
      : `Cannot delete CI. ${blockers.length} blocker(s) must be resolved first. ${topologyImpact}`;

    return {
      canDelete,
      ciKey: ci.ciKey || "",
      ciName: ci.name,
      ciClass: ci.ciClass?.name || "Unknown",
      criticality: ci.criticality || "MEDIUM",
      environment: ci.environment || "DEV",
      dependencies,
      totalDependencies,
      impactingRelationships,
      blockers,
      warnings,
      topologyImpact,
      message,
    };
  }

  /**
   * Check all CI dependencies using Prisma counts
   */
  private async checkDependencies(ciId: string): Promise<CIDependencies> {
    const [relationshipsFrom, relationshipsTo, impactingRelationshipsTo] =
      await Promise.all([
        // Outgoing: This CI depends on others
        this.prisma.cIRelationship.count({ where: { fromCiId: ciId } }),
        // Incoming: Others depend on this CI
        this.prisma.cIRelationship.count({ where: { toCiId: ciId } }),
        // Critical incoming: Count relationships with impacting types
        this.prisma.cIRelationship.count({
          where: {
            toCiId: ciId,
            isActive: true,
            relationshipType: {
              isImpacting: true,
            },
          },
        }),
      ]);

    return {
      relationshipsFrom,
      relationshipsTo,
      impactingRelationshipsTo,
    };
  }

  /**
   * Get detailed list of impacting relationships (where others depend on this CI)
   */
  private async getImpactingRelationships(
    ciId: string,
  ): Promise<RelationshipImpact[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: { toCiId: ciId },
      include: {
        fromCi: true,
        relationshipType: true,
      },
    });

    return relationships.map((rel: CIRelationshipWithRelations) => ({
      relationshipType: rel.relationshipType.name,
      relatedCIKey: rel.fromCi.ciKey || "",
      relatedCIName: rel.fromCi.name,
      isImpacting: rel.relationshipType.isImpacting,
      isActive: rel.isActive,
    }));
  }

  /**
   * Assess topology impact based on CI properties and relationships
   */
  private assessTopologyImpact(
    ci: ConfigurationItemWithRelations,
    dependencies: CIDependencies,
  ): string {
    const impacts: string[] = [];

    // High impact: Critical CI with impacting relationships
    if (
      (ci.criticality === "CRITICAL" || ci.criticality === "HIGH") &&
      dependencies.impactingRelationshipsTo > 0
    ) {
      impacts.push("HIGH IMPACT: Critical infrastructure with dependencies");
    }

    // Medium impact: Production CI or has active relationships
    if (ci.environment === "PROD" && dependencies.relationshipsTo > 0) {
      impacts.push("MEDIUM IMPACT: Production CI with relationships");
    }

    // Low impact or no relationships
    if (impacts.length === 0) {
      if (dependencies.relationshipsFrom > 0) {
        impacts.push("LOW IMPACT: Has outgoing dependencies only");
      } else {
        impacts.push("NO IMPACT: Isolated CI");
      }
    }

    return impacts.join(". ");
  }

  /**
   * Execute the hard delete after confirmation
   * Only call this after receiving user confirmation
   *
   * Note: This is a hard delete as CI does not have soft delete support
   */
  async executeDelete(id: string): Promise<void> {
    const ci = await this.ciRepository.findById(id);
    if (!ci) {
      throw new Error(`Configuration Item with ID "${id}" not found`);
    }

    // Perform hard delete
    // Due to onDelete: Restrict constraints, relationships must be deleted first
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete all relationships (both from and to)
      await tx.cIRelationship.deleteMany({
        where: {
          OR: [{ fromCiId: id }, { toCiId: id }],
        },
      });

      // Delete the CI
      await tx.configurationItem.delete({
        where: { id },
      });
    });
  }
}
