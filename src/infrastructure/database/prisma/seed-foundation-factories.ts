/**
 * Foundation Layer Seed Factories
 *
 * Helper factories to reduce duplication in foundation layer seeding
 * Applies DRY principle and batch operations for better performance
 */

import type { PrismaClient } from "@/generated/prisma/server";
import { FieldDataTypeEnum } from "@/generated/prisma/enums";

// ==============================================
// Lifecycle State Factory
// ==============================================

export interface LifecycleStateData {
  name: string;
  code: string;
  description: string;
  sortOrder: number;
  stateType: "INITIAL" | "ACTIVE" | "TERMINAL";
}

/**
 * Create multiple lifecycle states in batch (idempotent - uses upsert)
 * Reduces duplication and improves performance
 */
export async function createLifecycleStates(
  prisma: PrismaClient,
  lifecycleModelId: string,
  states: LifecycleStateData[],
) {
  const upsertPromises = states.map((state) =>
    prisma.lifecycleState.upsert({
      where: {
        lifecycleModelId_code: { lifecycleModelId, code: state.code },
      },
      create: {
        lifecycleModelId,
        name: state.name,
        code: state.code,
        description: state.description,
        sortOrder: state.sortOrder,
        stateType: state.stateType,
        isActiveState: state.stateType === "ACTIVE",
        isTerminalState: state.stateType === "TERMINAL",
        isActive: true,
      },
      update: {}, // No-op update to preserve existing data
    }),
  );

  return Promise.all(upsertPromises);
}

// ==============================================
// Lifecycle Transition Factory
// ==============================================

export interface LifecycleTransitionData {
  fromStateId: string;
  toStateId: string;
  name: string;
  description: string;
  isAutomated?: boolean;
  requiresApproval?: boolean;
}

/**
 * Create multiple lifecycle transitions in batch (idempotent - skipDuplicates)
 */
export async function createLifecycleTransitions(
  prisma: PrismaClient,
  lifecycleModelId: string,
  transitions: LifecycleTransitionData[],
) {
  return prisma.lifecycleTransition.createMany({
    data: transitions.map((t) => ({
      lifecycleModelId,
      fromStateId: t.fromStateId,
      toStateId: t.toStateId,
      name: t.name,
      description: t.description,
      isAutomated: t.isAutomated ?? false,
      requiresApproval: t.requiresApproval ?? false,
      isActive: true,
    })),
    skipDuplicates: true,
  });
}

// ==============================================
// Vendor Factory
// ==============================================

export interface VendorData {
  name: string;
  code: string;
  type: "MANUFACTURER" | "RESELLER" | "SERVICE_PROVIDER" | "CONSULTANT";
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
}

/**
 * Create vendors from config data (idempotent - uses upsert)
 */
export async function createVendors(
  prisma: PrismaClient,
  vendors: readonly VendorData[] | VendorData[],
) {
  const vendorMap = new Map<string, string>();

  for (const v of vendors) {
    const created = await prisma.vendor.upsert({
      where: { code: v.code },
      create: {
        name: v.name,
        code: v.code,
        vendorType: v.type,
        description: v.description,
        website: v.website,
        email: v.email,
        phone: v.phone,
        isActive: true,
      },
      update: {}, // No-op update to preserve existing data
    });

    vendorMap.set(v.code, created.id);
  }

  return vendorMap;
}

// ==============================================
// Location Factory
// ==============================================

export interface LocationData {
  name: string;
  code: string;
  city: string;
  country: string;
  address?: string;
  locationType?:
    | "COUNTRY"
    | "CITY"
    | "CAMPUS"
    | "BUILDING"
    | "FLOOR"
    | "ROOM"
    | "RACK"
    | "DATA_CENTER"
    | "CLOUD_REGION"
    | "PHYSICAL"
    | "LOGICAL";
}

/**
 * Create locations from config data (idempotent - skipDuplicates)
 */
