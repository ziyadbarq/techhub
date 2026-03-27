/**
 * List Maintenance Schedules Use Case
 * Retrieves maintenance schedules with optional filtering
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IMaintenanceScheduleRepository,
  ListMaintenanceSchedulesFilters,
} from "@/core/repositories/maintenance-schedule.repository.interface";
import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";

@injectable()
export class ListMaintenanceSchedulesUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceScheduleRepository)
    private repository: IMaintenanceScheduleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(
    filters?: ListMaintenanceSchedulesFilters,
  ): Promise<MaintenanceSchedule[]> {
    this.logger.info("Listing maintenance schedules", { filters });

    const schedules = await this.repository.findAll(filters);

    this.logger.info("Maintenance schedules retrieved", {
      count: schedules.length,
    });

    return schedules;
  }
}
