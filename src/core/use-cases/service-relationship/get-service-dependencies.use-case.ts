import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type { ServiceRelationship } from "../../domain/entities/service-relationship.entity";

export interface GetServiceDependenciesRequest {
  serviceId: string;
}

/**
 * Get services that a given service depends on (outgoing dependencies)
 * Example: "What services does Core Wallet Service depend on?"
 */
@injectable()
export class GetServiceDependenciesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: GetServiceDependenciesRequest,
  ): Promise<ServiceRelationship[]> {
    // From service = the service that depends on others
    // So we get relationships WHERE fromServiceId = request.serviceId
    return await this.serviceRelationshipRepository.findByFromService(
      request.serviceId,
    );
  }
}
