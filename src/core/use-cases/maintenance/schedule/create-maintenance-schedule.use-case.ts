/**
 * Create Maintenance Schedule Use Case
 * Creates a new recurring maintenance schedule for an asset
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  MaintenanceSchedule,
  type CreateMaintenanceScheduleProps,
} from "@/core/domain/entities/maintenance-schedule.entity";

@injectable()
export class CreateMaintenanceScheduleUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceScheduleRepository)
    private repository: IMaintenanceScheduleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    props: CreateMaintenanceScheduleProps,
  ): Promise<MaintenanceSchedule> {
    this.logger.info("Creating maintenance schedule", { props });

    // Create entity
    const schedule = MaintenanceSchedule.create(props, this.idGenerator);

    // Persist
    const created = await this.repository.create(schedule);

    this.logger.info("Maintenance schedule created", { id: created.id });

    return created;
  }
}
