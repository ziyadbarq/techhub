/**
 * Foundation Layer Seed Data (Refactored)
 *
 * Seeds comprehensive realistic data for all Foundation entities using factories.
 * Split into two functions:
 * - seedFoundation(): Config/reference data (production-safe)
 * - seedDemoPersons(): Demo persons (dev-only)
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { SEED_CONFIG } from "./seed-config.js";
import { logSection, logStep, logSuccess } from "./seed-utils.js";
import {
  createLifecycleStates,
  createLifecycleTransitions,
  createVendors,
  createVendorContacts,
  createLocations,
  createOrganizationUnits,
  createPersons,
  createFieldDefinitions,
  createExchangeRates,
} from "./seed-foundation-factories.js";

export async function seedFoundation(prisma: PrismaClient) {
  console.log("🏗️  Seeding Foundation layer...");

  // ==============================================
  // 1. LIFECYCLE MODELS (idempotent - uses upsert)
  // ==============================================
  logStep("📊", "Seeding lifecycle models...");

  const itAssetLifecycle = await prisma.lifecycleModel.upsert({
    where: { name: "IT Asset Lifecycle" },
    create: {
      name: "IT Asset Lifecycle",
      description:
        "Standard lifecycle model for IT hardware and software assets",
    },
    update: {}, // No-op update to preserve existing data
  });

  const softwareLicenseLifecycle = await prisma.lifecycleModel.upsert({
    where: { name: "Software License Lifecycle" },
    create: {
      name: "Software License Lifecycle",
      description: "Lifecycle model for software licenses and subscriptions",
    },
    update: {}, // No-op update to preserve existing data
  });

  const _facilityAssetLifecycle = await prisma.lifecycleModel.upsert({
    where: { name: "Facility Asset Lifecycle" },
    create: {
      name: "Facility Asset Lifecycle",
      description: "Lifecycle model for facility and building assets",
    },
    update: {}, // No-op update to preserve existing data
  });

  logSuccess(
    `Processed ${await prisma.lifecycleModel.count()} lifecycle models`,
  );

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

  await createOrganizationUnits(prisma, SEED_CONFIG.ORG_UNITS);

  logSuccess(
    `Created ${await prisma.organizationUnit.count()} organization units`,
  );

  // ==============================================
  // 8. FIELD DEFINITIONS (Using Factory)
  // ==============================================
  logStep("📋", "Seeding field definitions...");

  await createFieldDefinitions(prisma, [
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
    // CI Network Fields (7 fields for Configuration Items)
    {
      name: "Primary IPv4 Address",
      code: "PRIMARY_IPV4",
      dataType: "STRING",
      label: "Primary IPv4 Address",
      description: "Primary IPv4 address assigned to this CI",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        description: "Valid IPv4 address format (e.g., 192.168.1.100)",
      },
    },
    {
      name: "Primary IPv6 Address",
      code: "PRIMARY_IPV6",
      dataType: "STRING",
      label: "Primary IPv6 Address",
      description: "Primary IPv6 address assigned to this CI",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$",
        description: "Valid IPv6 address format (e.g., 2001:db8::1 or ::1)",
      },
    },
    {
      name: "MAC Address",
      code: "MAC_ADDRESS_CI",
      dataType: "STRING",
      label: "MAC Address",
      description: "Physical MAC address (hardware identifier)",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
        description: "Valid MAC address format (e.g., 00:1A:2B:3C:4D:5E)",
      },
    },
    {
      name: "FQDN",
      code: "FQDN",
      dataType: "STRING",
      label: "Fully Qualified Domain Name",
      description: "DNS hostname (FQDN) for this CI",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^(?=.{1,253}$)((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,63}$",
        description: "Valid FQDN format (e.g., server.example.com)",
      },
    },
    {
      name: "Default Gateway",
      code: "DEFAULT_GATEWAY",
      dataType: "STRING",
      label: "Default Gateway",
      description: "Default gateway IP address",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        description: "Valid IPv4 address format",
      },
    },
    {
      name: "Primary DNS Server",
      code: "PRIMARY_DNS",
      dataType: "STRING",
      label: "Primary DNS Server",
      description: "Primary DNS server IP address",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        description: "Valid IPv4 address format",
      },
    },
    {
      name: "Secondary DNS Server",
      code: "SECONDARY_DNS",
      dataType: "STRING",
      label: "Secondary DNS Server",
      description: "Secondary/backup DNS server IP address",
      entityType: "CONFIGURATION_ITEM",
      isGlobal: true,
      isRequired: false,
      validationRules: {
        pattern:
          "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        description: "Valid IPv4 address format",
      },
    },
  ]);

  logSuccess(
    `Created ${await prisma.fieldDefinition.count()} field definitions`,
  );

  // ==============================================
  // 9. EXCHANGE RATES
  // ==============================================
  logStep("💱", "Seeding exchange rates...");

  await createExchangeRates(prisma, SEED_CONFIG.EXCHANGE_RATES);

  logSuccess(`Created ${await prisma.exchangeRate.count()} exchange rates`);

  console.log("✅ Foundation config seeding complete!");
}

/**
 * Seed Demo Persons (Dev-only)
 *
 * Seeds 21 demo persons for development environments.
 * In production, persons are synced from Microsoft Graph.
 */
export async function seedDemoPersons(prisma: PrismaClient) {
  logSection("Demo Persons (Dev Only)");

  // Get org units for person assignment
  const orgUnits = await prisma.organizationUnit.findMany({
    select: { id: true, code: true },
  });
  const orgUnitMap = new Map(orgUnits.map((ou) => [ou.code, ou.id]));

  // ==============================================
  // 1. PERSONS (Using Factory)
  // ==============================================
  logStep("👥", "Seeding demo persons...");

  await createPersons(prisma, SEED_CONFIG.PERSONS, orgUnitMap);

  logSuccess(`Created ${await prisma.person.count()} demo persons`);

  console.log("✅ Demo persons seeding complete!");
}
