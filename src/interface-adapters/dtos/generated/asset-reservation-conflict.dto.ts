import { z } from "zod";

// Asset Reservation Conflict DTOs
export const ResolveConflictDTO = z.object({
  conflictId: z.string().uuid(),
  resolutionNote: z.string().min(1, "Resolution note is required"),
});

export const AssetReservationConflictDTO = z.object({
  id: z.string().uuid(),
  reservationId: z.string().uuid(),
  conflictingReservationId: z.string().uuid(),
  detectedAt: z.date(),
  resolvedAt: z.date().nullable(),
  resolutionNote: z.string().nullable(),
});

export type ResolveConflictDTO = z.infer<typeof ResolveConflictDTO>;
export type AssetReservationConflictDTO = z.infer<
  typeof AssetReservationConflictDTO
>;
