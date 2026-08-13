import { z } from "zod";
import { badgeStateSchema, verificationCheckTypeSchema, verificationStatusSchema } from "./enums.js";

export const directoryVendorSchema = z.object({
  id: z.string(),
  legalName: z.string(),
  pan: z.string().nullable(),
  primaryGstin: z.string().nullable(),
  contactEmail: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  processTags: z.array(z.string()),
  certificationTags: z.array(z.string()),
  badgeState: badgeStateSchema,
});
export type DirectoryVendor = z.infer<typeof directoryVendorSchema>;

export const directoryListResponseSchema = z.object({
  vendors: z.array(directoryVendorSchema),
});
export type DirectoryListResponse = z.infer<typeof directoryListResponseSchema>;

export const directoryQuerySchema = z.object({
  search: z.string().optional(),
  process: z.string().optional(),
  state: z.string().optional(),
  // Exclude vendors already added as candidates on this requirement.
  requirementId: z.string().optional(),
});
export type DirectoryQuery = z.infer<typeof directoryQuerySchema>;

export const directoryFiltersResponseSchema = z.object({
  processes: z.array(z.string()),
  states: z.array(z.string()),
});
export type DirectoryFiltersResponse = z.infer<typeof directoryFiltersResponseSchema>;

export const vendorDetailResponseSchema = z.object({
  vendor: directoryVendorSchema.extend({
    createdAt: z.string(),
  }),
  verificationChecks: z.array(z.object({
    id: z.string(),
    checkType: verificationCheckTypeSchema,
    status: verificationStatusSchema,
    matchScore: z.number().nullable(),
    detail: z.any().nullable(),
    ranAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    createdAt: z.string(),
  })),
});
export type VendorDetailResponse = z.infer<typeof vendorDetailResponseSchema>;
