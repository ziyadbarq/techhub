/**
 * Update Maintenance Schedule Use Case
 * Updates an existing maintenance schedule
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";
import type { ScheduleType } from "@/core/domain/value-objects/schedule-type";
import type { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateMaintenanceScheduleProps {
  id: string;
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
}

@injectable()
export class UpdateMaintenanceScheduleUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceScheduleRepository)
    private repository: IMaintenanceScheduleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(
    props: UpdateMaintenanceScheduleProps,
  ): Promise<MaintenanceSchedule> {
    this.logger.info("Updating maintenance schedule", { id: props.id });

    // Find existing
    const schedule = await this.repository.findById(props.id);
    if (!schedule) {
      throw new NotFoundError(`Maintenance schedule not found: ${props.id}`);
    }

    // Update entity
    schedule.update(props);

    // Persist
    const updated = await this.repository.update(schedule);

    this.logger.info("Maintenance schedule updated", { id: updated.id });

    return updated;
  }
}
