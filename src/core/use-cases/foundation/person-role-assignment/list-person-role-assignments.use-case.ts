/**
 * List Person Role Assignments Use Case
 *
 * Business logic for listing person role assignments with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

export interface ListPersonRoleAssignmentsOptions {
  skip?: number;
  take?: number;
  orderBy?: "startDate" | "endDate" | "createdAt";
  order?: "asc" | "desc";
  personId?: string;
  roleId?: string;
  activeOnly?: boolean;
  asOf?: Date;
  endingSoonDays?: number;
}

@injectable()
export class ListPersonRoleAssignmentsUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly personRoleAssignmentRepository: IPersonRoleAssignmentRepository,
  ) {}

  /**
   * Execute list person role assignments use case
   *
   * @param options - Optional filter options
   * @returns Array of person role assignments
   */
  async execute(
    options?: ListPersonRoleAssignmentsOptions,
  ): Promise<PersonRoleAssignment[]> {
    if (options?.personId && options?.activeOnly) {
      return await this.personRoleAssignmentRepository.findActiveForPerson(
        options.personId,
        options.asOf,
      );
    }

    if (options?.personId) {
      return await this.personRoleAssignmentRepository.findByPersonId(
        options.personId,
        {
          activeOnly: options.activeOnly,
          asOf: options.asOf,
        },
      );
    }

    if (options?.roleId) {
      return await this.personRoleAssignmentRepository.findByRoleId(
        options.roleId,
        {
          activeOnly: options.activeOnly,
          asOf: options.asOf,
        },
      );
    }

    if (options?.endingSoonDays) {
      return await this.personRoleAssignmentRepository.findEndingSoon(
        options.endingSoonDays,
      );
    }

    return await this.personRoleAssignmentRepository.findAll(options);
  }
}
