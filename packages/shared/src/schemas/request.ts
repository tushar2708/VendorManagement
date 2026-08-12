import { z } from "zod";
import { requestProcessSchema, requirementStageSchema, vendorTypeSchema } from "./enums.js";

export const createRequestSchema = z.object({
  category: z.string().min(1),
  process: requestProcessSchema,
  vendorType: vendorTypeSchema,
  businessJustification: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestSchema = z.object({
  category: z.string().min(1).optional(),
  process: requestProcessSchema.optional(),
  vendorType: vendorTypeSchema.optional(),
  notes: z.string().optional(),
  stage: requirementStageSchema.optional(),
});
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const requestResponseSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  stage: requirementStageSchema,
  category: z.string(),
  process: requestProcessSchema,
  vendorType: vendorTypeSchema,
  businessJustification: z.string().nullable(),
  notes: z.string().nullable(),
  createdById: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RequestResponse = z.infer<typeof requestResponseSchema>;
