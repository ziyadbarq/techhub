import { inject, injectable } from "inversify";

import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  SLAEscalationRule,
  StepConfig,
  StepDefinition,
  WorkflowGraph,
} from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";

import { calendarSpecFromDb, type CalendarSpec } from "./calendar.service";
import type { ISLACalculator } from "./sla-calculator.service";
import type { INotificationService } from "./notification.service";

export interface TickResult {
  scanned: number;
  fired: number;
  skipped: number;
  errors: Array<{ stepInstanceId: string; ruleKey: string; error: string }>;
}

/**
 * SLA escalator service interface.
 *
 * Scans every ACTIVE step that has SLA config, evaluates its rules against
 * the append-only event log, and fires unfired rules. Idempotent via the
 * (stepInstanceId, ruleKey) unique constraint on sla_escalation_logs.
 *
 * Run from cron (every minute is fine). Safe to run concurrently — duplicate
 * fires are blocked by the unique constraint.
 */
export interface ISLAEscalator {
  tick(now?: Date): Promise<TickResult>;
}

@injectable()
export class SLAEscalatorService implements ISLAEscalator {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.PrismaClient) private readonly db: PrismaClient,
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.IWorkflowNotificationService)
    private readonly notifications: INotificationService,
    @inject(DI_TOKENS.IWorkflowSLACalculator)
    private readonly calc: ISLACalculator,
  ) {
    this.logger = logger.child({ service: "SLAEscalatorService" });
  }

  async tick(now: Date = new Date()): Promise<TickResult> {
    const result: TickResult = {
      scanned: 0,
      fired: 0,
      skipped: 0,
      errors: [],
    };
    const calendarCache = new Map<string, CalendarSpec | null>();

    const activeSteps = await this.db.stepInstance.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        stepKey: true,
        requestId: true,
        workflowVersionId: true,
        request: { select: { status: true } },
      },
    });

    for (const step of activeSteps) {
      result.scanned++;
      if (step.request.status === "ON_HOLD") {
        result.skipped++;
        continue;
      }

      const wfv = await this.db.workflowVersion.findUnique({
        where: { id: step.workflowVersionId },
        select: { graphJson: true },
      });
      if (!wfv) {
        result.skipped++;
        continue;
      }
      const graph = wfv.graphJson as unknown as WorkflowGraph;
      const def: StepDefinition | undefined = graph.steps.find(
        (s) => s.key === step.stepKey,
      );
      const sla =
        def && "sla" in def.config
          ? (def.config as Extract<StepConfig, { sla?: unknown }>).sla
          : undefined;
      if (!sla?.escalations || sla.escalations.length === 0) {
        result.skipped++;
        continue;
      }

      let calendar: CalendarSpec | null = null;
      if (sla.calendarId) {
        if (!calendarCache.has(sla.calendarId)) {
          const cal = await this.db.calendar.findUnique({
            where: { id: sla.calendarId },
            select: {
              timezone: true,
              workingHoursJson: true,
              holidaysJson: true,
            },
          });
          calendarCache.set(
            sla.calendarId,
            cal ? calendarSpecFromDb(cal) : null,
          );
        }
        calendar = calendarCache.get(sla.calendarId) ?? null;
      }

      const status = await this.calc.status(
        this.db,
        step.id,
        sla.durationMinutes,
        now,
        calendar,
      );

      const elapsedMinutes = status.totalElapsedMs / 60_000;

      const fired = await this.db.sLAEscalationLog.findMany({
        where: { stepInstanceId: step.id },
        select: { ruleKey: true },
      });
      const firedKeys = new Set(fired.map((f) => f.ruleKey));

      for (const rule of sla.escalations) {
        if (firedKeys.has(rule.key)) continue;
        if (elapsedMinutes < rule.thresholdMinutes) continue;

        try {
          await this.fireRule(step.id, step.requestId, rule);
          result.fired++;
        } catch (error) {
          result.errors.push({
            stepInstanceId: step.id,
            ruleKey: rule.key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return result;
  }

  private async fireRule(
    stepInstanceId: string,
    requestId: string,
    rule: SLAEscalationRule,
  ): Promise<void> {
    // Reserve the slot first to make ourselves idempotent against concurrent ticks.
    try {
      await this.db.sLAEscalationLog.create({
        data: {
          stepInstanceId,
          ruleKey: rule.key,
          thresholdMs: rule.thresholdMinutes * 60_000,
          payloadJson: rule as unknown as object,
        },
      });
    } catch {
      // Unique constraint hit → another worker fired this rule first; bail out cleanly.
      return;
    }

    // Record every fired escalation in the audit trail (PRD §13.2)
    await this.db.auditEntry.create({
      data: {
        requestId,
        stepInstanceId,
        actorSystem: "sla_escalation",
        action: "step.sla_escalation",
        payloadJson: {
          ruleKey: rule.key,
          thresholdMinutes: rule.thresholdMinutes,
          actionKind: rule.action.kind,
        },
      },
    });

    const systemActor = {
      userId: null,
      system: "sla_escalation",
    };

    switch (rule.action.kind) {
      case "REMINDER": {
        const snapshot = await this.db.assigneeSnapshot.findMany({
          where: { stepInstanceId },
          select: { userId: true },
        });
        if (snapshot.length === 0) return;
        const formId = (
          await this.db.request.findUnique({
            where: { id: requestId },
            select: { formId: true },
          })
        )?.formId;
        await this.notifications.sendToUsers(this.db, {
          userIds: snapshot.map((s) => s.userId),
          formId: formId ?? undefined,
          requestId,
          stepInstanceId,
          subject: `Reminder: SLA threshold crossed`,
          body: `Action still pending (rule: ${rule.key})`,
          payload: { rule: rule.key },
          templateKey: "sla.reminder",
        });
        return;
      }
      case "ADD_ASSIGNEE": {
        await this.db.assigneeSnapshot.upsert({
          where: {
            stepInstanceId_userId: {
              stepInstanceId,
              userId: rule.action.userId,
            },
          },
          update: {},
          create: { stepInstanceId, userId: rule.action.userId },
        });
        return;
      }
      case "REASSIGN": {
        await this.engine.reassign(
          stepInstanceId,
          rule.action.toUserId,
          systemActor,
        );
        return;
      }
      case "AUTO_ADVANCE": {
        await this.engine.forceAdvance(stepInstanceId, systemActor);
        return;
      }
      case "AUTO_REJECT": {
        await this.engine.reject(
          stepInstanceId,
          `SLA auto-reject (${rule.key})`,
          systemActor,
        );
        return;
      }
    }
  }
}
