/**
 * Start Maintenance Use Case
 * Starts a scheduled maintenance task (SCHEDULED → IN_PROGRESS)
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";

export interface StartMaintenanceProps {
  id: string;
  performedById: string;
}

@injectable()
export class StartMaintenanceUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(props: StartMaintenanceProps): Promise<MaintenanceRecord> {
    this.logger.info("Starting maintenance", { id: props.id });

    // Find record
    const record = await this.repository.findById(props.id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${props.id}`);
    }

    // Start maintenance
    record.start(props.performedById);

    // Persist
    const updated = await this.repository.update(record);

    this.logger.info("Maintenance started", { id: updated.id });

    return updated;
  }
}
