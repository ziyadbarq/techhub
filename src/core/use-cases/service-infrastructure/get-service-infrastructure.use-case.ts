import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import { LogExecution } from "@/lib/decorators";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetServiceInfrastructureRequest {
  serviceId: string;
}

@injectable()
export class GetServiceInfrastructureUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceInfrastructureRepository)
    private readonly infrastructureRepository: IServiceInfrastructureRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("serviceInfrastructure.get")
  async execute(
    request: GetServiceInfrastructureRequest,
  ): Promise<ServiceInfrastructure[]> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new NotFoundError(`Service with ID ${request.serviceId} not found`);
    }

    return this.infrastructureRepository.findByServiceId(request.serviceId);
  }
}
