import { z } from "zod";
import { inviteChannelSchema, inviteStatusSchema } from "./enums.js";

export const registerViaInviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterViaInviteInput = z.infer<typeof registerViaInviteSchema>;

export const dispatchInvitesSchema = z.object({
  channels: z.array(inviteChannelSchema).min(1),
});
export type DispatchInvitesInput = z.infer<typeof dispatchInvitesSchema>;

export const invitationResponseSchema = z.object({
  id: z.string(),
  token: z.string(),
  channel: inviteChannelSchema,
  status: inviteStatusSchema,
  expiresAt: z.string().datetime(),
  remindersSent: z.number(),
  vendorId: z.string(),
  requestId: z.string(),
  createdAt: z.string().datetime(),
});
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
