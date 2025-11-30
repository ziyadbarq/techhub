/**
 * ServiceHealthHistory Entity
 *
 * Tracks historical health status changes for services including
 * check results, response times, and error details.
 */

import type { ServiceHealthStatus } from "@/generated/prisma";

export interface ServiceHealthHistoryProps {
  id: string;
  serviceId: string;
  previousStatus: ServiceHealthStatus;
  newStatus: ServiceHealthStatus;
  checkTimestamp: Date;
  responseTime: number | null;
  errorMessage: string | null;
  statusCode: number | null;
  checkDuration: number | null;
  triggeredBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateServiceHealthHistoryProps {
  serviceId: string;
  previousStatus: ServiceHealthStatus;
  newStatus: ServiceHealthStatus;
  responseTime?: number | null;
  errorMessage?: string | null;
  statusCode?: number | null;
  checkDuration?: number | null;
  triggeredBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class ServiceHealthHistory {
  private constructor(private props: ServiceHealthHistoryProps) {
    this.validate();
  }

  static create(props: CreateServiceHealthHistoryProps): ServiceHealthHistory {
    const now = new Date();

    return new ServiceHealthHistory({
      id: crypto.randomUUID(),
      serviceId: props.serviceId,
      previousStatus: props.previousStatus,
      newStatus: props.newStatus,
      checkTimestamp: now,
      responseTime: props.responseTime ?? null,
      errorMessage: props.errorMessage ?? null,
      statusCode: props.statusCode ?? null,
      checkDuration: props.checkDuration ?? null,
      triggeredBy: props.triggeredBy ?? null,
      metadata: props.metadata ?? null,
      createdAt: now,
    });
  }

  static reconstitute(props: ServiceHealthHistoryProps): ServiceHealthHistory {
    return new ServiceHealthHistory(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("ServiceHealthHistory ID is required");
    }
    if (!this.props.serviceId) {
      throw new Error("Service ID is required");
    }
  }

  // Business Logic

  isStatusChange(): boolean {
    return this.props.previousStatus !== this.props.newStatus;
  }

  isImprovement(): boolean {
    const statusOrder = {
      DOWN: 0,
      UNHEALTHY: 1,
      DEGRADED: 2,
      UNKNOWN: 3,
      MAINTENANCE: 4,
      HEALTHY: 5,
    };

    return (
      statusOrder[this.props.newStatus] > statusOrder[this.props.previousStatus]
    );
  }

  isDegradation(): boolean {
    const statusOrder = {
      HEALTHY: 5,
      MAINTENANCE: 4,
      UNKNOWN: 3,
      DEGRADED: 2,
      UNHEALTHY: 1,
      DOWN: 0,
    };

    return (
      statusOrder[this.props.newStatus] < statusOrder[this.props.previousStatus]
    );
  }

  hasError(): boolean {
    return this.props.errorMessage !== null;
  }

  isSlowResponse(thresholdMs: number = 1000): boolean {
    if (this.props.responseTime === null) {
      return false;
    }
    return this.props.responseTime > thresholdMs;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get serviceId(): string {
    return this.props.serviceId;
  }

  get previousStatus(): ServiceHealthStatus {
    return this.props.previousStatus;
  }

  get newStatus(): ServiceHealthStatus {
    return this.props.newStatus;
  }

  get checkTimestamp(): Date {
    return this.props.checkTimestamp;
  }

  get responseTime(): number | null {
    return this.props.responseTime;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get statusCode(): number | null {
    return this.props.statusCode;
  }

  get checkDuration(): number | null {
    return this.props.checkDuration;
  }

  get triggeredBy(): string | null {
    return this.props.triggeredBy;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toObject(): ServiceHealthHistoryProps {
    return { ...this.props };
  }
}
