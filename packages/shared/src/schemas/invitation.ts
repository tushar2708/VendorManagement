import { z } from "zod";
import { inviteStatusSchema } from "./enums.js";

export const registerViaInviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterViaInviteInput = z.infer<typeof registerViaInviteSchema>;

export const dispatchInvitesSchema = z.object({
  candidateIds: z.array(z.string()).optional(),
});
export type DispatchInvitesInput = z.infer<typeof dispatchInvitesSchema>;

export const invitationResponseSchema = z.object({
  id: z.string(),
  tokenHash: z.string().nullable(),
  email: z.string().nullable(),
  status: inviteStatusSchema,
  expiresAt: z.string(),
  candidateId: z.string(),
  requestId: z.string(),
  createdAt: z.string(),
});
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
