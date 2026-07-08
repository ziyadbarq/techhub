import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "../../../repositories/configuration-item.repository.interface";
import type {
  ConfigurationItem,
  UpdateConfigurationItemProps,
} from "../../../domain/entities/configuration-item.entity";

export interface UpdateConfigurationItemRequest {
  id: string;
  updates: UpdateConfigurationItemProps;
}

@injectable()
export class UpdateConfigurationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
  ) {}

  async execute(
    request: UpdateConfigurationItemRequest,
  ): Promise<ConfigurationItem> {
    const ci = await this.ciRepository.findById(request.id);

    if (!ci) {
      throw new NotFoundError(`Configuration Item not found: ${request.id}`);
    }

    // Check if CI key already exists (if being updated)
    if (request.updates.ciKey) {
      const existing = await this.ciRepository.findByCiKey(
        request.updates.ciKey,
      );
      if (existing && existing.id !== request.id) {
        throw new ConflictError(
          `Configuration Item with CI key already exists: ${request.updates.ciKey}`,
        );
      }
    }

    ci.update(request.updates);

    return await this.ciRepository.update(ci);
  }
}
