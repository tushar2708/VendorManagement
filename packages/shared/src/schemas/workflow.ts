import { z } from "zod";
import {
  verificationCheckTypeSchema, verificationStatusSchema,
  linkStateSchema, linkStageSchema, approvalStageSchema,
  reviewTaskStatusSchema, contractStateSchema, partySideSchema,
} from "./enums.js";

export const VERIFICATION_CHECK_TYPES = verificationCheckTypeSchema.options;
export const PREQUAL_CHECKS = ["PAN", "GST", "UDYAM"] as const;
export const DEEP_CHECKS = ["PENNY_DROP", "GST_FILINGS"] as const;

export const CHECK_SUBJECT_FIELD: Record<string, string> = {
  PAN: "pan",
  GST: "gstin",
  UDYAM: "udyam",
  PENNY_DROP: "bankAccountNumber",
  GST_FILINGS: "gstin",
};

export const CHECK_META: Record<string, { label: string }> = {
  PAN: { label: "PAN verification" },
  GST: { label: "GST verification" },
  UDYAM: { label: "Udyam verification" },
  PENNY_DROP: { label: "Bank penny drop" },
  GST_FILINGS: { label: "GST filings check" },
};

export const verifyRequestSchema = z.object({
  checkType: verificationCheckTypeSchema,
});
export type VerifyRequestInput = z.infer<typeof verifyRequestSchema>;

export const resolveCheckSchema = z.object({
  action: z.enum(["accept", "reject"]),
});
export type ResolveCheckInput = z.infer<typeof resolveCheckSchema>;

export const reviewActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("clear"), score: z.number().int().min(0).max(100) }),
  z.object({ action: z.literal("reject"), reason: z.string().min(1) }),
]);
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

export const requestChangesSchema = z.object({
  reason: z.string().min(1),
  rejectedDocumentIds: z.array(z.string()).optional(),
});
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;

export const decideTaskSchema = z.object({
  decision: z.enum(["approve", "request_changes"]),
  comment: z.string().optional(),
});
export type DecideTaskInput = z.infer<typeof decideTaskSchema>;

export const verificationCheckDTOSchema = z.object({
  id: z.string(),
  checkType: verificationCheckTypeSchema,
  status: verificationStatusSchema,
  matchScore: z.number().nullable(),
  detail: z.any().nullable(),
  ranAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
});
export type VerificationCheckDTO = z.infer<typeof verificationCheckDTOSchema>;

export const reviewTaskDTOSchema = z.object({
  id: z.string(),
  stage: approvalStageSchema,
  status: reviewTaskStatusSchema,
  slaHours: z.number().nullable(),
  assignedUserId: z.string().nullable(),
  lastDecision: z.object({
    decision: z.string(),
    comment: z.string().nullable(),
    decidedAt: z.string(),
  }).nullable(),
});
export type ReviewTaskDTO = z.infer<typeof reviewTaskDTOSchema>;

export const buyerLinkDetailSchema = z.object({
  id: z.string(),
  state: linkStateSchema,
  stage: linkStageSchema.nullable(),
  prequalScore: z.number().nullable(),
  erpVendorCode: z.string().nullable(),
  candidate: z.object({
    id: z.string(),
    legalName: z.string().nullable(),
    contactEmail: z.string().nullable(),
    pan: z.string().nullable(),
    gstin: z.string().nullable(),
  }),
  requirement: z.object({
    id: z.string(),
    title: z.string().nullable(),
    processCategories: z.array(z.string()),
  }),
  fields: z.record(z.string(), z.string().nullable()),
  documents: z.array(z.object({
    id: z.string(),
    checklistItemKey: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    fileBlobId: z.string(),
    status: z.string(),
    rejectionReason: z.string().nullable(),
    uploadedAt: z.string(),
  })),
  checks: z.array(verificationCheckDTOSchema),
  reviewTasks: z.array(reviewTaskDTOSchema),
  contracts: z.array(z.object({
    id: z.string(),
    contractType: z.string(),
    state: contractStateSchema,
    currentVersionId: z.string().nullable(),
    versions: z.array(z.object({
      id: z.string(),
      versionNo: z.number(),
      kind: z.string(),
      uploadedBySide: partySideSchema,
      fileBlobId: z.string(),
      fileName: z.string(),
      createdAt: z.string(),
    })),
    comments: z.array(z.object({
      id: z.string(),
      authorSide: partySideSchema,
      body: z.string(),
      fileBlobId: z.string().nullable(),
      fileName: z.string().nullable(),
      createdAt: z.string(),
    })),
  })),
  joinGateOpen: z.boolean(),
});
export type BuyerLinkDetail = z.infer<typeof buyerLinkDetailSchema>;

export const approverTaskSchema = z.object({
  id: z.string(),
  stage: approvalStageSchema,
  status: reviewTaskStatusSchema,
  linkId: z.string(),
  linkState: linkStateSchema,
  vendorName: z.string().nullable(),
  requirementTitle: z.string().nullable(),
  lastDecisionComment: z.string().nullable(),
});
export type ApproverTask = z.infer<typeof approverTaskSchema>;
