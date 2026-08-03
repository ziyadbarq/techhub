/**
 * Schedule Step Executor
 *
 * Defers completion until a target wall-clock time computed from
 * (now + leadTimeMinutes) projected through the configured calendar's
 * working hours, pushed past any BLOCK blackout period it lands in. The
 * tick cron (`scheduleTick`) auto-completes the step when its time arrives.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { InvalidStateError } from "@/core/domain/workflow";
import type { ActionKind, StepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IStepExecutor,
} from "@/core/repositories/workflow";
import type { ICalendarService } from "@/infrastructure/services/workflow/calendar.service";

@injectable()
export class ScheduleStepExecutor implements IStepExecutor {
  readonly type = "SCHEDULE" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowCalendarService)
    private readonly calendar: ICalendarService,
  ) {}

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as Extract<StepConfig, { type: "SCHEDULE" }>;
    const lead = cfg.leadTimeMinutes ?? 0;
    let scheduledFor = new Date(Date.now() + lead * 60_000);

    if (cfg.calendarId) {
      const cal = await exec.tx.calendar.findUnique({
        where: { id: cfg.calendarId },
        select: { timezone: true, workingHoursJson: true, holidaysJson: true },
      });
      if (cal) {
        const spec = this.calendar.calendarSpecFromDb(cal);
        scheduledFor = this.calendar.addWorkingMinutes(new Date(), lead, spec);
      }
    }

    const blockBehavior = cfg.blackoutBehavior ?? "BLOCK";
    if (blockBehavior !== "IGNORE") {
      let safety = 0;
      while (safety++ < 50) {
        const blackout = await exec.tx.blackoutPeriod.findFirst({
          where: {
            behavior: "BLOCK",
            startsAt: { lte: scheduledFor },
            endsAt: { gt: scheduledFor },
          },
          select: { endsAt: true },
        });
        if (!blackout) break;
        scheduledFor = new Date(blackout.endsAt.getTime() + 60_000);
      }
    }

    await exec.tx.stepInstance.update({
      where: { id: exec.stepInstanceId },
      data: {
        outcomeJson: {
          scheduledFor: scheduledFor.toISOString(),
          calendarId: cfg.calendarId ?? null,
          windowName: cfg.windowName ?? null,
          leadTimeMinutes: lead,
        },
      },
    });

    return { kind: "ACTIVE" };
  }

  async handleAction(
    _config: StepConfig,
    action: ActionKind,
  ): Promise<ActionResult> {
    if (action === "COMPLETE") return { kind: "ADVANCE" };
    throw new InvalidStateError(
      `Schedule step does not accept action: ${action}`,
    );
  }
}
