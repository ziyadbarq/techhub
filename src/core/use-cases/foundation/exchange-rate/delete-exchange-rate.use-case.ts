/**
 * Delete Exchange Rate Use Case
 *
 * Business logic for deleting (deactivating) an exchange rate.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteExchangeRateUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Execute delete exchange rate use case
   *
   * @param id - Exchange rate ID
   * @throws Error if exchange rate not found
   */
  async execute(id: string): Promise<void> {
    const exchangeRate = await this.exchangeRateRepository.findById(id);

    if (!exchangeRate) {
      throw new NotFoundError(`Exchange rate with ID "${id}" not found`);
    }

    // Check if this is the SAR rate - cannot delete
    if (exchangeRate.isSAR()) {
      throw new ValidationError("Cannot delete the SAR base rate");
    }

    await this.exchangeRateRepository.delete(id);
  }
}
