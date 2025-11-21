import type { DisposalApproval } from "@/core/domain/entities/disposal-approval.entity";
import type { ApprovalStatus } from "@/core/domain/entities/disposal-approval.entity";

export interface IDisposalApprovalRepository {
  /**
   * Create a new disposal approval
   */
  create(approval: DisposalApproval): Promise<DisposalApproval>;

  /**
   * Find approval by ID
   */
  findById(id: string): Promise<DisposalApproval | null>;

  /**
   * Find all approvals for a disposal
   */
  findByDisposalId(disposalId: string): Promise<DisposalApproval[]>;

  /**
   * Find approvals by approver
   */
  findByApproverId(
    approverId: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalApproval[]>;

  /**
   * Find approvals by status
   */
  findByStatus(
    status: ApprovalStatus,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalApproval[]>;

  /**
   * Find pending approvals for a specific approver
   */
  findPendingByApprover(approverId: string): Promise<DisposalApproval[]>;

  /**
   * Find all pending approvals
   */
  findAllPending(options?: {
    skip?: number;
    take?: number;
  }): Promise<DisposalApproval[]>;

  /**
   * Check if disposal has any pending approvals
   */
  hasPendingApprovals(disposalId: string): Promise<boolean>;

  /**
   * Check if disposal has any rejected approvals
   */
  hasRejectedApprovals(disposalId: string): Promise<boolean>;

  /**
   * Check if all approvals for disposal are approved
   */
  areAllApproved(disposalId: string): Promise<boolean>;

  /**
   * Update an approval
   */
  update(approval: DisposalApproval): Promise<DisposalApproval>;

  /**
   * Delete an approval
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all approvals for a disposal
   */
  deleteByDisposalId(disposalId: string): Promise<void>;

  /**
   * Count approvals by status
   */
  countByStatus(status: ApprovalStatus): Promise<number>;

  /**
   * Count total approvals for a disposal
   */
  countByDisposalId(disposalId: string): Promise<number>;
}
