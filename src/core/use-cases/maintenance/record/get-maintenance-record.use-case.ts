/**
 * Get Maintenance Record Use Case
 * Retrieves a single maintenance record by ID
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";

@injectable()
export class GetMaintenanceRecordUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<MaintenanceRecord> {
    this.logger.info("Getting maintenance record", { id });

    const record = await this.repository.findById(id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${id}`);
    }

    return record;
  }
}
