/**
 * Calendar utilities for working-time computation. Used by the SLA calculator
 * to count only "working hours" toward elapsed time / deadlines (PRD §13).
 *
 * A calendar is timezone-aware. Working hours are wall-clock times in that
 * timezone (e.g. "09:00"–"17:00"). Holidays are full-day exclusions
 * keyed by YYYY-MM-DD in the calendar's timezone.
 */

import { injectable } from "inversify";

export interface CalendarSpec {
  timezone: string;
  workingHours: Record<string, Array<{ from: string; to: string }>>;
  holidays: string[];
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = parseInt(get("hour"), 10);
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour: hour === 24 ? 0 : hour,
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
    weekday: WEEKDAY_MAP[get("weekday")] ?? 0,
  };
}

function timezoneOffsetMs(date: Date, timeZone: string): number {
  const z = getZonedParts(date, timeZone);
  const utcEquivalent = Date.UTC(
    z.year,
    z.month - 1,
    z.day,
    z.hour,
    z.minute,
    z.second,
  );
  return utcEquivalent - date.getTime();
}

function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = timezoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offset);
}

function dayKeyFor(parts: ZonedParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function parseClock(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

function* iterateWorkingSlots(
  start: Date,
  end: Date,
  cal: CalendarSpec,
): Generator<{ from: Date; to: Date }> {
  if (start.getTime() >= end.getTime()) return;

  let cursor = new Date(start.getTime());
  const holidaySet = new Set(cal.holidays);
  let safety = 0;

  while (cursor.getTime() < end.getTime() && safety < 400) {
    safety++;
    const z = getZonedParts(cursor, cal.timezone);
    const isHoliday = holidaySet.has(dayKeyFor(z));

    if (!isHoliday) {
      const slots = cal.workingHours[String(z.weekday)] ?? [];
      for (const slot of slots) {
        const fromClock = parseClock(slot.from);
        const toClock = parseClock(slot.to);
        const slotStart = zonedToUtc(
          z.year,
          z.month,
          z.day,
          fromClock.h,
          fromClock.m,
          cal.timezone,
        );
        const slotEnd = zonedToUtc(
          z.year,
          z.month,
          z.day,
          toClock.h,
          toClock.m,
          cal.timezone,
        );
        if (slotEnd.getTime() > slotStart.getTime()) {
          yield { from: slotStart, to: slotEnd };
        }
      }
    }

    cursor = zonedToUtc(z.year, z.month, z.day + 1, 0, 0, cal.timezone);
  }
}

/**
 * Calendar service interface
 */
export interface ICalendarService {
  workingMsBetween(start: Date, end: Date, cal: CalendarSpec): number;
  addWorkingMinutes(from: Date, minutes: number, cal: CalendarSpec): Date;
  calendarSpecFromDb(input: {
    timezone?: string | null;
    workingHoursJson: unknown;
    holidaysJson: unknown;
  }): CalendarSpec;
}

@injectable()
export class CalendarService implements ICalendarService {
  workingMsBetween(start: Date, end: Date, cal: CalendarSpec): number {
    if (end.getTime() <= start.getTime()) return 0;
    let total = 0;
    for (const slot of iterateWorkingSlots(start, end, cal)) {
      const overlapStart = Math.max(slot.from.getTime(), start.getTime());
      const overlapEnd = Math.min(slot.to.getTime(), end.getTime());
      if (overlapEnd > overlapStart) {
        total += overlapEnd - overlapStart;
      }
    }
    return total;
  }

  /**
   * Project `from` forward by `minutes` of working time. Returns the wall-clock
   * UTC instant when that many working minutes will have elapsed. Skips
   * weekends, holidays, and non-working hours.
   */
  addWorkingMinutes(from: Date, minutes: number, cal: CalendarSpec): Date {
    if (minutes <= 0) return from;
    let remainingMs = minutes * 60_000;
    let cursor = new Date(from.getTime());
    const holidaySet = new Set(cal.holidays);

    for (let safety = 0; safety < 400 && remainingMs > 0; safety++) {
      const z = getZonedParts(cursor, cal.timezone);
      const isHoliday = holidaySet.has(dayKeyFor(z));

      if (!isHoliday) {
        const slots = cal.workingHours[String(z.weekday)] ?? [];
        for (const slot of slots) {
          const fromClock = parseClock(slot.from);
          const toClock = parseClock(slot.to);
          const slotStart = zonedToUtc(
            z.year,
            z.month,
            z.day,
            fromClock.h,
            fromClock.m,
            cal.timezone,
          );
          const slotEnd = zonedToUtc(
            z.year,
            z.month,
            z.day,
            toClock.h,
            toClock.m,
            cal.timezone,
          );

          if (cursor.getTime() >= slotEnd.getTime()) continue;
          const startMs = Math.max(cursor.getTime(), slotStart.getTime());
          const available = slotEnd.getTime() - startMs;
          if (available <= 0) continue;

          if (remainingMs <= available) {
            return new Date(startMs + remainingMs);
          }
          remainingMs -= available;
          cursor = slotEnd;
        }
      }
      cursor = zonedToUtc(z.year, z.month, z.day + 1, 0, 0, cal.timezone);
    }

    return cursor;
  }

  /**
   * Convert raw DB JSON ({workingHoursJson, holidaysJson, timezone}) into a
   * CalendarSpec. Tolerant to missing fields — defaults to "always working".
   */
  calendarSpecFromDb(input: {
    timezone?: string | null;
    workingHoursJson: unknown;
    holidaysJson: unknown;
  }): CalendarSpec {
    const wh = input.workingHoursJson as
      | { days?: Record<string, Array<{ from: string; to: string }>> }
      | null
      | undefined;
    const days = wh?.days ?? {};
    const holidays = Array.isArray(input.holidaysJson)
      ? (input.holidaysJson as string[])
      : [];
    return {
      timezone: input.timezone ?? "UTC",
      workingHours: days,
      holidays,
    };
  }
}

// Re-export module-level helpers so other ported services that use them at
// module scope (e.g. SLACalculator's measure callback) keep their existing API.
export function workingMsBetween(
  start: Date,
  end: Date,
  cal: CalendarSpec,
): number {
  if (end.getTime() <= start.getTime()) return 0;
  let total = 0;
  for (const slot of iterateWorkingSlots(start, end, cal)) {
    const overlapStart = Math.max(slot.from.getTime(), start.getTime());
    const overlapEnd = Math.min(slot.to.getTime(), end.getTime());
    if (overlapEnd > overlapStart) {
      total += overlapEnd - overlapStart;
    }
  }
  return total;
}

export function addWorkingMinutes(
  from: Date,
  minutes: number,
  cal: CalendarSpec,
): Date {
  if (minutes <= 0) return from;
  let remainingMs = minutes * 60_000;
  let cursor = new Date(from.getTime());
  const holidaySet = new Set(cal.holidays);

  for (let safety = 0; safety < 400 && remainingMs > 0; safety++) {
    const z = getZonedParts(cursor, cal.timezone);
    const isHoliday = holidaySet.has(dayKeyFor(z));

    if (!isHoliday) {
      const slots = cal.workingHours[String(z.weekday)] ?? [];
      for (const slot of slots) {
        const fromClock = parseClock(slot.from);
        const toClock = parseClock(slot.to);
        const slotStart = zonedToUtc(
          z.year,
          z.month,
          z.day,
          fromClock.h,
          fromClock.m,
          cal.timezone,
        );
        const slotEnd = zonedToUtc(
          z.year,
          z.month,
          z.day,
          toClock.h,
          toClock.m,
          cal.timezone,
        );

        if (cursor.getTime() >= slotEnd.getTime()) continue;
        const startMs = Math.max(cursor.getTime(), slotStart.getTime());
        const available = slotEnd.getTime() - startMs;
        if (available <= 0) continue;

        if (remainingMs <= available) {
          return new Date(startMs + remainingMs);
        }
        remainingMs -= available;
        cursor = slotEnd;
      }
    }
    cursor = zonedToUtc(z.year, z.month, z.day + 1, 0, 0, cal.timezone);
  }

  return cursor;
}

export function calendarSpecFromDb(input: {
  timezone?: string | null;
  workingHoursJson: unknown;
  holidaysJson: unknown;
}): CalendarSpec {
  const wh = input.workingHoursJson as
    | { days?: Record<string, Array<{ from: string; to: string }>> }
    | null
    | undefined;
  const days = wh?.days ?? {};
  const holidays = Array.isArray(input.holidaysJson)
    ? (input.holidaysJson as string[])
    : [];
  return {
    timezone: input.timezone ?? "UTC",
    workingHours: days,
    holidays,
  };
}
