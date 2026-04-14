/**
 * Report Schedule Repository Interface
 */

import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

export interface IReportScheduleRepository {
  create(data: ReportScheduleProps): Promise<ReportScheduleProps>;
  findById(id: string): Promise<ReportScheduleProps | null>;
  findAll(): Promise<ReportScheduleProps[]>;
  findByCreatedBy(userId: string): Promise<ReportScheduleProps[]>;
  findDueSchedules(now: Date): Promise<ReportScheduleProps[]>;
  update(
    id: string,
    data: Partial<ReportScheduleProps>,
  ): Promise<ReportScheduleProps>;
  delete(id: string): Promise<void>;
}
