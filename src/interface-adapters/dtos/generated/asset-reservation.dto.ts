import { z } from "zod";

// Asset Reservation DTOs
export const CreateReservationDTO = z
  .object({
    assetId: z.string().cuid2(),
    reservedForPersonId: z
      .union([z.string().cuid2(), z.literal(""), z.null(), z.undefined()])
      .optional()
      .transform((val) => (val === "" || val === null ? undefined : val)),
    reservedForOrgUnitId: z
      .union([z.string().cuid2(), z.literal(""), z.null(), z.undefined()])
      .optional()
      .transform((val) => (val === "" || val === null ? undefined : val)),
    // reservedById is NOT accepted from client - server resolves from session
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    purpose: z
      .string()
      .max(500, "Purpose must be 500 characters or less")
      .optional(),
    notes: z
      .string()
      .max(5000, "Notes must be 5000 characters or less")
      .optional(),
  })
  .refine(
    (data) => {
      // Exactly one of person or org unit must be specified (XOR)
      return (
        (data.reservedForPersonId && !data.reservedForOrgUnitId) ||
        (!data.reservedForPersonId && data.reservedForOrgUnitId)
      );
    },
    {
      message:
        "Please pick either “Reserved For (Person)” or “Reserved For (Org Unit)” — not both.",
      path: ["reservedForPersonId"],
    },
  )
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const UpdateReservationDTO = z.object({
  endDate: z.coerce.date().optional(), // Can only extend end date
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or less")
    .optional(),
});

export const ConfirmReservationDTO = z.object({
  reservationId: z.string().cuid2(),
  confirmedById: z.string().cuid2(),
});

export const CheckAvailabilityDTO = z.object({
  assetId: z.string().cuid2(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  excludeReservationId: z.string().cuid2().optional(),
});

export const ListAvailableAssetsDTO = z.object({
  assetIds: z.array(z.string().cuid2()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const AssetReservationDTO = z.object({
  id: z.string().cuid2(),
  assetId: z.string().cuid2(),
  reservedForPersonId: z.string().cuid2().nullable(),
  reservedForOrgUnitId: z.string().cuid2().nullable(),
  reservedById: z.string().cuid2(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  confirmationDate: z.date().nullable(),
  confirmedById: z.string().cuid2().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Display fields (enriched from relations)
  assetTag: z.string().optional(),
  personName: z.string().optional(),
  // Computed fields
  isExpired: z.boolean().optional(),
  daysRemaining: z.number().optional(),
  isReadyToStart: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
});

export type CreateReservationDTO = z.infer<typeof CreateReservationDTO>;
export type UpdateReservationDTO = z.infer<typeof UpdateReservationDTO>;
export type ConfirmReservationDTO = z.infer<typeof ConfirmReservationDTO>;
export type CheckAvailabilityDTO = z.infer<typeof CheckAvailabilityDTO>;
export type ListAvailableAssetsDTO = z.infer<typeof ListAvailableAssetsDTO>;
export type AssetReservationDTO = z.infer<typeof AssetReservationDTO>;
