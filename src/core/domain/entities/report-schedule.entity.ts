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
   * Compute the next send time based on frequency and schedule config.
   */
  private computeNextSendAt(): void {
    const now = new Date();
    const next = new Date(now);

    // Set time
    next.setHours(this.props.hour, this.props.minute, 0, 0);

    switch (this.props.frequency) {
      case "DAILY":
        // If today's time already passed, schedule for tomorrow
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case "WEEKLY": {
        const targetDay = this.props.dayOfWeek ?? 0;
        const currentDay = next.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil === 0 && next <= now) daysUntil = 7;
        next.setDate(next.getDate() + daysUntil);
        break;
      }

      case "MONTHLY": {
        const targetDate = this.props.dayOfMonth ?? 1;
        next.setDate(targetDate);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      }
    }

    this.props.nextSendAt = next;
  }
}
