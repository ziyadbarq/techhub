/**
 * List Maintenance Records Use Case
 * Retrieves maintenance records with optional filtering
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IMaintenanceRecordRepository,
  ListMaintenanceRecordsFilters,
} from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";

@injectable()
export class ListMaintenanceRecordsUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(
    filters?: ListMaintenanceRecordsFilters,
  ): Promise<MaintenanceRecord[]> {
    this.logger.info("Listing maintenance records", { filters });

    const records = await this.repository.findAll(filters);

    this.logger.info("Maintenance records retrieved", {
      count: records.length,
    });

    return records;
  }
}
