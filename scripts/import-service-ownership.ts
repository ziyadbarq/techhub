/**
 * Service Ownership Import Script
 * Links services to their Technical, Product, and Business owners based on service_owners.json
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-ownership.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-ownership.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/infrastructure/database/prisma/client.js";

// ==============================================
// Types
// ==============================================

interface ServiceOwnershipData {
  [serviceName: string]: {
    "Technical Owner": string[];
    "Product Manager": string[];
    "Business Owner": string[];
  };
}

type OwnershipType = "TECHNICAL" | "PRODUCT" | "BUSINESS";

interface OwnershipMapping {
  serviceName: string;
  ownerName: string;
  ownershipType: OwnershipType;
  isPrimary: boolean;
}

// ==============================================
// Configuration
// ==============================================

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_FILE = join(process.cwd(), "local/barq-data/service_owners.json");

// ==============================================
// Helper Functions
// ==============================================

/**
 * Normalize a person's name for comparison
 * - Removes extra spaces
 * - Converts to lowercase
 * - Handles name variations
 */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Normalize spaces
    .replace(/\s+$/g, ""); // Remove trailing spaces
}

/**
 * Improved fuzzy matching for person names
 * Handles complex cases like:
 * - Target "Walaa Almutairi" → DB firstName="Walaa" + lastName="Sati Almutairi"
 * - Target "Moath Mohammed Almansour" → DB firstName="Moath" + lastName="Mohammed Almansour"
 */
function matchPerson(
  targetName: string,
  persons: Array<{ id: string; firstName: string; lastName: string | null }>,
): { id: string; firstName: string; lastName: string | null } | null {
  const normalized = normalizeName(targetName);
  const targetParts = normalized.split(" ");

  // Strategy 1: Exact "firstName lastName" match
  for (const person of persons) {
    const personFullName = normalizeName(
      `${person.firstName} ${person.lastName || ""}`,
    );
    if (personFullName === normalized) {
      return person;
    }
  }

  // Strategy 2: First name matches, and any part of lastName matches any part of target
  // This handles cases where lastName contains middle name + family name
  for (const person of persons) {
    const firstName = normalizeName(person.firstName);
    const lastName = person.lastName ? normalizeName(person.lastName) : null;

    if (!lastName || !targetParts.includes(firstName)) {
      continue;
    }

    // Check if any word in the target matches any word in the lastName
    const lastNameParts = lastName.split(" ");
    const hasLastNameMatch = targetParts.some((targetPart) =>
      lastNameParts.includes(targetPart),
    );

    if (hasLastNameMatch) {
      return person;
    }
  }

  // Strategy 3: Target contains both firstName and all parts of person's lastName
  // Handles cases where target has more words than database
  for (const person of persons) {
    const firstName = normalizeName(person.firstName);
    const lastName = person.lastName ? normalizeName(person.lastName) : null;

    if (
      lastName &&
      normalized.includes(firstName) &&
      normalized.includes(lastName)
    ) {
      return person;
    }
  }

  return null;
}

/**
 * Parse service_owners.json into flat ownership mappings
 */
function parseOwnershipData(data: ServiceOwnershipData): OwnershipMapping[] {
  const mappings: OwnershipMapping[] = [];

  for (const [serviceName, owners] of Object.entries(data)) {
    // Technical Owners
    owners["Technical Owner"].forEach((ownerName, index) => {
      mappings.push({
        serviceName,
        ownerName,
        ownershipType: "TECHNICAL",
        isPrimary: index === 0, // First one is primary
      });
    });

    // Product Managers
    owners["Product Manager"].forEach((ownerName, index) => {
      mappings.push({
        serviceName,
        ownerName,
        ownershipType: "PRODUCT",
        isPrimary: index === 0,
      });
    });

    // Business Owners
    owners["Business Owner"].forEach((ownerName, index) => {
      mappings.push({
        serviceName,
        ownerName,
        ownershipType: "BUSINESS",
        isPrimary: index === 0,
      });
    });
  }

  return mappings;
}

