import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import type { AssetDisposalDTO } from "../dtos/generated/asset-disposal.dto";

export interface AssetDisposalEnrichment {
  assetTag?: string;
}

export class AssetDisposalPresenter {
  static toDTO(
    disposal: AssetDisposal,
    enrichment?: AssetDisposalEnrichment,
  ): AssetDisposalDTO {
    return {
      id: disposal.id,
      assetId: disposal.assetId,
      disposalType: disposal.disposalType,
      reason: disposal.reason,
      initiatedById: disposal.initiatedById,
      approvedById: disposal.approvedById,
      approvedAt: disposal.approvedAt,
      status: disposal.status,
      estimatedValue: disposal.estimatedValue,
      actualProceeds: disposal.actualProceeds,
      currency: disposal.currency,
      sanitizationChecklist: disposal.sanitizationChecklist
        ? {
            checkedItems: disposal.sanitizationChecklist.checkedItems,
            completedAt: disposal.sanitizationChecklist.completedAt,
            performedById: disposal.sanitizationChecklist.performedById,
          }
        : null,
      disposalDate: disposal.disposalDate,
      certificateNumber: disposal.certificateNumber,
      certificateIssuedAt: disposal.certificateIssuedAt,
      disposalVendorId: disposal.disposalVendorId,
      recipientInfo: disposal.recipientInfo,
      note: disposal.note,
      metadata: disposal.metadata,
      createdAt: disposal.createdAt,
      updatedAt: disposal.updatedAt,
      // Display fields
      assetTag: enrichment?.assetTag,
    };
  }

  static toDTOList(
    disposals: AssetDisposal[],
    enrichmentMap?: Map<string, AssetDisposalEnrichment>,
  ): AssetDisposalDTO[] {
    return disposals.map((disposal) =>
      this.toDTO(disposal, enrichmentMap?.get(disposal.id)),
    );
  }
}
