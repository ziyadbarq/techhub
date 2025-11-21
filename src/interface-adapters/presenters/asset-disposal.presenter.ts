/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import type { AssetDisposalDTO } from "../dtos/generated/asset-disposal.dto";

export class AssetDisposalPresenter {
  static toDTO(disposal: AssetDisposal): AssetDisposalDTO {
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
    };
  }

  static toDTOList(disposals: AssetDisposal[]): AssetDisposalDTO[] {
    return disposals.map((disposal) => this.toDTO(disposal));
  }
}
