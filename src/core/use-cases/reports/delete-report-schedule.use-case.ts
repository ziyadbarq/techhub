/**
 * Delete Report Schedule Use Case
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import { LogExecution } from "@/lib/decorators";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteReportScheduleUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IReportScheduleRepository)
    private readonly repository: IReportScheduleRepository,
  ) {}

  @LogExecution("reports.schedule.delete")
  async execute(scheduleId: string): Promise<void> {
    const existing = await this.repository.findById(scheduleId);
    if (!existing) {
      throw new NotFoundError(`Schedule not found: ${scheduleId}`);
    }

    await this.repository.delete(scheduleId);

    this.logger.info("Report schedule deleted", { scheduleId });
  }
}
