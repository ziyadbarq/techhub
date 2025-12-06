import { z } from "zod";
import { currencyField, currencyCode } from "../validation-helpers";

// Asset Disposal DTOs
export const CreateAssetDisposalDTO = z.object({
  assetId: z.string().min(24).max(25),
  disposalType: z.enum([
    "DONATION",
    "SALE",
    "RECYCLING",
    "DESTRUCTION",
    "OTHER",
  ]),
  reason: z.string().optional(),
  estimatedValue: currencyField("Estimated value"),
  currency: currencyCode,
  disposalVendorId: z.string().min(24).max(25).optional(),
  recipientInfo: z.string().optional(),
  note: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  approverIds: z
    .array(z.string().min(24).max(25))
    .min(1, "At least one approver is required"),
});

export const UpdateAssetDisposalDTO = z.object({
  disposalType: z
    .enum(["DONATION", "SALE", "RECYCLING", "DESTRUCTION", "OTHER"])
    .optional(),
  reason: z.string().optional(),
  estimatedValue: currencyField("Estimated value"),
  currency: currencyCode,
  disposalVendorId: z.string().min(24).max(25).optional(),
  recipientInfo: z.string().optional(),
  note: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const StartDisposalDTO = z.object({
  disposalId: z.string().min(24).max(25),
});

export const CompleteSanitizationDTO = z.object({
  disposalId: z.string().min(24).max(25),
  checkedItems: z.array(z.string()),
  performedById: z.string().min(24).max(25),
});

export const CompleteDisposalDTO = z.object({
  disposalId: z.string().min(24).max(25),
  disposalDate: z.coerce.date(),
  actualProceeds: currencyField("Actual proceeds"),
});

export const GenerateCertificateDTO = z.object({
  disposalId: z.string().min(24).max(25),
});

export const CancelDisposalDTO = z.object({
  disposalId: z.string().min(24).max(25),
  cancellationReason: z.string().min(1, "Cancellation reason is required"),
});

export const AssetDisposalDTO = z.object({
  id: z.string().min(24).max(25),
  assetId: z.string().min(24).max(25),
  disposalType: z.string(),
  reason: z.string().nullable(),
  initiatedById: z.string(),
  approvedById: z.string().nullable(),
  approvedAt: z.date().nullable(),
  status: z.string(),
  estimatedValue: z.number().nullable(),
  actualProceeds: z.number().nullable(),
  currency: z.string().nullable(),
  sanitizationChecklist: z.record(z.string(), z.unknown()).nullable(),
  disposalDate: z.date().nullable(),
  certificateNumber: z.string().nullable(),
  certificateIssuedAt: z.date().nullable(),
  disposalVendorId: z.string().nullable(),
  recipientInfo: z.string().nullable(),
  note: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Display fields (enriched from relations)
  assetTag: z.string().optional(),
});

export type CreateAssetDisposalDTO = z.infer<typeof CreateAssetDisposalDTO>;
export type UpdateAssetDisposalDTO = z.infer<typeof UpdateAssetDisposalDTO>;
export type StartDisposalDTO = z.infer<typeof StartDisposalDTO>;
export type CompleteSanitizationDTO = z.infer<typeof CompleteSanitizationDTO>;
export type CompleteDisposalDTO = z.infer<typeof CompleteDisposalDTO>;
export type GenerateCertificateDTO = z.infer<typeof GenerateCertificateDTO>;
export type CancelDisposalDTO = z.infer<typeof CancelDisposalDTO>;
export type AssetDisposalDTO = z.infer<typeof AssetDisposalDTO>;
