import { randomUUID } from "node:crypto";
import { injectable } from "inversify";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import { PersonRoleAssignment as PersonRoleAssignmentEntity } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

/**
 * In-memory stub repository used after removing the underlying database tables.
 * Provides minimal no-op behavior to keep legacy interfaces compiling.
 */
@injectable()
export class InMemoryPersonRoleAssignmentRepository
  implements IPersonRoleAssignmentRepository
{
  private assignments: PersonRoleAssignment[] = [];

  async create(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment | null> {
    const id = randomUUID();
    const record = PersonRoleAssignmentEntity.reconstitute({
      ...assignment.toObject(),
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.assignments.push(record);
    return record;
  }

  async findById(id: string): Promise<PersonRoleAssignment | null> {
    return this.assignments.find((a) => a.id === id) ?? null;
  }

  async findByRoleId(roleId: string): Promise<PersonRoleAssignment[]> {
    return this.assignments.filter((a) => a.roleId === roleId);
  }

  async list(): Promise<PersonRoleAssignment[]> {
    return [...this.assignments];
  }

  async update(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment | null> {
    const idx = this.assignments.findIndex((a) => a.id === assignment.id);
    if (idx === -1) return null;
    const updated = PersonRoleAssignmentEntity.reconstitute({
      ...assignment.toObject(),
      updatedAt: new Date(),
    });
    this.assignments[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.assignments = this.assignments.filter((a) => a.id !== id);
  }
}
