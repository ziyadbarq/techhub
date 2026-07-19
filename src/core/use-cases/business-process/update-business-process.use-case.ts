import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import { LogExecution } from "@/lib/decorators";

export interface UpdateBusinessProcessRequest {
  businessProcessId: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class UpdateBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("businessProcess.update")
  async execute(
    request: UpdateBusinessProcessRequest,
  ): Promise<BusinessProcess> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new ValidationError(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    // Check if code is being changed and if new code already exists
    if (request.code && request.code !== businessProcess.code) {
      const codeExists = await this.businessProcessRepository.existsByCode(
        request.code,
        request.businessProcessId,
      );
      if (codeExists) {
        throw new ConflictError(
          `Business process with code "${request.code}" already exists`,
        );
      }
    }

    businessProcess.update({
      code: request.code,
      name: request.name,
      description: request.description,
      category: request.category,
      metadata: request.metadata,
    });

    return this.businessProcessRepository.update(businessProcess);
  }
}
