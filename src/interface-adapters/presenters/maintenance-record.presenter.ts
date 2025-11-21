/**
 * MaintenanceRecord Presenter
 * Transforms MaintenanceRecord domain entities to DTOs for presentation layer
 */

import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";
import type { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";

export interface MaintenanceRecordDTO {
  id: string;
  assetId: string;
  maintenanceScheduleId: string | null;
  title: string;
  description: string | null;
  scheduledDate: string;
  completedDate: string | null;
  performedById: string | null;
  status: MaintenanceStatus;
  notes: string | null;
  cost: number | null;
  partsUsed: string[] | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isOverdue: boolean;
  isComplete: boolean;
  canEdit: boolean;
  durationInDays: number;
  // Display fields (enriched from relations)
  assetTag?: string | null;
  performedByName?: string | null;
  scheduleTitle?: string | null;
}

/**
 * Transform a single MaintenanceRecord to DTO
 */
export function presentMaintenanceRecord(
  record: MaintenanceRecord,
  enrichment?: {
    assetTag?: string | null;
    performedByName?: string | null;
    scheduleTitle?: string | null;
  },
): MaintenanceRecordDTO {
  return {
    id: record.id,
    assetId: record.assetId,
    maintenanceScheduleId: record.maintenanceScheduleId,
    title: record.title,
    description: record.description,
    scheduledDate: record.scheduledDate.toISOString(),
    completedDate: record.completedDate
      ? record.completedDate.toISOString()
      : null,
    performedById: record.performedById,
    status: record.status,
    notes: record.notes,
    cost: record.cost,
    partsUsed: record.partsUsed,
    nextMaintenanceDate: record.nextMaintenanceDate
      ? record.nextMaintenanceDate.toISOString()
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    // Computed fields
    isOverdue: record.isOverdue(),
    isComplete: record.isComplete(),
    canEdit: record.canEdit(),
    durationInDays: record.getDurationInDays(),
    // Display fields
    assetTag: enrichment?.assetTag,
    performedByName: enrichment?.performedByName,
    scheduleTitle: enrichment?.scheduleTitle,
  };
}

/**
 * Transform an array of MaintenanceRecords to DTOs
 */
export function presentMaintenanceRecords(
  records: MaintenanceRecord[],
): MaintenanceRecordDTO[] {
  return records.map((record) => presentMaintenanceRecord(record));
}
