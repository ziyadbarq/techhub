/**
 * Contract Presenter
 * Transforms Contract entities to DTOs for the presentation layer
 */

import type { Contract } from "@/core/domain/entities/contract.entity";

export interface ContractDTO {
  id: string;
  contractTypeId: string;
  vendorId: string;
  name: string;
  contractNumber: string | null;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  renewalTerms: string | null;
  slaDefinition: Record<string, unknown> | null;
  totalValue: number | null;
  currency: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
}

export class ContractPresenter {
  static toDTO(contract: Contract, includeStatus = false): ContractDTO {
    const dto: ContractDTO = {
      id: contract.id,
      contractTypeId: contract.contractTypeId,
      vendorId: contract.vendorId,
      name: contract.name,
      contractNumber: contract.contractNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      autoRenew: contract.autoRenew,
      renewalTerms: contract.renewalTerms,
      slaDefinition: contract.slaDefinition,
      totalValue: contract.totalValue,
      currency: contract.currency,
      note: contract.note,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };

    if (includeStatus) {
      dto.isActive = contract.isActive();
      dto.isExpired = contract.isExpired();
      dto.daysUntilExpiry = contract.daysUntilExpiry();
    }

    return dto;
  }

  static toDTOList(
    contracts: Contract[],
    includeStatus = false,
  ): ContractDTO[] {
    return contracts.map((contract) => this.toDTO(contract, includeStatus));
  }
}
