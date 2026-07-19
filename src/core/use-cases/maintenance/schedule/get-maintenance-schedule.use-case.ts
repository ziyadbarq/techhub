/**
 * Get Maintenance Schedule Use Case
 * Retrieves a single maintenance schedule by ID
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class GetMaintenanceScheduleUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceScheduleRepository)
    private repository: IMaintenanceScheduleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<MaintenanceSchedule> {
    this.logger.info("Getting maintenance schedule", { id });

    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new NotFoundError(`Maintenance schedule not found: ${id}`);
    }

    return schedule;
  }
}
