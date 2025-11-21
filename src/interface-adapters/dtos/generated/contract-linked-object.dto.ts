/**
 * ContractLinkedObject DTOs
 */

import { z } from "zod";
import { TargetObjectType } from "@/core/domain/entities/contract-linked-object.entity";

// Create ContractLinkedObject DTO
export const CreateContractLinkedObjectSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
  targetType: z.nativeEnum(TargetObjectType),
  targetId: z.string().uuid("Invalid target ID"),
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Update ContractLinkedObject DTO
export const UpdateContractLinkedObjectSchema = z.object({
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Type exports
export type CreateContractLinkedObjectDTO = z.infer<
  typeof CreateContractLinkedObjectSchema
>;
export type UpdateContractLinkedObjectDTO = z.infer<
  typeof UpdateContractLinkedObjectSchema
>;
