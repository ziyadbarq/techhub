/**
 * MaintenanceRecord Repository Interface
 * Defines data access operations for MaintenanceRecord entities
 */

import type { MaintenanceRecord } from "../domain/entities/maintenance-record.entity";

export interface ListMaintenanceRecordsFilters {
  assetId?: string;
  maintenanceScheduleId?: string;
  performedById?: string;
  status?: string;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
}

export interface IMaintenanceRecordRepository {
  /**
   * Create a new maintenance record
   */
  create(record: MaintenanceRecord): Promise<MaintenanceRecord>;

  /**
   * Update an existing maintenance record
   */
  update(record: MaintenanceRecord): Promise<MaintenanceRecord>;

  /**
   * Delete a maintenance record by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find a maintenance record by ID
   */
  findById(id: string): Promise<MaintenanceRecord | null>;

  /**
   * List maintenance records with optional filters
   */
  findAll(
    filters?: ListMaintenanceRecordsFilters,
  ): Promise<MaintenanceRecord[]>;

  /**
   * Count maintenance records matching filters
   */
  count(filters?: ListMaintenanceRecordsFilters): Promise<number>;

  /**
   * Find records that are overdue (scheduled but past due)
   */
  findOverdueRecords(): Promise<MaintenanceRecord[]>;

  /**
   * Find records by asset ID
   */
  findByAssetId(assetId: string): Promise<MaintenanceRecord[]>;

  /**
   * Find records by schedule ID
   */
  findByScheduleId(scheduleId: string): Promise<MaintenanceRecord[]>;
}
