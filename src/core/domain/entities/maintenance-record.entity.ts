/**
 * MaintenanceRecord Entity
 * Represents an actual maintenance task performed or scheduled on an asset
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { MaintenanceStatus } from "../value-objects/maintenance-status";
import {
  canTransitionTo,
  isTerminalStatus,
} from "../value-objects/maintenance-status";

export interface MaintenanceRecordProps {
  id: string;
  assetId: string;
  maintenanceScheduleId: string | null;
  title: string;
  description: string | null;
  scheduledDate: Date;
  completedDate: Date | null;
  performedById: string | null;
  status: MaintenanceStatus;
  notes: string | null;
  cost: number | null;
  currency: string | null;
  partsUsed: string[] | null;
  nextMaintenanceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceRecordProps {
  assetId: string;
  maintenanceScheduleId?: string | null;
  title: string;
  description?: string | null;
  scheduledDate?: Date;
  completedDate?: Date | null;
  performedById?: string | null;
  status?: MaintenanceStatus;
  notes?: string | null;
  cost?: number | null;
  currency?: string | null;
  partsUsed?: string[] | null;
  nextMaintenanceDate?: Date | null;
}

export class MaintenanceRecord {
  private constructor(private props: MaintenanceRecordProps) {}

  /**
   * Create a new MaintenanceRecord
   */
  static create(
    props: CreateMaintenanceRecordProps,
    idGenerator: IIdGenerator,
  ): MaintenanceRecord {
    // Validation
    const title = props.title.trim();
    if (title.length < 3 || title.length > 200) {
      throw new Error(
        "Maintenance record title must be between 3 and 200 characters",
      );
    }

    if (props.cost !== null && props.cost !== undefined && props.cost < 0) {
      throw new Error("Maintenance cost cannot be negative");
    }

    const status = (props.status ?? "SCHEDULED") as MaintenanceStatus;
    const performedById = props.performedById ?? null;

    // Business rules
    if (
      (status === "IN_PROGRESS" || status === "COMPLETED") &&
      !performedById
    ) {
      throw new Error(
        "performedById is required when status is IN_PROGRESS or COMPLETED",
      );
    }

    if (status === "COMPLETED" && !props.completedDate) {
      throw new Error("completedDate is required when status is COMPLETED");
    }

    const now = new Date();

    return new MaintenanceRecord({
      id: idGenerator.generateId(),
      assetId: props.assetId,
      maintenanceScheduleId: props.maintenanceScheduleId ?? null,
      title,
      description: props.description?.trim() || null,
      scheduledDate: props.scheduledDate ?? now,
      completedDate: props.completedDate ?? null,
      performedById,
      status,
      notes: props.notes?.trim() || null,
      cost: props.cost ?? null,
      currency: props.currency ?? null,
      partsUsed: props.partsUsed ?? null,
      nextMaintenanceDate: props.nextMaintenanceDate ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static reconstitute(props: MaintenanceRecordProps): MaintenanceRecord {
    return new MaintenanceRecord(props);
  }

  /**
   * Update maintenance record
   */
  update(props: {
    title?: string;
    description?: string | null;
    scheduledDate?: Date;
    completedDate?: Date | null;
    performedById?: string | null;
    status?: MaintenanceStatus;
    notes?: string | null;
    cost?: number | null;
    currency?: string | null;
    partsUsed?: string[] | null;
    nextMaintenanceDate?: Date | null;
  }): void {
    if (props.title !== undefined) {
      const title = props.title.trim();
      if (title.length < 3 || title.length > 200) {
        throw new Error(
          "Maintenance record title must be between 3 and 200 characters",
        );
      }
      this.props.title = title;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.scheduledDate !== undefined) {
      this.props.scheduledDate = props.scheduledDate;
    }

    if (props.completedDate !== undefined) {
      this.props.completedDate = props.completedDate;
    }

    if (props.performedById !== undefined) {
      this.props.performedById = props.performedById;
    }

    if (props.status !== undefined) {
      // Validate status transition
      if (!canTransitionTo(this.props.status, props.status)) {
        throw new Error(
          `Cannot transition from ${this.props.status} to ${props.status}`,
        );
      }
      this.props.status = props.status;
    }

    if (props.notes !== undefined) {
      this.props.notes = props.notes?.trim() || null;
    }

    if (props.cost !== undefined) {
      if (props.cost !== null && props.cost < 0) {
        throw new Error("Maintenance cost cannot be negative");
      }
      this.props.cost = props.cost;
    }

    if (props.currency !== undefined) {
      this.props.currency = props.currency;
    }

    if (props.partsUsed !== undefined) {
      this.props.partsUsed = props.partsUsed;
    }

    if (props.nextMaintenanceDate !== undefined) {
      this.props.nextMaintenanceDate = props.nextMaintenanceDate;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Start maintenance work
   */
  start(performedById: string): void {
    if (
      !canTransitionTo(this.props.status, "IN_PROGRESS" as MaintenanceStatus)
    ) {
      throw new Error(
        `Cannot start maintenance from status ${this.props.status}`,
      );
    }

    this.props.status = "IN_PROGRESS" as MaintenanceStatus;
    this.props.performedById = performedById;
    this.props.updatedAt = new Date();
  }

  /**
   * Complete maintenance work
   */
  complete(props: {
    performedById: string;
    completedDate?: Date;
    notes?: string | null;
    cost?: number | null;
    currency?: string | null;
    partsUsed?: string[] | null;
    nextMaintenanceDate?: Date | null;
  }): void {
    if (!canTransitionTo(this.props.status, "COMPLETED" as MaintenanceStatus)) {
      throw new Error(
        `Cannot complete maintenance from status ${this.props.status}`,
      );
    }

    if (props.cost !== undefined && props.cost !== null && props.cost < 0) {
      throw new Error("Maintenance cost cannot be negative");
    }

    this.props.status = "COMPLETED" as MaintenanceStatus;
    this.props.performedById = props.performedById;
    this.props.completedDate = props.completedDate ?? new Date();
    this.props.notes = props.notes?.trim() || null;
    this.props.cost = props.cost ?? null;
    this.props.currency = props.currency ?? null;
    this.props.partsUsed = props.partsUsed ?? null;
    this.props.nextMaintenanceDate = props.nextMaintenanceDate ?? null;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel maintenance work
   */
  cancel(notes?: string | null): void {
    if (!canTransitionTo(this.props.status, "CANCELLED" as MaintenanceStatus)) {
      throw new Error(
        `Cannot cancel maintenance from status ${this.props.status}`,
      );
    }

    this.props.status = "CANCELLED" as MaintenanceStatus;
    if (notes) {
      this.props.notes = notes.trim();
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as overdue
   */
  markOverdue(): void {
    if (!canTransitionTo(this.props.status, "OVERDUE" as MaintenanceStatus)) {
      throw new Error(
        `Cannot mark as overdue from status ${this.props.status}`,
      );
    }

    this.props.status = "OVERDUE" as MaintenanceStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if maintenance is overdue
   */
  isOverdue(): boolean {
    return (
      this.props.status === "SCHEDULED" && this.props.scheduledDate < new Date()
    );
  }

  /**
   * Check if maintenance is complete
   */
  isComplete(): boolean {
    return this.props.status === "COMPLETED";
  }

  /**
   * Check if maintenance can be edited
   */
  canEdit(): boolean {
    return !isTerminalStatus(this.props.status);
  }

  /**
   * Get duration in days between scheduled and completed
   */
  getDurationInDays(): number {
    if (!this.props.completedDate) {
      return 0;
    }

    const diffMs =
      this.props.completedDate.getTime() - this.props.scheduledDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get maintenanceScheduleId(): string | null {
    return this.props.maintenanceScheduleId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get scheduledDate(): Date {
    return this.props.scheduledDate;
  }

  get completedDate(): Date | null {
    return this.props.completedDate;
  }

  get performedById(): string | null {
    return this.props.performedById;
  }

  get status(): MaintenanceStatus {
    return this.props.status;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get cost(): number | null {
    return this.props.cost;
  }

  get currency(): string | null {
    return this.props.currency;
  }

  get partsUsed(): string[] | null {
    return this.props.partsUsed;
  }

  get nextMaintenanceDate(): Date | null {
    return this.props.nextMaintenanceDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
