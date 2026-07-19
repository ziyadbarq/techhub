/**
 * Delete Maintenance Record Use Case
 * Deletes a maintenance record
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteMaintenanceRecordUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private repository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<void> {
    this.logger.info("Deleting maintenance record", { id });

    // Verify existence
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError(`Maintenance record not found: ${id}`);
    }

    // Delete
    await this.repository.delete(id);

    this.logger.info("Maintenance record deleted", { id });
  }
}
