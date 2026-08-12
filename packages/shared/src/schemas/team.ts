import { z } from "zod";
import { buyerRoleSchema } from "./enums.js";

export const BUYER_ROLES = buyerRoleSchema.options;
export const APPROVER_ROLES = ["QUALITY", "FINANCE", "TAX", "LEGAL"] as const;

export const createTeamMemberSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: buyerRoleSchema,
  password: z.string().min(8),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const teamMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().nullable(),
  role: buyerRoleSchema,
  isSelf: z.boolean(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;
