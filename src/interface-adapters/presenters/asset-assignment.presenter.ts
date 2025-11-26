/**
 * AssetAssignment Presenter
 * Transforms AssetAssignment domain entities to DTOs for presentation layer
 */

import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";

export interface AssetAssignmentEnrichment {
  assetTag?: string;
  assigneeName?: string;
}

export interface AssetAssignmentDTO {
  id: string;
  assetId: string;
  assigneeType: string;
  assigneeId: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  conditionOnAssignment: string | null;
  conditionOnReturn: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isActive: boolean;
  durationInDays: number;
  // Display fields (enriched from relations)
  assetTag?: string;
  assigneeName?: string;
}

/**
 * Transform a single AssetAssignment to DTO
 */
export function presentAssetAssignment(
  assignment: AssetAssignment,
  enrichment?: AssetAssignmentEnrichment,
): AssetAssignmentDTO {
  return {
    id: assignment.id,
    assetId: assignment.assetId,
    assigneeType: assignment.assigneeType,
    assigneeId: assignment.assigneeId,
    startDate: assignment.startDate.toISOString(),
    endDate: assignment.endDate?.toISOString() || null,
    isPrimary: assignment.isPrimary,
    conditionOnAssignment: assignment.conditionOnAssignment,
    conditionOnReturn: assignment.conditionOnReturn,
    note: assignment.note,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    // Computed fields
    isActive: assignment.isActive(),
    durationInDays: assignment.getDurationInDays(),
    // Display fields
    assetTag: enrichment?.assetTag,
    assigneeName: enrichment?.assigneeName,
  };
}

/**
 * Transform an array of AssetAssignments to DTOs
 */
export function presentAssetAssignments(
  assignments: AssetAssignment[],
  enrichmentMap?: Map<string, AssetAssignmentEnrichment>,
): AssetAssignmentDTO[] {
  return assignments.map((assignment) =>
    presentAssetAssignment(assignment, enrichmentMap?.get(assignment.id)),
  );
}
