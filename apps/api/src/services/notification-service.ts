import { prisma } from '@vendor-management/db';

import { logger } from '../lib/logger.js';

export async function notifyRole(
  role: string,
  type: string,
  title: string,
  body: string | null = null,
  vendorName: string | null = null,
  vendorId: string | null = null,
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role: role as any },
    select: { id: true },
  });

  if (users.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      title,
      body,
      vendorName,
      vendorId,
    })),
  });
}

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string | null = null,
  vendorName: string | null = null,
  vendorId: string | null = null,
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, title, body, vendorName, vendorId },
  });
}

export async function safeNotify(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error({ err }, 'Notification delivery failed (non-blocking)');
  }
}
