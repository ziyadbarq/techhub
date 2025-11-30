-- CreateEnum
CREATE TYPE "ServiceHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'DOWN', 'UNKNOWN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SlaComplianceStatus" AS ENUM ('COMPLIANT', 'AT_RISK', 'BREACHED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "SlaMetricType" AS ENUM ('RESPONSE_TIME', 'RESOLUTION_TIME', 'UPTIME', 'ERROR_RATE', 'THROUGHPUT');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "currentErrorRate" DECIMAL(5,3),
ADD COLUMN     "currentResponseTimeP50" INTEGER,
ADD COLUMN     "currentResponseTimeP95" INTEGER,
ADD COLUMN     "healthCheckEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "healthCheckInterval" INTEGER,
ADD COLUMN     "healthCheckTimeout" INTEGER,
ADD COLUMN     "healthCheckUrl" TEXT,
ADD COLUMN     "healthStatus" "ServiceHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "lastDowntimeDate" TIMESTAMP(3),
ADD COLUMN     "lastDowntimeDuration" INTEGER,
ADD COLUMN     "lastHealthCheck" TIMESTAMP(3),
ADD COLUMN     "lastIncidentDate" TIMESTAMP(3),
ADD COLUMN     "lastSlaReviewDate" TIMESTAMP(3),
ADD COLUMN     "mtbfHours" INTEGER,
ADD COLUMN     "mttrMinutes" INTEGER,
ADD COLUMN     "nextScheduledHealthCheck" TIMESTAMP(3),
ADD COLUMN     "slaComplianceStatus" "SlaComplianceStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "slaContactEmail" TEXT,
ADD COLUMN     "slaErrorRateThreshold" DECIMAL(5,3),
ADD COLUMN     "slaEscalationPath" TEXT,
ADD COLUMN     "slaResolutionTimeCritical" INTEGER,
ADD COLUMN     "slaResolutionTimeHigh" INTEGER,
ADD COLUMN     "slaResolutionTimeMedium" INTEGER,
ADD COLUMN     "slaResponseTimeP50" INTEGER,
ADD COLUMN     "slaResponseTimeP95" INTEGER,
ADD COLUMN     "slaResponseTimeP99" INTEGER,
ADD COLUMN     "slaSupportTier" TEXT,
ADD COLUMN     "slaUptimePercentage" DECIMAL(5,3),
ADD COLUMN     "slaViolationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uptimePercentage24h" DECIMAL(5,3),
ADD COLUMN     "uptimePercentage30d" DECIMAL(5,3),
ADD COLUMN     "uptimePercentage7d" DECIMAL(5,3);

-- CreateTable
CREATE TABLE "service_health_history" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "previousStatus" "ServiceHealthStatus" NOT NULL,
    "newStatus" "ServiceHealthStatus" NOT NULL,
    "checkTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER,
    "errorMessage" TEXT,
    "statusCode" INTEGER,
    "checkDuration" INTEGER,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_health_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sla_metrics" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "metricType" "SlaMetricType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "targetValue" DECIMAL(12,3) NOT NULL,
    "actualValue" DECIMAL(12,3) NOT NULL,
    "complianceStatus" "SlaComplianceStatus" NOT NULL,
    "breachDuration" INTEGER,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_sla_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_health_history_serviceId_checkTimestamp_idx" ON "service_health_history"("serviceId", "checkTimestamp");

-- CreateIndex
CREATE INDEX "service_health_history_newStatus_idx" ON "service_health_history"("newStatus");

-- CreateIndex
CREATE INDEX "service_sla_metrics_serviceId_periodStart_idx" ON "service_sla_metrics"("serviceId", "periodStart");

-- CreateIndex
CREATE INDEX "service_sla_metrics_complianceStatus_idx" ON "service_sla_metrics"("complianceStatus");

-- CreateIndex
CREATE INDEX "service_sla_metrics_metricType_idx" ON "service_sla_metrics"("metricType");

-- CreateIndex
CREATE UNIQUE INDEX "service_sla_metrics_serviceId_metricType_periodStart_key" ON "service_sla_metrics"("serviceId", "metricType", "periodStart");

-- CreateIndex
CREATE INDEX "services_healthStatus_idx" ON "services"("healthStatus");

-- CreateIndex
CREATE INDEX "services_slaComplianceStatus_idx" ON "services"("slaComplianceStatus");

-- CreateIndex
CREATE INDEX "services_lastHealthCheck_idx" ON "services"("lastHealthCheck");

-- CreateIndex
CREATE INDEX "services_healthCheckEnabled_idx" ON "services"("healthCheckEnabled");

-- AddForeignKey
ALTER TABLE "service_health_history" ADD CONSTRAINT "service_health_history_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sla_metrics" ADD CONSTRAINT "service_sla_metrics_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
