/**
 * Update Person Role Assignment Use Case
 *
 * Business logic for updating an existing person role assignment.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

export interface UpdatePersonRoleAssignmentProps {
  id: string;
  scope?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  isPrimary?: boolean;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdatePersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly personRoleAssignmentRepository: IPersonRoleAssignmentRepository,
  ) {}

  /**
   * Execute update person role assignment use case
   *
   * @param props - Update properties
   * @returns Updated person role assignment
   * @throws NotFoundError if person role assignment not found
   * @throws Error if dates would cause overlap with other assignments
   */
  async execute(
    props: UpdatePersonRoleAssignmentProps,
  ): Promise<PersonRoleAssignment> {
    // Fetch existing person role assignment
    const personRoleAssignment =
      await this.personRoleAssignmentRepository.findById(props.id);
    if (!personRoleAssignment) {
      throw new NotFoundError(
        "Person role assignment not found",
        "PersonRoleAssignment",
        props.id,
      );
    }

    // If dates are changing, check for overlaps
    if (props.startDate !== undefined || props.endDate !== undefined) {
      const newStartDate = props.startDate ?? personRoleAssignment.startDate;
      const newEndDate =
        props.endDate !== undefined
          ? props.endDate
          : personRoleAssignment.endDate;

      const hasOverlap = await this.personRoleAssignmentRepository.hasOverlap(
        personRoleAssignment.personId,
        personRoleAssignment.roleId,
        newStartDate,
        newEndDate,
        props.id,
      );

      if (hasOverlap) {
        throw new Error(
          "Cannot update person role assignment: new dates would overlap with existing assignment",
        );
      }
    }

    // Update using entity's update method (includes validation)
    personRoleAssignment.update({
      scope: props.scope,
      startDate: props.startDate,
      endDate: props.endDate,
      isPrimary: props.isPrimary,
      note: props.note,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.personRoleAssignmentRepository.update(
      personRoleAssignment,
    );
  }
}
