/**
 * Migrate existing slaDetails JSON to structured fields
 *
 * Run with: npx dotenv -e .env.local -- npx tsx scripts/migrate-sla-data.ts
 *
 * This script:
 * 1. Finds all services with slaDetails JSON
 * 2. Extracts structured data from JSON
 * 3. Populates new SLA fields
 * 4. Initializes health monitoring (disabled by default)
 * 5. Preserves original slaDetails for rollback safety
 */

import { prisma } from "@/infrastructure/database/prisma/client";
import { Prisma } from "@/generated/prisma/server";

interface SlaDetailsJson {
  uptimeTarget?: number | string;
  supportTier?: string;
  contactEmail?: string;
  escalationPath?: string;
  responseTimeP50?: number | string;
  responseTimeP95?: number | string;
  responseTimeP99?: number | string;
  resolutionTimeCritical?: number | string;
  resolutionTimeHigh?: number | string;
  resolutionTimeMedium?: number | string;
  errorRateThreshold?: number | string;
  [key: string]: unknown;
}

async function migrateSlaData() {
  console.log("🔄 Starting SLA data migration...\n");

  const services = await prisma.service.findMany({
    where: {
      slaDetails: { not: Prisma.DbNull },
    },
    select: {
      id: true,
      name: true,
      slaDetails: true,
    },
  });

  console.log(`📊 Found ${services.length} services with slaDetails JSON\n`);

  if (services.length === 0) {
    console.log("✨ No services to migrate. Exiting.\n");
    return;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const service of services) {
    try {
      const sla = service.slaDetails as SlaDetailsJson;

      // Skip if no recognizable SLA fields
      if (!sla || typeof sla !== "object") {
        console.log(`⏭️  Skipping ${service.name} - invalid slaDetails format`);
        skippedCount++;
        continue;
      }

      // Parse numeric values safely
      const parseNumber = (val: unknown): number | null => {
        if (val === null || val === undefined) return null;
        const num = typeof val === "string" ? parseFloat(val) : Number(val);
        return isNaN(num) ? null : num;
      };

      // Parse decimal values (percentages)
      const parseDecimal = (val: unknown): number | null => {
        const num = parseNumber(val);
        if (num === null) return null;
        // Ensure it's a valid percentage (0-100)
        return num >= 0 && num <= 100 ? num : null;
      };

      await prisma.service.update({
        where: { id: service.id },
        data: {
          // SLA Response Time fields (milliseconds)
          slaResponseTimeP50: parseNumber(sla.responseTimeP50),
          slaResponseTimeP95: parseNumber(sla.responseTimeP95),
          slaResponseTimeP99: parseNumber(sla.responseTimeP99),

          // SLA Resolution Time fields (minutes)
          slaResolutionTimeCritical: parseNumber(sla.resolutionTimeCritical),
          slaResolutionTimeHigh: parseNumber(sla.resolutionTimeHigh),
          slaResolutionTimeMedium: parseNumber(sla.resolutionTimeMedium),

          // SLA Uptime (percentage)
          slaUptimePercentage: parseDecimal(sla.uptimeTarget),

          // SLA Error Rate (percentage)
          slaErrorRateThreshold: parseDecimal(sla.errorRateThreshold),

          // Support tier information
          slaSupportTier: sla.supportTier?.toString() || null,
          slaContactEmail: sla.contactEmail?.toString() || null,
          slaEscalationPath: sla.escalationPath?.toString() || null,

          // Initialize health monitoring (disabled by default)
          healthCheckEnabled: false,
          healthStatus: "UNKNOWN",
          slaComplianceStatus: "NOT_APPLICABLE",
        },
      });

      console.log(`✅ Migrated: ${service.name}`);
      migratedCount++;
    } catch (error) {
      console.error(`❌ Error migrating ${service.name}:`, error);
      skippedCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped:  ${skippedCount}`);
  console.log("=".repeat(50) + "\n");

  // Show sample of migrated data
  if (migratedCount > 0) {
    console.log("Sample migrated service:");
    const sample = await prisma.service.findFirst({
      where: {
        OR: [
          { slaResponseTimeP50: { not: null } },
          { slaUptimePercentage: { not: null } },
          { slaSupportTier: { not: null } },
        ],
      },
      select: {
        name: true,
        slaResponseTimeP50: true,
        slaResponseTimeP95: true,
        slaUptimePercentage: true,
        slaErrorRateThreshold: true,
        slaSupportTier: true,
        slaContactEmail: true,
        healthStatus: true,
        slaComplianceStatus: true,
      },
    });

    if (sample) {
      console.log(JSON.stringify(sample, null, 2));
    }
  }
}

migrateSlaData()
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
