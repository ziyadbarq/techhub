import { z } from "zod";

// Asset Reservation DTOs
export const CreateReservationDTO = z.object({
  assetId: z.string().uuid(),
  reservedByPersonId: z.string().uuid().optional(),
  reservedByOrgUnitId: z.string().uuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateReservationDTO = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const ConfirmReservationDTO = z.object({
  reservationId: z.string().uuid(),
  confirmedById: z.string().uuid(),
});

export const CheckAvailabilityDTO = z.object({
  assetId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  excludeReservationId: z.string().uuid().optional(),
});

export const ListAvailableAssetsDTO = z.object({
  assetIds: z.array(z.string().uuid()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const AssetReservationDTO = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  reservedByPersonId: z.string().uuid().nullable(),
  reservedByOrgUnitId: z.string().uuid().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  confirmationDate: z.date().nullable(),
  confirmedById: z.string().uuid().nullable(),
  actualStartDate: z.date().nullable(),
  actualEndDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Display fields (enriched from relations)
  assetTag: z.string().optional(),
  personName: z.string().optional(),
});

export type CreateReservationDTO = z.infer<typeof CreateReservationDTO>;
export type UpdateReservationDTO = z.infer<typeof UpdateReservationDTO>;
export type ConfirmReservationDTO = z.infer<typeof ConfirmReservationDTO>;
export type CheckAvailabilityDTO = z.infer<typeof CheckAvailabilityDTO>;
export type ListAvailableAssetsDTO = z.infer<typeof ListAvailableAssetsDTO>;
export type AssetReservationDTO = z.infer<typeof AssetReservationDTO>;
