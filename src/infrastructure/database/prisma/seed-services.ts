/**
 * Service Management Seed Data
 *
 * Split into three functions:
 * - seedBusinessProcesses(): 25 business processes (production-safe)
 * - seedServices(): 74 real Barq services without owners (production-safe)
 * - seedServiceOwners(): Service ownership assignments (dev-only)
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  logSection,
  logStep,
  logSuccess,
  requireEntities,
  logWarning,
} from "./seed-utils.js";
import { SEED_CONFIG } from "./seed-config.js";

/**
 * Seed Business Processes
 */
export async function seedBusinessProcesses(prisma: PrismaClient) {
  logSection("Service Management: Business Processes");
  logStep("📋", "Creating business processes...");

  let processCount = 0;

  for (const process of SEED_CONFIG.BUSINESS_PROCESSES) {
    await prisma.businessProcess.upsert({
      where: { code: process.code },
      update: {},
      create: {
        code: process.code,
        name: process.name,
        description: process.description,
        category: process.category,
      },
    });
    processCount++;
  }

  logSuccess(`Created ${processCount} business processes`);
  console.log("");
}

/**
 * Seed Services (Production-safe)
 *
 * Seeds 74 real Barq services with infrastructure metadata.
 * Does NOT create ownership assignments (use seedServiceOwners for that).
 */
export async function seedServices(prisma: PrismaClient) {
  logSection("Services (Production)");

  // ==============================================
  // Prerequisites
  // ==============================================
  const vendors = await prisma.vendor.findMany({});
  const businessProcesses = await prisma.businessProcess.findMany({});

  requireEntities(vendors, "vendors");
  requireEntities(businessProcesses, "business processes");

  // Create lookup maps
  const vendorMap = new Map(vendors.map((v) => [v.code, v.id]));
  const businessProcessMap = new Map(
    businessProcesses.map((bp) => [bp.code, bp.id]),
  );

  // ==============================================
  // Create Services with infrastructure (no owners)
  // ==============================================
  logStep("🔧", "Creating services with infrastructure...");

  let serviceCount = 0;
  let infrastructureCount = 0;

  // Load existing services to support append mode
  const existingServices = await prisma.service.findMany({
    select: { id: true, name: true },
  });
  const existingServiceNames = new Set(existingServices.map((s) => s.name));

  for (const serviceData of SEED_CONFIG.SERVICES) {
    // Check if service already exists (idempotent)
    if (existingServiceNames.has(serviceData.name)) {
      serviceCount++;
      continue; // Skip duplicate
    }

    // Resolve vendor ID (optional)
    const vendorCode =
      "vendorCode" in serviceData ? serviceData.vendorCode : undefined;
    const vendorId = vendorCode ? vendorMap.get(vendorCode) : undefined;

    if (vendorCode && !vendorId) {
      logWarning(
        `Vendor ${vendorCode} not found for service ${serviceData.name}, skipping vendor link`,
      );
    }

    // Resolve business process ID (optional)
    const businessProcessCode =
      "businessProcessCode" in serviceData
        ? serviceData.businessProcessCode
        : undefined;
    const businessProcessId = businessProcessCode
      ? businessProcessMap.get(businessProcessCode)
      : undefined;

    if (businessProcessCode && !businessProcessId) {
      logWarning(
        `Business process ${businessProcessCode} not found for service ${serviceData.name}, skipping business process link`,
      );
    }

    // Prepare infrastructure data
    const infrastructure =
      "infrastructure" in serviceData ? serviceData.infrastructure : undefined;

    // Create service WITHOUT owners (owners added separately via seedServiceOwners)
    await prisma.service.create({
      data: {
        name: serviceData.name,
        serviceType: serviceData.serviceType,
        description: serviceData.description,
        businessPurpose: serviceData.businessPurpose,
        gitlabRepoUrl:
          "gitlabRepoUrl" in serviceData
            ? serviceData.gitlabRepoUrl
            : undefined,
        dataConfidentiality: serviceData.dataConfidentiality,
        businessImpactLevel: serviceData.businessImpactLevel,
        criticality: serviceData.criticality,
        isEssentialService: serviceData.isEssentialService,
        currentStatus: serviceData.currentStatus,
        vendorId,
        businessProcessId,
        // Create infrastructure inline (if present)
        infrastructure: infrastructure
          ? {
              create: {
                location: infrastructure.location,
                cloudProvider:
                  "cloudProvider" in infrastructure
                    ? (infrastructure.cloudProvider as string | undefined)
                    : undefined,
                compartment:
                  "compartment" in infrastructure
                    ? (infrastructure.compartment as string | undefined)
                    : undefined,
                project:
                  "project" in infrastructure
                    ? (infrastructure.project as string | undefined)
                    : undefined,
                region:
                  "region" in infrastructure
                    ? (infrastructure.region as string | undefined)
                    : undefined,
                ipAddress:
                  "ipAddress" in infrastructure
                    ? (infrastructure.ipAddress as string | undefined)
                    : undefined,
                hostname:
                  "hostname" in infrastructure
                    ? (infrastructure.hostname as string | undefined)
                    : undefined,
                backupEnabled:
                  "backupEnabled" in infrastructure
                    ? (infrastructure.backupEnabled as boolean | undefined)
                    : undefined,
                backupSchedule:
                  "backupSchedule" in infrastructure
                    ? (infrastructure.backupSchedule as string | undefined)
                    : undefined,
              },
            }
          : undefined,
      },
    });

    serviceCount++;
    if (infrastructure) {
      infrastructureCount++;
    }

    // Log progress every 10 services
    if (serviceCount % 10 === 0) {
      console.log(`   Progress: ${serviceCount} services processed...`);
    }
  }

  logSuccess(`Processed ${serviceCount} services`);
  logSuccess(`Processed ${infrastructureCount} service infrastructure records`);

  // ==============================================
  // Summary by Type
  // ==============================================
  console.log("\nService Distribution:");

  const servicesByType = await prisma.service.groupBy({
    by: ["serviceType"],
    _count: { serviceType: true },
  });

  for (const group of servicesByType) {
    console.log(`   - ${group.serviceType}: ${group._count.serviceType}`);
  }

  // ==============================================
  // Summary by Criticality
  // ==============================================
  console.log("\nService Criticality:");

  const servicesByCriticality = await prisma.service.groupBy({
    by: ["criticality"],
    _count: { criticality: true },
  });

  for (const group of servicesByCriticality) {
    console.log(`   - ${group.criticality}: ${group._count.criticality}`);
  }

  // ==============================================
  // Essential Services Count
  // ==============================================
  const essentialServicesCount = await prisma.service.count({
    where: { isEssentialService: true },
  });

  console.log(`\nEssential Services: ${essentialServicesCount}`);
}

