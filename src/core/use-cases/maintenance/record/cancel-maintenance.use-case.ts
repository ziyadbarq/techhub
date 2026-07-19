/**
 * Cancel Maintenance Use Case
 * Cancels a maintenance task
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CancelMaintenanceProps {
  id: string;
  notes?: string | null;
}

@injectable()
export class CancelMaintenanceUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private repository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(props: CancelMaintenanceProps): Promise<MaintenanceRecord> {
    this.logger.info("Cancelling maintenance", { id: props.id });

    // Find record
    const record = await this.repository.findById(props.id);
    if (!record) {
      throw new NotFoundError(`Maintenance record not found: ${props.id}`);
    }

    // Cancel maintenance
    record.cancel(props.notes);

    // Persist
    const updated = await this.repository.update(record);

    this.logger.info("Maintenance cancelled", { id: updated.id });

    return updated;
  }
}
