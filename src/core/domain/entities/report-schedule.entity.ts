/**
 * Report Schedule Entity
 *
 * Domain entity for scheduled report email deliveries.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface ReportScheduleProps {
  id: string;
  reportId: string;
  name: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  timezone: string;
  recipients: string[];
  filters: Record<string, unknown> | null;
  format: "PDF" | "CSV" | "XLSX";
  isActive: boolean;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportScheduleInput {
  reportId: string;
  name: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  minute?: number;
  timezone?: string;
  recipients: string[];
  filters?: Record<string, unknown>;
  format?: "PDF" | "CSV" | "XLSX";
  createdById: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

export class ReportScheduleEntity {
  private constructor(private props: ReportScheduleProps) {}

  // Getters
  get id() {
    return this.props.id;
  }
  get reportId() {
    return this.props.reportId;
  }
  get name() {
    return this.props.name;
  }
  get frequency() {
    return this.props.frequency;
  }
  get dayOfWeek() {
    return this.props.dayOfWeek;
  }
  get dayOfMonth() {
    return this.props.dayOfMonth;
  }
  get hour() {
    return this.props.hour;
  }
  get minute() {
    return this.props.minute;
  }
  get timezone() {
    return this.props.timezone;
  }
  get recipients() {
    return this.props.recipients;
  }
  get filters() {
    return this.props.filters;
  }
  get format() {
    return this.props.format;
  }
  get isActive() {
    return this.props.isActive;
  }
  get lastSentAt() {
    return this.props.lastSentAt;
  }
  get nextSendAt() {
    return this.props.nextSendAt;
  }
  get createdById() {
    return this.props.createdById;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    input: CreateReportScheduleInput,
    idGenerator: IIdGenerator,
  ): ReportScheduleEntity {
    // Validate recipients
    if (!input.recipients || input.recipients.length === 0) {
      throw new Error("At least one recipient is required");
    }
    if (input.recipients.length > MAX_RECIPIENTS) {
      throw new Error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
    }
    for (const email of input.recipients) {
      if (!EMAIL_REGEX.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }

    // Validate frequency-specific fields
    if (
      input.frequency === "WEEKLY" &&
      (input.dayOfWeek == null || input.dayOfWeek < 0 || input.dayOfWeek > 6)
    ) {
      throw new Error("dayOfWeek (0-6) is required for WEEKLY frequency");
    }
    if (
      input.frequency === "MONTHLY" &&
      (input.dayOfMonth == null ||
        input.dayOfMonth < 1 ||
        input.dayOfMonth > 28)
    ) {
      throw new Error("dayOfMonth (1-28) is required for MONTHLY frequency");
    }

    const now = new Date();
    const entity = new ReportScheduleEntity({
      id: idGenerator.generateId(),
      reportId: input.reportId,
      name: input.name,
      frequency: input.frequency,
      dayOfWeek:
        input.frequency === "WEEKLY" ? (input.dayOfWeek ?? null) : null,
      dayOfMonth:
        input.frequency === "MONTHLY" ? (input.dayOfMonth ?? null) : null,
      hour: input.hour ?? 8,
      minute: input.minute ?? 0,
      timezone: input.timezone ?? "Asia/Riyadh",
      recipients: input.recipients,
      filters: input.filters ?? null,
      format: input.format ?? "PDF",
      isActive: true,
      lastSentAt: null,
      nextSendAt: null,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    });

    entity.computeNextSendAt();
    return entity;
  }

  static fromPersistence(props: ReportScheduleProps): ReportScheduleEntity {
    return new ReportScheduleEntity(props);
  }

  toPlainObject(): ReportScheduleProps {
    return { ...this.props };
  }

  activate(): ReportScheduleEntity {
    return new ReportScheduleEntity({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  deactivate(): ReportScheduleEntity {
    return new ReportScheduleEntity({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  markSent(): ReportScheduleEntity {
    const updated = new ReportScheduleEntity({
      ...this.props,
      lastSentAt: new Date(),
      updatedAt: new Date(),
    });
    updated.computeNextSendAt();
    return updated;
  }

  /**
   * Compute the next send time based on frequency, schedule config, and timezone.
   * Uses Intl.DateTimeFormat to resolve the correct UTC offset for the target timezone.
   */
  private computeNextSendAt(): void {
    const now = new Date();
    const tz = this.props.timezone || "Asia/Riyadh";

    // Get current date components in the target timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    const tzYear = get("year");
    const tzMonth = get("month"); // 1-based
    const tzDay = get("day");
    const tzHour = get("hour");
    const tzMinute = get("minute");
    const tzWeekday = new Date(tzYear, tzMonth - 1, tzDay).getDay();

    // Build the candidate date (in tz calendar)
    let candidateDay = tzDay;
    let candidateMonth = tzMonth;
    const candidateYear = tzYear;
    const targetHour = this.props.hour;
    const targetMinute = this.props.minute;
    const nowInTzMinutes = tzHour * 60 + tzMinute;
    const targetInMinutes = targetHour * 60 + targetMinute;

    switch (this.props.frequency) {
      case "DAILY":
        if (targetInMinutes <= nowInTzMinutes) {
          candidateDay++;
        }
        break;

      case "WEEKLY": {
        const targetWeekday = this.props.dayOfWeek ?? 0;
        let daysUntil = targetWeekday - tzWeekday;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil === 0 && targetInMinutes <= nowInTzMinutes) daysUntil = 7;
        candidateDay += daysUntil;
        break;
      }

      case "MONTHLY": {
        candidateDay = this.props.dayOfMonth ?? 1;
        if (
          candidateDay < tzDay ||
          (candidateDay === tzDay && targetInMinutes <= nowInTzMinutes)
        ) {
          candidateMonth++;
        }
        break;
      }
    }

    // Construct a Date string in the target timezone, then convert to UTC
    // by using the timezone offset from Intl
    const candidateDate = new Date(
      candidateYear,
      candidateMonth - 1,
      candidateDay,
    );
    const isoDateStr = `${candidateDate.getFullYear()}-${String(candidateDate.getMonth() + 1).padStart(2, "0")}-${String(candidateDate.getDate()).padStart(2, "0")}T${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}:00`;

    // Use the timezone to resolve to an absolute UTC instant
    // Create a formatter that gives us the UTC offset
    const utcFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const offsetPart =
      utcFormatter
        .formatToParts(candidateDate)
        .find((p) => p.type === "timeZoneName")?.value ?? "+03";

    // Parse offset like "GMT+3" or "GMT+5:30" into minutes
    const offsetMatch = offsetPart.match(/GMT([+-]?)(\d+)(?::(\d+))?/);
    let offsetMinutes = 0;
    if (offsetMatch) {
      const sign = offsetMatch[1] === "-" ? -1 : 1;
      offsetMinutes =
        sign * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] || 0));
    }

    // Build UTC timestamp
    const utcDate = new Date(isoDateStr + "Z");
    utcDate.setMinutes(utcDate.getMinutes() - offsetMinutes);

    this.props.nextSendAt = utcDate;
  }
}
