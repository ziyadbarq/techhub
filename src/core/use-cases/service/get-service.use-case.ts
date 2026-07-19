import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetServiceRequest {
  serviceId: string;
}

@injectable()
export class GetServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.get")
  async execute(request: GetServiceRequest): Promise<Service> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new NotFoundError(`Service with ID ${request.serviceId} not found`);
    }

    return service;
  }
}
