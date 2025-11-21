import { z } from "zod";

// Asset Kit Checkout DTOs
export const CreateKitCheckoutDTO = z.object({
  kitId: z.string().uuid(),
  assignedToPersonId: z.string().uuid().optional(),
  assignedToOrgUnitId: z.string().uuid().optional(),
  checkoutDate: z.coerce.date(),
  expectedReturnDate: z.coerce.date(),
  purpose: z.string().optional(),
  assetIds: z.array(z.string().uuid()).min(1, "At least one asset is required"),
});

export const ReturnKitCheckoutDTO = z.object({
  checkoutId: z.string().uuid(),
  returnDate: z.coerce.date().optional(),
});

export const ReturnKitItemDTO = z.object({
  checkoutItemId: z.string().uuid(),
  conditionAtReturn: z.string().optional(),
});

export const MarkItemDamagedDTO = z.object({
  checkoutItemId: z.string().uuid(),
  conditionDescription: z.string().min(1, "Condition description is required"),
});

export const MarkItemLostDTO = z.object({
  checkoutItemId: z.string().uuid(),
  notes: z.string().optional(),
});

export const ExtendCheckoutDTO = z.object({
  checkoutId: z.string().uuid(),
  newExpectedReturnDate: z.coerce.date(),
});

export const AssetKitCheckoutDTO = z.object({
  id: z.string().uuid(),
  kitId: z.string().uuid(),
  assignedToPersonId: z.string().uuid().nullable(),
  assignedToOrgUnitId: z.string().uuid().nullable(),
  checkoutDate: z.date(),
  expectedReturnDate: z.date(),
  actualReturnDate: z.date().nullable(),
  purpose: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AssetKitCheckoutItemDTO = z.object({
  id: z.string().uuid(),
  checkoutId: z.string().uuid(),
  assetId: z.string().uuid(),
  checkoutDate: z.date(),
  returnDate: z.date().nullable(),
  conditionAtReturn: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateKitCheckoutDTO = z.infer<typeof CreateKitCheckoutDTO>;
export type ReturnKitCheckoutDTO = z.infer<typeof ReturnKitCheckoutDTO>;
export type ReturnKitItemDTO = z.infer<typeof ReturnKitItemDTO>;
export type MarkItemDamagedDTO = z.infer<typeof MarkItemDamagedDTO>;
export type MarkItemLostDTO = z.infer<typeof MarkItemLostDTO>;
export type ExtendCheckoutDTO = z.infer<typeof ExtendCheckoutDTO>;
export type AssetKitCheckoutDTO = z.infer<typeof AssetKitCheckoutDTO>;
export type AssetKitCheckoutItemDTO = z.infer<typeof AssetKitCheckoutItemDTO>;
