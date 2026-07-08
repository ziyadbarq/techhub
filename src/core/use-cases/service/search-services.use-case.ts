import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { Service } from "@/core/domain/entities/service.entity";
import { LogExecution } from "@/lib/decorators";

export interface SearchServicesRequest {
  query: string;
  skip?: number;
  take?: number;
}

@injectable()
export class SearchServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("service.search")
  async execute(request: SearchServicesRequest): Promise<Service[]> {
    if (!request.query || request.query.trim().length === 0) {
      throw new ValidationError("Search query is required");
    }

    return this.serviceRepository.search(request.query, {
      skip: request.skip,
      take: request.take,
    });
  }
}
