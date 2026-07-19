import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface RetireServiceRequest {
  serviceId: string;
  reason?: string;
}

@injectable()
export class RetireServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.retire")
  async execute(request: RetireServiceRequest): Promise<Service> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new NotFoundError(`Service with ID ${request.serviceId} not found`);
    }

    // Check if service can be retired (business rule in entity)
    if (!service.canBeRetired()) {
      throw new ValidationError(
        "Cannot retire service: Essential services in PRODUCTION status cannot be retired",
      );
    }

    service.retire(request.reason);

    return this.serviceRepository.update(service);
  }
}
