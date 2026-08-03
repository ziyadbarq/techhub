import { inject, injectable } from "inversify";

import type { PrismaClient, RequestStatus } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface EntryAutomationRule {
  /** Stable rule key — used for idempotency / logging. */
  key: string;
  description?: string;
  /** Filter applied via Prisma `where`. */
  matcher: {
    status?: RequestStatus;
    olderThanDays?: number;
    formId?: string;
  };
  /** Action to execute on each matched request. */
  action:
    | {
        kind: "CANCEL";
        outcome?: "ABANDONED" | "SUPERSEDED" | "EXPIRED" | "WITHDRAWN";
      }
    | { kind: "PLACE_ON_HOLD"; holdReasonKey: string }
    | { kind: "NOOP" };
}

export interface RunResult {
  matched: number;
  acted: number;
  errors: Array<{ requestId: string; error: string }>;
}

/**
 * Entry automation runner interface.
 *
 * Scheduled rules that act on requests matching a filter. Run from cron
 * (e.g., once an hour). Idempotent at the action level — the engine's
 * transition guards prevent double-cancel of an already-closed request.
 */
export interface IEntryAutomationService {
  runRule(rule: EntryAutomationRule): Promise<RunResult>;
  runAll(rules: EntryAutomationRule[]): Promise<Record<string, RunResult>>;
}

@injectable()
export class EntryAutomationService implements IEntryAutomationService {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.PrismaClient) private readonly db: PrismaClient,
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
  ) {
    this.logger = logger.child({ service: "EntryAutomationService" });
  }

  async runRule(rule: EntryAutomationRule): Promise<RunResult> {
    const result: RunResult = { matched: 0, acted: 0, errors: [] };

    const olderThan =
      rule.matcher.olderThanDays !== undefined
        ? new Date(Date.now() - rule.matcher.olderThanDays * 86_400_000)
        : undefined;

    const where: {
      status?: RequestStatus;
      formId?: string;
      createdAt?: { lt: Date };
    } = {};
    if (rule.matcher.status) where.status = rule.matcher.status;
    if (rule.matcher.formId) where.formId = rule.matcher.formId;
    if (olderThan) where.createdAt = { lt: olderThan };

    const matches = await this.db.request.findMany({
      where,
      select: { id: true },
      take: 500,
    });
    result.matched = matches.length;

    for (const r of matches) {
      try {
        const actor = {
          userId: null,
          system: `entry_automation:${rule.key}`,
        };
        switch (rule.action.kind) {
          case "CANCEL":
            await this.engine.cancel(
              r.id,
              rule.action.outcome ?? "ABANDONED",
              `Automation rule: ${rule.key}`,
              actor,
            );
            break;
          case "PLACE_ON_HOLD": {
            const reason = await this.db.holdReason.findFirst({
              where: { key: rule.action.holdReasonKey },
              select: { id: true },
            });
            if (!reason) {
              result.errors.push({
                requestId: r.id,
                error: `Hold reason ${rule.action.holdReasonKey} not found`,
              });
              continue;
            }
            await this.engine.placeOnHold(r.id, reason.id, actor);
            break;
          }
          case "NOOP":
            break;
        }
        result.acted++;
      } catch (error) {
        result.errors.push({
          requestId: r.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (result.errors.length > 0) {
      this.logger.warn("entry automation rule completed with errors", {
        ruleKey: rule.key,
        matched: result.matched,
        acted: result.acted,
        errorCount: result.errors.length,
      });
    }

    return result;
  }

  async runAll(
    rules: EntryAutomationRule[],
  ): Promise<Record<string, RunResult>> {
    const out: Record<string, RunResult> = {};
    for (const rule of rules) {
      out[rule.key] = await this.runRule(rule);
    }
    return out;
  }
}
