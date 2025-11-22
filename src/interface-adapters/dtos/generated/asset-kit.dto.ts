import { z } from "zod";

// Asset Kit DTOs
export const CreateAssetKitDTO = z.object({
  name: z.string().min(1, "Kit name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  kitType: z.enum(
    ["NEW_HIRE", "CONTRACTOR", "EXECUTIVE", "PROJECT", "TEMPORARY", "OTHER"],
    {
      message:
        "Kit type must be NEW_HIRE, CONTRACTOR, EXECUTIVE, PROJECT, TEMPORARY, or OTHER",
    },
  ),
  isActive: z.boolean().optional().default(true),
});

export const UpdateAssetKitDTO = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  kitType: z
    .enum([
      "NEW_HIRE",
      "CONTRACTOR",
      "EXECUTIVE",
      "PROJECT",
      "TEMPORARY",
      "OTHER",
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

export const AddKitItemDTO = z.object({
  kitId: z.string().uuid(),
  assetCategoryId: z.string().uuid(),
  assetModelId: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive("Quantity must be positive"),
  isRequired: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export const UpdateKitItemDTO = z.object({
  assetCategoryId: z.string().uuid().optional().nullable(),
  assetModelId: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
  notes: z.string().optional(),
});

export const AssetKitDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  kitType: z.enum([
    "NEW_HIRE",
    "CONTRACTOR",
    "EXECUTIVE",
    "PROJECT",
    "TEMPORARY",
    "OTHER",
  ]),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AssetKitItemDTO = z.object({
  id: z.string().uuid(),
  kitId: z.string().uuid(),
  assetCategoryId: z.string().uuid().nullable(),
  assetModelId: z.string().uuid().nullable(),
  quantity: z.number(),
  isRequired: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateAssetKitDTO = z.infer<typeof CreateAssetKitDTO>;
export type UpdateAssetKitDTO = z.infer<typeof UpdateAssetKitDTO>;
export type AddKitItemDTO = z.infer<typeof AddKitItemDTO>;
export type UpdateKitItemDTO = z.infer<typeof UpdateKitItemDTO>;
export type AssetKitDTO = z.infer<typeof AssetKitDTO>;
export type AssetKitItemDTO = z.infer<typeof AssetKitItemDTO>;
