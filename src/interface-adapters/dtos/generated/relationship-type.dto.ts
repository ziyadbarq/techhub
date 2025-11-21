import { z } from "zod";

export const CreateRelationshipTypeSchema = z.object({
  name: z.string().min(2).max(100),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i),
  description: z.string().max(500).optional().nullable(),
  direction: z
    .enum(["UNIDIRECTIONAL", "BIDIRECTIONAL"])
    .default("UNIDIRECTIONAL"),
  isImpacting: z.boolean().default(false),
});

export const UpdateRelationshipTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  direction: z.enum(["UNIDIRECTIONAL", "BIDIRECTIONAL"]).optional(),
  isImpacting: z.boolean().optional(),
});

export type CreateRelationshipTypeDTO = z.infer<
  typeof CreateRelationshipTypeSchema
>;
export type UpdateRelationshipTypeDTO = z.infer<
  typeof UpdateRelationshipTypeSchema
>;

export interface RelationshipTypeDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  direction: "UNIDIRECTIONAL" | "BIDIRECTIONAL";
  isImpacting: boolean;
  createdAt: string;
  updatedAt: string;
}
