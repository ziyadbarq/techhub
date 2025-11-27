import { z } from "zod";
import { ServiceRelationshipType } from "@/generated/prisma/enums";

const dateSchema = z.coerce.date().optional().nullable();

export const CreateServiceRelationshipSchema = z.object({
  fromServiceId: z.string().min(1, "From service is required"),
  toServiceId: z.string().min(1, "To service is required"),
  relationshipType: z.nativeEnum(ServiceRelationshipType),
  isCritical: z.boolean().optional().default(false),
  description: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  validFrom: dateSchema,
  validTo: dateSchema,
});

export const UpdateServiceRelationshipSchema = z.object({
  isCritical: z.boolean().optional(),
  description: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  validTo: dateSchema,
  isActive: z.boolean().optional(),
});

export type CreateServiceRelationshipDTO = z.infer<
  typeof CreateServiceRelationshipSchema
>;
export type UpdateServiceRelationshipDTO = z.infer<
  typeof UpdateServiceRelationshipSchema
>;

export interface ServiceRelationshipDTO {
  id: string;
  fromServiceId: string;
  toServiceId: string;
  relationshipType: ServiceRelationshipType;
  isCritical: boolean;
  description: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  fromServiceName?: string;
  toServiceName?: string;
}

export interface ImpactedServiceDTO {
  serviceId: string;
  serviceName: string;
  depth: number;
}
