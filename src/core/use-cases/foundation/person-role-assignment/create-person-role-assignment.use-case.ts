import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

const DISABLED_MESSAGE =
  "Person role assignments are no longer supported (feature removed).";

@injectable()
export class CreatePersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly repository: IPersonRoleAssignmentRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    _assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment> {
    // Explicitly fail to signal feature removal
    throw new Error(DISABLED_MESSAGE);
  }
}
