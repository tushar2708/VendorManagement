import { Router } from 'express';

import { prisma } from '@vendor-management/db';

import { requireAuth } from '../middleware/require-auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const items = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.json(
    items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      vendorName: n.vendorName,
      vendorId: n.vendorId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

notificationsRouter.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, read: false },
  });

  res.json({ count });
});

notificationsRouter.post('/:id/read', async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { read: true },
  });

  res.json({ ok: true });
});

notificationsRouter.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });

  res.json({ ok: true });
});
