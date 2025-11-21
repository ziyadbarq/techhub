/**
 * DisposalApproval Entity
 *
 * Tracks individual approvals for asset disposal requests.
 * Supports multi-level approval workflows.
 */

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DisposalApprovalProps {
  id: string;
  disposalId: string;
  approverId: string;
  status: ApprovalStatus;
  decisionAt: Date | null;
  comment: string | null;
  createdAt: Date;
}

export interface CreateDisposalApprovalProps {
  disposalId: string;
  approverId: string;
  comment?: string | null;
}

export class DisposalApproval {
  private constructor(private props: DisposalApprovalProps) {
    this.validate();
  }

  static create(props: CreateDisposalApprovalProps): DisposalApproval {
    if (!props.disposalId?.trim()) {
      throw new Error("Disposal ID is required");
    }
    if (!props.approverId?.trim()) {
      throw new Error("Approver ID is required");
    }

    return new DisposalApproval({
      id: crypto.randomUUID(),
      disposalId: props.disposalId,
      approverId: props.approverId,
      status: "PENDING",
      decisionAt: null,
      comment: props.comment?.trim() || null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: DisposalApprovalProps): DisposalApproval {
    return new DisposalApproval(props);
  }

  approve(comment?: string): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Can only approve pending approval");
    }

    this.props.status = "APPROVED";
    this.props.decisionAt = new Date();
    if (comment) {
      this.props.comment = comment.trim();
    }
  }

  reject(comment: string): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Can only reject pending approval");
    }

    if (!comment?.trim()) {
      throw new Error("Comment is required when rejecting");
    }

    this.props.status = "REJECTED";
    this.props.decisionAt = new Date();
    this.props.comment = comment.trim();
  }

  isPending(): boolean {
    return this.props.status === "PENDING";
  }

  isApproved(): boolean {
    return this.props.status === "APPROVED";
  }

  isRejected(): boolean {
    return this.props.status === "REJECTED";
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Approval ID is required");
    }
    if (!this.props.disposalId) {
      throw new Error("Disposal ID is required");
    }
    if (!this.props.approverId) {
      throw new Error("Approver ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get disposalId(): string {
    return this.props.disposalId;
  }

  get approverId(): string {
    return this.props.approverId;
  }

  get status(): ApprovalStatus {
    return this.props.status;
  }

  get decisionAt(): Date | null {
    return this.props.decisionAt;
  }

  get comment(): string | null {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toObject(): DisposalApprovalProps {
    return { ...this.props };
  }
}
