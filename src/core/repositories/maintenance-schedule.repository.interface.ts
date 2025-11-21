/**
 * MaintenanceSchedule Repository Interface
 * Defines data access operations for MaintenanceSchedule entities
 */

import type { MaintenanceSchedule } from "../domain/entities/maintenance-schedule.entity";

export interface ListMaintenanceSchedulesFilters {
  assetId?: string;
  assignedToId?: string;
  isActive?: boolean;
  scheduleType?: string;
  priority?: string;
  dueBefore?: Date;
  overdueOnly?: boolean;
}

export interface IMaintenanceScheduleRepository {
  /**
   * Create a new maintenance schedule
   */
  create(schedule: MaintenanceSchedule): Promise<MaintenanceSchedule>;

  /**
   * Update an existing maintenance schedule
   */
  update(schedule: MaintenanceSchedule): Promise<MaintenanceSchedule>;

  /**
   * Delete a maintenance schedule by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find a maintenance schedule by ID
   */
  findById(id: string): Promise<MaintenanceSchedule | null>;

  /**
   * List maintenance schedules with optional filters
   */
  findAll(
    filters?: ListMaintenanceSchedulesFilters,
  ): Promise<MaintenanceSchedule[]>;

  /**
   * Count maintenance schedules matching filters
   */
  count(filters?: ListMaintenanceSchedulesFilters): Promise<number>;

  /**
   * Find schedules that are due (nextDueDate <= now) and active
   */
  findDueSchedules(): Promise<MaintenanceSchedule[]>;

  /**
   * Find schedules by asset ID
   */
  findByAssetId(assetId: string): Promise<MaintenanceSchedule[]>;
}
