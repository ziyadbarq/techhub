import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";

const DISABLED_MESSAGE =
  "Person role assignments are no longer supported (feature removed).";

@injectable()
export class DeletePersonRoleAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRoleAssignmentRepository)
    private readonly repository: IPersonRoleAssignmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Explicitly fail to signal feature removal
    await this.repository.delete(id);
    throw new Error(DISABLED_MESSAGE);
  }
}
