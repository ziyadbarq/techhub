import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IServiceOwnershipRepository,
  ServiceOwnershipWithPerson,
} from "@/core/repositories/service-ownership.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";

export interface GetServiceOwnersRequest {
  serviceId: string;
}

@injectable()
export class GetServiceOwnersUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceOwnershipRepository)
    private readonly serviceOwnershipRepository: IServiceOwnershipRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(
    request: GetServiceOwnersRequest,
  ): Promise<ServiceOwnershipWithPerson[]> {
    // Check if service exists; return empty list instead of throwing to keep UI resilient
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      return [];
    }

    return this.serviceOwnershipRepository.listWithPersonByService(
      request.serviceId,
    );
  }
}
