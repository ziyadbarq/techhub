/**
 * Foundation Layer Seed Data
 *
 * Seeds comprehensive realistic data for all Foundation entities:
 * - Lifecycle Models, States, and Transitions
 * - Vendors and Vendor Contacts
 * - Organization Units
 * - Locations
 * - Persons and Role Assignments
 * - Field Definitions
 */

import type {
  PrismaClient,
  VendorType,
} from "../../../generated/prisma/client.js";
import {
  FieldDataTypeEnum,
  LocationType,
} from "../../../generated/prisma/client.js";
import { SEED_CONFIG } from "./seed-config.js";
import { logStep, logSuccess, logWarning } from "./seed-utils.js";

export async function seedFoundation(prisma: PrismaClient) {
  console.log("🏗️  Seeding Foundation layer...");

  // Note: Cleanup is handled by main seed.ts orchestrator

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

  console.log("   ✓ Created 3 lifecycle models");

  logSuccess(`Created ${await prisma.lifecycleModel.count()} lifecycle models`);

  // ==============================================
  // 2. LIFECYCLE STATES
  // ==============================================
  logStep("🔄", "Seeding lifecycle states...");

  // IT Asset States
  const stateNew = await prisma.lifecycleState.create({
    data: {
      lifecycleModelId: itAssetLifecycle.id,
      name: "New",
      code: "NEW",
      description: "Asset has been ordered but not yet received",
      sortOrder: 1,
      stateType: "INITIAL",
      isActiveState: false,
      isTerminalState: false,
      isActive: true,
    },
  });

  const stateReceived = await prisma.lifecycleState.create({
    data: {
      lifecycleModelId: itAssetLifecycle.id,
      name: "Received",
      code: "RECEIVED",
      description:
        "Asset has been received and is being prepared for deployment",
      sortOrder: 2,
      stateType: "ACTIVE",
      isActiveState: false,
      isTerminalState: false,
      isActive: true,
    },
  });

  const stateDeployed = await prisma.lifecycleState.create({
    data: {
      lifecycleModelId: itAssetLifecycle.id,
      name: "Deployed",
      code: "DEPLOYED",
      description: "Asset is in active use",
      sortOrder: 3,
      stateType: "ACTIVE",
      isActiveState: true,
      isTerminalState: false,
      isActive: true,
    },
  });

  const stateMaintenance = await prisma.lifecycleState.create({
    data: {
      lifecycleModelId: itAssetLifecycle.id,
      name: "Maintenance",
      code: "MAINTENANCE",
      description: "Asset is under maintenance or repair",
      sortOrder: 4,
      stateType: "ACTIVE",
      isActiveState: true,
      isTerminalState: false,
      isActive: true,
    },
  });

  const stateRetired = await prisma.lifecycleState.create({
    data: {
      lifecycleModelId: itAssetLifecycle.id,
      name: "Retired",
      code: "RETIRED",
      description: "Asset has been retired from service",
      sortOrder: 5,
      stateType: "TERMINAL",
      isActiveState: false,
      isTerminalState: true,
      isActive: true,
    },
  });

  // Software License States
  await prisma.lifecycleState.createMany({
    data: [
      {
        lifecycleModelId: softwareLicenseLifecycle.id,
        name: "Purchased",
        code: "PURCHASED",
        description: "License has been purchased",
        sortOrder: 1,
        stateType: "INITIAL",
        isActiveState: false,
        isTerminalState: false,
        isActive: true,
      },
      {
        lifecycleModelId: softwareLicenseLifecycle.id,
        name: "Active",
        code: "ACTIVE",
        description: "License is active and in use",
        sortOrder: 2,
        stateType: "ACTIVE",
        isActiveState: true,
        isTerminalState: false,
        isActive: true,
      },
      {
        lifecycleModelId: softwareLicenseLifecycle.id,
        name: "Expiring Soon",
        code: "EXPIRING_SOON",
        description: "License is expiring within 30 days",
        sortOrder: 3,
        stateType: "ACTIVE",
        isActiveState: true,
        isTerminalState: false,
        isActive: true,
      },
      {
        lifecycleModelId: softwareLicenseLifecycle.id,
        name: "Expired",
        code: "EXPIRED",
        description: "License has expired",
        sortOrder: 4,
        stateType: "TERMINAL",
        isActiveState: false,
        isTerminalState: true,
        isActive: true,
      },
    ],
  });

  console.log("   ✓ Created 9 lifecycle states");

  logSuccess(`Created ${await prisma.lifecycleState.count()} lifecycle states`);

  // ==============================================
  // 3. LIFECYCLE TRANSITIONS
  // ==============================================
  logStep("➡️", "Seeding lifecycle transitions...");

  const transitions = [
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateNew.id,
      toStateId: stateReceived.id,
      name: "Receive Asset",
      description: "Mark asset as received",
    },
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateReceived.id,
      toStateId: stateDeployed.id,
      name: "Deploy Asset",
      description: "Deploy asset to user or location",
    },
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateDeployed.id,
      toStateId: stateMaintenance.id,
      name: "Send to Maintenance",
      description: "Send asset for maintenance or repair",
    },
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateMaintenance.id,
      toStateId: stateDeployed.id,
      name: "Return from Maintenance",
      description: "Return asset to service after maintenance",
    },
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateDeployed.id,
      toStateId: stateRetired.id,
      name: "Retire Asset",
      description: "Retire asset from service",
    },
    {
      lifecycleModelId: itAssetLifecycle.id,
      fromStateId: stateMaintenance.id,
      toStateId: stateRetired.id,
      name: "Retire Unrepairable Asset",
      description: "Retire asset that cannot be repaired",
    },
  ];

  await prisma.lifecycleTransition.createMany({ data: transitions });
  console.log(`   ✓ Created ${transitions.length} lifecycle transitions`);

  logSuccess(
    `Created ${await prisma.lifecycleTransition.count()} lifecycle transitions`,
  );

  // ==============================================
  // 4. VENDORS
  // ==============================================
  logStep("📦", "Seeding vendors...");

  // Create vendors from configuration
  const vendorMap = new Map<
    string,
    { id: string; code: string; name: string }
  >();

  for (const vendorData of SEED_CONFIG.VENDORS) {
    const vendor = await prisma.vendor.create({
      data: {
        name: vendorData.name,
        code: vendorData.code,
        vendorType: vendorData.type as VendorType,
        isActive: true,
        paymentTerms: "Net 30",
      },
    });
    vendorMap.set(vendor.code, vendor);
  }

  logSuccess(`Created ${vendorMap.size} vendors`);

  // ==============================================
  // 5. VENDOR CONTACTS (Sample data for first vendor)
  // ==============================================
  logStep("👥", "Seeding vendor contacts...");

  // Get first two vendors for sample contacts
  const firstVendor = vendorMap.get("DELL");
  const secondVendor = vendorMap.get("HP");

  const contacts = [];

  if (firstVendor) {
    contacts.push(
      {
        vendorId: firstVendor.id,
        firstName: "Sarah",
        lastName: "Johnson",
        title: "Enterprise Account Manager",
        email: "sarah.johnson@dell.com",
        phone: "+1-512-555-0101",
        isPrimary: true,
        isActive: true,
      },
      {
        vendorId: firstVendor.id,
        firstName: "Michael",
        lastName: "Chen",
        title: "Technical Sales Specialist",
        email: "michael.chen@dell.com",
        phone: "+1-512-555-0102",
        isPrimary: false,
        isActive: true,
      },
    );
  }

  if (secondVendor) {
    contacts.push({
      vendorId: secondVendor.id,
      firstName: "Jennifer",
      lastName: "Martinez",
      title: "Business Development Manager",
      email: "jennifer.martinez@hp.com",
      phone: "+1-650-555-0201",
      isPrimary: true,
      isActive: true,
    });
  }

  if (contacts.length > 0) {
    await prisma.vendorContact.createMany({ data: contacts });
  }

  logSuccess(`Created ${contacts.length} vendor contacts`);

  // ==============================================
  // 6. ORGANIZATION UNITS
  // ==============================================
  logStep("🏢", "Seeding organization units...");

  const orgRoot = await prisma.organizationUnit.create({
    data: {
      name: "Barq Corporation",
      code: "BARQ",
      description: "Root organization unit",
      level: 0,
      isActive: true,
    },
  });

  const orgUnitMap = new Map<string, string>();

  for (const orgUnit of SEED_CONFIG.ORG_UNITS) {
    const parentCode = "parentCode" in orgUnit ? orgUnit.parentCode : undefined;
    const parentId = parentCode ? orgUnitMap.get(parentCode) : orgRoot.id;

    if (parentCode && !parentId) {
      logWarning(
        `Parent org unit ${parentCode} not found for ${orgUnit.code}, skipping`,
      );
      continue;
    }

    const createdOrgUnit = await prisma.organizationUnit.create({
      data: {
        name: orgUnit.name,
        code: orgUnit.code,
        description: orgUnit.description,
        parentId,
        level: parentCode ? 2 : 1,
        isActive: true,
      },
    });

    orgUnitMap.set(orgUnit.code, createdOrgUnit.id);
  }

  logSuccess(
    `Created ${await prisma.organizationUnit.count()} organization units`,
  );

  // ==============================================
  // 7. LOCATIONS
  // ==============================================
  logStep("📍", "Seeding locations...");

  const locations = [
    {
      name: "Headquarters",
      code: "HQ",
      description: "Main corporate headquarters",
      locationType: LocationType.PHYSICAL,
      addressLine1: "123 Business Plaza",
      addressLine2: "Suite 500",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
      isActive: true,
    },
    {
      name: "East Coast Office",
      code: "NYC-01",
      description: "New York regional office",
      locationType: LocationType.PHYSICAL,
      addressLine1: "456 Park Avenue",
      addressLine2: "Floor 15",
      city: "New York",
      state: "NY",
      postalCode: "10022",
      country: "USA",
      isActive: true,
    },
    {
      name: "Data Center - Primary",
      code: "DC-01",
      description: "Primary data center facility",
      locationType: LocationType.DATA_CENTER,
      addressLine1: "789 Tech Drive",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "USA",
      isActive: true,
    },
    {
      name: "Data Center - DR",
      code: "DC-02",
      description: "Disaster recovery data center",
      locationType: LocationType.DATA_CENTER,
      addressLine1: "321 Cloud Street",
      city: "Seattle",
      state: "WA",
      postalCode: "98101",
      country: "USA",
      isActive: true,
    },
    {
      name: "Warehouse - Central",
      code: "WH-01",
      description: "Central warehouse for equipment storage",
      locationType: LocationType.PHYSICAL,
      addressLine1: "555 Storage Parkway",
      city: "Dallas",
      state: "TX",
      postalCode: "75201",
      country: "USA",
      isActive: true,
    },
  ];

  await prisma.location.createMany({ data: locations });
  logSuccess(`Created ${locations.length} locations`);

  // ==============================================
  // 8. PERSONS
  // ==============================================
  logStep("👤", "Seeding persons...");

  // Get roles first (needed for Person.primaryRoleId)
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const viewerRole = await prisma.role.findUnique({
    where: { name: "viewer" },
  });
  const managerRole = await prisma.role.findUnique({
    where: { name: "manager" },
  });

  if (!adminRole || !viewerRole || !managerRole) {
    console.log("   ⚠ Skipped persons (RBAC roles not found)");
  } else {
    const createdPersons = [];

    const toEmail = (firstName: string, lastName: string): string => {
      const slug = (value: string) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-+|-+$)/g, "");
      return `${slug(firstName)}.${slug(lastName)}@barq.com`;
    };

    for (const person of SEED_CONFIG.PERSONS) {
      const orgUnitId = orgUnitMap.get(person.orgUnitCode);

      if (!orgUnitId) {
        logWarning(
          `Org unit ${person.orgUnitCode} not found for ${person.firstName} ${person.lastName}, skipping`,
        );
        continue;
      }

      const isManager =
        person.title?.toLowerCase().includes("manager") ||
        person.title?.toLowerCase().includes("architect");

      const primaryRoleId = isManager ? managerRole.id : viewerRole.id;
      const email = toEmail(person.firstName, person.lastName);

      const createdPerson = await prisma.person.upsert({
        where: { email },
        update: {
          firstName: person.firstName,
          lastName: person.lastName,
          title: person.title,
          department: person.orgUnitCode,
          orgUnitId,
          primaryRoleId,
          isActive: true,
          email,
        },
        create: {
          firstName: person.firstName,
          lastName: person.lastName,
          email,
          title: person.title,
          department: person.orgUnitCode,
          orgUnitId,
          primaryRoleId,
          isActive: true,
        },
      });

      createdPersons.push(createdPerson);
    }

    logSuccess(`Created ${createdPersons.length} persons`);

    // ==============================================
    // 9. PERSON ROLE ASSIGNMENTS
    // ==============================================
    logStep("🎭", "Seeding person role assignments...");

    const roleAssignments = createdPersons.map((person) => ({
      personId: person.id,
      roleId: person.primaryRoleId,
      scope: "Default",
      isPrimary: true,
      isActive: true,
    }));

    // Give the first person an admin role assignment for elevated access
    if (createdPersons[0]) {
      roleAssignments.push({
        personId: createdPersons[0].id,
        roleId: adminRole.id,
        scope: "Global",
        isPrimary: false,
        isActive: true,
      });
    }

    if (roleAssignments.length > 0) {
      await prisma.personRoleAssignment.createMany({ data: roleAssignments });
    }

    logSuccess(`Created ${roleAssignments.length} person role assignments`);
  }

  // ==============================================
  // 10. FIELD DEFINITIONS
  // ==============================================
  logStep("🔧", "Seeding field definitions...");

  const fieldDefinitions = [
    // IT Asset fields
    {
      name: "serial_number",
      label: "Serial Number",
      description: "Manufacturer serial number",
      dataType: FieldDataTypeEnum.STRING,
      entityType: "Asset",
      isRequired: true,
      isUnique: true,
      displayOrder: 1,
      isActive: true,
    },
    {
      name: "asset_tag",
      label: "Asset Tag",
      description: "Company asset tag number",
      dataType: FieldDataTypeEnum.STRING,
      entityType: "Asset",
      isRequired: true,
      isUnique: true,
      displayOrder: 2,
      isActive: true,
    },
    {
      name: "purchase_date",
      label: "Purchase Date",
      description: "Date the asset was purchased",
      dataType: FieldDataTypeEnum.DATE,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      name: "purchase_price",
      label: "Purchase Price",
      description: "Original purchase price",
      dataType: FieldDataTypeEnum.DECIMAL,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 4,
      isActive: true,
      validationRules: { min: 0, precision: 2 },
    },
    {
      name: "warranty_expiration",
      label: "Warranty Expiration",
      description: "Date the warranty expires",
      dataType: FieldDataTypeEnum.DATE,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 5,
      isActive: true,
    },
    {
      name: "cpu_model",
      label: "CPU Model",
      description: "Processor model",
      dataType: FieldDataTypeEnum.STRING,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 10,
      isActive: true,
    },
    {
      name: "ram_gb",
      label: "RAM (GB)",
      description: "Amount of RAM in gigabytes",
      dataType: FieldDataTypeEnum.DECIMAL,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 11,
      isActive: true,
      validationRules: { min: 0, step: 1 },
    },
    {
      name: "storage_gb",
      label: "Storage (GB)",
      description: "Storage capacity in gigabytes",
      dataType: FieldDataTypeEnum.DECIMAL,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 12,
      isActive: true,
      validationRules: { min: 0, step: 1 },
    },
    {
      name: "is_portable",
      label: "Is Portable",
      description: "Whether the asset is portable/mobile",
      dataType: FieldDataTypeEnum.BOOLEAN,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 20,
      isActive: true,
      defaultValue: "false",
    },
    {
      name: "asset_category",
      label: "Asset Category",
      description: "Category of the asset",
      dataType: FieldDataTypeEnum.ENUM,
      entityType: "Asset",
      isRequired: true,
      displayOrder: 6,
      isActive: true,
      validationRules: {
        options: [
          "Laptop",
          "Desktop",
          "Server",
          "Network Device",
          "Printer",
          "Mobile Device",
          "Other",
        ],
      },
    },
    {
      name: "operating_system",
      label: "Operating System",
      description: "Installed operating system",
      dataType: FieldDataTypeEnum.ENUM,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 13,
      isActive: true,
      validationRules: {
        options: ["Windows 11", "Windows 10", "macOS", "Linux", "Other"],
      },
    },
    {
      name: "compliance_tags",
      label: "Compliance Tags",
      description: "Compliance and regulatory tags",
      dataType: FieldDataTypeEnum.ENUM,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 21,
      isActive: true,
      validationRules: {
        options: ["SOC 2", "HIPAA", "PCI-DSS", "GDPR", "ISO 27001"],
      },
    },
    {
      name: "notes",
      label: "Notes",
      description: "Additional notes and comments",
      dataType: FieldDataTypeEnum.TEXT,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 30,
      isActive: true,
      validationRules: { maxLength: 5000 },
    },
    {
      name: "custom_attributes",
      label: "Custom Attributes",
      description: "Additional custom attributes in JSON format",
      dataType: FieldDataTypeEnum.JSON,
      entityType: "Asset",
      isRequired: false,
      displayOrder: 40,
      isActive: true,
    },
  ];

  await prisma.fieldDefinition.createMany({ data: fieldDefinitions });
  logSuccess(`Created ${fieldDefinitions.length} field definitions`);

  // ==============================================
  // 11. EXCHANGE RATES (Multi-Currency Support)
  // ==============================================
  logStep("💱", "Seeding exchange rates...");

  const exchangeRates = SEED_CONFIG.EXCHANGE_RATES.map((rate) => ({
    currency: rate.currency,
    rateToSAR: rate.rateToSAR,
    isActive: rate.isActive,
  }));

  // Ensure idempotent seeding: clear existing then insert fresh data
  await prisma.exchangeRate.deleteMany();
  await prisma.exchangeRate.createMany({
    data: exchangeRates,
    skipDuplicates: true,
  });
  logSuccess(`Created ${exchangeRates.length} exchange rates`);

  logSuccess("Foundation layer seeding completed");
}
