import { z } from "zod";
import { verificationCheckTypeSchema, verificationStatusSchema } from "./enums.js";

export const prequalSubmissionSchema = z.object({
  panNumber: z.string().length(10),
  gstin: z.string().length(15),
  udyamNumber: z.string().optional(),
});
export type PrequalSubmissionInput = z.infer<typeof prequalSubmissionSchema>;

export const verificationCheckResponseSchema = z.object({
  id: z.string(),
  checkType: verificationCheckTypeSchema,
  status: verificationStatusSchema,
  matchScore: z.number().nullable(),
  detail: z.any().nullable(),
  ranAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});
export type VerificationCheckResponse = z.infer<typeof verificationCheckResponseSchema>;
