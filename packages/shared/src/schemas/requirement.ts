import { z } from 'zod';
import { requestStatusSchema } from './enums.js';

export const pipelineStepSchema = z.enum([
  'INTAKE_AND_INVITE',
  'VERIFICATION',
  'AWARD_AND_FULL_PACK',
  'GOVERNANCE',
  'CONTRACT',
  'ACTIVATED',
]);
export type PipelineStep = z.infer<typeof pipelineStepSchema>;

// Summary shown on the dashboard (dates serialised as ISO strings).
export const requirementSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  partCategory: z.string().nullable(),
  processCategories: z.array(z.string()),
  plantLocation: z.string().nullable(),
  targetAwardDate: z.string().nullable(),
  status: requestStatusSchema,
  pipelineStep: pipelineStepSchema,
  whoseCourt: z.enum(['Buyer', 'Vendor', 'Done']),
  openDays: z.number().int().nonnegative(),
  candidateCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type RequirementSummary = z.infer<typeof requirementSummarySchema>;

export const requirementListResponseSchema = z.object({
  requirements: z.array(requirementSummarySchema),
});
export type RequirementListResponse = z.infer<typeof requirementListResponseSchema>;

export const createRequirementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  partCategory: z.string().trim().max(80).optional(),
  process: z.enum(['RFQ', 'NOMINATION', 'DIRECT']).default('RFQ'),
  vendorType: z.enum(['PRODUCTION_PART', 'INDIRECT_SERVICES']).default('PRODUCTION_PART'),
  processCategories: z.array(z.string()).default([]),
  plantLocation: z.string().trim().max(120).optional(),
  targetAwardDate: z.string().date().optional(),
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
  requirement: z.object({
    id: z.string(),
    title: z.string(),
    partCategory: z.string().nullable(),
    processCategories: z.array(z.string()),
    plantLocation: z.string().nullable(),
    targetAwardDate: z.string().nullable(),
    status: requestStatusSchema,
    pipelineStep: pipelineStepSchema,
    whoseCourt: z.enum(['Buyer', 'Vendor', 'Done']),
    openDays: z.number().int().nonnegative(),
    createdAt: z.string(),
    candidates: z.array(z.object({
      id: z.string(),
      requirementId: z.string(),
      source: z.enum(['MANUAL', 'DIRECTORY']),
      directoryVendorId: z.string().nullable(),
      legalName: z.string(),
      contactEmail: z.string(),
      contactPhone: z.string().nullable(),
      pan: z.string().nullable(),
      gstin: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      inviteStatus: z.enum(['PENDING', 'INVITED', 'OPENED', 'REGISTERED', 'EXPIRED']),
      createdAt: z.string(),
    })),
  }),
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
    action: z.string(),
    message: z.string(),
    metadata: z.string().nullable(),
    createdAt: z.string(),
  })),
});
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>;
