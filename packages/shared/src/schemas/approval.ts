import { z } from "zod";
import { approvalStageSchema, reviewTaskStatusSchema, slaRiskSchema } from "./enums.js";

export const updateApprovalSchema = z.object({
  status: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  notes: z.string().optional(),
});
export type UpdateApprovalInput = z.infer<typeof updateApprovalSchema>;

export const approvalResponseSchema = z.object({
  id: z.string(),
  stage: approvalStageSchema,
  status: reviewTaskStatusSchema,
  slaRisk: slaRiskSchema,
  ageDays: z.number(),
  slaDays: z.number(),
  vendorName: z.string().nullable(),
  vendorEmail: z.string().nullable(),
  assignedToName: z.string().nullable(),
  requestId: z.string().nullable(),
  linkId: z.string(),
  createdAt: z.string(),
});
export type ApprovalResponse = z.infer<typeof approvalResponseSchema>;
