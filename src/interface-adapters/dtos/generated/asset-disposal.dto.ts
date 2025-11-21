import { z } from "zod";

// Asset Disposal DTOs
export const CreateAssetDisposalDTO = z.object({
  assetId: z.string().uuid(),
  disposalType: z.enum([
    "SELL",
    "DONATE",
    "RECYCLE",
    "DESTROY",
    "RETURN_TO_VENDOR",
    "OTHER",
  ]),
  disposalMethod: z.string().min(1, "Disposal method is required"),
  reason: z.string().min(1, "Reason is required"),
  estimatedValue: z.number().nonnegative().optional(),
  approverIds: z
    .array(z.string().uuid())
    .min(1, "At least one approver is required"),
  notes: z.string().optional(),
});

export const UpdateAssetDisposalDTO = z.object({
  disposalType: z
    .enum(["SELL", "DONATE", "RECYCLE", "DESTROY", "RETURN_TO_VENDOR", "OTHER"])
    .optional(),
  disposalMethod: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  estimatedValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const StartDisposalDTO = z.object({
  disposalId: z.string().uuid(),
});

export const CompleteSanitizationDTO = z.object({
  disposalId: z.string().uuid(),
  checkedItems: z.array(z.string()),
  performedById: z.string().uuid(),
});

export const CompleteDisposalDTO = z.object({
  disposalId: z.string().uuid(),
  disposalDate: z.coerce.date(),
  actualProceeds: z.number().nonnegative().optional(),
});

export const GenerateCertificateDTO = z.object({
  disposalId: z.string().uuid(),
});

export const CancelDisposalDTO = z.object({
  disposalId: z.string().uuid(),
  cancellationReason: z.string().min(1, "Cancellation reason is required"),
});

export const AssetDisposalDTO = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  disposalType: z.string(),
  disposalMethod: z.string(),
  reason: z.string(),
  status: z.string(),
  requestedDate: z.date(),
  approvalDate: z.date().nullable(),
  startDate: z.date().nullable(),
  completionDate: z.date().nullable(),
  estimatedValue: z.number().nullable(),
  actualProceeds: z.number().nullable(),
  certificateNumber: z.string().nullable(),
  certificateGeneratedAt: z.date().nullable(),
  sanitizationChecklist: z
    .object({
      items: z.array(z.string()),
      completedAt: z.date().nullable(),
      performedById: z.string().nullable(),
    })
    .nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateAssetDisposalDTO = z.infer<typeof CreateAssetDisposalDTO>;
export type UpdateAssetDisposalDTO = z.infer<typeof UpdateAssetDisposalDTO>;
export type StartDisposalDTO = z.infer<typeof StartDisposalDTO>;
export type CompleteSanitizationDTO = z.infer<typeof CompleteSanitizationDTO>;
export type CompleteDisposalDTO = z.infer<typeof CompleteDisposalDTO>;
export type GenerateCertificateDTO = z.infer<typeof GenerateCertificateDTO>;
export type CancelDisposalDTO = z.infer<typeof CancelDisposalDTO>;
export type AssetDisposalDTO = z.infer<typeof AssetDisposalDTO>;
