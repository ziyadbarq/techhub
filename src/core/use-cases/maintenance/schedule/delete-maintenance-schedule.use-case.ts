/**
 * Delete Maintenance Schedule Use Case
 * Deletes a maintenance schedule
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";

@injectable()
export class DeleteMaintenanceScheduleUseCase {
  constructor(
    @inject("IMaintenanceScheduleRepository")
    private repository: IMaintenanceScheduleRepository,
    @inject("ILoggerService") private logger: ILoggerService,
  ) {}

  async execute(id: string): Promise<void> {
    this.logger.info("Deleting maintenance schedule", { id });

    // Verify existence
    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new Error(`Maintenance schedule not found: ${id}`);
    }

    // Delete
    await this.repository.delete(id);

    this.logger.info("Maintenance schedule deleted", { id });
  }
}
