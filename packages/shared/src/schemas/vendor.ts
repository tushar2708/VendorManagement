import { z } from "zod";
import { vendorTypeSchema } from "./enums.js";

export const createVendorSchema = z.object({
  name: z.string().min(1),
  contactEmail: z.string().email(),
  vendorType: vendorTypeSchema.optional(),
  category: z.string().optional(),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const vendorResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactEmail: z.string(),
  vendorType: vendorTypeSchema.nullable(),
  panNumber: z.string().nullable(),
  gstin: z.string().nullable(),
  udyamNumber: z.string().nullable(),
  vendorCode: z.string().nullable(),
  isVerified: z.boolean(),
  isInWarmPool: z.boolean(),
  isInDirectory: z.boolean(),
  prequalScore: z.number().nullable(),
  category: z.string().nullable(),
  certifications: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VendorResponse = z.infer<typeof vendorResponseSchema>;
