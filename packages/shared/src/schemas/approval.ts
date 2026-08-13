import { z } from "zod";
import { approvalStageSchema, controlFunctions, reviewTaskStatusSchema, slaRiskSchema } from "./enums.js";

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

/**
 * One row of the control-function table. A vendor always has all eight, whether
 * or not anyone has started the review — an untouched function reports PENDING
 * rather than going missing.
 */
export const controlFunctionSchema = z.object({
  stage: approvalStageSchema,
  status: reviewTaskStatusSchema,
  slaRisk: slaRiskSchema,
  notes: z.string().nullable(),
  enteredStageAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  /**
   * Controls that must clear before this one can be decided. Empty for the
   * seven parallel controls. Deliberately required rather than defaulted: a
   * `.default()` makes the schema's input and output types differ, which the
   * two zod copies in this repo then refuse to match up.
   */
  waitingOn: z.array(approvalStageSchema),
});
export type ControlFunction = z.infer<typeof controlFunctionSchema>;

/**
 * One line of the approver queue: a control somewhere that is not cleared, with
 * enough context to act on it without opening the vendor first.
 */
export const approvalQueueItemSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  requestId: z.string().nullable(),
  requestNumber: z.string().nullable(),
  stage: approvalStageSchema,
  status: reviewTaskStatusSchema,
  slaRisk: slaRiskSchema,
  waitingSince: z.string().datetime().nullable(),
});
export type ApprovalQueueItem = z.infer<typeof approvalQueueItemSchema>;

export const vendorControlsResponseSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  controls: z.array(controlFunctionSchema).length(controlFunctions.length),
});
export type VendorControlsResponse = z.infer<typeof vendorControlsResponseSchema>;

/**
 * The states a reviewer can put a control into. PENDING is absent on purpose —
 * a review that has started cannot be made un-started, and an audit trail that
 * allows it stops being an audit trail. ESCALATION has its own workflow and is
 * not a status the table sets directly.
 */
export const controlDecisionSchema = z.object({
  status: z.enum(["IN_PROGRESS", "INFORMATION_REQUIRED", "APPROVED", "EDD_COMPLETE", "CHANGES_REQUESTED"]),
  notes: z.string().trim().max(500).optional(),
});
export type ControlDecisionInput = z.infer<typeof controlDecisionSchema>;
