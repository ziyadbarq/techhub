/**
 * Complete Maintenance Use Case
 * Completes a maintenance task (IN_PROGRESS → COMPLETED)
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";

export interface CompleteMaintenanceProps {
  id: string;
  performedById: string;
  completedDate?: Date;
  notes?: string | null;
  cost?: number | null;
  currency?: string | null;
  partsUsed?: string[] | null;
  nextMaintenanceDate?: Date | null;
}

@injectable()
export class CompleteMaintenanceUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private repository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(props: CompleteMaintenanceProps): Promise<MaintenanceRecord> {
    this.logger.info("Completing maintenance", { id: props.id });

    // Find record
    const record = await this.repository.findById(props.id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${props.id}`);
    }

    // Complete maintenance
    record.complete({
      performedById: props.performedById,
      completedDate: props.completedDate,
      notes: props.notes,
      cost: props.cost,
      currency: props.currency,
      partsUsed: props.partsUsed,
      nextMaintenanceDate: props.nextMaintenanceDate,
    });

    // Persist
    const updated = await this.repository.update(record);

    this.logger.info("Maintenance completed", { id: updated.id });

    return updated;
  }
}
