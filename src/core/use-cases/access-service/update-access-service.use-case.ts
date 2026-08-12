import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
  AccessServiceAssigneeInput,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface UpdateAccessServiceRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  requireManagerApproval?: boolean;
  instructions?: string | null;
  assignees?: AccessServiceAssigneeInput[];
  updatedById?: string | null;
}

@injectable()
export class UpdateAccessServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: UpdateAccessServiceRequest,
  ): Promise<AccessServiceData> {
    const existing = await this.repo.findById(request.id);
    if (!existing) {
      throw new NotFoundError(
        `Access service "${request.id}" not found.`,
        "AccessService",
        request.id,
      );
    }

    const newSlug =
      request.slug !== undefined
        ? request.slug.toLowerCase().trim()
        : undefined;
    const newName =
      request.name !== undefined ? request.name.trim() : undefined;

    if (newSlug && newSlug !== existing.slug) {
      const conflict = await this.repo.findBySlug(newSlug);
      if (conflict && conflict.id !== request.id) {
        throw new ConflictError(
          `An access service with slug "${newSlug}" already exists.`,
        );
      }
    }

    if (newName && newName !== existing.name) {
      const conflict = await this.repo.findByName(newName);
      if (conflict && conflict.id !== request.id) {
        throw new ConflictError(
          `An access service with name "${newName}" already exists.`,
        );
      }
    }

    const patch: Partial<
      Omit<AccessServiceData, "id" | "createdAt" | "updatedAt" | "assignees">
    > = {};
    if (newName !== undefined) patch.name = newName;
    if (newSlug !== undefined) patch.slug = newSlug;
    if (request.description !== undefined)
      patch.description = request.description;
    if (request.requireManagerApproval !== undefined)
      patch.requireManagerApproval = request.requireManagerApproval;
    if (request.instructions !== undefined)
      patch.instructions = request.instructions;
    if (request.updatedById !== undefined)
      patch.updatedById = request.updatedById;

    const result = await this.repo.update(
      request.id,
      patch,
      request.assignees ??
        existing.assignees?.map((a) => ({ userId: a.userId, role: a.role })) ??
        [],
    );

    this.logger.info("access-service.update", { id: request.id });
    return result;
  }
}
