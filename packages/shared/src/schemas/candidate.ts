import { z } from 'zod';
import { candidateSourceSchema, inviteStatusSchema, linkStateSchema, requirementStageSchema } from './enums.js';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

export const candidateSchema = z.object({
  id: z.string(),
  source: candidateSourceSchema,
  legalName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  pan: z.string().nullable(),
  gstin: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  inviteStatus: inviteStatusSchema,
  link: z.object({
    id: z.string(),
    state: linkStateSchema,
    prequalScore: z.number().nullable(),
  }).nullable().optional(),
  createdAt: z.string(),
});
export type Candidate = z.infer<typeof candidateSchema>;


export const addCandidateSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('manual'),
    legalName: z.string().min(1),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    pan: z.string().regex(PAN_REGEX).optional(),
    gstin: z.string().regex(GSTIN_REGEX).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  z.object({
    source: z.literal('directory'),
    vendorId: z.string().min(1),
  }),
]);
export type AddCandidateInput = z.infer<typeof addCandidateSchema>;

export const addCandidatesSchema = z.object({
  candidates: z.array(addCandidateSchema).min(1),
});
export type AddCandidatesInput = z.infer<typeof addCandidatesSchema>;

export const updateCandidateSchema = z.object({
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;

export const requirementDetailSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  title: z.string().nullable(),
  category: z.string(),
  stage: requirementStageSchema,
  processCategories: z.array(z.string()),
  plantLocation: z.string().nullable(),
  targetAwardDate: z.string().nullable(),
  createdAt: z.string(),
  candidates: z.array(candidateSchema),
});
export type RequirementDetail = z.infer<typeof requirementDetailSchema>;

export const requirementDetailResponseSchema = z.object({
  requirement: requirementDetailSchema,
});
export type RequirementDetailResponse = z.infer<typeof requirementDetailResponseSchema>;
