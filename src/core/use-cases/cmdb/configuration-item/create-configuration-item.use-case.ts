import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "../../../repositories/configuration-item.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  ConfigurationItem,
  type CreateConfigurationItemProps,
} from "../../../domain/entities/configuration-item.entity";

export type CreateConfigurationItemRequest = CreateConfigurationItemProps;

@injectable()
export class CreateConfigurationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateConfigurationItemRequest,
  ): Promise<ConfigurationItem> {
    // Check if CI key already exists
    if (request.ciKey) {
      const exists = await this.ciRepository.existsByCiKey(request.ciKey);
      if (exists) {
        throw new ConflictError(
          `Configuration Item with CI key already exists: ${request.ciKey}`,
        );
      }
    }

    const ci = ConfigurationItem.create(request, this.idGenerator);
    return await this.ciRepository.create(ci);
  }
}
