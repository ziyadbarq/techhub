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
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type {
  CIDeletionContext,
  IConfigurationItemRepository,
} from "@/core/repositories/configuration-item.repository.interface";

export interface DeleteCIConfirmationRequest {
  id: string;
}

export interface CIDependencies {
  relationshipsFrom: number; // Outgoing relationships (this CI depends on others)
  relationshipsTo: number; // Incoming relationships (others depend on this CI)
  impactingRelationshipsTo: number; // Critical: Relationships with impacting types
  activeRelationshipsTo: number;
  activeRelationshipsFrom: number;
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

type ConfigurationItemWithRelations = CIDeletionContext["ci"];

@injectable()
export class DeleteCIWithConfirmationUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
  ) {}

  async execute(
    request: DeleteCIConfirmationRequest,
  ): Promise<DeleteCIConfirmationResponse> {
    // Check if CI exists
    const context = await this.ciRepository.getDeletionContext(request.id);

    if (!context) {
      throw new NotFoundError(
        `Configuration Item with ID "${request.id}" not found`,
      );
    }

    const { ci, dependencies, impactingRelationships } = context;

    // Check all dependencies
    const totalDependencies =
      dependencies.relationshipsFrom + dependencies.relationshipsTo;

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
      if (dependencies.activeRelationshipsTo > 0) {
        warnings.push(
          `${dependencies.activeRelationshipsTo} active relationship(s) from other CIs. Review topology impacts.`,
        );
      }
    }

    // Warning: Outgoing relationships (this CI depends on others)
    if (dependencies.relationshipsFrom > 0) {
      if (dependencies.activeRelationshipsFrom > 0) {
        warnings.push(
          `${dependencies.activeRelationshipsFrom} active relationship(s) to other CIs will be removed.`,
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
      ciClass: ci.ciClassName || "Unknown",
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
      throw new NotFoundError(`Configuration Item with ID "${id}" not found`);
    }

    await this.ciRepository.deleteWithRelationships(id);
  }
}
