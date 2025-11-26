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
  // Display fields (enriched from relations)
  vendorName?: string | null;
  contractTypeName?: string | null;
}

export interface ContractEnrichment {
  vendorName?: string | null;
  contractTypeName?: string | null;
}

export class ContractPresenter {
  static toDTO(
    contract: Contract,
    includeStatus = false,
    enrichment?: ContractEnrichment,
  ): ContractDTO {
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
      // Display fields
      vendorName: enrichment?.vendorName,
      contractTypeName: enrichment?.contractTypeName,
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
    enrichmentMap?: Map<string, ContractEnrichment>,
  ): ContractDTO[] {
    return contracts.map((contract) =>
      this.toDTO(contract, includeStatus, enrichmentMap?.get(contract.id)),
    );
  }
}
