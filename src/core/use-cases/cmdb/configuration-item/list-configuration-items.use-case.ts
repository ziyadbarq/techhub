import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "../../../repositories/configuration-item.repository.interface";
import type {
  ConfigurationItem,
  CriticalityEnum,
  EnvironmentEnum,
} from "../../../domain/entities/configuration-item.entity";

export interface ListConfigurationItemsRequest {
  ciClassId?: string;
  linkedAssetId?: string;
  criticality?: CriticalityEnum;
  environment?: EnvironmentEnum;
  ownerPersonId?: string;
  unlinked?: boolean;
}

@injectable()
export class ListConfigurationItemsUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
  ) {}

  async execute(
    request: ListConfigurationItemsRequest = {},
  ): Promise<ConfigurationItem[]> {
    if (request.ciClassId) {
      return await this.ciRepository.findByCiClass(request.ciClassId);
    }

    if (request.linkedAssetId) {
      return await this.ciRepository.findByLinkedAsset(request.linkedAssetId);
    }

    if (request.criticality) {
      return await this.ciRepository.findByCriticality(request.criticality);
    }

    if (request.environment) {
      return await this.ciRepository.findByEnvironment(request.environment);
    }

    if (request.ownerPersonId) {
      return await this.ciRepository.findByOwnerPerson(request.ownerPersonId);
    }

    if (request.unlinked) {
      return await this.ciRepository.findUnlinked();
    }

    return await this.ciRepository.findAll();
  }
}
