/**
 * Foundation Layer Enums
 * Core value objects for CMDB/ITAM system
 */

/**
 * Environment types for CIs and infrastructure
 */
export enum EnvironmentEnum {
  PROD = "PROD",
  UAT = "UAT",
  DEV = "DEV",
  DR = "DR",
  TEST = "TEST",
  OTHER = "OTHER",
}

/**
 * Criticality levels for CIs and assets
 */
export enum CriticalityEnum {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Asset assignment target types (polymorphic)
 */
export enum AssigneeTypeEnum {
  PERSON = "PERSON",
  ORG_UNIT = "ORG_UNIT",
  LOCATION = "LOCATION",
  CI = "CI",
}

/**
 * License allocation target types (polymorphic)
 */
export enum AllocationTargetTypeEnum {
  PERSON = "PERSON",
  CI = "CI",
  ASSET = "ASSET",
}

/**
 * Target object types for contracts and governance (polymorphic)
 */
export enum TargetObjectTypeEnum {
  CI = "CI",
  ASSET = "ASSET",
  LICENSE_ENTITLEMENT = "LICENSE_ENTITLEMENT",
  CONTRACT = "CONTRACT",
}

/**
 * Stock movement types for inventory tracking
 */
export enum StockMovementTypeEnum {
  IN = "IN", // Receiving stock
  OUT = "OUT", // Issuing stock
  TRANSFER = "TRANSFER", // Moving between locations
  ADJUSTMENT = "ADJUSTMENT", // Inventory correction
}

/**
 * Field data types for dynamic attributes
 */
export enum FieldDataTypeEnum {
  STRING = "STRING",
  TEXT = "TEXT",
  INTEGER = "INTEGER",
  DECIMAL = "DECIMAL",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  DATETIME = "DATETIME",
  ENUM = "ENUM",
  JSON = "JSON",
  CI_REFERENCE = "CI_REFERENCE",
  PERSON_REFERENCE = "PERSON_REFERENCE",
  ORG_UNIT_REFERENCE = "ORG_UNIT_REFERENCE",
  LOCATION_REFERENCE = "LOCATION_REFERENCE",
  // New data types (Phase 3)
  URL = "URL",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  MULTI_SELECT_ENUM = "MULTI_SELECT_ENUM",
  CURRENCY = "CURRENCY",
  ATTACHMENT_REFERENCE = "ATTACHMENT_REFERENCE",
}

/**
 * Relationship direction for CI topology
 */
export enum RelationshipDirectionEnum {
  UNIDIRECTIONAL = "UNIDIRECTIONAL",
  BIDIRECTIONAL = "BIDIRECTIONAL",
}

/**
 * Verification campaign status
 */
export enum VerificationStatusEnum {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  VERIFIED = "VERIFIED",
  EXCEPTION = "EXCEPTION",
}

/**
 * Organization unit types
 */
export enum OrganizationUnitType {
  COMPANY = "COMPANY",
  BUSINESS_UNIT = "BUSINESS_UNIT",
  DEPARTMENT = "DEPARTMENT",
  TEAM = "TEAM",
  DIVISION = "DIVISION",
  OTHER = "OTHER",
}

/**
 * Org unit type that may legally own an asset. An asset belongs to a company
 * (Barq, Aoun, ...), never to a department or team within one.
 */
export const OWNING_COMPANY_UNIT_TYPE = OrganizationUnitType.COMPANY;

/**
 * Vendor types
 */
export enum VendorType {
  MANUFACTURER = "MANUFACTURER",
  RESELLER = "RESELLER",
  SERVICE_PROVIDER = "SERVICE_PROVIDER",
  CONSULTANT = "CONSULTANT",
  CONTRACTOR = "CONTRACTOR",
  OTHER = "OTHER",
}

/**
 * Location types
 */
export enum LocationType {
  COUNTRY = "COUNTRY",
  CITY = "CITY",
  CAMPUS = "CAMPUS",
  BUILDING = "BUILDING",
  FLOOR = "FLOOR",
  ROOM = "ROOM",
  RACK = "RACK",
  DATA_CENTER = "DATA_CENTER",
  CLOUD_REGION = "CLOUD_REGION",
  PHYSICAL = "PHYSICAL",
  LOGICAL = "LOGICAL",
  ZONE = "ZONE",
  AREA = "AREA",
}

/**
 * Lifecycle state types
 */
export enum StateType {
  INITIAL = "INITIAL",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  TERMINAL = "TERMINAL",
  TRANSITION = "TRANSITION",
}

/**
 * Helper functions for enum validation and conversion
 */

export const isValidEnvironment = (value: string): value is EnvironmentEnum => {
  return Object.values(EnvironmentEnum).includes(value as EnvironmentEnum);
};

export const isValidCriticality = (value: string): value is CriticalityEnum => {
  return Object.values(CriticalityEnum).includes(value as CriticalityEnum);
};

export const isValidAssigneeType = (
  value: string,
): value is AssigneeTypeEnum => {
  return Object.values(AssigneeTypeEnum).includes(value as AssigneeTypeEnum);
};

export const isValidAllocationTargetType = (
  value: string,
): value is AllocationTargetTypeEnum => {
  return Object.values(AllocationTargetTypeEnum).includes(
    value as AllocationTargetTypeEnum,
  );
};

export const isValidTargetObjectType = (
  value: string,
): value is TargetObjectTypeEnum => {
  return Object.values(TargetObjectTypeEnum).includes(
    value as TargetObjectTypeEnum,
  );
};

export const isValidStockMovementType = (
  value: string,
): value is StockMovementTypeEnum => {
  return Object.values(StockMovementTypeEnum).includes(
    value as StockMovementTypeEnum,
  );
};

export const isValidFieldDataType = (
  value: string,
): value is FieldDataTypeEnum => {
  return Object.values(FieldDataTypeEnum).includes(value as FieldDataTypeEnum);
};

export const isValidRelationshipDirection = (
  value: string,
): value is RelationshipDirectionEnum => {
  return Object.values(RelationshipDirectionEnum).includes(
    value as RelationshipDirectionEnum,
  );
};

export const isValidVerificationStatus = (
  value: string,
): value is VerificationStatusEnum => {
  return Object.values(VerificationStatusEnum).includes(
    value as VerificationStatusEnum,
  );
};

export const isValidOrganizationUnitType = (
  value: string,
): value is OrganizationUnitType => {
  return Object.values(OrganizationUnitType).includes(
    value as OrganizationUnitType,
  );
};

export const isValidVendorType = (value: string): value is VendorType => {
  return Object.values(VendorType).includes(value as VendorType);
};

export const isValidLocationType = (value: string): value is LocationType => {
  return Object.values(LocationType).includes(value as LocationType);
};

export const isValidStateType = (value: string): value is StateType => {
  return Object.values(StateType).includes(value as StateType);
};
