import crypto from 'node:crypto';
import { Router } from 'express';
import { prisma } from '@vendor-management/db';

export const inviteRouter = Router();

inviteRouter.post('/:token/register', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.vendorInvitation.findUnique({
      where: { tokenHash },
      include: { vendor: true },
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invite link' });
      return;
    }

    if (invitation.expiresAt < new Date()) {
      res.status(410).json({ error: 'This invite link has expired' });
      return;
    }

    if (invitation.status === 'PENDING') {
      await prisma.vendorInvitation.update({
        where: { id: invitation.id },
        data: { status: 'OPENED', openedAt: new Date() },
      });
    }

    res.json({
      vendor: {
        id: invitation.vendor.id,
        name: invitation.vendor.name,
        contactEmail: invitation.vendor.contactEmail,
      },
      requirementId: invitation.requestId,
    });
  } catch (error) {
    next(error);
  }
});
