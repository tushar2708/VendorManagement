import crypto from 'node:crypto';
import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { APIError } from 'better-auth';
import { registerViaInviteSchema } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { auth } from './auth.js';
import { validateBody } from '../middleware/validate.js';

export const inviteRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function loadInvitation(token: string) {
  return prisma.vendorInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { vendor: true },
  });
}

// Read-only: validate the link and surface vendor info. Safe to call on page load.
inviteRouter.get('/:token', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const invitation = await loadInvitation(token);

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
      alreadyRegistered: invitation.vendor.userId !== null,
    });
  } catch (error) {
    next(error);
  }
});

// Creates the vendor's login account, links it to the Vendor record, and
// establishes a session — the step the original implementation skipped.
inviteRouter.post('/:token/register', validateBody(registerViaInviteSchema), async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    const invitation = await loadInvitation(token);
    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invite link' });
      return;
    }
    if (invitation.expiresAt < new Date()) {
      res.status(410).json({ error: 'This invite link has expired' });
      return;
    }
    if (invitation.vendor.userId) {
      res.status(409).json({ error: 'This vendor has already registered. Please log in instead.' });
      return;
    }
    if (email.toLowerCase() !== invitation.vendor.contactEmail.toLowerCase()) {
      res.status(400).json({ error: 'Email must match the address this invite was sent to.' });
      return;
    }

    let authResponse: Response;
    try {
      authResponse = await auth.api.signUpEmail({
        body: { name, email, password },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });
    } catch (error) {
      if (error instanceof APIError) {
        res.status(error.statusCode || 400).json({ error: error.body?.message ?? 'Could not create your account.' });
        return;
      }
      throw error;
    }

    if (!authResponse.ok) {
      const body: { message?: string } = await authResponse.json().catch(() => ({}));
      res.status(authResponse.status).json({ error: body.message ?? 'Could not create your account.' });
      return;
    }

    const created = (await authResponse.json()) as { user: { id: string } };

    await prisma.$transaction([
      prisma.user.update({ where: { id: created.user.id }, data: { role: 'VENDOR', tier: 'EXECUTIVE' } }),
      prisma.vendor.update({ where: { id: invitation.vendor.id }, data: { userId: created.user.id } }),
      prisma.vendorInvitation.update({
        where: { id: invitation.id },
        data: { status: 'REGISTERED', registeredAt: new Date() },
      }),
      prisma.requestCandidate.update({
        where: { requestId_vendorId: { requestId: invitation.requestId, vendorId: invitation.vendor.id } },
        data: { inviteStatus: 'OPENED' },
      }),
    ]);

    for (const cookie of authResponse.headers.getSetCookie()) {
      res.append('Set-Cookie', cookie);
    }

    res.status(201).json({
      user: { id: created.user.id, name, email, role: 'VENDOR' },
      vendor: { id: invitation.vendor.id, name: invitation.vendor.name },
    });
  } catch (error) {
    next(error);
  }
});
