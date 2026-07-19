import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import { LogExecution } from "@/lib/decorators";

export interface GetBusinessProcessRequest {
  businessProcessId: string;
}

@injectable()
export class GetBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("businessProcess.get")
  async execute(request: GetBusinessProcessRequest): Promise<BusinessProcess> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new ValidationError(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    return businessProcess;
  }
}
