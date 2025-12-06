import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type { IServiceRepository } from "../../repositories/service.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  ServiceRelationship,
  type CreateServiceRelationshipProps,
} from "../../domain/entities/service-relationship.entity";

export type CreateServiceRelationshipRequest = CreateServiceRelationshipProps;

@injectable()
export class CreateServiceRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateServiceRelationshipRequest,
  ): Promise<ServiceRelationship> {
    // Verify fromService exists
    const fromService = await this.serviceRepository.findById(
      request.fromServiceId,
    );
    if (!fromService) {
      throw new Error(`From service not found: ${request.fromServiceId}`);
    }

    // Verify toService exists
    const toService = await this.serviceRepository.findById(
      request.toServiceId,
    );
    if (!toService) {
      throw new Error(`To service not found: ${request.toServiceId}`);
    }

    // Check for existing relationship
    const exists =
      await this.serviceRelationshipRepository.existsBetweenServices(
        request.fromServiceId,
        request.toServiceId,
        request.relationshipType,
      );

    if (exists) {
      throw new Error(
        "Relationship already exists between these services with the same type",
      );
    }

    const relationship = ServiceRelationship.create(request, this.idGenerator);
    return await this.serviceRelationshipRepository.create(relationship);
  }
}
