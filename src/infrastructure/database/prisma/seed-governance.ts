/**
 * Governance Seed Data
 *
 * Seeds:
 * - Data Domains (5 domains for Saudi financial services)
 * - Data Ownerships (linking domains to CI classes/asset categories with owners)
 * - Verification Campaigns (3 campaigns for compliance audits)
 * - Verification Items (items within campaigns for tracking)
 */

import type { PrismaClient } from "@/generated/prisma";
import {
  DATA_DOMAINS,
  DATA_OWNERSHIPS,
  VERIFICATION_CAMPAIGNS,
  CI_CLASS_DATA,
} from "./seed-config.js";
import { getRelativeDate, logStep, logSuccess } from "./seed-utils.js";

/**
 * Seed governance data
 */
export async function seedGovernance(prisma: PrismaClient) {
  console.log("🛡️  Seeding Governance data...");

  // ==============================================
  // 1. DATA DOMAINS
  // ==============================================
  logStep("📊", "Creating data domains...");

  const createdDomains = [];
  for (const domain of DATA_DOMAINS) {
    const existing = await prisma.dataDomain.findUnique({
      where: { code: domain.code },
    });

    if (existing) {
      // Update if exists
      const updated = await prisma.dataDomain.update({
        where: { code: domain.code },
        data: {
          name: domain.name,
          description: domain.description,
          isActive: domain.isActive,
        },
      });
      createdDomains.push(updated);
    } else {
      // Create new
      const created = await prisma.dataDomain.create({
        data: {
          name: domain.name,
          code: domain.code,
          description: domain.description,
          isActive: domain.isActive,
        },
      });
      createdDomains.push(created);
    }
  }

  logSuccess(`Created/updated ${createdDomains.length} data domains`);

  // ==============================================
  // 2. DATA OWNERSHIPS
  // ==============================================
  logStep("👤", "Creating data ownerships...");

  // Fetch lookup data
  const persons = await prisma.person.findMany({});
  const orgUnits = await prisma.organizationUnit.findMany({});
  // Ensure baseline CI classes exist (Lightweight seed when CMDB seeding is skipped)
  for (const className of CI_CLASS_DATA) {
    await prisma.cIClass.upsert({
      where: { name: className },
      update: {},
      create: {
        name: className,
        code: className.toUpperCase().replace(/\s+/g, "_"),
        isDiscoverable: false,
      },
    });
  }
  const ciClasses = await prisma.cIClass.findMany({});
  const assetCategories = await prisma.assetCategory.findMany({});
  const fallbackPerson = persons[0];

  let ownershipCount = 0;
  for (const ownership of DATA_OWNERSHIPS) {
    // Find the data domain
    const domain = createdDomains.find(
      (d) => d.code === ownership.dataDomainCode,
    );
    if (!domain) {
      console.warn(
        `   ⚠️  Data domain ${ownership.dataDomainCode} not found, skipping ownership`,
      );
      continue;
    }

    // Determine target (CI Class or Asset Category)
    let ciClassId: string | null = null;
    let assetCategoryId: string | null = null;

    if (ownership.targetType === "CI_CLASS") {
      const ciClass = ciClasses.find((c) => c.name === ownership.ciClassName);
      if (!ciClass) {
        console.warn(
          `   ⚠️  CI Class ${ownership.ciClassName} not found, skipping ownership`,
        );
        continue;
      }
      ciClassId = ciClass.id;
    } else if (ownership.targetType === "ASSET_CATEGORY") {
      const category = assetCategories.find(
        (c) => c.code === ownership.assetCategoryCode,
      );
      if (!category) {
        console.warn(
          `   ⚠️  Asset Category ${ownership.assetCategoryCode} not found, skipping ownership`,
        );
        continue;
      }
      assetCategoryId = category.id;
    }

    // Determine owner (Person or Org Unit)
    let ownerPersonId: string | null = null;
    let ownerOrgUnitId: string | null = null;

    if (ownership.ownerType === "PERSON") {
      const person =
        persons.find((p) => p.email === ownership.ownerEmail) || fallbackPerson;
      if (!person) {
        console.warn(
          `   ⚠️  Person ${ownership.ownerEmail} not found and no fallback available, skipping ownership`,
        );
        continue;
      }
      ownerPersonId = person.id;
    } else if (ownership.ownerType === "ORG_UNIT") {
      const orgUnit = orgUnits.find(
        (o) => o.code === ownership.ownerOrgUnitCode,
      );
      if (!orgUnit) {
        console.warn(
          `   ⚠️  Org Unit ${ownership.ownerOrgUnitCode} not found, skipping ownership`,
        );
        continue;
      }
      ownerOrgUnitId = orgUnit.id;
    }

    // Create ownership
    await prisma.dataOwnership.create({
      data: {
        dataDomainId: domain.id,
        ciClassId,
        assetCategoryId,
        ownerPersonId,
        ownerOrgUnitId,
        note: ownership.note,
      },
    });

    ownershipCount++;
  }

  logSuccess(`Created ${ownershipCount} data ownerships`);

  // ==============================================
  // 3. VERIFICATION CAMPAIGNS
  // ==============================================
  logStep("📋", "Creating verification campaigns...");

  const campaigns = [];
  for (const campaignTemplate of VERIFICATION_CAMPAIGNS) {
    // Find creator
    const creator =
      persons.find((p) => p.email === campaignTemplate.creatorEmail) ||
      fallbackPerson;
    if (!creator) {
      console.warn(
        `   ⚠️  Creator ${campaignTemplate.creatorEmail} not found and no fallback available, skipping campaign`,
      );
      continue;
    }

    const campaign = await prisma.verificationCampaign.create({
      data: {
        name: campaignTemplate.name,
        description: campaignTemplate.description,
        targetType: campaignTemplate.targetType,
        scheduledStart: getRelativeDate(
          campaignTemplate.scheduledStartDaysFromNow,
        ),
        scheduledEnd: getRelativeDate(campaignTemplate.scheduledEndDaysFromNow),
        createdById: creator.id,
      },
    });

    campaigns.push(campaign);
  }

  logSuccess(`Created ${campaigns.length} verification campaigns`);

  // ==============================================
  // 4. VERIFICATION ITEMS
  // ==============================================
  logStep("✅", "Creating verification items...");

  let itemCount = 0;

  // Campaign 1: Q1 2025 Server Infrastructure Verification (CI)
  if (campaigns[0]) {
    const campaign = campaigns[0];
    const configurationItems = await prisma.configurationItem.findMany({
      where: {
        ciClass: {
          name: { in: ["Server", "Database", "Application"] },
        },
      },
      take: 10,
    });

    for (const ci of configurationItems) {
      // Assign some items with different statuses
      const statusOptions: Array<
        "PENDING" | "IN_PROGRESS" | "VERIFIED" | "EXCEPTION"
      > = ["PENDING", "IN_PROGRESS", "VERIFIED", "EXCEPTION"];
      const randomStatus = statusOptions[itemCount % statusOptions.length];

      // Find verifier (different persons)
      const verifier = persons[itemCount % persons.length];

      await prisma.verificationItem.create({
        data: {
          verificationCampaignId: campaign.id,
          targetType: "CI",
          targetId: ci.id,
          status: randomStatus,
          verifierPersonId: randomStatus !== "PENDING" ? verifier?.id : null,
          verifiedAt: randomStatus === "VERIFIED" ? getRelativeDate(-5) : null,
          comment:
            randomStatus === "VERIFIED"
              ? "Configuration verified, all security controls in place"
              : randomStatus === "EXCEPTION"
                ? "Missing OS patches, remediation ticket created"
                : randomStatus === "IN_PROGRESS"
                  ? "Currently under review"
                  : null,
        },
      });

      itemCount++;
    }
  }

  // Campaign 2: Annual Asset Compliance Audit 2025 (ASSET)
  if (campaigns[1]) {
    const campaign = campaigns[1];
    const assets = await prisma.asset.findMany({
      where: {
        assetCategory: {
          code: { in: ["LAPTOP", "SERVER", "NETWORK"] },
        },
      },
      take: 15,
    });

    for (const asset of assets) {
      const statusOptions: Array<
        "PENDING" | "IN_PROGRESS" | "VERIFIED" | "EXCEPTION"
      > = ["PENDING", "IN_PROGRESS", "VERIFIED"];
      const randomStatus = statusOptions[itemCount % statusOptions.length];

      const verifier = persons[itemCount % persons.length];

      await prisma.verificationItem.create({
        data: {
          verificationCampaignId: campaign.id,
          targetType: "ASSET",
          targetId: asset.id,
          status: randomStatus,
          verifierPersonId: randomStatus !== "PENDING" ? verifier?.id : null,
          verifiedAt: randomStatus === "VERIFIED" ? getRelativeDate(-3) : null,
          comment:
            randomStatus === "VERIFIED"
              ? "Asset location and ownership verified"
              : randomStatus === "IN_PROGRESS"
                ? "Pending physical verification"
                : null,
        },
      });

      itemCount++;
    }
  }

  // Campaign 3: PCI-DSS Quarterly Review Q1 2025 (CI) - Future campaign, all items pending
  if (campaigns[2]) {
    const campaign = campaigns[2];
    const paymentCIs = await prisma.configurationItem.findMany({
      where: {
        ciClass: {
          name: { in: ["Application", "Service"] },
        },
      },
      take: 5,
    });

    for (const ci of paymentCIs) {
      await prisma.verificationItem.create({
        data: {
          verificationCampaignId: campaign.id,
          targetType: "CI",
          targetId: ci.id,
          status: "PENDING",
          verifierPersonId: null,
          comment: "Awaiting PCI-DSS compliance review",
        },
      });

      itemCount++;
    }
  }

  logSuccess(`Created ${itemCount} verification items`);

  console.log("   ✅ Governance seeding completed");
}
