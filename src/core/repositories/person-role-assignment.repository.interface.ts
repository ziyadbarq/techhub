/**
 * IPersonRoleAssignmentRepository Interface
 * Data access contract for person role assignments
 */

import type { PersonRoleAssignment } from "../domain/entities/person-role-assignment.entity";

export interface IPersonRoleAssignmentRepository {
  /**
   * Create a new person role assignment
   */
  create(assignment: PersonRoleAssignment): Promise<PersonRoleAssignment>;

  /**
   * Find person role assignment by ID
   */
  findById(id: string): Promise<PersonRoleAssignment | null>;

  /**
   * Find all role assignments for a person
   */
  findByPersonId(
    personId: string,
    options?: {
      activeOnly?: boolean;
      asOf?: Date;
    },
  ): Promise<PersonRoleAssignment[]>;

  /**
   * Find all person assignments for a role
   */
  findByRoleId(
    roleId: string,
    options?: {
      activeOnly?: boolean;
      asOf?: Date;
    },
  ): Promise<PersonRoleAssignment[]>;

  /**
   * Find specific person-role assignment
   */
  findByPersonAndRole(
    personId: string,
    roleId: string,
    activeOnly?: boolean,
  ): Promise<PersonRoleAssignment[]>;

  /**
   * Find active assignments for a person
   */
  findActiveForPerson(
    personId: string,
    asOf?: Date,
  ): Promise<PersonRoleAssignment[]>;

  /**
   * Find assignments ending soon (within days)
   */
  findEndingSoon(days: number): Promise<PersonRoleAssignment[]>;

  /**
   * Find all person role assignments
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "startDate" | "endDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<PersonRoleAssignment[]>;

  /**
   * Count assignments for a person
   */
  countByPersonId(personId: string): Promise<number>;

  /**
   * Count active assignments for a person
   */
  countActiveByPersonId(personId: string, asOf?: Date): Promise<number>;

  /**
   * Count assignments for a role
   */
  countByRoleId(roleId: string): Promise<number>;

  /**
   * Update person role assignment
   */
  update(assignment: PersonRoleAssignment): Promise<PersonRoleAssignment>;

  /**
   * Delete person role assignment
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all assignments for a person
   */
  deleteByPersonId(personId: string): Promise<void>;

  /**
   * Check for overlapping assignments (same person, same role, overlapping dates)
   */
  hasOverlap(
    personId: string,
    roleId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<boolean>;
}
