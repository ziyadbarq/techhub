import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

@injectable()
export class GetPersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly repository: IPersonRoleAssignmentRepository,
  ) {}

  async execute(id: string): Promise<PersonRoleAssignment | null> {
    return this.repository.findById(id);
  }
}
