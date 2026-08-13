import { z } from 'zod';

import { uploadDocumentSchema } from './document.js';

/**
 * Contract for the black-and-gold vendor console (/vendor/prequal, /vendor/status),
 * served by /api/vendor.
 *
 * Kept separate from ./prequal.js deliberately. Both describe pre-qualification,
 * but the buyer lane asks for a registeredName to match against the shortlisted
 * vendor, and reports status as { vendor, checks, request } for review screens.
 * The console submits without that field and renders a stepper, so it needs
 * { submitted, stageLabel, steps }. Sharing one schema would force one caller to
 * fake data the other requires.
 */

export const consolePrequalIdentitySchema = z.object({
  panNumber: z.string().min(10).max(10),
  gstin: z.string().min(15).max(15),
  udyamNumber: z.string().optional(),
});
export type ConsolePrequalIdentityInput = z.infer<typeof consolePrequalIdentitySchema>;

export const prequalCapabilitySchema = z.object({
  processes: z.array(z.string().min(1)).min(1),
  annualCapacityTons: z.number().positive(),
  shifts: z.number().int().min(1).max(3),
  certifications: z.array(z.string().min(1)).min(1),
  customerReferences: z
    .array(z.object({ company: z.string().min(1), contact: z.string().optional() }))
    .max(5),
});
export type PrequalCapabilityInput = z.infer<typeof prequalCapabilitySchema>;

export const fullPrequalSubmissionSchema = consolePrequalIdentitySchema.extend({
  capability: prequalCapabilitySchema,
  documents: z.array(uploadDocumentSchema).min(1),
});
export type FullPrequalSubmissionInput = z.infer<typeof fullPrequalSubmissionSchema>;

export const prequalSubmitResultSchema = z.object({
  ok: z.boolean(),
  status: z.literal('PREQUAL_SUBMITTED'),
  vendorId: z.string(),
  documentIds: z.array(z.string()),
  submittedAt: z.string().datetime(),
});
export type PrequalSubmitResult = z.infer<typeof prequalSubmitResultSchema>;

export const statusStepStateSchema = z.enum(['done', 'active', 'pending']);
export type StatusStepState = z.infer<typeof statusStepStateSchema>;

export const vendorStatusStepSchema = z.object({
  key: z.string(),
  label: z.string(),
  actor: z.string().nullable(), // "you" | "platform" | "buyer" | null
  at: z.string().datetime().nullable(),
  state: statusStepStateSchema,
  /** What the step produced, e.g. the issued vendor code. */
  detail: z.string().nullable(),
});
export type VendorStatusStep = z.infer<typeof vendorStatusStepSchema>;

export const vendorConsoleStatusResponseSchema = z.object({
  submitted: z.boolean(),
  vendorName: z.string().nullable(),
  category: z.string().nullable(),
  whoseCourt: z.enum(['VENDOR', 'BUYER', 'PLATFORM']).nullable(),
  stageLabel: z.string(),
  buyerPendingDays: z.number().nullable(),
  vendorWaitedDays: z.number().nullable(),
  contactName: z.string().nullable(),
  contactRole: z.string().nullable(),
  reference: z.string().nullable(),
  steps: z.array(vendorStatusStepSchema),
});
export type VendorConsoleStatusResponse = z.infer<typeof vendorConsoleStatusResponseSchema>;

/** Mobile verification — the last step, after the ERP handoff. */
export const mobileStartSchema = z.object({
  // Deliberately loose on format: numbers arrive with spaces, +91, or neither,
  // and rejecting a real number on punctuation is worse than accepting one.
  mobileNumber: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[+0-9][0-9 ()-]*$/, 'Enter a valid mobile number'),
});
export type MobileStartInput = z.infer<typeof mobileStartSchema>;

export const mobileVerifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'The code is six digits'),
});
export type MobileVerifyInput = z.infer<typeof mobileVerifySchema>;

export const mobileStatusSchema = z.object({
  isOpen: z.boolean(),
  mobileNumber: z.string().nullable(),
  verified: z.boolean(),
  listedInDirectory: z.boolean(),
});
export type MobileStatus = z.infer<typeof mobileStatusSchema>;
