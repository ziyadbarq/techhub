import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";

export interface DeleteRelationshipTypeRequest {
  id: string;
}

@injectable()
export class DeleteRelationshipTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
  ) {}

  async execute(request: DeleteRelationshipTypeRequest): Promise<void> {
    const relationshipType = await this.relationshipTypeRepository.findById(
      request.id,
    );

    if (!relationshipType) {
      throw new Error(`Relationship type not found: ${request.id}`);
    }

    await this.relationshipTypeRepository.delete(request.id);
  }
}
