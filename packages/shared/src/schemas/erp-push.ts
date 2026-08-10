import { z } from "zod";
import { erpPushStatusSchema } from "./enums.js";

export const erpPushResponseSchema = z.object({
  id: z.string(),
  status: erpPushStatusSchema,
  vendorCode: z.string().nullable(),
  apiMethod: z.string().nullable(),
  errorMessage: z.string().nullable(),
  pushedAt: z.string().datetime().nullable(),
  totalDays: z.number().nullable(),
  vendorId: z.string(),
  createdAt: z.string().datetime(),
});
export type ErpPushResponse = z.infer<typeof erpPushResponseSchema>;
