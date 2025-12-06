/**
 * Create Maintenance Record Use Case
 * Creates a new maintenance record (scheduled or ad-hoc)
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  MaintenanceRecord,
  type CreateMaintenanceRecordProps,
} from "@/core/domain/entities/maintenance-record.entity";

@injectable()
export class CreateMaintenanceRecordUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    props: CreateMaintenanceRecordProps,
  ): Promise<MaintenanceRecord> {
    this.logger.info("Creating maintenance record", { props });

    // Create entity
    const record = MaintenanceRecord.create(props, this.idGenerator);

    // Persist
    const created = await this.repository.create(record);

    this.logger.info("Maintenance record created", { id: created.id });

    return created;
  }
}
