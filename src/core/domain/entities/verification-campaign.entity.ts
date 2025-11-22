/**
 * VerificationCampaign Domain Entity
 *
 * Represents a verification campaign for CIs or Assets.
 * Used to schedule and track verification activities across multiple items.
 */

import { v4 as uuid } from "uuid";

// Enum for target object type
export enum TargetObjectTypeEnum {
  CI = "CI",
  ASSET = "ASSET",
}

export interface CreateVerificationCampaignProps {
  name: string;
  description?: string | null;
  targetType: TargetObjectTypeEnum;
  filterDefinition?: Record<string, unknown> | null;
  scheduledStart: Date;
  scheduledEnd?: Date | null;
  createdById: string;
}

export interface VerificationCampaignProps
  extends CreateVerificationCampaignProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VerificationCampaign {
  private readonly props: VerificationCampaignProps;

  private constructor(props: VerificationCampaignProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    VerificationCampaign.validateName(value);
    this.props.name = value.trim();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(value: string | null) {
    this.props.description = value;
  }

  get targetType(): TargetObjectTypeEnum {
    return this.props.targetType;
  }

  get filterDefinition(): Record<string, unknown> | null {
    return this.props.filterDefinition ?? null;
  }

  set filterDefinition(value: Record<string, unknown> | null) {
    this.props.filterDefinition = value;
  }

  get scheduledStart(): Date {
    return this.props.scheduledStart;
  }

  set scheduledStart(value: Date) {
    VerificationCampaign.validateScheduledStart(value);
    this.props.scheduledStart = value;
  }

  get scheduledEnd(): Date | null {
    return this.props.scheduledEnd ?? null;
  }

  set scheduledEnd(value: Date | null) {
    if (value) {
      VerificationCampaign.validateScheduledEnd(
        this.props.scheduledStart,
        value,
      );
    }
    this.props.scheduledEnd = value;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  /**
   * Check if the campaign is active on a specific date
   * @param asOfDate - Date to check (defaults to now)
   */
  public isActive(asOfDate?: Date): boolean {
    const checkDate = asOfDate ?? new Date();
    const hasStarted = checkDate >= this.props.scheduledStart;
    const hasNotEnded =
      !this.props.scheduledEnd || checkDate <= this.props.scheduledEnd;

    return hasStarted && hasNotEnded;
  }

  /**
   * Check if the campaign is completed (past scheduled end date)
   */
  public isCompleted(): boolean {
    if (!this.props.scheduledEnd) {
      return false;
    }
    return new Date() > this.props.scheduledEnd;
  }

  /**
   * Check if the campaign has started (past scheduled start date)
   */
  public hasStarted(): boolean {
    return new Date() >= this.props.scheduledStart;
  }

  /**
   * Start the campaign by updating the scheduled start date to now
   */
  public start(): void {
    if (this.hasStarted()) {
      throw new Error("Campaign has already started");
    }
    this.props.scheduledStart = new Date();
  }

  /**
   * Complete the campaign by setting the scheduled end date to now
   */
  public complete(): void {
    if (!this.hasStarted()) {
      throw new Error("Cannot complete a campaign that has not started");
    }
    if (this.isCompleted()) {
      throw new Error("Campaign is already completed");
    }
    this.props.scheduledEnd = new Date();
  }

  /**
   * Update the schedule dates
   */
  public updateSchedule(startDate: Date, endDate?: Date | null): void {
    VerificationCampaign.validateScheduledStart(startDate);
    if (endDate) {
      VerificationCampaign.validateScheduledEnd(startDate, endDate);
    }
    this.props.scheduledStart = startDate;
    this.props.scheduledEnd = endDate ?? null;
  }

  // Factory method
  public static create(
    props: CreateVerificationCampaignProps,
  ): VerificationCampaign {
    // Validations
    VerificationCampaign.validateName(props.name);
    VerificationCampaign.validateScheduledStart(props.scheduledStart);
    if (props.scheduledEnd) {
      VerificationCampaign.validateScheduledEnd(
        props.scheduledStart,
        props.scheduledEnd,
      );
    }

    const now = new Date();
    return new VerificationCampaign({
      id: uuid(),
      name: props.name.trim(),
      description: props.description?.trim() || null,
      targetType: props.targetType,
      filterDefinition: props.filterDefinition ?? null,
      scheduledStart: props.scheduledStart,
      scheduledEnd: props.scheduledEnd ?? null,
      createdById: props.createdById,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(
    props: VerificationCampaignProps,
  ): VerificationCampaign {
    return new VerificationCampaign(props);
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim() === "") {
      throw new Error("Verification campaign name is required");
    }
    if (name.length > 255) {
      throw new Error(
        "Verification campaign name must not exceed 255 characters",
      );
    }
  }

  private static validateScheduledStart(scheduledStart: Date): void {
    if (!(scheduledStart instanceof Date) || isNaN(scheduledStart.getTime())) {
      throw new Error("Scheduled start date must be a valid date");
    }
  }

  private static validateScheduledEnd(
    scheduledStart: Date,
    scheduledEnd: Date,
  ): void {
    if (!(scheduledEnd instanceof Date) || isNaN(scheduledEnd.getTime())) {
      throw new Error("Scheduled end date must be a valid date");
    }
    if (scheduledEnd <= scheduledStart) {
      throw new Error("Scheduled end date must be after scheduled start date");
    }
  }
}
