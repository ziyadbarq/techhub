/**
 * Update Contract Use Case
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { Contract } from "@/core/domain/entities/contract.entity";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateContractRequest {
  id: string;
  contractTypeId?: string;
  vendorId?: string;
  name?: string;
  contractNumber?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  autoRenew?: boolean;
  renewalTerms?: string | null;
  slaDefinition?: Record<string, unknown> | null;
  totalValue?: number | null;
  currency?: string | null;
  note?: string | null;
}

@injectable()
export class UpdateContractUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.ISarConversionService)
    private sarConversionService: ISarConversionService,
  ) {}

  async execute(request: UpdateContractRequest): Promise<Contract> {
    const contract = await this.contractRepository.findById(request.id);

    if (!contract) {
      throw new NotFoundError("Contract not found");
    }

    // Validate contract type if being updated
    if (
      request.contractTypeId !== undefined &&
      request.contractTypeId !== contract.contractTypeId
    ) {
      const contractType = await this.contractTypeRepository.findById(
        request.contractTypeId,
      );
      if (!contractType) {
        throw new NotFoundError("Contract type not found");
      }
    }

    // Validate vendor if being updated
    if (
      request.vendorId !== undefined &&
      request.vendorId !== contract.vendorId
    ) {
      const vendor = await this.vendorRepository.findById(request.vendorId);
      if (!vendor) {
        throw new NotFoundError("Vendor not found");
      }
    }

    // Check for duplicate contract number if being updated
    if (
      request.contractNumber !== undefined &&
      request.contractNumber !== contract.contractNumber
    ) {
      if (request.contractNumber) {
        const existingByNumber =
          await this.contractRepository.existsByContractNumber(
            request.contractNumber,
            request.id,
          );
        if (existingByNumber) {
          throw new ConflictError(
            "A contract with this contract number already exists",
          );
        }
      }
    }

    // Update contract fields
    if (request.name !== undefined) {
      contract["props"].name = request.name.trim();
    }
    if (request.contractNumber !== undefined) {
      contract.contractNumber = request.contractNumber;
    }
    if (request.startDate !== undefined) {
      contract.startDate = request.startDate;
    }
    if (request.endDate !== undefined) {
      contract.endDate = request.endDate;
    }
    if (request.autoRenew !== undefined) {
      contract.autoRenew = request.autoRenew;
    }
    if (request.renewalTerms !== undefined) {
      contract.renewalTerms = request.renewalTerms;
    }
    if (request.slaDefinition !== undefined) {
      contract.slaDefinition = request.slaDefinition;
    }
    if (request.totalValue !== undefined) {
      contract.totalValue = request.totalValue;
    }
    if (request.currency !== undefined) {
      contract.currency = request.currency;
    }
    if (request.note !== undefined) {
      contract.note = request.note;
    }

    // Check if SAR recalculation is needed (when value or currency changes)
    const sarCheck = this.sarConversionService.shouldRecalculateSar(
      { amount: request.totalValue, currency: request.currency },
      contract.totalValue,
      contract.currency,
    );

    if (sarCheck.needsConversion) {
      const totalValueSar =
        await this.sarConversionService.convertToSarIfNeeded(
          sarCheck.amount,
          sarCheck.currency,
        );
      contract.totalValueSar = totalValueSar;
    }

    return await this.contractRepository.update(contract);
  }
}
