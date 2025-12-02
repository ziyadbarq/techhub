import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";

/**
 * IPersonRoleAssignmentRepository
 *
 * Stub repository to keep legacy interfaces compiling after removing
 * database-backed person role assignments.
 */
export interface IPersonRoleAssignmentRepository {
  create(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment | null>;
  findById(id: string): Promise<PersonRoleAssignment | null>;
  findByRoleId(roleId: string): Promise<PersonRoleAssignment[]>;
  list(): Promise<PersonRoleAssignment[]>;
  update(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment | null>;
  delete(id: string): Promise<void>;
}
