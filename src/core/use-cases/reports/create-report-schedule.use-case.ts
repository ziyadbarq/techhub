/**
 * Create Report Schedule Use Case
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import { LogExecution } from "@/lib/decorators";
import {
  ReportScheduleEntity,
  type CreateReportScheduleInput,
  type ReportScheduleProps,
} from "@/core/domain/entities/report-schedule.entity";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";

@injectable()
export class CreateReportScheduleUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
    @inject(DI_TOKENS.IReportScheduleRepository)
    private readonly repository: IReportScheduleRepository,
  ) {}

  @LogExecution("reports.schedule.create")
  async execute(
    input: CreateReportScheduleInput,
  ): Promise<ReportScheduleProps> {
    // Validate report exists
    const definition = getReportDefinition(input.reportId);
    if (!definition) {
      throw new ValidationError(`Unknown report: ${input.reportId}`);
    }

    const entity = ReportScheduleEntity.create(input, this.idGenerator);
    const saved = await this.repository.create(entity.toPlainObject());

    this.logger.info("Report schedule created", {
      scheduleId: saved.id,
      reportId: saved.reportId,
      frequency: saved.frequency,
      recipients: saved.recipients.length,
    });

    return saved;
  }
}
