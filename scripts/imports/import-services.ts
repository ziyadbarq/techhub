/**
 * Service Import Script
 * Imports real Barq services from service_owners.json
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-services.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-services.ts --dry-run
 *
 * Background:
 * - Seed files (seed-config-services-*.ts) contain DEMO services for development
 * - Real production services come from service_owners.json (75 services)
 * - This script imports real services WITHOUT ownership (use import-service-ownership.ts for that)
 *
 * Workflow:
 * 1. npm run db:seed (production preset - no demo services)
 * 2. Run Graph sync to populate persons
 * 3. npx tsx scripts/import-services.ts (creates services)
 * 4. npx tsx scripts/import-service-ownership.ts (links owners to services)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/infrastructure/database/prisma/client.js";
import type { ServiceType } from "@/generated/prisma";

// ==============================================
// Types
// ==============================================

interface ServiceOwnersData {
  [serviceName: string]: {
    "Technical Owner": string[];
    "Product Manager": string[];
    "Business Owner": string[];
  };
}

// ==============================================
// Configuration
// ==============================================

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_FILE = join(process.cwd(), "local/barq-data/service_owners.json");

// Service type mapping (infer from name patterns)
function inferServiceType(serviceName: string): ServiceType {
  const name = serviceName.toLowerCase();

  // Applications
  if (
    name.includes(" app") ||
    name.includes("portal") ||
    name.includes("website")
  ) {
    return "APPLICATION";
  }

  // APIs
  if (name.includes(" api") || name.includes("gateway")) {
    return "API";
  }

  // Middleware
  if (
    name.includes("airflow") ||
    name.includes("kafka") ||
    name.includes("rabbitmq")
  ) {
    return "MIDDLEWARE";
  }

  // Infrastructure
  if (
    name.includes("active directory") ||
    name.includes("dns") ||
    name.includes("firewall") ||
    name.includes("load balancer")
  ) {
    return "NETWORK";
  }

  // Databases
  if (
    name.includes("database") ||
    name.includes("postgres") ||
    name.includes("redis") ||
    name.includes("mongo") ||
    name.includes("elasticsearch")
  ) {
    return "DATABASE";
  }

  // Default to APPLICATION for services
  if (name.includes("service")) {
    return "APPLICATION";
  }

  // Default
  return "APPLICATION";
}

// ==============================================
// Main Import Logic
// ==============================================

async function importServices() {
  console.log("🔧 Service Import");
  console.log("=" + "=".repeat(79));

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  // 1. Load data file
  console.log(`📂 Loading data from ${DATA_FILE}...`);
  const rawData = readFileSync(DATA_FILE, "utf-8");
  const servicesData: ServiceOwnersData = JSON.parse(rawData);
  const serviceNames = Object.keys(servicesData).sort();
  console.log(`   ✓ Loaded ${serviceNames.length} services\n`);

  // 2. Fetch existing services from database
  console.log("📦 Fetching existing services from database...");
  const existingServices = await prisma.service.findMany({
    select: { id: true, name: true },
  });
  const existingServiceNames = new Set(existingServices.map((s) => s.name));
  console.log(`   ✓ Found ${existingServices.length} existing services\n`);

  // 3. Process each service
  console.log("🔄 Processing services...\n");

  let createdCount = 0;
  let skippedAlreadyExists = 0;

  for (const serviceName of serviceNames) {
    // Check if service already exists
    if (existingServiceNames.has(serviceName)) {
      skippedAlreadyExists++;
      continue;
    }

    // Infer service type from name
    const serviceType = inferServiceType(serviceName);

    // Create service
    if (!DRY_RUN) {
      await prisma.service.create({
        data: {
          name: serviceName,
          serviceType,
          description: `${serviceName} - imported from service_owners.json`,
          businessPurpose: "Business service",
          dataConfidentiality: "CONFIDENTIAL",
          businessImpactLevel: "MEDIUM",
          criticality: "MEDIUM",
          isEssentialService: false,
          currentStatus: "PRODUCTION",
        },
      });
    }

    createdCount++;
    console.log(`   ✓ ${serviceName} (${serviceType})`);

    // Log progress every 10 services
    if (createdCount % 10 === 0) {
      console.log(`   Progress: ${createdCount} services processed...\n`);
    }
  }

  // 4. Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 Summary");
  console.log("=".repeat(80));
  console.log(
    `✅ Created: ${createdCount} service${createdCount !== 1 ? "s" : ""}`,
  );
  console.log(`⏭️  Skipped (already exists): ${skippedAlreadyExists}`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - No changes were made to the database");
  } else {
    console.log("\n📝 Next step:");
    console.log("   Run: npx tsx scripts/import-service-ownership.ts");
    console.log("   To link services to their owners\n");
  }

  console.log("");
}

// ==============================================
// Execute
// ==============================================

importServices()
  .then(() => {
    console.log("✅ Import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
