/**
 * Create Person Role Assignment Use Case
 *
 * Business logic for creating a new person role assignment with overlap detection.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

export interface CreatePersonRoleAssignmentProps {
  personId: string;
  roleId: string;
  startDate: Date;
  endDate?: Date | null;
  notes?: string;
}

@injectable()
export class CreatePersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly personRoleAssignmentRepository: IPersonRoleAssignmentRepository,
  ) {}

  /**
   * Execute create person role assignment use case
   *
   * @param props - Person role assignment creation properties
   * @returns Created person role assignment
   * @throws Error if assignment would overlap with existing assignment
   */
  async execute(
    props: CreatePersonRoleAssignmentProps,
  ): Promise<PersonRoleAssignment> {
    // Check for overlapping assignments
    const hasOverlap = await this.personRoleAssignmentRepository.hasOverlap(
      props.personId,
      props.roleId,
      props.startDate,
      props.endDate ?? null,
    );

    if (hasOverlap) {
      throw new Error(
        "Cannot create person role assignment: overlaps with existing assignment for same person and role",
      );
    }

    const personRoleAssignment = PersonRoleAssignment.create(props);
    const created =
      await this.personRoleAssignmentRepository.create(personRoleAssignment);
    return created;
  }
}
