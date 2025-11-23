/**
 * Foundation Layer Seed Data (Refactored)
 *
 * Seeds comprehensive realistic data for all Foundation entities using factories.
 * Applies DRY principle and batch operations for better performance.
 *
 * Refactored from 749 lines to ~400 lines (47% reduction)
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { SEED_CONFIG } from "./seed-config.js";
import { logStep, logSuccess } from "./seed-utils.js";
import {
  createLifecycleStates,
  createLifecycleTransitions,
  createVendors,
  createVendorContacts,
  createLocations,
  createOrganizationUnits,
  createPersons,
  createPersonRoleAssignments,
  createFieldDefinitions,
  createExchangeRates,
} from "./seed-foundation-factories.js";

export async function seedFoundation(prisma: PrismaClient) {
  console.log("🏗️  Seeding Foundation layer...");

  // ==============================================
  // 1. LIFECYCLE MODELS
  // ==============================================
  logStep("📊", "Seeding lifecycle models...");

  const itAssetLifecycle = await prisma.lifecycleModel.create({
    data: {
      name: "IT Asset Lifecycle",
      description:
        "Standard lifecycle model for IT hardware and software assets",
    },
  });

  const softwareLicenseLifecycle = await prisma.lifecycleModel.create({
    data: {
      name: "Software License Lifecycle",
      description: "Lifecycle model for software licenses and subscriptions",
    },
  });

  const _facilityAssetLifecycle = await prisma.lifecycleModel.create({
    data: {
      name: "Facility Asset Lifecycle",
      description: "Lifecycle model for facility and building assets",
    },
  });

  logSuccess(`Created ${await prisma.lifecycleModel.count()} lifecycle models`);

  // ==============================================
  // 2. LIFECYCLE STATES (Using Factory)
  // ==============================================
  logStep("🔄", "Seeding lifecycle states...");

  // IT Asset States - batch creation using factory
  const [
    stateNew,
    stateReceived,
    stateDeployed,
    stateMaintenance,
    stateRetired,
  ] = await createLifecycleStates(prisma, itAssetLifecycle.id, [
    {
      name: "New",
      code: "NEW",
      description: "Asset has been ordered but not yet received",
      sortOrder: 1,
      stateType: "INITIAL",
    },
    {
      name: "Received",
      code: "RECEIVED",
      description:
        "Asset has been received and is being prepared for deployment",
      sortOrder: 2,
      stateType: "ACTIVE",
    },
    {
      name: "Deployed",
      code: "DEPLOYED",
      description: "Asset is in active use",
      sortOrder: 3,
      stateType: "ACTIVE",
    },
    {
      name: "Maintenance",
      code: "MAINTENANCE",
      description: "Asset is under maintenance or repair",
      sortOrder: 4,
      stateType: "ACTIVE",
    },
    {
      name: "Retired",
      code: "RETIRED",
      description: "Asset has been retired from service",
      sortOrder: 5,
      stateType: "TERMINAL",
    },
  ]);

  // Software License States - batch creation
  await createLifecycleStates(prisma, softwareLicenseLifecycle.id, [
    {
      name: "Purchased",
      code: "PURCHASED",
      description: "License has been purchased",
      sortOrder: 1,
      stateType: "INITIAL",
    },
    {
      name: "Active",
      code: "ACTIVE",
      description: "License is active and in use",
      sortOrder: 2,
      stateType: "ACTIVE",
    },
    {
      name: "Expiring Soon",
      code: "EXPIRING_SOON",
      description: "License is expiring within 30 days",
      sortOrder: 3,
      stateType: "ACTIVE",
    },
    {
      name: "Expired",
      code: "EXPIRED",
      description: "License has expired",
      sortOrder: 4,
      stateType: "TERMINAL",
    },
  ]);

  logSuccess(`Created ${await prisma.lifecycleState.count()} lifecycle states`);

  // ==============================================
  // 3. LIFECYCLE TRANSITIONS (Using Factory)
  // ==============================================
  logStep("➡️", "Seeding lifecycle transitions...");

  await createLifecycleTransitions(prisma, itAssetLifecycle.id, [
    {
      fromStateId: stateNew.id,
      toStateId: stateReceived.id,
      name: "Receive",
      description: "Receive ordered asset",
    },
    {
      fromStateId: stateReceived.id,
      toStateId: stateDeployed.id,
      name: "Deploy",
      description: "Deploy asset to user",
    },
    {
      fromStateId: stateDeployed.id,
      toStateId: stateMaintenance.id,
      name: "Send to Maintenance",
      description: "Send asset for maintenance",
    },
    {
      fromStateId: stateMaintenance.id,
      toStateId: stateDeployed.id,
      name: "Return to Service",
      description: "Return asset from maintenance",
    },
    {
      fromStateId: stateDeployed.id,
      toStateId: stateRetired.id,
      name: "Retire",
      description: "Retire asset from service",
    },
    {
      fromStateId: stateMaintenance.id,
      toStateId: stateRetired.id,
      name: "Retire (from Maintenance)",
      description: "Retire asset during maintenance",
    },
  ]);

  logSuccess(
    `Created ${await prisma.lifecycleTransition.count()} lifecycle transitions`,
  );

  // ==============================================
  // 4. VENDORS (Using Factory)
  // ==============================================
  logStep("🏭", "Seeding vendors...");

  const vendorMap = await createVendors(prisma, SEED_CONFIG.VENDORS);

  logSuccess(`Created ${await prisma.vendor.count()} vendors`);

  // ==============================================
  // 5. VENDOR CONTACTS
  // ==============================================
  logStep("👥", "Seeding vendor contacts...");

  await createVendorContacts(prisma, SEED_CONFIG.VENDOR_CONTACTS, vendorMap);

  logSuccess(`Created ${await prisma.vendorContact.count()} vendor contacts`);

  // ==============================================
  // 6. LOCATIONS (Using Factory)
  // ==============================================
  logStep("📍", "Seeding locations...");

  await createLocations(prisma, SEED_CONFIG.LOCATIONS);

  logSuccess(`Created ${await prisma.location.count()} locations`);

  // ==============================================
  // 7. ORGANIZATION UNITS (Using Factory)
  // ==============================================
  logStep("🏢", "Seeding organization units...");

  const orgUnitMap = await createOrganizationUnits(
    prisma,
    SEED_CONFIG.ORG_UNITS,
  );

  logSuccess(
    `Created ${await prisma.organizationUnit.count()} organization units`,
  );

  // ==============================================
  // 8. PERSONS (Using Factory)
  // ==============================================
  logStep("👥", "Seeding persons...");

  const { emailMap: personEmailMap, nameMap: personNameMap } =
    await createPersons(prisma, SEED_CONFIG.PERSONS, orgUnitMap);

  logSuccess(`Created ${await prisma.person.count()} persons`);

  // ==============================================
  // 9. PERSON ROLE ASSIGNMENTS
  // ==============================================
  logStep("🎭", "Seeding person role assignments...");

  await createPersonRoleAssignments(
    prisma,
    SEED_CONFIG.PERSON_ROLE_ASSIGNMENTS,
    personEmailMap,
    personNameMap,
  );

  logSuccess(
    `Created ${await prisma.personRoleAssignment.count()} person role assignments`,
  );

  // ==============================================
  // 10. FIELD DEFINITIONS (Using Factory)
  // ==============================================
  logStep("📋", "Seeding field definitions...");

  await createFieldDefinitions(prisma, [
    {
      name: "Serial Number",
      code: "SERIAL_NUM",
      dataType: "STRING",
      description: "Asset serial number",
      isRequired: true,
    },
    {
      name: "MAC Address",
      code: "MAC_ADDR",
      dataType: "STRING",
      description: "Network MAC address",
    },
    {
      name: "CPU Model",
      code: "CPU_MODEL",
      dataType: "STRING",
      description: "CPU/Processor model",
    },
    {
      name: "RAM Size (GB)",
      code: "RAM_GB",
      dataType: "INTEGER",
      description: "RAM size in gigabytes",
      validationRules: { min: 1, max: 1024 },
    },
    {
      name: "Storage Size (GB)",
      code: "STORAGE_GB",
      dataType: "INTEGER",
      description: "Storage capacity in gigabytes",
      validationRules: { min: 1, max: 10000 },
    },
    {
      name: "OS Version",
      code: "OS_VERSION",
      dataType: "STRING",
      description: "Operating system version",
    },
    {
      name: "IP Address",
      code: "IP_ADDR",
      dataType: "STRING",
      description: "Assigned IP address",
    },
    {
      name: "Warranty Expiry",
      code: "WARRANTY_EXP",
      dataType: "DATE",
      description: "Warranty expiration date",
    },
  ]);

  logSuccess(
    `Created ${await prisma.fieldDefinition.count()} field definitions`,
  );

  // ==============================================
  // 11. EXCHANGE RATES
  // ==============================================
  logStep("💱", "Seeding exchange rates...");

  await createExchangeRates(prisma, SEED_CONFIG.EXCHANGE_RATES);

  logSuccess(`Created ${await prisma.exchangeRate.count()} exchange rates`);

  console.log("✅ Foundation layer seeding complete!");
}
