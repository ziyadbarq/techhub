import { z } from "zod";

// Disposal Approval DTOs
export const ApproveDisposalDTO = z.object({
  disposalId: z.string().uuid(),
  approverId: z.string().uuid(),
  comments: z.string().optional(),
});

export const RejectDisposalDTO = z.object({
  disposalId: z.string().uuid(),
  approverId: z.string().uuid(),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export const DisposalApprovalDTO = z.object({
  id: z.string().uuid(),
  disposalId: z.string().uuid(),
  approverId: z.string().uuid(),
  approvalLevel: z.number(),
  status: z.string(),
  reviewedAt: z.date().nullable(),
  comments: z.string().nullable(),
  createdAt: z.date(),
});

export type ApproveDisposalDTO = z.infer<typeof ApproveDisposalDTO>;
export type RejectDisposalDTO = z.infer<typeof RejectDisposalDTO>;
export type DisposalApprovalDTO = z.infer<typeof DisposalApprovalDTO>;
