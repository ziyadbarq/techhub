/**
 * Person Role Assignment Presenter
 * Transforms Person Role Assignment domain entities into DTOs for the UI layer
 */

import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";

export interface PersonRoleAssignmentDTO {
  id: string;
  personId: string;
  roleId: string;
  scope: string | null;
  startDate: string | null;
  endDate: string | null;
  isPrimary: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // Display fields (enriched from relations)
  personName?: string | null;
  roleName?: string | null;
}

export interface PersonRoleAssignmentEnrichment {
  personName?: string | null;
  roleName?: string | null;
}

export function presentPersonRoleAssignment(
  assignment: PersonRoleAssignment,
  enrichment?: PersonRoleAssignmentEnrichment,
): PersonRoleAssignmentDTO {
  return {
    id: assignment.id,
    personId: assignment.personId,
    roleId: assignment.roleId,
    scope: assignment.scope,
    startDate: assignment.startDate ? assignment.startDate.toISOString() : null,
    endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
    isPrimary: assignment.isPrimary,
    isActive: assignment.active,
    metadata: assignment.metadata,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    // Display fields
    personName: enrichment?.personName,
    roleName: enrichment?.roleName,
  };
}

export function presentPersonRoleAssignments(
  assignments: PersonRoleAssignment[],
  enrichmentMap?: Map<string, PersonRoleAssignmentEnrichment>,
): PersonRoleAssignmentDTO[] {
  return assignments.map((assignment) =>
    presentPersonRoleAssignment(assignment, enrichmentMap?.get(assignment.id)),
  );
}
