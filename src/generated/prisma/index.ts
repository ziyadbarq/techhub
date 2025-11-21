/**
 * Prisma Generated Types - Barrel Export
 *
 * This file re-exports all generated Prisma types for easier imports
 */

// Export client, Prisma namespace, and $Enums
export { PrismaClient, Prisma, $Enums } from "./client";

// Export all model types
export type {
  User,
  Account,
  Session,
  Verification,
  Role,
  Permission,
  RolePermission,
  UserRole,
  AuditLog,
  OrganizationUnit,
  Person,
  PersonRoleAssignment,
  Location,
  Vendor,
  VendorContact,
  LifecycleModel,
  LifecycleState,
  LifecycleTransition,
  FieldDefinition,
  CIClass,
  CIClassField,
  ConfigurationItem,
  RelationshipType,
  RelationshipTypeScope,
  CIRelationship,
  AssetCategory,
  AssetCategoryField,
  AssetModel,
  StockLocation,
  StockMovement,
  Asset,
  AssetAssignment,
  ContractType,
  Contract,
  ContractLinkedObject,
  LicenseProduct,
  LicenseProductField,
  LicenseEntitlement,
  LicenseAllocation,
  DataDomain,
  DataOwnership,
  VerificationCampaign,
  VerificationItem,
  AuditLogEntry,
  AttachmentType,
  Attachment,
  Task,
  PromptBlock,
  PromptComposition,
  PromptCompositionBlock,
} from "./client";

// Re-export all enums
export * from "./enums";
