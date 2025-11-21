/**
 * Get Maintenance Schedule Use Case
 * Retrieves a single maintenance schedule by ID
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";

@injectable()
export class GetMaintenanceScheduleUseCase {
  constructor(
    @inject("IMaintenanceScheduleRepository")
    private repository: IMaintenanceScheduleRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<MaintenanceSchedule> {
    this.logger.info("Getting maintenance schedule", { id });

    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new Error(`Maintenance schedule not found: ${id}`);
    }

    return schedule;
  }
}
