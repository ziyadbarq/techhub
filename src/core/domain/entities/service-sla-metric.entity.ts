/**
 * ServiceSlaMetric Entity
 *
 * Tracks SLA performance metrics over time for services including
 * response time, resolution time, uptime, error rate, and throughput.
 */

import type { SlaMetricType, SlaComplianceStatus } from "@/generated/prisma";

export interface ServiceSlaMetricProps {
  id: string;
  serviceId: string;
  metricType: SlaMetricType;
  periodStart: Date;
  periodEnd: Date;
  targetValue: number; // Decimal stored as number
  actualValue: number; // Decimal stored as number
  complianceStatus: SlaComplianceStatus;
  breachDuration: number | null;
  incidentCount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceSlaMetricProps {
  serviceId: string;
  metricType: SlaMetricType;
  periodStart: Date;
  periodEnd: Date;
  targetValue: number;
  actualValue: number;
  complianceStatus: SlaComplianceStatus;
  breachDuration?: number | null;
  incidentCount?: number;
  notes?: string | null;
}

export class ServiceSlaMetric {
  private constructor(private props: ServiceSlaMetricProps) {
    this.validate();
  }

  static create(props: CreateServiceSlaMetricProps): ServiceSlaMetric {
    const now = new Date();

    return new ServiceSlaMetric({
      id: crypto.randomUUID(),
      serviceId: props.serviceId,
      metricType: props.metricType,
      periodStart: props.periodStart,
      periodEnd: props.periodEnd,
      targetValue: props.targetValue,
      actualValue: props.actualValue,
      complianceStatus: props.complianceStatus,
      breachDuration: props.breachDuration ?? null,
      incidentCount: props.incidentCount ?? 0,
      notes: props.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ServiceSlaMetricProps): ServiceSlaMetric {
    return new ServiceSlaMetric(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("ServiceSlaMetric ID is required");
    }
    if (!this.props.serviceId) {
      throw new Error("Service ID is required");
    }
    if (!this.props.periodStart) {
      throw new Error("Period start date is required");
    }
    if (!this.props.periodEnd) {
      throw new Error("Period end date is required");
    }
    if (this.props.periodStart >= this.props.periodEnd) {
      throw new Error("Period start must be before period end");
    }
    if (this.props.targetValue < 0) {
      throw new Error("Target value cannot be negative");
    }
    if (this.props.actualValue < 0) {
      throw new Error("Actual value cannot be negative");
    }
  }

  // Business Logic

  isBreached(): boolean {
    return this.props.complianceStatus === "BREACHED";
  }

  isCompliant(): boolean {
    return this.props.complianceStatus === "COMPLIANT";
  }

  isAtRisk(): boolean {
    return this.props.complianceStatus === "AT_RISK";
  }

  hasBreachDuration(): boolean {
    return this.props.breachDuration !== null && this.props.breachDuration > 0;
  }

  hasIncidents(): boolean {
    return this.props.incidentCount > 0;
  }

  /**
   * Calculate how far the actual value is from target as a percentage
   * Positive = over target (bad for response time/error rate)
   * Negative = under target (good for response time/error rate, bad for uptime)
   */
  getBreachPercentage(): number {
    if (this.props.targetValue === 0) {
      return 0;
    }

    const difference = this.props.actualValue - this.props.targetValue;
    return (difference / this.props.targetValue) * 100;
  }

  /**
   * Calculate compliance percentage based on metric type
   * For response time/error rate: lower is better
   * For uptime/throughput: higher is better
   */
  getCompliancePercentage(): number {
    if (this.props.targetValue === 0) {
      return 0;
    }

    // For metrics where lower is better (response time, error rate)
    if (
      this.props.metricType === "RESPONSE_TIME" ||
      this.props.metricType === "ERROR_RATE"
    ) {
      if (this.props.actualValue <= this.props.targetValue) {
        return 100;
      }
      // Calculate how much worse than target
      const overage = this.props.actualValue - this.props.targetValue;
      const compliancePercentage =
        100 - (overage / this.props.targetValue) * 100;
      return Math.max(0, compliancePercentage);
    }

    // For metrics where higher is better (uptime, throughput)
    if (
      this.props.metricType === "UPTIME" ||
      this.props.metricType === "THROUGHPUT"
    ) {
      if (this.props.actualValue >= this.props.targetValue) {
        return 100;
      }
      return (this.props.actualValue / this.props.targetValue) * 100;
    }

    // For resolution time (lower is better, but measured differently)
    if (this.props.metricType === "RESOLUTION_TIME") {
      if (this.props.actualValue <= this.props.targetValue) {
        return 100;
      }
      const overage = this.props.actualValue - this.props.targetValue;
      const compliancePercentage =
        100 - (overage / this.props.targetValue) * 100;
      return Math.max(0, compliancePercentage);
    }

    return 0;
  }

  getPeriodDuration(): number {
    return this.props.periodEnd.getTime() - this.props.periodStart.getTime();
  }

  getPeriodDurationHours(): number {
    return this.getPeriodDuration() / (1000 * 60 * 60);
  }

  getPeriodDurationDays(): number {
    return this.getPeriodDuration() / (1000 * 60 * 60 * 24);
  }

  isCurrentPeriod(): boolean {
    const now = new Date();
    return now >= this.props.periodStart && now <= this.props.periodEnd;
  }

  isPastPeriod(): boolean {
    const now = new Date();
    return now > this.props.periodEnd;
  }

  isFuturePeriod(): boolean {
    const now = new Date();
    return now < this.props.periodStart;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get serviceId(): string {
    return this.props.serviceId;
  }

  get metricType(): SlaMetricType {
    return this.props.metricType;
  }

  get periodStart(): Date {
    return this.props.periodStart;
  }

  get periodEnd(): Date {
    return this.props.periodEnd;
  }

  get targetValue(): number {
    return this.props.targetValue;
  }

  get actualValue(): number {
    return this.props.actualValue;
  }

  get complianceStatus(): SlaComplianceStatus {
    return this.props.complianceStatus;
  }

  get breachDuration(): number | null {
    return this.props.breachDuration;
  }

  get incidentCount(): number {
    return this.props.incidentCount;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): ServiceSlaMetricProps {
    return { ...this.props };
  }
}
