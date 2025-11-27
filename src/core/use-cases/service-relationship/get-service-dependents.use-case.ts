import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type { ServiceRelationship } from "../../domain/entities/service-relationship.entity";

export interface GetServiceDependentsRequest {
  serviceId: string;
}

/**
 * Get services that depend on a given service (incoming dependencies)
 * Example: "What services depend on Core Wallet Service?"
 */
@injectable()
export class GetServiceDependentsUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: GetServiceDependentsRequest,
  ): Promise<ServiceRelationship[]> {
    // To service = the service that others depend on
    // So we get relationships WHERE toServiceId = request.serviceId
    return await this.serviceRelationshipRepository.findByToService(
      request.serviceId,
    );
  }
}
