import { z } from 'zod';
import { requirementStageSchema, requestProcessSchema, vendorTypeSchema } from './enums.js';

export const requirementSummarySchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  partCategory: z.string().nullable(),
  processCategories: z.array(z.string()),
  plantLocation: z.string().nullable(),
  targetAwardDate: z.string().nullable(),
  stage: requirementStageSchema,
  candidateCount: z.number(),
  createdAt: z.string(),
});
export type RequirementSummary = z.infer<typeof requirementSummarySchema>;

export const inviteRequirementSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  partCategory: z.string().nullable(),
  processCategories: z.array(z.string()),
  plantLocation: z.string().nullable(),
  targetAwardDate: z.string().nullable(),
  stage: requirementStageSchema,
  createdAt: z.string(),
  candidates: z.array(z.any()),
});
export type InviteRequirement = z.infer<typeof inviteRequirementSchema>;

export const requirementListResponseSchema = z.object({
  requirements: z.array(requirementSummarySchema),
});
export type RequirementListResponse = z.infer<typeof requirementListResponseSchema>;

export const createRequirementSchema = z.object({
  title: z.string().min(1).max(200),
  partCategory: z.string().optional(),
  process: requestProcessSchema.default('RFQ'),
  vendorType: vendorTypeSchema.default('PRODUCTION_PART'),
  processCategories: z.array(z.string()).default([]),
  plantLocation: z.string().optional(),
  targetAwardDate: z.string().optional(),
});
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;

export const requirementResponseSchema = z.object({
  requirement: requirementSummarySchema,
});
export type RequirementResponse = z.infer<typeof requirementResponseSchema>;

export const inviteResultSchema = z.object({
  candidateId: z.string(),
  email: z.string(),
  sent: z.boolean(),
  link: z.string(),
});
export type InviteResult = z.infer<typeof inviteResultSchema>;

export const inviteResponseSchema = z.object({
  results: z.array(inviteResultSchema),
  requirement: inviteRequirementSchema,
});
export type InviteResponse = z.infer<typeof inviteResponseSchema>;

export const requirementStatsSchema = z.object({
  active: z.number(),
  waitingOnYou: z.number(),
  completed: z.number(),
  vendorsOnboarded: z.number(),
  openLongestDays: z.number(),
});
export type RequirementStats = z.infer<typeof requirementStatsSchema>;

export const activityListResponseSchema = z.object({
  activities: z.array(z.object({
    id: z.string(),
    at: z.string(),
    side: z.string(),
    category: z.string(),
    vendorName: z.string().nullable(),
    requirementTitle: z.string().nullable(),
    description: z.string(),
  })),
});
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>;
