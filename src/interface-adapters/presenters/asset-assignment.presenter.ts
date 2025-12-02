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
  // Source tracking
  source: string;
  sourceReferenceType: string | null;
  sourceReferenceId: string | null;
  // Conflict tracking
  hasConflict: boolean;
  conflictNote: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isActive: boolean;
  durationInDays: number;
  isIntuneManaged: boolean;
  isManual: boolean;
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
    // Source tracking
    source: assignment.source,
    sourceReferenceType: assignment.sourceReferenceType,
    sourceReferenceId: assignment.sourceReferenceId,
    // Conflict tracking
    hasConflict: assignment.hasConflict,
    conflictNote: assignment.conflictNote,
    // Timestamps
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    // Computed fields
    isActive: assignment.isActive(),
    durationInDays: assignment.getDurationInDays(),
    isIntuneManaged: assignment.isIntuneManaged(),
    isManual: assignment.isManual(),
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
