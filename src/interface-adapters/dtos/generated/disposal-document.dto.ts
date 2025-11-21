import { z } from "zod";

// Disposal Document DTOs
export const UploadDisposalDocumentDTO = z.object({
  disposalId: z.string().uuid(),
  documentType: z.enum(["APPROVAL", "CERTIFICATE", "RECEIPT", "OTHER"]),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileSize: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  uploadedById: z.string().uuid(),
});

export const DisposalDocumentDTO = z.object({
  id: z.string().uuid(),
  disposalId: z.string().uuid(),
  documentType: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadedById: z.string().uuid(),
  uploadedAt: z.date(),
});

export type UploadDisposalDocumentDTO = z.infer<
  typeof UploadDisposalDocumentDTO
>;
export type DisposalDocumentDTO = z.infer<typeof DisposalDocumentDTO>;
