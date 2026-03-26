import type { DisposalApproval } from "@/core/domain/entities/disposal-approval.entity";
import type { DisposalApprovalDTO } from "../dtos/generated/disposal-approval.dto";

export class DisposalApprovalPresenter {
  static toDTO(approval: DisposalApproval): DisposalApprovalDTO {
    return {
      id: approval.id,
      disposalId: approval.disposalId,
      approverId: approval.approverId,
      status: approval.status,
      decisionAt: approval.decisionAt,
      comment: approval.comment,
      createdAt: approval.createdAt,
    };
  }

  static toDTOList(approvals: DisposalApproval[]): DisposalApprovalDTO[] {
    return approvals.map((approval) => this.toDTO(approval));
  }
}
