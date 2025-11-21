/**
 * MaintenanceSchedule Entity
 * Represents a recurring preventive maintenance schedule for an asset
 */

import { createId } from "@paralleldrive/cuid2";
import type { ScheduleType } from "../value-objects/schedule-type";
import { calculateNextDueDate } from "../value-objects/schedule-type";
import type { MaintenancePriority } from "../value-objects/maintenance-priority";

export interface MaintenanceScheduleProps {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  scheduleType: ScheduleType;
  intervalValue: number;
  startDate: Date;
  nextDueDate: Date;
  isActive: boolean;
  assignedToId: string | null;
  estimatedDurationMinutes: number | null;
  priority: MaintenancePriority;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceScheduleProps {
  assetId: string;
  title: string;
  description?: string | null;
  scheduleType: ScheduleType;
  intervalValue?: number;
  startDate?: Date;
  nextDueDate?: Date;
  isActive?: boolean;
  assignedToId?: string | null;
  estimatedDurationMinutes?: number | null;
  priority?: MaintenancePriority;
  instructions?: string | null;
}

export class MaintenanceSchedule {
  private constructor(private props: MaintenanceScheduleProps) {}

  /**
   * Create a new MaintenanceSchedule
   */
  static create(props: CreateMaintenanceScheduleProps): MaintenanceSchedule {
    // Validation
    const title = props.title.trim();
    if (title.length < 3 || title.length > 200) {
      throw new Error(
        "Maintenance schedule title must be between 3 and 200 characters",
      );
    }

    const intervalValue = props.intervalValue ?? 1;
    if (intervalValue < 1) {
      throw new Error("Interval value must be at least 1");
    }

    if (
      props.estimatedDurationMinutes !== null &&
      props.estimatedDurationMinutes !== undefined &&
      props.estimatedDurationMinutes < 0
    ) {
      throw new Error("Estimated duration cannot be negative");
    }

    const now = new Date();
    const startDate = props.startDate ?? now;

    // Calculate next due date if not provided
    const nextDueDate =
      props.nextDueDate ??
      calculateNextDueDate(startDate, props.scheduleType, intervalValue);

    return new MaintenanceSchedule({
      id: createId(),
      assetId: props.assetId,
      title,
      description: props.description?.trim() || null,
      scheduleType: props.scheduleType,
      intervalValue,
      startDate,
      nextDueDate,
      isActive: props.isActive ?? true,
      assignedToId: props.assignedToId ?? null,
      estimatedDurationMinutes: props.estimatedDurationMinutes ?? null,
      priority: (props.priority ?? "MEDIUM") as MaintenancePriority,
      instructions: props.instructions?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static reconstitute(props: MaintenanceScheduleProps): MaintenanceSchedule {
    return new MaintenanceSchedule(props);
  }

  /**
   * Update maintenance schedule
   */
  update(props: {
    title?: string;
    description?: string | null;
    scheduleType?: ScheduleType;
    intervalValue?: number;
    startDate?: Date;
    nextDueDate?: Date;
    isActive?: boolean;
    assignedToId?: string | null;
    estimatedDurationMinutes?: number | null;
    priority?: MaintenancePriority;
    instructions?: string | null;
  }): void {
    if (props.title !== undefined) {
      const title = props.title.trim();
      if (title.length < 3 || title.length > 200) {
        throw new Error(
          "Maintenance schedule title must be between 3 and 200 characters",
        );
      }
      this.props.title = title;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.scheduleType !== undefined) {
      this.props.scheduleType = props.scheduleType;
    }

    if (props.intervalValue !== undefined) {
      if (props.intervalValue < 1) {
        throw new Error("Interval value must be at least 1");
      }
      this.props.intervalValue = props.intervalValue;
    }

    if (props.startDate !== undefined) {
      this.props.startDate = props.startDate;
    }

    if (props.nextDueDate !== undefined) {
      this.props.nextDueDate = props.nextDueDate;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    if (props.assignedToId !== undefined) {
      this.props.assignedToId = props.assignedToId;
    }

    if (props.estimatedDurationMinutes !== undefined) {
      if (
        props.estimatedDurationMinutes !== null &&
        props.estimatedDurationMinutes < 0
      ) {
        throw new Error("Estimated duration cannot be negative");
      }
      this.props.estimatedDurationMinutes = props.estimatedDurationMinutes;
    }

    if (props.priority !== undefined) {
      this.props.priority = props.priority;
    }

    if (props.instructions !== undefined) {
      this.props.instructions = props.instructions?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Check if the schedule is overdue (next due date is in the past)
   */
  isOverdue(): boolean {
    return this.props.nextDueDate < new Date();
  }

  /**
   * Calculate and update the next due date
   */
  advanceNextDueDate(): void {
    this.props.nextDueDate = calculateNextDueDate(
      this.props.nextDueDate,
      this.props.scheduleType,
      this.props.intervalValue,
    );
    this.props.updatedAt = new Date();
  }

  /**
   * Activate the schedule
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the schedule
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get scheduleType(): ScheduleType {
    return this.props.scheduleType;
  }

  get intervalValue(): number {
    return this.props.intervalValue;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get nextDueDate(): Date {
    return this.props.nextDueDate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get assignedToId(): string | null {
    return this.props.assignedToId;
  }

  get estimatedDurationMinutes(): number | null {
    return this.props.estimatedDurationMinutes;
  }

  get priority(): MaintenancePriority {
    return this.props.priority;
  }

  get instructions(): string | null {
    return this.props.instructions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
