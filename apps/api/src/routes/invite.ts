import crypto from 'node:crypto';
import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { registerViaInviteSchema } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { auth } from './auth.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/require-auth.js';
import { transition } from '../lib/link-state.js';
import { ensureSubmission } from '../lib/link-dto.js';

export const inviteRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function loadInvitation(token: string) {
  const tokenHash = hashToken(token);
  return prisma.vendorInvitation.findFirst({
    where: { tokenHash },
    include: {
      request: { select: { id: true, title: true } },
    },
  });
}

inviteRouter.get('/:token', async (req, res) => {
  const token = String(req.params.token);
  const invitation = await loadInvitation(token);
  if (!invitation) { res.status(404).json({ error: 'Invalid or expired invite link' }); return; }
  if (invitation.expiresAt < new Date()) { res.status(410).json({ error: 'Invite has expired' }); return; }

  if (invitation.status === 'PENDING' || invitation.status === 'INVITED') {
    await prisma.vendorInvitation.update({
      where: { id: invitation.id },
      data: { status: 'OPENED', openedAt: new Date() },
    });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email ?? '' } });

  let needsPassword = false;
  if (existingUser) {
    const account = await prisma.account.findFirst({
      where: { userId: existingUser.id, providerId: 'credential' },
    });
    needsPassword = !account?.password;
  }

  res.json({
    vendorName: invitation.email ?? '',
    email: invitation.email,
    requirementTitle: invitation.request.title,
    alreadyRegistered: !!existingUser,
    needsPassword,
  });
});

inviteRouter.post('/:token/register', validateBody(registerViaInviteSchema), async (req, res) => {
  const token = String(req.params.token);
  const invitation = await loadInvitation(token);
  if (!invitation) { res.status(404).json({ error: 'Invalid invite' }); return; }
  if (invitation.expiresAt < new Date()) { res.status(410).json({ error: 'Invite has expired' }); return; }

  try {
    const signupResult = await auth.api.signUpEmail({
      body: { email: req.body.email, password: req.body.password, name: req.body.name },
    });

    const userId = (signupResult as any).user?.id;
    if (!userId) { res.status(500).json({ error: 'User creation failed' }); return; }

    const emailDomain = req.body.email.split('@')[1];
    let vendorOrg = await prisma.vendorOrg.findFirst({
      where: { users: { some: { email: { endsWith: `@${emailDomain}` } } } },
    });
    if (!vendorOrg) {
      vendorOrg = await prisma.vendorOrg.create({
        data: {
          legalName: req.body.name ?? "Vendor Organization",
          contactEmail: req.body.email,
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'VENDOR', tier: 'EXECUTIVE', vendorOrgId: vendorOrg.id },
    });

    let link = null;
    if (invitation.candidateId) {
      link = await prisma.vendorBuyerLink.findUnique({
        where: { candidateId: invitation.candidateId },
      });
    }

    if (link) {
      await prisma.vendorBuyerLink.update({
        where: { id: link.id },
        data: { vendorUserId: userId, vendorOrgId: vendorOrg.id },
      });

      if (link.state === 'INVITED') {
        try {
          await transition(link.id, 'PREQUAL_IN_PROGRESS', {
            actorType: 'VENDOR', actorId: userId, note: 'Vendor registered',
          });
          await ensureSubmission(link.id, 'PREQUAL');
        } catch (err) {
          console.error("Failed to transition link:", err);
        }
      }
    }

    await prisma.vendorInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REGISTERED', registeredAt: new Date() },
    });

    const session = await auth.api.signInEmail({
      body: { email: req.body.email, password: req.body.password },
    });

    const headers = (session as any).headers;
    if (headers) {
      const setCookie = headers.get?.('set-cookie') ?? headers['set-cookie'];
      if (setCookie) {
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        cookies.forEach((c: string) => res.appendHeader('Set-Cookie', c));
      }
    }

    res.json({
      needsPassword: false,
      linkId: link?.id ?? '',
      requirementTitle: invitation.request.title ?? '',
      email: req.body.email,
    });
  } catch (e: any) {
    if (e?.body?.code === 'USER_ALREADY_EXISTS' || e?.message?.includes('already exists')) {
      const existingUser = await prisma.user.findUnique({ where: { email: req.body.email } });
      let linkId = '';
      if (existingUser) {
        const existingLink = await prisma.vendorBuyerLink.findFirst({
          where: { vendorUserId: existingUser.id, requestId: invitation.requestId },
        });
        linkId = existingLink?.id ?? '';
      }

      const session = await auth.api.signInEmail({
        body: { email: req.body.email, password: req.body.password },
      });
      const headers = (session as any).headers;
      if (headers) {
        const setCookie = headers.get?.('set-cookie') ?? headers['set-cookie'];
        if (setCookie) {
          const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
          cookies.forEach((c: string) => res.appendHeader('Set-Cookie', c));
        }
      }

      res.json({
        needsPassword: false,
        linkId,
        requirementTitle: invitation.request.title ?? '',
        email: req.body.email,
      });
      return;
    }
    res.status(400).json({ error: e?.message ?? 'Registration failed' });
  }
});

inviteRouter.post('/set-password', requireAuth, async (req, res) => {
  if (!req.user || req.user.role !== 'VENDOR') {
    res.status(403).json({ error: 'Only vendors can set a password' });
    return;
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const account = await prisma.account.findFirst({
    where: { userId: req.user.userId, providerId: 'credential' },
  });

  if (account?.password) {
    res.status(409).json({ error: 'Password already set' });
    return;
  }

  // @ts-ignore -- bcrypt has no declaration file in devDeps
  const bcrypt = await import('bcrypt');
  const hash = (bcrypt.default?.hash ?? bcrypt.hash) as (data: string, rounds: number) => Promise<string>;
  const passwordHash = await hash(password, 12);

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: passwordHash },
    });
  } else {
    const id = crypto.randomUUID();
    await prisma.account.create({
      data: {
        id,
        userId: req.user.userId,
        accountId: req.user.userId,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }

  res.json({ ok: true });
});
