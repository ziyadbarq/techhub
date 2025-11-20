/**
 * Task Domain Entity
 *
 * This entity demonstrates Clean Architecture principles:
 * - Encapsulates business logic and validation
 * - Factory method for creation with validation
 * - Immutable ID, mutable business fields
 * - Business methods for state transitions
 *
 * Example CRUD entity for the boilerplate.
 */

import { ValidationError } from "../errors/validation.error";

/**
 * Task status enum
 * Represents the lifecycle of a task
 */
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

/**
 * Props for creating a new Task
 */
export interface CreateTaskProps {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  createdBy?: string | null;
}

/**
 * Task Entity
 *
 * Represents a task with business logic and validation.
 * Demonstrates domain-driven design patterns.
 */
export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Task
   *
   * Validates input and sets defaults.
   * Throws ValidationError if input is invalid.
   *
   * @param props - Task creation properties
   * @returns New Task instance
   * @throws ValidationError if validation fails
   */
  static create(props: CreateTaskProps): Task {
    // Validation
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }

    if (props.title.length > 200) {
      throw new ValidationError("Task title must be 200 characters or less");
    }

    if (props.description && props.description.length > 2000) {
      throw new ValidationError(
        "Task description must be 2000 characters or less",
      );
    }

    const now = new Date();

    return new Task(
      "", // ID will be set by repository
      props.title.trim(),
      props.description?.trim() || null,
      props.status || TaskStatus.PENDING,
      props.createdBy || null,
      now,
      now,
    );
  }

  /**
   * Mark task as completed
   *
   * Business rule: Only pending or in-progress tasks can be completed
   *
   * @throws ValidationError if task is already completed
   */
  complete(): void {
    if (this.status === TaskStatus.COMPLETED) {
      throw new ValidationError("Task is already completed");
    }

    this.status = TaskStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  /**
   * Start working on task
   *
   * Business rule: Only pending tasks can be started
   *
   * @throws ValidationError if task is not pending
   */
  start(): void {
    if (this.status !== TaskStatus.PENDING) {
      throw new ValidationError("Only pending tasks can be started");
    }

    this.status = TaskStatus.IN_PROGRESS;
    this.updatedAt = new Date();
  }

  /**
   * Reopen a completed task
   *
   * Business rule: Only completed tasks can be reopened
   *
   * @throws ValidationError if task is not completed
   */
  reopen(): void {
    if (this.status !== TaskStatus.COMPLETED) {
      throw new ValidationError("Only completed tasks can be reopened");
    }

    this.status = TaskStatus.PENDING;
    this.updatedAt = new Date();
  }

  /**
   * Update task title
   *
   * Validates new title before updating
   *
   * @param newTitle - New task title
   * @throws ValidationError if validation fails
   */
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }

    if (newTitle.length > 200) {
      throw new ValidationError("Task title must be 200 characters or less");
    }

    this.title = newTitle.trim();
    this.updatedAt = new Date();
  }

  /**
   * Update task description
   *
   * Validates new description before updating
   *
   * @param newDescription - New task description (or null to remove)
   * @throws ValidationError if validation fails
   */
  updateDescription(newDescription: string | null): void {
    if (newDescription && newDescription.length > 2000) {
      throw new ValidationError(
        "Task description must be 2000 characters or less",
      );
    }

    this.description = newDescription?.trim() || null;
    this.updatedAt = new Date();
  }

  /**
   * Check if task is completed
   *
   * @returns true if task is completed
   */
  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  /**
   * Check if task is in progress
   *
   * @returns true if task is in progress
   */
  isInProgress(): boolean {
    return this.status === TaskStatus.IN_PROGRESS;
  }

  /**
   * Check if task is pending
   *
   * @returns true if task is pending
   */
  isPending(): boolean {
    return this.status === TaskStatus.PENDING;
  }
}
