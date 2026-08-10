import { z } from "zod";
import { verificationCheckTypeSchema, verificationCheckStatusSchema } from "./enums.js";

export const prequalSubmissionSchema = z.object({
  panNumber: z.string().min(10).max(10),
  gstin: z.string().min(15).max(15),
  udyamNumber: z.string().optional(),
});
export type PrequalSubmissionInput = z.infer<typeof prequalSubmissionSchema>;

export const verificationCheckResponseSchema = z.object({
  id: z.string(),
  type: verificationCheckTypeSchema,
  status: verificationCheckStatusSchema,
  matchScore: z.number().nullable(),
  notes: z.string().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  vendorId: z.string(),
  createdAt: z.string().datetime(),
});
export type VerificationCheckResponse = z.infer<typeof verificationCheckResponseSchema>;

export const verificationOverrideSchema = z.object({
  status: z.enum(["PASS", "FAIL"]),
  notes: z.string().min(1),
});
export type VerificationOverrideInput = z.infer<typeof verificationOverrideSchema>;
