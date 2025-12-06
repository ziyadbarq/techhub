import { z } from "zod";

// Asset Reservation Conflict DTOs
export const ResolveConflictDTO = z.object({
  conflictId: z.string().min(24).max(25),
  resolutionNote: z.string().min(1, "Resolution note is required"),
});

export const AssetReservationConflictDTO = z.object({
  id: z.string().min(24).max(25),
  reservationId: z.string().min(24).max(25),
  conflictingReservationId: z.string().min(24).max(25),
  detectedAt: z.date(),
  resolvedAt: z.date().nullable(),
  resolutionNote: z.string().nullable(),
});

export type ResolveConflictDTO = z.infer<typeof ResolveConflictDTO>;
export type AssetReservationConflictDTO = z.infer<
  typeof AssetReservationConflictDTO
>;
