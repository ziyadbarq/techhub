import { z } from "zod";

// Asset Kit Checkout DTOs
export const CreateKitCheckoutDTO = z.object({
  kitId: z.string().min(24).max(25),
  assigneeType: z.enum(["PERSON", "ORG_UNIT", "LOCATION"]),
  assigneeId: z.string().min(24).max(25),
  checkedOutById: z.string().min(24).max(25).optional(),
  expectedReturnDate: z.coerce.date().optional(),
  note: z.string().optional(),
  assetIds: z.array(z.string().min(24).max(25)).optional().default([]),
  kitItemIds: z.array(z.string().min(24).max(25)).optional().default([]),
});

export const ReturnKitCheckoutDTO = z.object({
  checkoutId: z.string().min(24).max(25),
  conditionAtReturn: z.string().optional(),
});

export const ReturnKitItemDTO = z.object({
  checkoutItemId: z.string().min(24).max(25),
  conditionAtReturn: z.string().optional(),
});

export const MarkItemDamagedDTO = z.object({
  checkoutItemId: z.string().min(24).max(25),
  conditionDescription: z.string().min(1, "Condition description is required"),
});

export const MarkItemLostDTO = z.object({
  checkoutItemId: z.string().min(24).max(25),
});

export const ExtendCheckoutDTO = z.object({
  checkoutId: z.string().min(24).max(25),
  newExpectedReturnDate: z.coerce.date(),
});

export const AssetKitCheckoutDTO = z.object({
  id: z.string().min(24).max(25),
  assetKitId: z.string().min(24).max(25),
  assigneeType: z.enum(["PERSON", "ORG_UNIT", "LOCATION"]),
  assigneeId: z.string().min(24).max(25),
  checkoutDate: z.date(),
  expectedReturnDate: z.date().nullable(),
  actualReturnDate: z.date().nullable(),
  status: z.string(),
  checkedOutById: z.string().min(24).max(25),
  note: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Display fields (enriched from relations)
  kitName: z.string().optional(),
  personName: z.string().optional(),
});

export const AssetKitCheckoutItemDTO = z.object({
  id: z.string().min(24).max(25),
  kitCheckoutId: z.string().min(24).max(25),
  assetId: z.string().min(24).max(25),
  kitItemId: z.string().min(24).max(25),
  checkoutDate: z.date(),
  returnDate: z.date().nullable(),
  status: z.string(),
  conditionAtCheckout: z.string().nullable(),
  conditionAtReturn: z.string().nullable(),
  note: z.string().nullable(),
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
