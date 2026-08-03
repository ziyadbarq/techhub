/**
 * Workflow Entry Automation Tick Handler
 *
 * Cron-driven job that runs entry-automation rules on requests matching
 * configured filter rules. Gated by the WORKFLOW_ENGINE feature flag.
 *
 * Rules are loaded from `WORKFLOW_ENTRY_AUTOMATION_RULES_JSON` env var
 * (parsed JSON array of `EntryAutomationRule`). When unset or empty, the
 * handler is a no-op — install rules per deployment as needed.
 */

import type { Job } from "bullmq";
import type { WorkflowTickJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IEntryAutomationService,
  EntryAutomationRule,
  RunResult,
} from "@/infrastructure/services/workflow/entry-automation.service";

function loadRulesFromEnv(logger: ILoggerService): EntryAutomationRule[] {
  const raw = process.env.WORKFLOW_ENTRY_AUTOMATION_RULES_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EntryAutomationRule[]) : [];
  } catch (err) {
    logger.warn("workflow.entry-automation.rules.parse-failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function handleWorkflowEntryAutomationTick(
  job: Job<WorkflowTickJobData>,
): Promise<Record<string, RunResult>> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const entryAutomation = container.get<IEntryAutomationService>(
    DI_TOKENS.IWorkflowEntryAutomationService,
  );

  const rules = loadRulesFromEnv(logger);

  logger.info("workflow.entry-automation-tick.started", {
    jobId: job.id,
    origin: job.data.origin ?? "cron",
    ruleCount: rules.length,
  });

  if (rules.length === 0) return {};

  const result = await entryAutomation.runAll(rules);

  logger.info("workflow.entry-automation-tick.completed", {
    jobId: job.id,
    rulesProcessed: Object.keys(result).length,
  });

  return result;
}
