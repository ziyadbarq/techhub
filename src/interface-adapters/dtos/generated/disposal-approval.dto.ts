import { z } from "zod";

// Disposal Approval DTOs
export const ApproveDisposalDTO = z.object({
  disposalId: z.string().min(24).max(25),
  approverId: z.string().min(24).max(25),
  comments: z.string().optional(),
});

export const RejectDisposalDTO = z.object({
  disposalId: z.string().min(24).max(25),
  approverId: z.string().min(24).max(25),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export const DisposalApprovalDTO = z.object({
  id: z.string().min(24).max(25),
  disposalId: z.string().min(24).max(25),
  approverId: z.string().min(24).max(25),
  approvalLevel: z.number(),
  status: z.string(),
  reviewedAt: z.date().nullable(),
  comments: z.string().nullable(),
  createdAt: z.date(),
});

export type ApproveDisposalDTO = z.infer<typeof ApproveDisposalDTO>;
export type RejectDisposalDTO = z.infer<typeof RejectDisposalDTO>;
export type DisposalApprovalDTO = z.infer<typeof DisposalApprovalDTO>;
