/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { DisposalApproval } from "@/core/domain/entities/disposal-approval.entity";
import type { DisposalApprovalDTO } from "../dtos/generated/disposal-approval.dto";

export class DisposalApprovalPresenter {
  static toDTO(approval: DisposalApproval): DisposalApprovalDTO {
    return {
      id: approval.id,
      disposalId: approval.disposalId,
      approverId: approval.approverId,
      approvalLevel: approval.approvalLevel,
      status: approval.status,
      reviewedAt: approval.reviewedAt,
      comments: approval.comments,
      createdAt: approval.createdAt,
    };
  }

  static toDTOList(approvals: DisposalApproval[]): DisposalApprovalDTO[] {
    return approvals.map((approval) => this.toDTO(approval));
  }
}
