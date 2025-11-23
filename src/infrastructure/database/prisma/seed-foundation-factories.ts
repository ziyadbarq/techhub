/**
 * Foundation Layer Seed Factories
 *
 * Helper factories to reduce duplication in foundation layer seeding
 * Applies DRY principle and batch operations for better performance
 */

import type { PrismaClient } from "@/generated/prisma";

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
  isAutomatic?: boolean;
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
      isAutomatic: t.isAutomatic ?? false,
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
  return prisma.vendor.createMany({
    data: vendors.map((v) => ({
      name: v.name,
      code: v.code,
      type: v.type,
      description: v.description,
      website: v.website,
      email: v.email,
      phone: v.phone,
      isActive: true,
    })),
  });
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
  locationType?: "OFFICE" | "DATA_CENTER" | "WAREHOUSE" | "REMOTE" | "OTHER";
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
      locationType: l.locationType ?? "OFFICE",
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
  const createdUnits = new Map<string, string>(); // code -> id

  // First, create top-level units (no parent)
  const topLevel = orgUnits.filter((ou) => !ou.parentCode);
  for (const unit of topLevel) {
    const created = await prisma.organizationUnit.create({
      data: {
        name: unit.name,
        code: unit.code,
        description: unit.description ?? null,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    createdUnits.set(unit.code, created.id);
  }

  // Then, create child units
  const children = orgUnits.filter((ou) => ou.parentCode);
  for (const unit of children) {
    const parentId = createdUnits.get(unit.parentCode!);
    if (!parentId) {
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
        parent: { connect: { id: parentId } },
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    createdUnits.set(unit.code, created.id);
  }

  return createdUnits;
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
  const createdPersons = [];

  for (const person of persons) {
    const orgUnitId = person.orgUnitCode
      ? orgUnitMap.get(person.orgUnitCode)
      : undefined;

    const created = await prisma.person.create({
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        title: person.title ?? null,
        organizationUnit: orgUnitId
          ? { connect: { id: orgUnitId } }
          : undefined,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    createdPersons.push(created);
  }

  return createdPersons;
}

// ==============================================
// Field Definition Factory
// ==============================================

export interface FieldDefinitionData {
  name: string;
  code: string;
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "DATE" | "JSON";
  description: string;
  isRequired?: boolean;
  isList?: boolean;
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
  return prisma.fieldDefinition.createMany({
    data: fields.map((f) => ({
      name: f.name,
      code: f.code,
      dataType: f.dataType,
      description: f.description,
      isRequired: f.isRequired ?? false,
      isList: f.isList ?? false,
      defaultValue: f.defaultValue ?? null,
      validationRules: f.validationRules ?? null,
      isSystem: false,
      isActive: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
  });
}
