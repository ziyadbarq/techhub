import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type {
  IWorkflowSLAEventRepository,
  Tx,
} from "@/core/repositories/workflow";

import {
  addWorkingMinutes,
  workingMsBetween,
  type CalendarSpec,
} from "./calendar.service";

export interface SLAStatus {
  totalElapsedMs: number;
  isPaused: boolean;
  hasBreached: boolean;
  /** Deadline; calendar-aware when a calendar is supplied to status(). */
  deadlineAt: Date | null;
}

/**
 * SLA calculator interface.
 *
 * Compute elapsed running-time and current pause state for a step
 * from its append-only event log.
 */
export interface ISLACalculator {
  status(
    tx: Tx,
    stepInstanceId: string,
    slaDurationMinutes: number | null,
    now?: Date,
    calendar?: CalendarSpec | null,
  ): Promise<SLAStatus>;
}

@injectable()
export class SLACalculatorService implements ISLACalculator {
  constructor(
    @inject(DI_TOKENS.IWorkflowSLAEventRepository)
    private readonly slaEvents: IWorkflowSLAEventRepository,
  ) {}

  /**
   * Compute the elapsed running-time and current pause state for a step
   * from its append-only event log.
   *
   * When `calendar` is provided, elapsed time and the projected deadline are
   * computed in working-time only — non-working hours, weekends, and holidays
   * do not advance the clock (PRD §13).
   */
  async status(
    tx: Tx,
    stepInstanceId: string,
    slaDurationMinutes: number | null,
    now: Date = new Date(),
    calendar: CalendarSpec | null = null,
  ): Promise<SLAStatus> {
    const events = await this.slaEvents.list(tx, stepInstanceId);

    const measure = (start: Date, end: Date): number => {
      if (calendar) return workingMsBetween(start, end, calendar);
      return Math.max(0, end.getTime() - start.getTime());
    };

    let totalElapsedMs = 0;
    let runningSince: Date | null = null;
    let isPaused = false;
    let hasBreached = false;

    for (const e of events) {
      switch (e.eventType) {
        case "START":
          runningSince = e.occurredAt;
          isPaused = false;
          break;
        case "PAUSE":
          if (runningSince) {
            totalElapsedMs += measure(runningSince, e.occurredAt);
            runningSince = null;
          }
          isPaused = true;
          break;
        case "RESUME":
          runningSince = e.occurredAt;
          isPaused = false;
          break;
        case "BREACH":
          hasBreached = true;
          break;
      }
    }

    if (runningSince) {
      totalElapsedMs += measure(runningSince, now);
    }

    let deadlineAt: Date | null = null;
    if (slaDurationMinutes !== null) {
      const targetMs = slaDurationMinutes * 60_000;
      const remainingMs = Math.max(0, targetMs - totalElapsedMs);
      const remainingMinutes = remainingMs / 60_000;
      if (calendar) {
        deadlineAt = isPaused
          ? null
          : addWorkingMinutes(now, remainingMinutes, calendar);
      } else {
        deadlineAt = isPaused ? null : new Date(now.getTime() + remainingMs);
      }
    }

    return { totalElapsedMs, isPaused, hasBreached, deadlineAt };
  }
}
