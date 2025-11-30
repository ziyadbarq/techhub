import type { ServiceHealthHistory } from "@/core/domain/entities/service-health-history.entity";
import type { ServiceHealthStatus } from "@/generated/prisma";

export interface IServiceHealthHistoryRepository {
  /**
   * Create a new health history record
   */
  create(history: ServiceHealthHistory): Promise<ServiceHealthHistory>;

  /**
   * Find health history by ID
   */
  findById(id: string): Promise<ServiceHealthHistory | null>;

  /**
   * Find all health history records for a service
   */
  findByServiceId(
    serviceId: string,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceHealthHistory[]>;

  /**
   * Find health history records by status
   */
  findByStatus(
    serviceId: string,
    status: ServiceHealthStatus,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceHealthHistory[]>;

  /**
   * Find recent health history for a service
   */
  findRecent(serviceId: string, limit: number): Promise<ServiceHealthHistory[]>;

  /**
   * Find health history within a date range
   */
  findByDateRange(
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceHealthHistory[]>;

  /**
   * Count total health history records for a service
   */
  countByServiceId(serviceId: string): Promise<number>;

  /**
   * Delete health history records older than a date
   */
  deleteOlderThan(date: Date): Promise<number>;
}