export async function createLocations(
  prisma: PrismaClient,
  locations: readonly LocationData[] | LocationData[],
) {
  return prisma.location.createMany({
    data: locations.map((l) => ({
      name: l.name,
      code: l.code,
      address: l.address ?? null,
      city: l.city,
      country: l.country,
      locationType: l.locationType ?? "PHYSICAL",
      isActive: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
    skipDuplicates: true,
  });
}

// ==============================================
// Organization Unit Factory
// ==============================================

export interface OrgUnitData {
  name: string;
  code: string;
  description?: string;
  parentCode?: string;
  unitType?:
    | "COMPANY"
    | "BUSINESS_UNIT"
    | "DEPARTMENT"
    | "TEAM"
    | "DIVISION"
    | "OTHER";
}

/**
 * Create organization units with multi-pass hierarchy support (idempotent - uses upsert).
 * Handles 4+ levels by repeatedly processing remaining units until
 * all parents are resolved or no progress can be made.
 */
export async function createOrganizationUnits(
  prisma: PrismaClient,
  orgUnits: readonly OrgUnitData[] | OrgUnitData[],
) {
  const createdUnits = new Map<string, { id: string; level: number }>(); // code -> metadata
  let remaining = [...orgUnits];
  let maxPasses = 10; // Safety limit to prevent infinite loops
  let passCount = 0;

  // First, load any existing org units to support append mode
  const existingUnits = await prisma.organizationUnit.findMany({
    select: { id: true, code: true, level: true },
  });
  for (const unit of existingUnits) {
    createdUnits.set(unit.code, { id: unit.id, level: unit.level });
  }

  while (remaining.length > 0 && maxPasses > 0) {
    passCount++;
    const nextRound: OrgUnitData[] = [];
    let createdThisPass = 0;

    for (const unit of remaining) {
      // Check if this unit can be created (either no parent, or parent already exists)
      const canCreate = !unit.parentCode || createdUnits.has(unit.parentCode);

      if (canCreate) {
        const parentMeta = unit.parentCode
          ? createdUnits.get(unit.parentCode)
          : undefined;
        const level = parentMeta ? parentMeta.level + 1 : 1;

        const created = await prisma.organizationUnit.upsert({
          where: { code: unit.code },
          create: {
            name: unit.name,
            code: unit.code,
            description: unit.description ?? null,
            unitType: unit.unitType ?? "DEPARTMENT",
            parent: parentMeta ? { connect: { id: parentMeta.id } } : undefined,
            level,
            isActive: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          update: {}, // No-op update to preserve existing data
        });

        createdUnits.set(unit.code, { id: created.id, level });
        createdThisPass++;
      } else {
        // Parent not yet created, defer to next pass
        nextRound.push(unit);
      }
    }

    // If no progress was made this pass, we have orphaned units
    if (createdThisPass === 0 && nextRound.length > 0) {
      console.warn(
        `⚠️  Could not create ${nextRound.length} org units - missing parents:`,
      );
      nextRound.forEach((u) =>
        console.warn(`    - ${u.code} (parent: ${u.parentCode})`),
      );
      break;
    }

    remaining = nextRound;
    maxPasses--;
  }

  if (maxPasses === 0 && remaining.length > 0) {
    console.warn(
      `⚠️  Max passes reached with ${remaining.length} units remaining`,
    );
  }

  // Log summary
  console.log(
    `    Processed ${createdUnits.size} org units in ${passCount} pass(es)`,
  );

  const orgUnitIdMap = new Map<string, string>();
  for (const [code, meta] of createdUnits.entries()) {
    orgUnitIdMap.set(code, meta.id);
  }

  return orgUnitIdMap;
}

// ==============================================
// Person Factory
// ==============================================

export interface PersonData {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  orgUnitCode?: string;
}

/**
 * Create persons (with org unit mapping) - idempotent using upsert
 */
export async function createPersons(
  prisma: PrismaClient,
  persons: readonly PersonData[] | PersonData[],
  orgUnitMap: Map<string, string>, // code -> id
) {
  const defaultRole = await prisma.role.findUnique({
    where: { name: "viewer" },
  });

  if (!defaultRole) {
    throw new Error("Default role 'viewer' not found while seeding persons");
  }

  const createdPersons = [];
  const emailMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  const usedEmails = new Set<string>();

  // Load existing persons to support append mode
  const existingPersons = await prisma.person.findMany({
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  for (const p of existingPersons) {
    usedEmails.add(p.email.toLowerCase());
    emailMap.set(p.email.toLowerCase(), p.id);
    nameMap.set(`${p.firstName} ${p.lastName}`.toLowerCase(), p.id);
  }

  for (const person of persons) {
    const orgUnitId = person.orgUnitCode
      ? orgUnitMap.get(person.orgUnitCode)
      : undefined;

    if (!orgUnitId) {
      console.warn(
        `⚠️  Org unit not found for person ${person.email}: ${person.orgUnitCode}`,
      );
      continue;
    }

    let email = (person.email || "").toLowerCase();
    if (!email.includes("@")) {
      email = `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@example.com`;
    }

    // Skip if this email already exists (either in DB or from this batch)
    if (emailMap.has(email)) {
      continue;
    }

    if (usedEmails.has(email)) {
      const [local, domain] = email.split("@");
      let counter = 2;
      while (usedEmails.has(`${local}${counter}@${domain}`)) {
        counter += 1;
      }
      email = `${local}${counter}@${domain}`;
    }
    usedEmails.add(email);

    const created = await prisma.person.upsert({
      where: { email },
      create: {
        firstName: person.firstName,
        lastName: person.lastName,
        email,
        title: person.title ?? null,
        orgUnit: orgUnitId ? { connect: { id: orgUnitId } } : undefined,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      update: {}, // No-op update to preserve existing data
    });

    createdPersons.push(created);
    emailMap.set(email, created.id);
    nameMap.set(
      `${person.firstName} ${person.lastName}`.toLowerCase(),
      created.id,
    );
  }

  return { createdPersons, emailMap, nameMap };
}

// ==============================================
// Field Definition Factory
// ==============================================

export interface FieldDefinitionData {
  name: string;
  code: string;
  dataType: keyof typeof FieldDataTypeEnum | FieldDataTypeEnum;
  description: string;
  label?: string;
  entityType?: string;
  isRequired?: boolean;
  isGlobal?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  validationRules?: Record<string, unknown>;
}

/**
 * Create field definitions in batch (idempotent - skipDuplicates)
 */
export async function createFieldDefinitions(
  prisma: PrismaClient,
  fields: FieldDefinitionData[],
) {
  const dataTypeMap: Record<string, FieldDataTypeEnum> = {
    STRING: FieldDataTypeEnum.STRING,
    TEXT: FieldDataTypeEnum.TEXT,
    NUMBER: FieldDataTypeEnum.INTEGER,
    INTEGER: FieldDataTypeEnum.INTEGER,
    DECIMAL: FieldDataTypeEnum.DECIMAL,
    BOOLEAN: FieldDataTypeEnum.BOOLEAN,
    DATE: FieldDataTypeEnum.DATE,
    DATETIME: FieldDataTypeEnum.DATETIME,
    ENUM: FieldDataTypeEnum.ENUM,
    JSON: FieldDataTypeEnum.JSON,
    CI_REFERENCE: FieldDataTypeEnum.CI_REFERENCE,
    PERSON_REFERENCE: FieldDataTypeEnum.PERSON_REFERENCE,
    ORG_UNIT_REFERENCE: FieldDataTypeEnum.ORG_UNIT_REFERENCE,
    LOCATION_REFERENCE: FieldDataTypeEnum.LOCATION_REFERENCE,
  };

  return prisma.fieldDefinition.createMany({
    data: fields.map((f) => ({
      name: f.code || f.name,
      label: f.label ?? f.name,
      entityType: f.entityType ?? "ASSET",
      dataType:
        typeof f.dataType === "string"
          ? (dataTypeMap[f.dataType] ?? FieldDataTypeEnum.STRING)
          : f.dataType,
      description: f.description,
      isRequired: f.isRequired ?? false,
      isGlobal: f.isGlobal ?? true,
      isUnique: f.isUnique ?? false,
      defaultValue: f.defaultValue ?? null,
      validationRules: f.validationRules ?? null,
      isActive: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
    skipDuplicates: true,
  });
}

// ==============================================
// Vendor Contacts Factory
// ==============================================

export interface VendorContactData {
  vendorCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export async function createVendorContacts(
  prisma: PrismaClient,
  contacts: readonly VendorContactData[] | VendorContactData[],
  vendorMap: Map<string, string>,
) {
  for (const contact of contacts) {
    const vendorId = vendorMap.get(contact.vendorCode);
    if (!vendorId) {
      console.warn(
        `⚠️  Vendor not found for contact ${contact.email}: ${contact.vendorCode}`,
      );
      continue;
    }

    // Check if contact already exists for this vendor (idempotent)
    const existing = await prisma.vendorContact.findFirst({
      where: {
        vendorId,
        email: contact.email,
      },
    });

    if (existing) {
      continue; // Skip duplicate
    }

    await prisma.vendorContact.create({
      data: {
        vendor: { connect: { id: vendorId } },
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone ?? null,
        role: contact.role ?? null,
        isPrimary: contact.isPrimary ?? false,
        isActive: true,
      },
    });
  }
}

// ==============================================
// Person Role Assignments Factory
// ==============================================

export interface PersonRoleAssignmentData {
  personEmail: string;
  roleName: string;
  isPrimary?: boolean;
  scope?: string;
  personName?: string;
}

export async function createPersonRoleAssignments(
  prisma: PrismaClient,
  assignments: readonly PersonRoleAssignmentData[] | PersonRoleAssignmentData[],
  personEmailMap: Map<string, string>,
  personNameMap?: Map<string, string>,
) {
  const uniqueRoles = Array.from(
    new Set(assignments.map((a) => a.roleName)),
  ).filter(Boolean);

  const roles = await prisma.role.findMany({
    where: { name: { in: uniqueRoles } },
  });
  const roleMap = new Map(roles.map((r) => [r.name, r.id]));

  for (const assignment of assignments) {
    const personId =
      personEmailMap.get(assignment.personEmail.toLowerCase()) ||
      (assignment.personName
        ? personNameMap?.get(assignment.personName.toLowerCase())
        : undefined);
    const roleId = roleMap.get(assignment.roleName);

    if (!personId || !roleId) {
      console.warn(
        `⚠️  Skipping role assignment for ${assignment.personEmail} -> ${assignment.roleName} (missing person or role)`,
      );
      continue;
    }

    // NOTE: personRoleAssignment table no longer exists
    // Role assignments are now managed via BetterAuth and PersonAuthenticationProvider
    // TODO: Implement role assignment seeding through appropriate authentication flow
  }
}

// ==============================================
// Exchange Rates Factory
// ==============================================

export interface ExchangeRateData {
  currency: string;
  rateToSAR: number;
  isActive?: boolean;
}

export async function createExchangeRates(
  prisma: PrismaClient,
  rates: readonly ExchangeRateData[] | ExchangeRateData[],
) {
  await prisma.exchangeRate.createMany({
    data: rates.map((r) => ({
      currency: r.currency,
      rateToSAR: r.rateToSAR,
      isActive: r.isActive ?? true,
    })),
    skipDuplicates: true,
  });
}
