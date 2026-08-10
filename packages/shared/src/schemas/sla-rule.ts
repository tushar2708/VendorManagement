import { z } from "zod";
import { approvalStageSchema } from "./enums.js";

export const updateSlaRuleSchema = z.object({
  slaDays: z.number().int().positive().optional(),
  escalateAfterBreach: z.boolean().optional(),
});
export type UpdateSlaRuleInput = z.infer<typeof updateSlaRuleSchema>;

export const slaRuleResponseSchema = z.object({
  id: z.string(),
  stage: approvalStageSchema,
  slaDays: z.number(),
  escalateAfterBreach: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SlaRuleResponse = z.infer<typeof slaRuleResponseSchema>;
