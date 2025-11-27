import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";

export interface DeleteServiceRelationshipRequest {
  id: string;
}

@injectable()
export class DeleteServiceRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(request: DeleteServiceRelationshipRequest): Promise<void> {
    const relationship = await this.serviceRelationshipRepository.findById(
      request.id,
    );

    if (!relationship) {
      throw new Error(`Service relationship not found: ${request.id}`);
    }

    await this.serviceRelationshipRepository.delete(request.id);
  }
}
