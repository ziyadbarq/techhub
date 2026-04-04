import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";

export interface GetRetiringServicesRequest {
  daysThreshold?: number;
  skip?: number;
  take?: number;
}

@injectable()
export class GetRetiringServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.getRetiring")
  async execute(request: GetRetiringServicesRequest = {}): Promise<Service[]> {
    const daysThreshold = request.daysThreshold ?? 90; // Default 90 days

    return this.serviceRepository.findRetiringSoon(daysThreshold, {
      skip: request.skip,
      take: request.take,
    });
  }
}
