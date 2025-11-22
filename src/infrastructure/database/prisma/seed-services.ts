/**
 * Service Management Seed Data
 *
 * Seeds comprehensive service management data:
 * - Business Processes (25 processes covering all business domains)
 * - Services (80 services with full metadata, owners, and infrastructure)
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
 * Seed Services with owners and infrastructure
 */
export async function seedServices(prisma: PrismaClient) {
  logSection("Service Management: Services");

  // ==============================================
  // Prerequisites
  // ==============================================
  const persons = await prisma.person.findMany({});
  const vendors = await prisma.vendor.findMany({});
  const businessProcesses = await prisma.businessProcess.findMany({});

  requireEntities(persons, "persons");
  requireEntities(vendors, "vendors");
  requireEntities(businessProcesses, "business processes");

  // Create lookup maps
  const personMap = new Map(
    persons.map((p) => [`${p.firstName} ${p.lastName}`, p.id]),
  );
  const vendorMap = new Map(vendors.map((v) => [v.code, v.id]));
  const businessProcessMap = new Map(
    businessProcesses.map((bp) => [bp.code, bp.id]),
  );

  // ==============================================
  // Create Services with nested relations
  // ==============================================
  logStep("🔧", "Creating services with owners and infrastructure...");

  let serviceCount = 0;
  let ownershipCount = 0;
  let infrastructureCount = 0;

  for (const serviceData of SEED_CONFIG.SERVICES) {
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

    // Prepare owners data
    const owners = "owners" in serviceData ? serviceData.owners : undefined;
    const ownersData =
      owners
        ?.map((owner) => {
          const personId = personMap.get(owner.personName);
          if (!personId) {
            logWarning(
              `Person ${owner.personName} not found for service ${serviceData.name}, skipping owner`,
            );
            return null;
          }
          return {
            personId,
            ownershipType: owner.type,
            isPrimary: owner.isPrimary,
          };
        })
        .filter(Boolean) || [];

    // Prepare infrastructure data
    const infrastructure =
      "infrastructure" in serviceData ? serviceData.infrastructure : undefined;

    // Create service with nested relations
    const _service = await prisma.service.create({
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
        // Create owners inline
        owners:
          ownersData.length > 0
            ? {
                create: ownersData as Array<{
                  personId: string;
                  ownershipType: "TECHNICAL" | "PRODUCT" | "BUSINESS";
                  isPrimary: boolean;
                }>,
              }
            : undefined,
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
    ownershipCount += ownersData.length;
    if (infrastructure) {
      infrastructureCount++;
    }

    // Log progress every 10 services
    if (serviceCount % 10 === 0) {
      console.log(`   Progress: ${serviceCount} services created...`);
    }
  }

  logSuccess(`Created ${serviceCount} services`);
  logSuccess(`Created ${ownershipCount} service ownerships`);
  logSuccess(`Created ${infrastructureCount} service infrastructure records`);

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
