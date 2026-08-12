import { z } from "zod";
import { contractTypeSchema, contractStateSchema, partySideSchema, contractVersionKindSchema } from "./enums.js";

export const CONTRACT_TYPES = contractTypeSchema.options;
export const CONTRACT_STATES = contractStateSchema.options;

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  NDA: "Non-Disclosure Agreement",
  MSA: "Master Service Agreement",
  QUALITY_AGREEMENT: "Quality Agreement",
  SUPPLY_AGREEMENT: "Supply Agreement",
  PRICING_AGREEMENT: "Pricing Agreement",
  DATA_PROCESSING: "Data Processing Agreement",
};

export const CONTRACT_STATE_LABEL: Record<string, string> = {
  DRAFT_PENDING: "Draft pending",
  DRAFT_UPLOADED: "Draft uploaded",
  VENDOR_REVIEW: "Vendor review",
  CHANGES_REQUESTED: "Changes requested",
  REVISED: "Revised",
  AGREED: "Agreed",
  AWAITING_SIGNATURES: "Awaiting signatures",
  PARTIALLY_EXECUTED: "Partially executed",
  EXECUTED: "Executed",
};

export const VENDOR_TURN_CONTRACT_STATES = ["DRAFT_UPLOADED", "REVISED", "VENDOR_REVIEW"] as const;

export const CONTRACT_KIND_VERB: Record<string, string> = {
  DRAFT: "uploaded draft of",
  REVISED: "uploaded revision of",
  VENDOR_SIGNED: "signed",
  BUYER_SIGNED: "counter-signed",
};

export const contractUploadSchema = z.object({
  fileBlobId: z.string().min(1),
  fileName: z.string().min(1),
});
export type ContractUploadInput = z.infer<typeof contractUploadSchema>;

export const contractCommentInputSchema = z.object({
  body: z.string().min(1),
  fileBlobId: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
});
export type ContractCommentInput = z.infer<typeof contractCommentInputSchema>;

export const contractVersionDTOSchema = z.object({
  id: z.string(),
  versionNo: z.number(),
  kind: contractVersionKindSchema,
  uploadedBySide: partySideSchema,
  fileBlobId: z.string(),
  fileName: z.string(),
  createdAt: z.string(),
});
export type ContractVersionDTO = z.infer<typeof contractVersionDTOSchema>;

export const contractCommentDTOSchema = z.object({
  id: z.string(),
  authorSide: partySideSchema,
  body: z.string(),
  fileBlobId: z.string().nullable(),
  fileName: z.string().nullable(),
  createdAt: z.string(),
});
export type ContractCommentDTO = z.infer<typeof contractCommentDTOSchema>;

export const contractDTOSchema = z.object({
  id: z.string(),
  contractType: contractTypeSchema,
  state: contractStateSchema,
  currentVersionId: z.string().nullable(),
  versions: z.array(contractVersionDTOSchema),
  comments: z.array(contractCommentDTOSchema),
});
export type ContractDTO = z.infer<typeof contractDTOSchema>;
