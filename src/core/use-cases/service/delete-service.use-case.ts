import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteServiceRequest {
  serviceId: string;
}

@injectable()
export class DeleteServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.delete")
  async execute(request: DeleteServiceRequest): Promise<void> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new NotFoundError(`Service with ID ${request.serviceId} not found`);
    }

    await this.serviceRepository.delete(request.serviceId);
  }
}
