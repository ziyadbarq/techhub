/**
 * Workflow Pending Attachment Cleanup Handler
 *
 * Hourly job that deletes FILE-field uploads never linked to a request
 * (`request_attachments.requestId` null) once they are older than 24 hours:
 * the stored file first, then the row. Idempotent — rows whose file could not
 * be removed are kept and retried on the next run.
 *
 * Gated at scheduling time by the WORKFLOW_ENGINE feature flag.
 */

import type { Job } from "bullmq";
import type { WorkflowTickJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IPendingAttachmentCleanup,
  PendingAttachmentCleanupResult,
} from "@/infrastructure/services/workflow/pending-attachment-cleanup.service";

export async function handleWorkflowPendingAttachmentCleanup(
  job: Job<WorkflowTickJobData>,
): Promise<PendingAttachmentCleanupResult> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const cleanup = container.get<IPendingAttachmentCleanup>(
    DI_TOKENS.IWorkflowPendingAttachmentCleanup,
  );

  logger.info("workflow.pending-attachment-cleanup.started", {
    jobId: job.id,
    origin: job.data.origin ?? "cron",
  });

  const result = await cleanup.run();

  logger.info("workflow.pending-attachment-cleanup.completed", {
    jobId: job.id,
    scanned: result.scanned,
    deleted: result.deleted,
    failed: result.failed,
    skipped: result.skipped,
    storageUnavailable: result.storageUnavailable,
  });

  return result;
}
