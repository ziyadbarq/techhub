/**
 * Foundation Layer Seed Factories
 *
 * Helper factories to reduce duplication in foundation layer seeding
 * Applies DRY principle and batch operations for better performance
 */

import type { PrismaClient } from "@/generated/prisma";
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
 * Create multiple lifecycle states in batch
 * Reduces duplication and improves performance
 */
export async function createLifecycleStates(
  prisma: PrismaClient,
  lifecycleModelId: string,
  states: LifecycleStateData[],
) {
  const createPromises = states.map((state) =>
    prisma.lifecycleState.create({
      data: {
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
    }),
  );

  return Promise.all(createPromises);
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
 * Create multiple lifecycle transitions in batch
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
 * Create vendors from config data
 */
export async function createVendors(
  prisma: PrismaClient,
  vendors: readonly VendorData[] | VendorData[],
) {
  const vendorMap = new Map<string, string>();

  for (const v of vendors) {
    const created = await prisma.vendor.create({
      data: {
        name: v.name,
        code: v.code,
        vendorType: v.type,
        description: v.description,
        website: v.website,
        email: v.email,
        phone: v.phone,
        isActive: true,
      },
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
 * Create locations from config data
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
}

/**
 * Create organization units (handles parent relationships)
 */
export async function createOrganizationUnits(
  prisma: PrismaClient,
  orgUnits: readonly OrgUnitData[] | OrgUnitData[],
) {
  const createdUnits = new Map<string, { id: string; level: number }>(); // code -> metadata

  // First, create top-level units (no parent)
  const topLevel = orgUnits.filter((ou) => !ou.parentCode);
  for (const unit of topLevel) {
    const created = await prisma.organizationUnit.create({
      data: {
        name: unit.name,
        code: unit.code,
        description: unit.description ?? null,
        level: 1,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    createdUnits.set(unit.code, { id: created.id, level: 1 });
  }

  // Then, create child units
  const children = orgUnits.filter((ou) => ou.parentCode);
  for (const unit of children) {
    const parent = createdUnits.get(unit.parentCode!);
    if (!parent) {
      console.warn(
        `⚠️  Parent unit not found for ${unit.code}: ${unit.parentCode}`,
      );
      continue;
    }

    const created = await prisma.organizationUnit.create({
      data: {
        name: unit.name,
        code: unit.code,
        description: unit.description ?? null,
        parent: { connect: { id: parent.id } },
        level: parent.level + 1,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    createdUnits.set(unit.code, { id: created.id, level: parent.level + 1 });
  }

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
 * Create persons (with org unit mapping)
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
    if (usedEmails.has(email)) {
      const [local, domain] = email.split("@");
      let counter = 2;
      while (usedEmails.has(`${local}${counter}@${domain}`)) {
        counter += 1;
      }
      email = `${local}${counter}@${domain}`;
    }
    usedEmails.add(email);

    const created = await prisma.person.create({
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        email,
        title: person.title ?? null,
        orgUnit: orgUnitId ? { connect: { id: orgUnitId } } : undefined,
        primaryRole: { connect: { id: defaultRole.id } },
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
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
 * Create field definitions in batch
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

    await prisma.personRoleAssignment.create({
      data: {
        person: { connect: { id: personId } },
        role: { connect: { id: roleId } },
        isPrimary: assignment.isPrimary ?? false,
        scope: assignment.scope ?? null,
        isActive: true,
      },
    });
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
