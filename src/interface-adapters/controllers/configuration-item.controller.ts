"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  ConfigurationItemDTO,
  CreateConfigurationItemDTO,
  UpdateConfigurationItemDTO,
} from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { ConfigurationItemPresenter } from "@/interface-adapters/presenters/configuration-item.presenter";
import type {
  CriticalityEnum,
  EnvironmentEnum,
} from "@/core/domain/entities/configuration-item.entity";
import type { CreateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/create-configuration-item.use-case";
import type { GetConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/get-configuration-item.use-case";
import type { ListConfigurationItemsUseCase } from "@/core/use-cases/cmdb/configuration-item/list-configuration-items.use-case";
import type { UpdateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/update-configuration-item.use-case";
import type { DeleteConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/delete-configuration-item.use-case";

export async function createConfigurationItemAction(
  data: CreateConfigurationItemDTO,
): Promise<ActionResponse<ConfigurationItemDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<CreateConfigurationItemUseCase>(
      DI_TOKENS.CreateConfigurationItemUseCase,
    );

    const ci = await useCase.execute(data);
    const dto = ConfigurationItemPresenter.toDTO(ci);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createConfigurationItemAction" },
      "Failed to create configuration item",
    );
  }
}

export async function getConfigurationItemAction(
  id: string,
): Promise<ActionResponse<ConfigurationItemDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<GetConfigurationItemUseCase>(
      DI_TOKENS.GetConfigurationItemUseCase,
    );

    const ci = await useCase.execute({ id });
    const dto = ConfigurationItemPresenter.toDTO(ci);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getConfigurationItemAction" },
      "Failed to get configuration item",
    );
  }
}

export async function listConfigurationItemsAction(filters?: {
  ciClassId?: string;
  linkedAssetId?: string;
  criticality?: CriticalityEnum;
  environment?: EnvironmentEnum;
  ownerPersonId?: string;
  unlinked?: boolean;
}): Promise<ActionResponse<ConfigurationItemDTO[]>> {
  try {
    const container = getContainer();
    const useCase = container.get<ListConfigurationItemsUseCase>(
      DI_TOKENS.ListConfigurationItemsUseCase,
    );

    const cis = await useCase.execute(filters);
    const dtos = ConfigurationItemPresenter.toDTOList(cis);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listConfigurationItemsAction" },
      "Failed to list configuration items",
    );
  }
}

export async function updateConfigurationItemAction(
  id: string,
  updates: UpdateConfigurationItemDTO,
): Promise<ActionResponse<ConfigurationItemDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<UpdateConfigurationItemUseCase>(
      DI_TOKENS.UpdateConfigurationItemUseCase,
    );

    const ci = await useCase.execute({ id, updates });
    const dto = ConfigurationItemPresenter.toDTO(ci);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateConfigurationItemAction" },
      "Failed to update configuration item",
    );
  }
}

export async function deleteConfigurationItemAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    const container = getContainer();
    const useCase = container.get<DeleteConfigurationItemUseCase>(
      DI_TOKENS.DeleteConfigurationItemUseCase,
    );

    await useCase.execute({ id });

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteConfigurationItemAction" },
      "Failed to delete configuration item",
    );
  }
}
