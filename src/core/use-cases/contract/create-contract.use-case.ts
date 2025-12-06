/**
 * Create Contract Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import { Contract } from "@/core/domain/entities/contract.entity";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateContractRequest {
  contractTypeId: string;
  vendorId: string;
  name: string;
  contractNumber?: string | null;
  startDate: Date;
  endDate?: Date | null;
  autoRenew?: boolean;
  renewalTerms?: string | null;
  slaDefinition?: Record<string, unknown> | null;
  totalValue?: number | null;
  currency?: string | null;
  note?: string | null;
}

@injectable()
export class CreateContractUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.ISarConversionService)
    private sarConversionService: ISarConversionService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateContractRequest): Promise<Contract> {
    // Validate contract type exists
    const contractType = await this.contractTypeRepository.findById(
      request.contractTypeId,
    );
    if (!contractType) {
      throw new Error("Contract type not found");
    }

    // Validate vendor exists
    const vendor = await this.vendorRepository.findById(request.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Check for duplicate contract number if provided
    if (request.contractNumber) {
      const existingByNumber =
        await this.contractRepository.existsByContractNumber(
          request.contractNumber,
        );
      if (existingByNumber) {
        throw new Error("A contract with this contract number already exists");
      }
    }

    // Calculate SAR snapshot for total value
    const totalValueSar = await this.sarConversionService.convertToSarIfNeeded(
      request.totalValue,
      request.currency,
    );

    // Create contract entity
    const contract = Contract.create(
      {
        contractTypeId: request.contractTypeId,
        vendorId: request.vendorId,
        name: request.name,
        contractNumber: request.contractNumber,
        startDate: request.startDate,
        endDate: request.endDate,
        autoRenew: request.autoRenew,
        renewalTerms: request.renewalTerms,
        slaDefinition: request.slaDefinition,
        totalValue: request.totalValue,
        totalValueSar,
        currency: request.currency,
        note: request.note,
      },
      this.idGenerator,
    );

    return await this.contractRepository.create(contract);
  }
}
