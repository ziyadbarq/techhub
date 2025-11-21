/**
 * AssetDisposal Entity
 *
 * Represents a disposal workflow for an asset with approval process,
 * sanitization checklist, and certificate generation.
 */

export type DisposalType =
  | "DONATION"
  | "SALE"
  | "RECYCLING"
  | "DESTRUCTION"
  | "OTHER";
export type DisposalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface SanitizationChecklist {
  checkedItems: string[];
  completedAt: Date | null;
  performedById: string | null;
}

export interface AssetDisposalProps {
  id: string;
  assetId: string;
  disposalType: DisposalType;
  reason: string | null;
  initiatedById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  status: DisposalStatus;
  estimatedValue: number | null;
  actualProceeds: number | null;
  currency: string | null;
  sanitizationChecklist: SanitizationChecklist | null;
  disposalDate: Date | null;
  certificateNumber: string | null;
  certificateIssuedAt: Date | null;
  disposalVendorId: string | null;
  recipientInfo: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetDisposalProps {
  assetId: string;
  disposalType: DisposalType;
  reason?: string | null;
  initiatedById: string;
  estimatedValue?: number | null;
  currency?: string | null;
  disposalVendorId?: string | null;
  recipientInfo?: string | null;
  note?: string | null;
}

export class AssetDisposal {
  private constructor(private props: AssetDisposalProps) {
    this.validate();
  }

  static create(props: CreateAssetDisposalProps): AssetDisposal {
    if (!props.assetId?.trim()) {
      throw new Error("Asset ID is required");
    }
    if (!props.initiatedById?.trim()) {
      throw new Error("Initiated by ID is required");
    }

    const now = new Date();

    return new AssetDisposal({
      id: crypto.randomUUID(),
      assetId: props.assetId,
      disposalType: props.disposalType,
      reason: props.reason?.trim() || null,
      initiatedById: props.initiatedById,
      approvedById: null,
      approvedAt: null,
      status: "PENDING_APPROVAL",
      estimatedValue: props.estimatedValue ?? null,
      actualProceeds: null,
      currency: props.currency ?? null,
      sanitizationChecklist: null,
      disposalDate: null,
      certificateNumber: null,
      certificateIssuedAt: null,
      disposalVendorId: props.disposalVendorId ?? null,
      recipientInfo: props.recipientInfo?.trim() || null,
      note: props.note?.trim() || null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetDisposalProps): AssetDisposal {
    return new AssetDisposal(props);
  }

  // Workflow methods
  approve(approvedById: string): void {
    if (this.props.status !== "PENDING_APPROVAL") {
      throw new Error("Can only approve disposal in PENDING_APPROVAL status");
    }

    this.props.status = "APPROVED";
    this.props.approvedById = approvedById;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(): void {
    if (this.props.status !== "PENDING_APPROVAL") {
      throw new Error("Can only reject disposal in PENDING_APPROVAL status");
    }

    this.props.status = "REJECTED";
    this.props.updatedAt = new Date();
  }

  startDisposal(): void {
    if (this.props.status !== "APPROVED") {
      throw new Error("Can only start disposal after approval");
    }

    this.props.status = "IN_PROGRESS";
    this.props.updatedAt = new Date();
  }

  completeSanitization(checkedItems: string[], performedById: string): void {
    if (
      this.props.status !== "IN_PROGRESS" &&
      this.props.status !== "APPROVED"
    ) {
      throw new Error("Invalid status for sanitization completion");
    }

    this.props.sanitizationChecklist = {
      checkedItems,
      completedAt: new Date(),
      performedById,
    };
    this.props.updatedAt = new Date();
  }

  completeDisposal(disposalDate: Date, actualProceeds?: number): void {
    if (
      this.props.status !== "IN_PROGRESS" &&
      this.props.status !== "APPROVED"
    ) {
      throw new Error(
        "Can only complete disposal in IN_PROGRESS or APPROVED status",
      );
    }

    if (!this.props.sanitizationChecklist?.completedAt) {
      throw new Error("Sanitization must be completed before disposal");
    }

    this.props.status = "COMPLETED";
    this.props.disposalDate = disposalDate;
    if (actualProceeds !== undefined) {
      this.props.actualProceeds = actualProceeds;
    }
    this.props.updatedAt = new Date();
  }

  generateCertificate(): string {
    if (this.props.status !== "COMPLETED") {
      throw new Error("Can only generate certificate for completed disposal");
    }

    if (this.props.certificateNumber) {
      return this.props.certificateNumber;
    }

    // Generate certificate number: DISP-YYYYMMDD-XXXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.props.certificateNumber = `DISP-${date}-${random}`;
    this.props.certificateIssuedAt = new Date();
    this.props.updatedAt = new Date();

    return this.props.certificateNumber;
  }

  cancel(): void {
    if (this.props.status === "COMPLETED") {
      throw new Error("Cannot cancel completed disposal");
    }

    this.props.status = "CANCELLED";
    this.props.updatedAt = new Date();
  }

  // Status checks
  isPendingApproval(): boolean {
    return this.props.status === "PENDING_APPROVAL";
  }

  isApproved(): boolean {
    return this.props.status === "APPROVED";
  }

  isCompleted(): boolean {
    return this.props.status === "COMPLETED";
  }

  canBeApproved(): boolean {
    return this.props.status === "PENDING_APPROVAL";
  }

  canBeCompleted(): boolean {
    return (
      (this.props.status === "IN_PROGRESS" ||
        this.props.status === "APPROVED") &&
      !!this.props.sanitizationChecklist?.completedAt
    );
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Disposal ID is required");
    }
    if (!this.props.assetId) {
      throw new Error("Asset ID is required");
    }
    if (!this.props.initiatedById) {
      throw new Error("Initiated by ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get disposalType(): DisposalType {
    return this.props.disposalType;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get initiatedById(): string {
    return this.props.initiatedById;
  }

  get approvedById(): string | null {
    return this.props.approvedById;
  }

  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }

  get status(): DisposalStatus {
    return this.props.status;
  }

  get estimatedValue(): number | null {
    return this.props.estimatedValue;
  }

  get actualProceeds(): number | null {
    return this.props.actualProceeds;
  }

  get currency(): string | null {
    return this.props.currency;
  }

  get sanitizationChecklist(): SanitizationChecklist | null {
    return this.props.sanitizationChecklist;
  }

  get disposalDate(): Date | null {
    return this.props.disposalDate;
  }

  get certificateNumber(): string | null {
    return this.props.certificateNumber;
  }

  get certificateIssuedAt(): Date | null {
    return this.props.certificateIssuedAt;
  }

  get disposalVendorId(): string | null {
    return this.props.disposalVendorId;
  }

  get recipientInfo(): string | null {
    return this.props.recipientInfo;
  }

  get note(): string | null {
    return this.props.note;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): AssetDisposalProps {
    return { ...this.props };
  }
}
