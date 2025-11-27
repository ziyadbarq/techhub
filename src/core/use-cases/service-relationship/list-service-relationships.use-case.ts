import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ServiceRelationshipType } from "@/generated/prisma";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type { ServiceRelationship } from "../../domain/entities/service-relationship.entity";

export interface ListServiceRelationshipsRequest {
  serviceId?: string;
  relationshipType?: ServiceRelationshipType;
  activeOnly?: boolean;
  criticalOnly?: boolean;
}

@injectable()
export class ListServiceRelationshipsUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: ListServiceRelationshipsRequest = {},
  ): Promise<ServiceRelationship[]> {
    // Filter by critical only
    if (request.criticalOnly) {
      return await this.serviceRelationshipRepository.findCriticalRelationships();
    }

    // Filter by service
    if (request.serviceId) {
      return await this.serviceRelationshipRepository.findByService(
        request.serviceId,
      );
    }

    // Filter by relationship type
    if (request.relationshipType) {
      return await this.serviceRelationshipRepository.findByRelationshipType(
        request.relationshipType,
      );
    }

    // Filter by active only
    if (request.activeOnly) {
      return await this.serviceRelationshipRepository.findCurrentlyValidRelationships();
    }

    return await this.serviceRelationshipRepository.findAll();
  }
}
