import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import { LogExecution } from "@/lib/decorators";

export interface ListBusinessProcessesRequest {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "category" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListBusinessProcessesUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("businessProcess.list")
  async execute(
    request: ListBusinessProcessesRequest = {},
  ): Promise<BusinessProcess[]> {
    return this.businessProcessRepository.findAll({
      skip: request.skip,
      take: request.take,
      orderBy: request.orderBy,
      order: request.order,
    });
  }
}
