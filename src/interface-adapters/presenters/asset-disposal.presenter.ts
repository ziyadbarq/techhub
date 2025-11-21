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
      disposalMethod: disposal.disposalMethod,
      reason: disposal.reason,
      status: disposal.status,
      requestedDate: disposal.requestedDate,
      approvalDate: disposal.approvalDate,
      startDate: disposal.startDate,
      completionDate: disposal.completionDate,
      estimatedValue: disposal.estimatedValue,
      actualProceeds: disposal.actualProceeds,
      certificateNumber: disposal.certificateNumber,
      certificateGeneratedAt: disposal.certificateGeneratedAt,
      sanitizationChecklist: disposal.sanitizationChecklist,
      notes: disposal.notes,
      createdAt: disposal.createdAt,
      updatedAt: disposal.updatedAt,
    };
  }

  static toDTOList(disposals: AssetDisposal[]): AssetDisposalDTO[] {
    return disposals.map((disposal) => this.toDTO(disposal));
  }
}
