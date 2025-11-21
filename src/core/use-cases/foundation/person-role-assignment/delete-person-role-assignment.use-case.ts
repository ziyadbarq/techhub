/**
 * Delete Person Role Assignment Use Case
 *
 * Business logic for deleting a person role assignment.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

@injectable()
export class DeletePersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly personRoleAssignmentRepository: IPersonRoleAssignmentRepository,
  ) {}

  /**
   * Execute delete person role assignment use case
   *
   * @param id - Person role assignment ID to delete
   * @throws NotFoundError if person role assignment not found
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const personRoleAssignment =
      await this.personRoleAssignmentRepository.findById(id);
    if (!personRoleAssignment) {
      throw new NotFoundError(
        "Person role assignment not found",
        "PersonRoleAssignment",
        id,
      );
    }

    await this.personRoleAssignmentRepository.delete(id);
  }
}
