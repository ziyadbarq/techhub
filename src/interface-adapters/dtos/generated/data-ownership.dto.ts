/**
 * DataOwnership DTOs
 */

import { z } from "zod";

// Create DataOwnership DTO
export const CreateDataOwnershipSchema = z
  .object({
    dataDomainId: z.string().min(24).max(25),
    ciClassId: z.string().min(24).max(25).optional().nullable(),
    assetCategoryId: z.string().min(24).max(25).optional().nullable(),
    ownerPersonId: z.string().min(24).max(25).optional().nullable(),
    ownerOrgUnitId: z.string().min(24).max(25).optional().nullable(),
    note: z
      .string()
      .trim()
      .max(2000, "Note must not exceed 2000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Must have exactly one target type
      const hasCIClass =
        data.ciClassId !== null && data.ciClassId !== undefined;
      const hasAssetCategory =
        data.assetCategoryId !== null && data.assetCategoryId !== undefined;
      return (
        (hasCIClass && !hasAssetCategory) || (!hasCIClass && hasAssetCategory)
      );
    },
    {
      message:
        "Data ownership must be assigned to either a CI class or an asset category (not both, not neither)",
    },
  )
  .refine(
    (data) => {
      // Can have at most one owner type (owner is optional)
      const hasPersonOwner =
        data.ownerPersonId !== null && data.ownerPersonId !== undefined;
      const hasOrgUnitOwner =
        data.ownerOrgUnitId !== null && data.ownerOrgUnitId !== undefined;
      return !(hasPersonOwner && hasOrgUnitOwner);
    },
    {
      message:
        "Data ownership cannot be assigned to both a person and an organization unit",
    },
  );

// Update DataOwnership DTO
export const UpdateDataOwnershipSchema = z
  .object({
    dataDomainId: z.string().min(24).max(25).optional(),
    ciClassId: z.string().min(24).max(25).optional().nullable(),
    assetCategoryId: z.string().min(24).max(25).optional().nullable(),
    ownerPersonId: z.string().min(24).max(25).optional().nullable(),
    ownerOrgUnitId: z.string().min(24).max(25).optional().nullable(),
    note: z
      .string()
      .trim()
      .max(2000, "Note must not exceed 2000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If updating target, must have exactly one target type
      const hasCIClass =
        data.ciClassId !== null && data.ciClassId !== undefined;
      const hasAssetCategory =
        data.assetCategoryId !== null && data.assetCategoryId !== undefined;

      // If neither is provided, it's fine (not updating target)
      if (!hasCIClass && !hasAssetCategory) return true;

      // If one is provided, the other must not be
      return (
        (hasCIClass && !hasAssetCategory) || (!hasCIClass && hasAssetCategory)
      );
    },
    {
      message:
        "Data ownership cannot be assigned to both a CI class and an asset category",
    },
  )
  .refine(
    (data) => {
      // If updating owner, can have at most one owner type
      const hasPersonOwner =
        data.ownerPersonId !== null && data.ownerPersonId !== undefined;
      const hasOrgUnitOwner =
        data.ownerOrgUnitId !== null && data.ownerOrgUnitId !== undefined;
      return !(hasPersonOwner && hasOrgUnitOwner);
    },
    {
      message:
        "Data ownership cannot be assigned to both a person and an organization unit",
    },
  );

// Type exports
export type CreateDataOwnershipDTO = z.infer<typeof CreateDataOwnershipSchema>;
export type UpdateDataOwnershipDTO = z.infer<typeof UpdateDataOwnershipSchema>;
