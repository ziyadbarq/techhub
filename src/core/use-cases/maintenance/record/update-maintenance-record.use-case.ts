/**
 * Update Maintenance Record Use Case
 * Updates an existing maintenance record
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";
import type { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";

export interface UpdateMaintenanceRecordProps {
  id: string;
  title?: string;
  description?: string | null;
  scheduledDate?: Date;
  completedDate?: Date | null;
  performedById?: string | null;
  status?: MaintenanceStatus;
  notes?: string | null;
  cost?: number | null;
  partsUsed?: string[] | null;
  nextMaintenanceDate?: Date | null;
}

@injectable()
export class UpdateMaintenanceRecordUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(
    props: UpdateMaintenanceRecordProps,
  ): Promise<MaintenanceRecord> {
    this.logger.info("Updating maintenance record", { id: props.id });

    // Find existing
    const record = await this.repository.findById(props.id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${props.id}`);
    }

    // Update entity
    record.update(props);

    // Persist
    const updated = await this.repository.update(record);

    this.logger.info("Maintenance record updated", { id: updated.id });

    return updated;
  }
}
