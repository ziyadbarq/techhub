/**
 * Get Person Role Assignment Use Case
 *
 * Business logic for retrieving a single person role assignment by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

@injectable()
export class GetPersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly personRoleAssignmentRepository: IPersonRoleAssignmentRepository,
  ) {}

  /**
   * Execute get person role assignment use case
   *
   * @param id - Person role assignment ID
   * @returns Person role assignment or null if not found
   */
  async execute(id: string): Promise<PersonRoleAssignment | null> {
    return await this.personRoleAssignmentRepository.findById(id);
  }
}
