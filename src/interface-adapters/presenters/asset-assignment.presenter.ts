/**
 * AssetAssignment Presenter
 * Transforms AssetAssignment domain entities to DTOs for presentation layer
 */

import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";

export interface AssetAssignmentDTO {
  id: string;
  assetId: string;
  assigneeType: string;
  assigneeId: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isActive: boolean;
  durationInDays: number;
}

/**
 * Transform a single AssetAssignment to DTO
 */
export function presentAssetAssignment(
  assignment: AssetAssignment,
): AssetAssignmentDTO {
  return {
    id: assignment.id,
    assetId: assignment.assetId,
    assigneeType: assignment.assigneeType,
    assigneeId: assignment.assigneeId,
    startDate: assignment.startDate.toISOString(),
    endDate: assignment.endDate?.toISOString() || null,
    isPrimary: assignment.isPrimary,
    note: assignment.note,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    // Computed fields
    isActive: assignment.isActive(),
    durationInDays: assignment.getDurationInDays(),
  };
}

/**
 * Transform an array of AssetAssignments to DTOs
 */
export function presentAssetAssignments(
  assignments: AssetAssignment[],
): AssetAssignmentDTO[] {
  return assignments.map(presentAssetAssignment);
}
