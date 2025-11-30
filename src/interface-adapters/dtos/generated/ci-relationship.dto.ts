import { z } from "zod";

const dateSchema = z.coerce.date().optional().nullable();

export const CreateCIRelationshipSchema = z.object({
  fromCiId: z.string().min(1, "From CI is required"),
  toCiId: z.string().min(1, "To CI is required"),
  relationshipTypeId: z.string().min(1, "Relationship type is required"),
  validFrom: dateSchema,
  validTo: dateSchema,
  note: z.string().max(1000).optional().nullable(),
});

export const UpdateCIRelationshipSchema = z.object({
  validTo: dateSchema,
  note: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateCIRelationshipDTO = z.infer<
  typeof CreateCIRelationshipSchema
>;
export type UpdateCIRelationshipDTO = z.infer<
  typeof UpdateCIRelationshipSchema
>;

export interface CIRelationshipDTO {
  id: string;
  fromCiId: string;
  toCiId: string;
  relationshipTypeId: string;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  fromCiName?: string;
  toCiName?: string;
  relationshipTypeName?: string;
  relationshipTypeCode?: string;
}
