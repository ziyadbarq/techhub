/**
 * Delete Maintenance Record Use Case
 * Deletes a maintenance record
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";

@injectable()
export class DeleteMaintenanceRecordUseCase {
  constructor(
    @inject("IMaintenanceRecordRepository")
    private repository: IMaintenanceRecordRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<void> {
    this.logger.info("Deleting maintenance record", { id });

    // Verify existence
    const record = await this.repository.findById(id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${id}`);
    }

    // Delete
    await this.repository.delete(id);

    this.logger.info("Maintenance record deleted", { id });
  }
}
