/**
 * Exchange Rate Controller
 * Server actions for Exchange Rate CRUD operations and currency conversion
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateExchangeRateSchema,
  UpdateExchangeRateSchema,
  ConvertCurrencySchema,
  type CreateExchangeRateDTO,
  type UpdateExchangeRateDTO,
  type ConvertCurrencyDTO,
} from "../dtos/generated/exchange-rate.dto";
import {
  presentExchangeRate,
  presentExchangeRates,
  presentConvertCurrencyResult,
  type ExchangeRateResponseDTO,
  type ConvertCurrencyResponseDTO,
} from "../presenters/exchange-rate.presenter";
import type {
  CreateExchangeRateUseCase,
  ListExchangeRatesUseCase,
  GetExchangeRateUseCase,
  UpdateExchangeRateUseCase,
  DeleteExchangeRateUseCase,
  ConvertCurrencyUseCase,
} from "@/core/use-cases/foundation/exchange-rate";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createExchangeRateAction(
  data: CreateExchangeRateDTO,
): Promise<ActionResponse<ExchangeRateResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_CREATE);

    const validated = CreateExchangeRateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateExchangeRateUseCase>(
      DI_TOKENS.CreateExchangeRateUseCase,
    );

    const exchangeRate = await useCase.execute({
      currency: validated.currency,
      rateToSAR: validated.rateToSAR,
      isActive: validated.isActive,
    });

    revalidatePath("/fx-rates");

    return {
      success: true,
      data: presentExchangeRate(exchangeRate),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createExchangeRateAction" },
      "Failed to create exchange rate",
    );
  }
}

export async function listExchangeRatesAction(options?: {
  onlyActive?: boolean;
  orderBy?: "currency" | "createdAt";
  order?: "asc" | "desc";
}): Promise<ActionResponse<ExchangeRateResponseDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListExchangeRatesUseCase>(
      DI_TOKENS.ListExchangeRatesUseCase,
    );

    const exchangeRates = await useCase.execute(options);

    return {
      success: true,
      data: presentExchangeRates(exchangeRates),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listExchangeRatesAction" },
      "Failed to list exchange rates",
    );
  }
}

export async function getExchangeRateAction(
  currency: string,
  onlyActive: boolean = true,
): Promise<ActionResponse<ExchangeRateResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetExchangeRateUseCase>(
      DI_TOKENS.GetExchangeRateUseCase,
    );

    const exchangeRate = await useCase.execute(currency, onlyActive);


    return {
      success: true,
      data: presentExchangeRate(exchangeRate),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getExchangeRateAction" },
      "Failed to get exchange rate",
    );
  }
}

export async function updateExchangeRateAction(
  data: UpdateExchangeRateDTO,
): Promise<ActionResponse<ExchangeRateResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_UPDATE);

    const validated = UpdateExchangeRateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateExchangeRateUseCase>(
      DI_TOKENS.UpdateExchangeRateUseCase,
    );

    const exchangeRate = await useCase.execute({
      id: validated.id,
      rateToSAR: validated.rateToSAR,
      isActive: validated.isActive,
    });

    revalidatePath("/fx-rates");

    return {
      success: true,
      data: presentExchangeRate(exchangeRate),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateExchangeRateAction" },
      "Failed to update exchange rate",
    );
  }
}

export async function deleteExchangeRateAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteExchangeRateUseCase>(
      DI_TOKENS.DeleteExchangeRateUseCase,
    );

    await useCase.execute(id);

    revalidatePath("/fx-rates");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteExchangeRateAction" },
      "Failed to delete exchange rate",
    );
  }
}

export async function convertCurrencyAction(
  data: ConvertCurrencyDTO,
): Promise<ActionResponse<ConvertCurrencyResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_CONVERT);

    const validated = ConvertCurrencySchema.parse(data);

    const container = getContainer();
    const useCase = container.get<ConvertCurrencyUseCase>(
      DI_TOKENS.ConvertCurrencyUseCase,
    );

    const result = await useCase.execute({
      amount: validated.amount,
      fromCurrency: validated.fromCurrency,
    });

    return {
      success: true,
      data: presentConvertCurrencyResult(result),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "convertCurrencyAction" },
      "Failed to convert currency",
    );
  }
}