// ==============================================
// Main Import Logic
// ==============================================

async function importServiceOwnership() {
  console.log("🔗 Service Ownership Import");
  console.log("=".repeat(80));

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  // 1. Load data file
  console.log(`📂 Loading data from ${DATA_FILE}...`);
  const rawData = readFileSync(DATA_FILE, "utf-8");
  const ownershipData: ServiceOwnershipData = JSON.parse(rawData);
  const mappings = parseOwnershipData(ownershipData);
  console.log(
    `   ✓ Loaded ${Object.keys(ownershipData).length} services with ${mappings.length} ownership assignments\n`,
  );

  // 2. Fetch all services from database
  console.log("📦 Fetching services from database...");
  const services = await prisma.service.findMany({
    select: { id: true, name: true },
  });
  console.log(`   ✓ Found ${services.length} services in database\n`);

  // 3. Fetch all persons from database
  console.log("👥 Fetching persons from database...");
  const persons = await prisma.person.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  console.log(`   ✓ Found ${persons.length} persons in database\n`);

  // 4. Build service name lookup
  const serviceByName = new Map(
    services.map((s) => [normalizeName(s.name), s]),
  );

  // 5. Process each ownership mapping
  console.log("🔄 Processing ownership mappings...\n");

  let createdCount = 0;
  let skippedServiceNotFound = 0;
  let skippedPersonNotFound = 0;
  let skippedAlreadyExists = 0;
  const unmatchedServices = new Set<string>();
  const unmatchedPersons = new Set<string>();

  for (const mapping of mappings) {
    // Find service
    const service = serviceByName.get(normalizeName(mapping.serviceName));
    if (!service) {
      unmatchedServices.add(mapping.serviceName);
      skippedServiceNotFound++;
      continue;
    }

    // Find person
    const person = matchPerson(mapping.ownerName, persons);
    if (!person) {
      unmatchedPersons.add(mapping.ownerName);
      skippedPersonNotFound++;
      continue;
    }

    // Check if ownership already exists
    const existing = await prisma.serviceOwnership.findUnique({
      where: {
        serviceId_personId_ownershipType: {
          serviceId: service.id,
          personId: person.id,
          ownershipType: mapping.ownershipType,
        },
      },
    });

    if (existing) {
      skippedAlreadyExists++;
      continue;
    }

    // Create ownership
    if (!DRY_RUN) {
      await prisma.serviceOwnership.create({
        data: {
          serviceId: service.id,
          personId: person.id,
          ownershipType: mapping.ownershipType,
          isPrimary: mapping.isPrimary,
        },
      });
    }

    createdCount++;
    console.log(
      `   ✓ ${service.name} → ${person.firstName} ${person.lastName || ""} (${mapping.ownershipType}${mapping.isPrimary ? ", PRIMARY" : ""})`,
    );
  }

  // 6. Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 Summary");
  console.log("=".repeat(80));
  console.log(
    `✅ Created: ${createdCount} ownership${createdCount !== 1 ? "s" : ""}`,
  );
  console.log(`⏭️  Skipped (already exists): ${skippedAlreadyExists}`);
  console.log(`⚠️  Skipped (service not found): ${skippedServiceNotFound}`);
  console.log(`⚠️  Skipped (person not found): ${skippedPersonNotFound}`);

  if (unmatchedServices.size > 0) {
    console.log(`\n⚠️  Unmatched Services (${unmatchedServices.size}):`);
    Array.from(unmatchedServices)
      .sort()
      .forEach((name) => console.log(`   - ${name}`));
  }

  if (unmatchedPersons.size > 0) {
    console.log(`\n⚠️  Unmatched Persons (${unmatchedPersons.size}):`);
    Array.from(unmatchedPersons)
      .sort()
      .forEach((name) => console.log(`   - ${name}`));
  }

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - No changes were made to the database");
  }

  console.log("");
}

// ==============================================
// Execute
// ==============================================

importServiceOwnership()
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
