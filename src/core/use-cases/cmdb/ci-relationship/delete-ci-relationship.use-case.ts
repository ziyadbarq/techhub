import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "../../../repositories/ci-relationship.repository.interface";

export interface DeleteCIRelationshipRequest {
  id: string;
}

@injectable()
export class DeleteCIRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,
  ) {}

  async execute(request: DeleteCIRelationshipRequest): Promise<void> {
    const relationship = await this.ciRelationshipRepository.findById(
      request.id,
    );

    if (!relationship) {
      throw new Error(`CI Relationship not found: ${request.id}`);
    }

    await this.ciRelationshipRepository.delete(request.id);
  }
}
