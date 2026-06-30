import { describe, it, expect } from "vitest";

import {
  addWorkingMinutes,
  workingMsBetween,
  type CalendarSpec,
} from "@/infrastructure/services/workflow/calendar.service";

const businessHours: CalendarSpec = {
  timezone: "UTC",
  workingHours: {
    "1": [{ from: "09:00", to: "17:00" }],
    "2": [{ from: "09:00", to: "17:00" }],
    "3": [{ from: "09:00", to: "17:00" }],
    "4": [{ from: "09:00", to: "17:00" }],
    "5": [{ from: "09:00", to: "17:00" }],
  },
  holidays: [],
};

describe("Calendar — workingMsBetween", () => {
  it("counts only working hours within a single day", () => {
    // Monday 2026-01-05 — 8:00 to 18:00 UTC. Window is 9–17, so 8 hours.
    const start = new Date("2026-01-05T08:00:00Z");
    const end = new Date("2026-01-05T18:00:00Z");
    const ms = workingMsBetween(start, end, businessHours);
    expect(ms).toBe(8 * 60 * 60 * 1000);
  });

  it("returns 0 across a weekend", () => {
    // Saturday 2026-01-03 → Sunday 2026-01-04, 24h span
    const start = new Date("2026-01-03T00:00:00Z");
    const end = new Date("2026-01-04T23:59:00Z");
    expect(workingMsBetween(start, end, businessHours)).toBe(0);
  });

  it("skips holidays", () => {
    const cal: CalendarSpec = {
      ...businessHours,
      holidays: ["2026-01-05"],
    };
    const start = new Date("2026-01-05T09:00:00Z");
    const end = new Date("2026-01-05T17:00:00Z");
    expect(workingMsBetween(start, end, cal)).toBe(0);
  });

  it("spans across a weekend but only counts Friday and Monday", () => {
    // Friday 2026-01-02 09:00 → Monday 2026-01-05 17:00 = 16 working hours
    const start = new Date("2026-01-02T09:00:00Z");
    const end = new Date("2026-01-05T17:00:00Z");
    expect(workingMsBetween(start, end, businessHours)).toBe(
      16 * 60 * 60 * 1000,
    );
  });
});

describe("Calendar — addWorkingMinutes", () => {
  it("Friday 5pm + 4h SLA → Monday 1pm (skips weekend)", () => {
    const start = new Date("2026-01-02T17:00:00Z"); // Friday 17:00 UTC
    // Already past working window; clock starts Monday 09:00
    const result = addWorkingMinutes(start, 4 * 60, businessHours);
    expect(result.toISOString()).toBe("2026-01-05T13:00:00.000Z");
  });

  it("Wednesday 10am + 2h → Wednesday 12pm (same day)", () => {
    const start = new Date("2026-01-07T10:00:00Z"); // Wed
    const result = addWorkingMinutes(start, 120, businessHours);
    expect(result.toISOString()).toBe("2026-01-07T12:00:00.000Z");
  });

  it("Wednesday 4pm + 2h → Thursday 10am (rolls over)", () => {
    const start = new Date("2026-01-07T16:00:00Z"); // Wed 16:00, 1h left
    const result = addWorkingMinutes(start, 120, businessHours); // 1h Wed + 1h Thu
    expect(result.toISOString()).toBe("2026-01-08T10:00:00.000Z");
  });

  it("skips a holiday in the middle", () => {
    const cal: CalendarSpec = {
      ...businessHours,
      holidays: ["2026-01-07"], // Wednesday is holiday
    };
    // Tue 2026-01-06 16:00 + 2h → Thu 2026-01-08 10:00
    const start = new Date("2026-01-06T16:00:00Z");
    const result = addWorkingMinutes(start, 120, cal);
    expect(result.toISOString()).toBe("2026-01-08T10:00:00.000Z");
  });

  it("respects timezone — Riyadh business hours", () => {
    const riyadhCal: CalendarSpec = {
      timezone: "Asia/Riyadh", // UTC+3
      workingHours: {
        "0": [{ from: "09:00", to: "17:00" }], // Sunday
        "1": [{ from: "09:00", to: "17:00" }],
        "2": [{ from: "09:00", to: "17:00" }],
        "3": [{ from: "09:00", to: "17:00" }],
        "4": [{ from: "09:00", to: "17:00" }], // Thu
      },
      holidays: [],
    };
    // Sunday 2026-01-04 06:00 UTC = 09:00 Riyadh — start of work
    // + 4h working time → 13:00 Riyadh = 10:00 UTC
    const start = new Date("2026-01-04T06:00:00Z");
    const result = addWorkingMinutes(start, 240, riyadhCal);
    expect(result.toISOString()).toBe("2026-01-04T10:00:00.000Z");
  });
});
