import { injectable, inject } from "inversify";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface ToggleAccessServiceStatusRequest {
  id: string;
  isActive: boolean;
  updatedById?: string | null;
}

@injectable()
export class ToggleAccessServiceStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: ToggleAccessServiceStatusRequest,
  ): Promise<AccessServiceData> {
    const existing = await this.repo.findById(request.id);
    if (!existing) {
      throw new NotFoundError(
        `Access service "${request.id}" not found.`,
        "AccessService",
        request.id,
      );
    }

    const result = await this.repo.update(
      request.id,
      {
        isActive: request.isActive,
        updatedById: request.updatedById ?? null,
      },
      // preserve existing assignees unchanged
      existing.assignees?.map((a) => ({ userId: a.userId, role: a.role })) ??
        [],
    );

    this.logger.info("access-service.toggle-status", {
      id: request.id,
      isActive: request.isActive,
    });
    return result;
  }
}
