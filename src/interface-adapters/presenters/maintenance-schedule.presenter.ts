/**
 * MaintenanceSchedule Presenter
 * Transforms MaintenanceSchedule domain entities to DTOs for presentation layer
 */

import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";
import type { ScheduleType } from "@/core/domain/value-objects/schedule-type";
import type { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";

export interface MaintenanceScheduleDTO {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  scheduleType: ScheduleType;
  intervalValue: number;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  assignedToId: string | null;
  estimatedDurationMinutes: number | null;
  priority: MaintenancePriority;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isOverdue: boolean;
  // Display fields (enriched from relations)
  assetTag?: string | null;
  assignedToName?: string | null;
}

/**
 * Transform a single MaintenanceSchedule to DTO
 */
export function presentMaintenanceSchedule(
  schedule: MaintenanceSchedule,
  enrichment?: {
    assetTag?: string | null;
    assignedToName?: string | null;
  },
): MaintenanceScheduleDTO {
  return {
    id: schedule.id,
    assetId: schedule.assetId,
    title: schedule.title,
    description: schedule.description,
    scheduleType: schedule.scheduleType,
    intervalValue: schedule.intervalValue,
    startDate: schedule.startDate.toISOString(),
    nextDueDate: schedule.nextDueDate.toISOString(),
    isActive: schedule.isActive,
    assignedToId: schedule.assignedToId,
    estimatedDurationMinutes: schedule.estimatedDurationMinutes,
    priority: schedule.priority,
    instructions: schedule.instructions,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    // Computed fields
    isOverdue: schedule.isOverdue(),
    // Display fields
    assetTag: enrichment?.assetTag,
    assignedToName: enrichment?.assignedToName,
  };
}

/**
 * Transform an array of MaintenanceSchedules to DTOs
 */
export function presentMaintenanceSchedules(
  schedules: MaintenanceSchedule[],
): MaintenanceScheduleDTO[] {
  return schedules.map((schedule) => presentMaintenanceSchedule(schedule));
}
