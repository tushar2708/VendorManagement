import { z } from "zod";
import { activityActionSchema } from "./enums.js";

export const activityLogResponseSchema = z.object({
  id: z.string(),
  action: activityActionSchema,
  message: z.string(),
  metadata: z.string().nullable(),
  requestId: z.string().nullable(),
  vendorId: z.string().nullable(),
  userId: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ActivityLogResponse = z.infer<typeof activityLogResponseSchema>;
