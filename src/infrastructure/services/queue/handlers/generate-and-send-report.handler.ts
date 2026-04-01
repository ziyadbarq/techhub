/**
 * Generate and Send Report Handler
 *
 * Executes a scheduled report: generates data, creates attachment, sends email.
 */

import type { Job } from "bullmq";
import type { GenerateAndSendReportJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { ExecuteScheduledReportUseCase } from "@/core/use-cases/reports/execute-scheduled-report.use-case";

export async function handleGenerateAndSendReport(
  job: Job<GenerateAndSendReportJobData>,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  const { scheduleId, claimedNextSendAt } = job.data;

  logger.info("Starting scheduled report execution", {
    scheduleId,
    jobId: job.id,
  });

  const useCase = container.get<ExecuteScheduledReportUseCase>(
    DI_TOKENS.ExecuteScheduledReportUseCase,
  );

  await useCase.execute(
    scheduleId,
    claimedNextSendAt ? new Date(claimedNextSendAt) : undefined,
  );

  logger.info("Scheduled report execution completed", {
    scheduleId,
    jobId: job.id,
  });
}
