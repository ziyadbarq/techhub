import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";

export interface GetImpactedServicesRequest {
  serviceId: string;
  maxDepth?: number;
}

export interface ImpactedService {
  serviceId: string;
  serviceName: string;
  depth: number;
}

/**
 * Get all services that would be impacted if a given service fails (recursive)
 * Example: "If Core Wallet Service goes down, what services are affected?"
 *
 * Uses recursive CTE to traverse the dependency graph up to maxDepth levels.
 */
@injectable()
export class GetImpactedServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: GetImpactedServicesRequest,
  ): Promise<ImpactedService[]> {
    const maxDepth = request.maxDepth ?? 3; // Default to 3 levels

    return await this.serviceRelationshipRepository.findImpactedServices(
      request.serviceId,
      maxDepth,
    );
  }
}
