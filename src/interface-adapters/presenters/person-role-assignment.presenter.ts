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
}

export function presentPersonRoleAssignment(
  assignment: PersonRoleAssignment,
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
  };
}

export function presentPersonRoleAssignments(
  assignments: PersonRoleAssignment[],
): PersonRoleAssignmentDTO[] {
  return assignments.map(presentPersonRoleAssignment);
}
