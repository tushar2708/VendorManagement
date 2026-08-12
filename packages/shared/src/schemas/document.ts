import { z } from "zod";
import { documentStatusSchema } from "./enums.js";

export const uploadDocumentSchema = z.object({
  checklistItemKey: z.string().min(1),
  fileBlobId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentResponseSchema = z.object({
  id: z.string(),
  checklistItemKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  fileBlobId: z.string(),
  status: documentStatusSchema,
  rejectionReason: z.string().nullable(),
  uploadedAt: z.string(),
  linkId: z.string(),
});
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
