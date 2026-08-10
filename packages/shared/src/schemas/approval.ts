import { z } from "zod";
import { approvalStageSchema, approvalStatusSchema, slaRiskSchema } from "./enums.js";

export const updateApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});
export type UpdateApprovalInput = z.infer<typeof updateApprovalSchema>;

export const approvalResponseSchema = z.object({
  id: z.string(),
  stage: approvalStageSchema,
  status: approvalStatusSchema,
  slaRisk: slaRiskSchema,
  enteredStageAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  vendorId: z.string(),
  assignedToId: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ApprovalResponse = z.infer<typeof approvalResponseSchema>;
