/**
 * Prisma Report Schedule Repository
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

@injectable()
export class PrismaReportScheduleRepository implements IReportScheduleRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async create(data: ReportScheduleProps): Promise<ReportScheduleProps> {
    const record = await this.prisma.reportSchedule.create({
      data: {
        id: data.id,
        reportId: data.reportId,
        name: data.name,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        hour: data.hour,
        minute: data.minute,
        timezone: data.timezone,
        recipients: data.recipients,
        filters: data.filters as unknown as undefined,
        format: data.format,
        isActive: data.isActive,
        lastSentAt: data.lastSentAt,
        nextSendAt: data.nextSendAt,
        createdById: data.createdById,
      },
    });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<ReportScheduleProps | null> {
    const record = await this.prisma.reportSchedule.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<ReportScheduleProps[]> {
    const records = await this.prisma.reportSchedule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByCreatedBy(userId: string): Promise<ReportScheduleProps[]> {
    const records = await this.prisma.reportSchedule.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findDueSchedules(now: Date): Promise<ReportScheduleProps[]> {
    const records = await this.prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextSendAt: { lte: now },
      },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(
    id: string,
    data: Partial<ReportScheduleProps>,
  ): Promise<ReportScheduleProps> {
    // Build update object, only including provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.hour !== undefined) updateData.hour = data.hour;
    if (data.minute !== undefined) updateData.minute = data.minute;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.recipients !== undefined) updateData.recipients = data.recipients;
    if (data.filters !== undefined) updateData.filters = data.filters;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastSentAt !== undefined) updateData.lastSentAt = data.lastSentAt;
    if (data.nextSendAt !== undefined) updateData.nextSendAt = data.nextSendAt;

    const record = await this.prisma.reportSchedule.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reportSchedule.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(record: any): ReportScheduleProps {
    return {
      id: record.id,
      reportId: record.reportId,
      name: record.name,
      frequency: record.frequency,
      dayOfWeek: record.dayOfWeek,
      dayOfMonth: record.dayOfMonth,
      hour: record.hour,
      minute: record.minute,
      timezone: record.timezone,
      recipients: record.recipients,
      filters: record.filters as Record<string, unknown> | null,
      format: record.format,
      isActive: record.isActive,
      lastSentAt: record.lastSentAt,
      nextSendAt: record.nextSendAt,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
