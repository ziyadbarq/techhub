import { injectable, inject } from "inversify";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
} from "@/core/repositories/workflow/access-service.repository.interface";

export interface GetAccessServiceRequest {
  id: string;
}

@injectable()
export class GetAccessServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
  ) {}

  async execute(request: GetAccessServiceRequest): Promise<AccessServiceData> {
    const service = await this.repo.findById(request.id);
    if (!service) {
      throw new NotFoundError(
        `Access service "${request.id}" not found.`,
        "AccessService",
        request.id,
      );
    }
    return service;
  }
}
