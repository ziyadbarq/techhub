/**
 * Workflow SLA Tick Handler
 *
 * Cron-driven job that scans active step instances and fires SLA escalation
 * rules whose thresholds have been crossed. Idempotent — each (stepInstanceId,
 * ruleKey) pair fires at most once thanks to the SLAEscalationLog unique
 * constraint.
 *
 * Gated at scheduling time by the WORKFLOW_ENGINE feature flag.
 */

import type { Job } from "bullmq";
import type { WorkflowTickJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  ISLAEscalator,
  TickResult,
} from "@/infrastructure/services/workflow/sla-escalator.service";

export async function handleWorkflowSLATick(
  job: Job<WorkflowTickJobData>,
): Promise<TickResult> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const escalator = container.get<ISLAEscalator>(DI_TOKENS.IWorkflowSLAEscalator);

  logger.info("workflow.sla-tick.started", {
    jobId: job.id,
    origin: job.data.origin ?? "cron",
  });

  const result = await escalator.tick();

  logger.info("workflow.sla-tick.completed", {
    jobId: job.id,
    scanned: result.scanned,
    fired: result.fired,
    skipped: result.skipped,
    errorCount: result.errors.length,
  });

  return result;
}
