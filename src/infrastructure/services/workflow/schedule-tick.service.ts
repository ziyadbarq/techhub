import { inject, injectable } from "inversify";

import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type { WorkflowGraph } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface ScheduleTickResult {
  scanned: number;
  fired: number;
  errors: Array<{ stepInstanceId: string; error: string }>;
}

/**
 * Schedule tick service interface.
 *
 * Scans ACTIVE SCHEDULE steps and auto-completes any whose `scheduledFor`
 * (persisted in StepInstance.outcomeJson by the schedule executor at
 * activation) has arrived. Run from cron (every minute is fine).
 */
export interface IScheduleTickService {
  tick(now?: Date): Promise<ScheduleTickResult>;
}

@injectable()
export class ScheduleTickService implements IScheduleTickService {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.PrismaClient) private readonly db: PrismaClient,
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
  ) {
    this.logger = logger.child({ service: "ScheduleTickService" });
  }

  async tick(now: Date = new Date()): Promise<ScheduleTickResult> {
    const result: ScheduleTickResult = { scanned: 0, fired: 0, errors: [] };

    const candidates = await this.db.stepInstance.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        stepKey: true,
        outcomeJson: true,
        workflowVersion: { select: { graphJson: true } },
      },
    });

    for (const c of candidates) {
      const graph = c.workflowVersion.graphJson as unknown as WorkflowGraph;
      const def = graph.steps.find((s) => s.key === c.stepKey);
      if (!def || def.config.type !== "SCHEDULE") continue;
      result.scanned++;

      const meta = c.outcomeJson as { scheduledFor?: string } | null;
      if (!meta?.scheduledFor) continue;
      const scheduledFor = new Date(meta.scheduledFor);
      if (scheduledFor.getTime() > now.getTime()) continue;

      try {
        await this.engine.forceAdvance(c.id, {
          userId: null,
          system: "schedule_tick",
        });
        result.fired++;
      } catch (error) {
        result.errors.push({
          stepInstanceId: c.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (result.errors.length > 0) {
      this.logger.warn("schedule tick completed with errors", {
        scanned: result.scanned,
        fired: result.fired,
        errorCount: result.errors.length,
      });
    }

    return result;
  }
}
