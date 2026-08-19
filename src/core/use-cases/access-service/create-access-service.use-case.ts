import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
  AccessServiceAssigneeInput,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface CreateAccessServiceRequest {
  name: string;
  slug: string;
  description?: string | null;
  requireManagerApproval?: boolean;
  instructions?: string | null;
  assignees?: AccessServiceAssigneeInput[];
  createdById?: string | null;
}

@injectable()
export class CreateAccessServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: CreateAccessServiceRequest,
  ): Promise<AccessServiceData> {
    const slug = request.slug.toLowerCase().trim();

    const [bySlug, byName] = await Promise.all([
      this.repo.findBySlug(slug),
      this.repo.findByName(request.name.trim()),
    ]);

    if (bySlug) {
      throw new ConflictError(
        `An access service with slug "${slug}" already exists.`,
      );
    }
    if (byName) {
      throw new ConflictError(
        `An access service with name "${request.name.trim()}" already exists.`,
      );
    }

    const id = this.idGenerator.generateId();
    const result = await this.repo.create(
      {
        id,
        name: request.name.trim(),
        slug,
        description: request.description ?? null,
        isActive: true,
        requireManagerApproval: request.requireManagerApproval ?? false,
        instructions: request.instructions ?? null,
        createdById: request.createdById ?? null,
        updatedById: request.createdById ?? null,
      },
      request.assignees ?? [],
    );

    this.logger.info("access-service.create", { id, slug });
    return result;
  }
}
