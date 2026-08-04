/**
 * Workflow Schedule Tick Handler
 *
 * Cron-driven job that advances SCHEDULE steps when their maintenance window
 * opens (or the lead time elapses). Gated by the WORKFLOW_ENGINE feature flag.
 */

import type { Job } from "bullmq";
import type { WorkflowTickJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IScheduleTickService,
  ScheduleTickResult,
} from "@/infrastructure/services/workflow/schedule-tick.service";

export async function handleWorkflowScheduleTick(
  job: Job<WorkflowTickJobData>,
): Promise<ScheduleTickResult> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const scheduleTick = container.get<IScheduleTickService>(
    DI_TOKENS.IWorkflowScheduleTickService,
  );

  logger.info("workflow.schedule-tick.started", {
    jobId: job.id,
    origin: job.data.origin ?? "cron",
  });

  const result = await scheduleTick.tick();

  logger.info("workflow.schedule-tick.completed", {
    jobId: job.id,
    scanned: result.scanned,
    fired: result.fired,
    errorCount: result.errors.length,
  });

  return result;
}
