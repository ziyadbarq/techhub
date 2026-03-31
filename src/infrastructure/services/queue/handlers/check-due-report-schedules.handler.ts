/**
 * Check Due Report Schedules Handler
 *
 * Runs every 15 minutes. Queries for active schedules where nextSendAt <= now,
 * then enqueues individual generate-and-send jobs for each due schedule.
 *
 * To prevent double-enqueue: nextSendAt is cleared before enqueuing,
 * so subsequent checker runs won't pick up the same schedule.
 * The execute use case recomputes nextSendAt after delivery.
 */

import type { Job } from "bullmq";
import type { CheckDueReportSchedulesJobData } from "@/core/domain/jobs/job-data.types";
import { QUEUE_NAMES, REPORT_JOBS } from "@/core/domain/jobs/job-names";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";

export async function handleCheckDueReportSchedules(
  job: Job<CheckDueReportSchedulesJobData>,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const jobQueueService = container.get<IJobQueueService>(
    DI_TOKENS.IJobQueueService,
  );
  const repository = container.get<IReportScheduleRepository>(
    DI_TOKENS.IReportScheduleRepository,
  );

  const now = new Date();
  const dueSchedules = await repository.findDueSchedules(now);

  if (dueSchedules.length === 0) {
    logger.debug("No due report schedules found", { jobId: job.id });
    return;
  }

  logger.info("Found due report schedules", {
    count: dueSchedules.length,
    jobId: job.id,
  });

  for (const schedule of dueSchedules) {
    // Claim: clear nextSendAt so the next checker run won't pick this up again.
    // The execute use case will recompute it after successful delivery.
    await repository.update(schedule.id, { nextSendAt: null });

    await jobQueueService.addJob(
      QUEUE_NAMES.MAINTENANCE,
      REPORT_JOBS.GENERATE_AND_SEND,
      {
        scheduleId: schedule.id,
        createdAt: Date.now(),
      },
    );

    logger.info("Enqueued report generation job", {
      scheduleId: schedule.id,
      reportId: schedule.reportId,
    });
  }
}
