/**
 * List Report Schedules Use Case
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import { LogExecution } from "@/lib/decorators";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

@injectable()
export class ListReportSchedulesUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IReportScheduleRepository)
    private readonly repository: IReportScheduleRepository,
  ) {}

  @LogExecution("reports.schedule.list")
  async execute(userId: string): Promise<ReportScheduleProps[]> {
    return this.repository.findByCreatedBy(userId);
  }
}
