import { z } from "zod";

export const activityCategorySchema = z.enum(["lifecycle", "approval", "contract", "verification"]);
export type ActivityCategory = z.infer<typeof activityCategorySchema>;

export const activitySideSchema = z.enum(["vendor", "buyer", "system"]);
export type ActivitySide = z.infer<typeof activitySideSchema>;

export const activityItemSchema = z.object({
  id: z.string(),
  at: z.string(),
  side: activitySideSchema,
  category: activityCategorySchema,
  vendorName: z.string().nullable(),
  requirementTitle: z.string().nullable(),
  description: z.string(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;
