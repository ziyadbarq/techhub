/**
 * Create Maintenance Schedule Use Case
 * Creates a new recurring maintenance schedule for an asset
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import {
  MaintenanceSchedule,
  type CreateMaintenanceScheduleProps,
} from "@/core/domain/entities/maintenance-schedule.entity";

@injectable()
export class CreateMaintenanceScheduleUseCase {
  constructor(
    @inject("IMaintenanceScheduleRepository")
    private repository: IMaintenanceScheduleRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(
    props: CreateMaintenanceScheduleProps,
  ): Promise<MaintenanceSchedule> {
    this.logger.info("Creating maintenance schedule", { props });

    // Create entity
    const schedule = MaintenanceSchedule.create(props);

    // Persist
    const created = await this.repository.create(schedule);

    this.logger.info("Maintenance schedule created", { id: created.id });

    return created;
  }
}
