import { z } from 'zod';

export const notificationDTOSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  vendorName: z.string().nullable(),
  vendorId: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type NotificationDTO = z.infer<typeof notificationDTOSchema>;
