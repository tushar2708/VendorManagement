import { z } from "zod";
import { documentCategorySchema, documentStatusSchema } from "./enums.js";

export const uploadDocumentSchema = z.object({
  name: z.string().min(1),
  category: documentCategorySchema,
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(1_048_576),
  data: z.string().min(1),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: documentCategorySchema,
  mimeType: z.string(),
  sizeBytes: z.number(),
  status: documentStatusSchema,
  uploadedAt: z.string().datetime(),
  verifiedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  vendorId: z.string(),
  createdAt: z.string().datetime(),
});
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
