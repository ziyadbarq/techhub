/**
 * LicenseAllocation DTOs
 */

import { z } from "zod";
import { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";

// Create Schema
export const CreateLicenseAllocationSchema = z.object({
  licenseEntitlementId: z.string().min(24).max(25),
  targetType: z.nativeEnum(AllocationTargetType),
  targetId: z.string().min(24).max(25),
  allocatedQuantity: z
    .number()
    .int("Allocated quantity must be an integer")
    .positive("Allocated quantity must be greater than 0"),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type CreateLicenseAllocationDTO = z.infer<
  typeof CreateLicenseAllocationSchema
>;

// Update Schema
export const UpdateLicenseAllocationSchema = z.object({
  id: z.string().min(24).max(25),
  allocatedQuantity: z
    .number()
    .int("Allocated quantity must be an integer")
    .positive("Allocated quantity must be greater than 0")
    .optional(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type UpdateLicenseAllocationDTO = z.infer<
  typeof UpdateLicenseAllocationSchema
>;

// Deallocate Schema
export const DeallocateLicenseAllocationSchema = z.object({
  id: z.string().min(24).max(25),
  deallocatedAt: z.coerce
    .date({ message: "Invalid deallocation date" })
    .optional(),
});

export type DeallocateLicenseAllocationDTO = z.infer<
  typeof DeallocateLicenseAllocationSchema
>;

// Response DTO
export interface LicenseAllocationDTO {
  id: string;
  licenseEntitlementId: string;
  targetType: AllocationTargetType;
  targetId: string;
  allocatedQuantity: number;
  allocatedAt: Date;
  deallocatedAt: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}