/**
 * Seed Service Owners (Dev-only)
 *
 * Seeds service ownership assignments linking services to demo persons.
 * Requires SERVICES and DEMO_PERSONS to be seeded first.
 */
export async function seedServiceOwners(prisma: PrismaClient) {
  logSection("Service Owners (Dev Only)");

  // ==============================================
  // Prerequisites
  // ==============================================
  const persons = await prisma.person.findMany({});
  const services = await prisma.service.findMany({
    select: { id: true, name: true },
  });

  requireEntities(persons, "persons");
  requireEntities(services, "services");

  // Create lookup maps
  const personMap = new Map(
    persons.map((p) => [`${p.firstName} ${p.lastName}`, p.id]),
  );
  const serviceMap = new Map(services.map((s) => [s.name, s.id]));

  // ==============================================
  // Create Service Ownerships
  // ==============================================
  logStep("👥", "Creating service ownership assignments...");

  let ownershipCount = 0;
  let skippedCount = 0;

  // Check existing ownerships to avoid duplicates
  const existingOwnerships = await prisma.serviceOwnership.findMany({
    select: { serviceId: true, personId: true },
  });
  const existingOwnershipSet = new Set(
    existingOwnerships.map((o) => `${o.serviceId}-${o.personId}`),
  );

  for (const serviceData of SEED_CONFIG.SERVICES) {
    const serviceId = serviceMap.get(serviceData.name);
    if (!serviceId) {
      logWarning(`Service ${serviceData.name} not found, skipping owners`);
      continue;
    }

    // Get owners from config
    const owners = "owners" in serviceData ? serviceData.owners : undefined;
    if (!owners) {
      continue;
    }

    for (const owner of owners) {
      const personId = personMap.get(owner.personName);
      if (!personId) {
        logWarning(
          `Person ${owner.personName} not found for service ${serviceData.name}, skipping`,
        );
        skippedCount++;
        continue;
      }

      // Check if already exists (idempotent)
      const key = `${serviceId}-${personId}`;
      if (existingOwnershipSet.has(key)) {
        ownershipCount++;
        continue;
      }

      await prisma.serviceOwnership.create({
        data: {
          serviceId,
          personId,
          ownershipType: owner.type,
          isPrimary: owner.isPrimary,
        },
      });

      ownershipCount++;
    }
  }

  logSuccess(`Processed ${ownershipCount} service ownerships`);
  if (skippedCount > 0) {
    logWarning(`Skipped ${skippedCount} ownerships (persons not found)`);
  }
}
