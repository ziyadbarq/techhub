import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";

export interface ListServicesRequest {
  skip?: number;
  take?: number;
  orderBy?: "name" | "serviceType" | "currentStatus" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.list")
  async execute(request: ListServicesRequest = {}): Promise<Service[]> {
    return this.serviceRepository.findAll({
      skip: request.skip,
      take: request.take,
      orderBy: request.orderBy,
      order: request.order,
    });
  }
}
