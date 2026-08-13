import { z } from "zod";
import { documentCategorySchema, documentStatusSchema } from "./enums.js";

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

/** What the checklist shows about an uploaded file. Never includes the Base64. */
export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  status: documentStatusSchema,
  uploadedAt: z.string().datetime(),
});
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

/** One row of the vendor's resolved document checklist. */
export const checklistEntrySchema = z.object({
  code: z.string(),
  label: z.string(),
  group: z.string(),
  category: documentCategorySchema,
  document: uploadedFileSchema.nullable(),
});
export type ChecklistEntry = z.infer<typeof checklistEntrySchema>;

export const fullPackResponseSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  /** False until the vendor has been awarded — the pack only opens on award. */
  isOpen: z.boolean(),
  submitted: z.boolean(),
  entries: z.array(checklistEntrySchema),
  outstanding: z.array(z.string()),
});
export type FullPackResponse = z.infer<typeof fullPackResponseSchema>;

/**
 * One file against one checklist slot. The category is not accepted from the
 * caller — it is fixed by the slot, so a vendor cannot file a cheque as a
 * quality certificate.
 */
export const uploadChecklistFileSchema = z.object({
  name: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(1_048_576),
  /** Base64 of the original binary. */
  data: z.string().min(1),
});
export type UploadChecklistFileInput = z.infer<typeof uploadChecklistFileSchema>;

export const submitFullPackSchema = z.object({
  /** Recorded in the activity trail; the pack cannot be submitted without it. */
  acceptDeclarations: z.literal(true),
});
export type SubmitFullPackInput = z.infer<typeof submitFullPackSchema>;
