import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "../../../repositories/configuration-item.repository.interface";
import type { ConfigurationItem } from "../../../domain/entities/configuration-item.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetConfigurationItemRequest {
  id?: string;
  ciKey?: string;
}

@injectable()
export class GetConfigurationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
  ) {}

  async execute(
    request: GetConfigurationItemRequest,
  ): Promise<ConfigurationItem> {
    if (!request.id && !request.ciKey) {
      throw new Error("Either id or ciKey must be provided");
    }

    let ci: ConfigurationItem | null = null;

    if (request.id) {
      ci = await this.ciRepository.findById(request.id);
    } else if (request.ciKey) {
      ci = await this.ciRepository.findByCiKey(request.ciKey);
    }

    if (!ci) {
      const identifier = request.id || request.ciKey || "unknown";
      throw new NotFoundError(`Configuration Item not found: ${identifier}`);
    }

    return ci;
  }
}
