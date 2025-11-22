/**
 * VerificationItem Domain Entity
 *
 * Represents an item to be verified in a verification campaign,
 * tracking the verification status of assets or configuration items.
 */

import { v4 as uuid } from "uuid";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export enum VerificationStatusEnum {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  VERIFIED = "VERIFIED",
  EXCEPTION = "EXCEPTION",
}

export interface CreateVerificationItemProps {
  verificationCampaignId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  verifierPersonId?: string | null;
  status?: VerificationStatusEnum;
  verifiedAt?: Date | null;
  comment?: string | null;
}

export interface VerificationItemProps extends CreateVerificationItemProps {
  id: string;
  status: VerificationStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

export class VerificationItem {
  private readonly props: VerificationItemProps;

  private constructor(props: VerificationItemProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get verificationCampaignId(): string {
    return this.props.verificationCampaignId;
  }

  get targetType(): TargetObjectTypeEnum {
    return this.props.targetType;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get verifierPersonId(): string | null {
    return this.props.verifierPersonId ?? null;
  }

  set verifierPersonId(value: string | null) {
    this.props.verifierPersonId = value;
  }

  get status(): VerificationStatusEnum {
    return this.props.status;
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt ?? null;
  }

  get comment(): string | null {
    return this.props.comment ?? null;
  }

  set comment(value: string | null) {
    this.props.comment = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Status check methods
  public isPending(): boolean {
    return this.props.status === VerificationStatusEnum.PENDING;
  }

  public isInProgress(): boolean {
    return this.props.status === VerificationStatusEnum.IN_PROGRESS;
  }

  public isVerified(): boolean {
    return this.props.status === VerificationStatusEnum.VERIFIED;
  }

  public isException(): boolean {
    return this.props.status === VerificationStatusEnum.EXCEPTION;
  }

  // Business logic methods
  public startVerification(verifierPersonId: string): void {
    if (!this.isPending()) {
      throw new Error(
        "Only pending verification items can be started. Current status: " +
          this.props.status,
      );
    }

    this.props.status = VerificationStatusEnum.IN_PROGRESS;
    this.props.verifierPersonId = verifierPersonId;
    this.props.updatedAt = new Date();
  }

  public verify(comment?: string): void {
    if (!this.isInProgress()) {
      throw new Error(
        "Only in-progress verification items can be verified. Current status: " +
          this.props.status,
      );
    }

    this.props.status = VerificationStatusEnum.VERIFIED;
    this.props.verifiedAt = new Date();
    this.props.comment = comment ?? null;
    this.props.updatedAt = new Date();
  }

  public flagException(comment: string): void {
    if (!this.isInProgress()) {
      throw new Error(
        "Only in-progress verification items can be flagged as exception. Current status: " +
          this.props.status,
      );
    }

    if (!comment || comment.trim() === "") {
      throw new Error(
        "Comment is required when flagging a verification item as exception",
      );
    }

    this.props.status = VerificationStatusEnum.EXCEPTION;
    this.props.verifiedAt = new Date();
    this.props.comment = comment;
    this.props.updatedAt = new Date();
  }

  // Factory method
  public static create(
    props: CreateVerificationItemProps,
  ): VerificationItem {
    // Validations
    VerificationItem.validateCampaignId(props.verificationCampaignId);
    VerificationItem.validateTargetId(props.targetId);

    const now = new Date();
    return new VerificationItem({
      id: uuid(),
      verificationCampaignId: props.verificationCampaignId,
      targetType: props.targetType,
      targetId: props.targetId,
      verifierPersonId: props.verifierPersonId ?? null,
      status: props.status ?? VerificationStatusEnum.PENDING,
      verifiedAt: props.verifiedAt ?? null,
      comment: props.comment ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: VerificationItemProps): VerificationItem {
    return new VerificationItem(props);
  }

  // Validation methods
  private static validateCampaignId(campaignId: string): void {
    if (!campaignId || campaignId.trim() === "") {
      throw new Error("Verification campaign ID is required");
    }
  }

  private static validateTargetId(targetId: string): void {
    if (!targetId || targetId.trim() === "") {
      throw new Error("Target ID is required");
    }
  }
}
