import { z } from "zod";
import { contractStatusSchema } from "./enums.js";

export const createContractSchema = z.object({
  title: z.string().min(1),
  documentName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(1_048_576),
  documentData: z.string().min(1),
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const contractCommentSchema = z.object({
  content: z.string().min(1),
});
export type ContractCommentInput = z.infer<typeof contractCommentSchema>;

export const contractResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: contractStatusSchema,
  documentName: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  buyerSignedAt: z.string().datetime().nullable(),
  vendorSignedAt: z.string().datetime().nullable(),
  vendorId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ContractResponse = z.infer<typeof contractResponseSchema>;
