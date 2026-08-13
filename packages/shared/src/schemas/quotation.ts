import { z } from 'zod';

/** What a buyer records from an off-platform quote. Facts only, never scores. */
export const upsertQuotationSchema = z.object({
  unitPrice: z.number().int().positive().max(100_000_000),
  toolingPerUnit: z.number().int().min(0).max(100_000_000).default(0),
  freightPerUnit: z.number().int().min(0).max(100_000_000).default(0),
  leadTimeDays: z.number().int().min(0).max(3650),
  location: z.string().trim().max(120).optional(),
  capacityNote: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type UpsertQuotationInput = z.infer<typeof upsertQuotationSchema>;

export const criterionScoresSchema = z.object({
  quality: z.number().nullable(),
  cost: z.number().nullable(),
  delivery: z.number().nullable(),
  risk: z.number().nullable(),
});

/** One candidate on the award screen: their quote, plus the derived scores. */
export const scoredCandidateSchema = z.object({
  candidateId: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  status: z.string(),
  isVerified: z.boolean(),
  certifications: z.array(z.string()),
  prequalScore: z.number().nullable(),
  unitPrice: z.number().nullable(),
  toolingPerUnit: z.number().nullable(),
  freightPerUnit: z.number().nullable(),
  landedCost: z.number().nullable(),
  leadTimeDays: z.number().nullable(),
  location: z.string().nullable(),
  capacityNote: z.string().nullable(),
  scores: criterionScoresSchema,
});
export type ScoredCandidate = z.infer<typeof scoredCandidateSchema>;

export const scoringResponseSchema = z.object({
  requestId: z.string(),
  candidates: z.array(scoredCandidateSchema),
});
export type ScoringResponse = z.infer<typeof scoringResponseSchema>;
