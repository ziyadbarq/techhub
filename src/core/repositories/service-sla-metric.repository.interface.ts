import type { ServiceSlaMetric } from "@/core/domain/entities/service-sla-metric.entity";
import type { SlaMetricType, SlaComplianceStatus } from "@/generated/prisma";

export interface IServiceSlaMetricRepository {
  /**
   * Create a new SLA metric record
   */
  create(metric: ServiceSlaMetric): Promise<ServiceSlaMetric>;

  /**
   * Find SLA metric by ID
   */
  findById(id: string): Promise<ServiceSlaMetric | null>;

  /**
   * Find all SLA metrics for a service
   */
  findByServiceId(
    serviceId: string,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]>;

  /**
   * Find SLA metrics by type
   */
  findByType(
    serviceId: string,
    metricType: SlaMetricType,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]>;

  /**
   * Find SLA metrics by compliance status
   */
  findByComplianceStatus(
    serviceId: string,
    status: SlaComplianceStatus,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]>;

  /**
   * Find current period metrics (where periodEnd >= now)
   */
  findCurrentPeriod(serviceId: string): Promise<ServiceSlaMetric[]>;

  /**
   * Find SLA metrics within a date range
   */
  findByDateRange(
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceSlaMetric[]>;

  /**
   * Find recent SLA metrics for a service
   */
  findRecent(serviceId: string, limit: number): Promise<ServiceSlaMetric[]>;

  /**
   * Update an SLA metric record
   */
  update(metric: ServiceSlaMetric): Promise<ServiceSlaMetric>;

  /**
   * Delete an SLA metric record
   */
  delete(id: string): Promise<void>;

  /**
   * Count total SLA metrics for a service
   */
  countByServiceId(serviceId: string): Promise<number>;

  /**
   * Count breached SLA metrics for a service
   */
  countBreached(serviceId: string): Promise<number>;

  /**
   * Delete SLA metrics older than a date
   */
  deleteOlderThan(date: Date): Promise<number>;
}
