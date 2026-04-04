import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface DeleteBusinessProcessRequest {
  businessProcessId: string;
}

@injectable()
export class DeleteBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("businessProcess.delete")
  async execute(request: DeleteBusinessProcessRequest): Promise<void> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new Error(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    await this.businessProcessRepository.delete(request.businessProcessId);
  }
}
