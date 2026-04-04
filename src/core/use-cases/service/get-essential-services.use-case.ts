import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";

export interface GetEssentialServicesRequest {
  skip?: number;
  take?: number;
}

@injectable()
export class GetEssentialServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.getEssential")
  async execute(request: GetEssentialServicesRequest = {}): Promise<Service[]> {
    return this.serviceRepository.findEssentialServices({
      skip: request.skip,
      take: request.take,
    });
  }
}
