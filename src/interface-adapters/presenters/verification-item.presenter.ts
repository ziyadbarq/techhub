/**
 * VerificationItem Presenter
 * Transforms VerificationItem entities to DTOs for the presentation layer
 */

import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface VerificationItemDTO {
  id: string;
  verificationCampaignId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  verifierPersonId: string | null;
  status: string;
  verifiedAt: Date | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class VerificationItemPresenter {
  static toDTO(verificationItem: VerificationItem): VerificationItemDTO {
    return {
      id: verificationItem.id,
      verificationCampaignId: verificationItem.verificationCampaignId,
      targetType: verificationItem.targetType,
      targetId: verificationItem.targetId,
      verifierPersonId: verificationItem.verifierPersonId,
      status: verificationItem.status,
      verifiedAt: verificationItem.verifiedAt,
      comment: verificationItem.comment,
      createdAt: verificationItem.createdAt,
      updatedAt: verificationItem.updatedAt,
    };
  }

  static toDTOList(verificationItems: VerificationItem[]): VerificationItemDTO[] {
    return verificationItems.map((verificationItem) =>
      this.toDTO(verificationItem),
    );
  }
}
