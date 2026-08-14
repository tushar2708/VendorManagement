import { Router } from 'express';
import { safeNotify, notifyRole } from '../services/notification-service.js';
import { prisma } from '@vendor-management/db';
import { requireAuth, requireRole, requireOwnLink } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  verifyRequestSchema,
  resolveCheckSchema,
  reviewActionSchema,
  requestChangesSchema,
  PREQUAL_CHECKS,
  DEEP_CHECKS,
  CHECK_SUBJECT_FIELD,
} from '@vendor-management/shared';
import { CONTRACT_TYPES } from '@vendor-management/shared';
import { transition, IllegalTransitionError } from '../lib/link-state.js';
import { resolveDueChecks } from '../lib/verification.js';
import { resolveErpIfDue, markErpSyncToFail } from '../lib/erp.js';
import { loadBuyerLinkDetail, mergedFields } from '../lib/buyer-link-dto.js';
import { buildActivityFeed } from '../lib/activity.js';
import { listWarmCandidates } from '../lib/directory-sync.js';
import { sendNotifyEmail } from '../lib/email.js';
import { trackServer } from '../lib/analytics.js';

export const buyerRouter = Router();
buyerRouter.use(requireAuth);
buyerRouter.use(requireRole('BUYER', 'ADMIN'));

buyerRouter.get('/activity', async (req, res, next) => {
  try {
    const activities = await buildActivityFeed(req.user!.buyerOrgId!);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

buyerRouter.get('/links/:id', requireOwnLink('id'), async (req, res, next) => {
  try {
    const linkId = String(req.params.id);

    await resolveDueChecks(linkId);
    await resolveErpIfDue(linkId);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { state: true },
    });
    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    try {
      if (link.state === 'PREQUAL_SUBMITTED') {
        await transition(linkId, 'PREQUAL_UNDER_REVIEW', {
          actorType: 'BUYER',
          actorId: req.user!.userId,
        });
      } else if (link.state === 'FULL_SUBMITTED') {
        await transition(linkId, 'FULL_UNDER_REVIEW', {
          actorType: 'BUYER',
          actorId: req.user!.userId,
        });
      }
    } catch (err) {
      if (err instanceof IllegalTransitionError) {
        // Already transitioned, continue
      } else {
        throw err;
      }
    }

    const detail = await loadBuyerLinkDetail(linkId);
    if (!detail) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    next(error);
  }
});

buyerRouter.post(
  '/links/:id/verify',
  requireOwnLink('id'),
  validateBody(verifyRequestSchema),
  async (req, res, next) => {
    try {
      const linkId = String(req.params.id);
      const { checkType } = req.body;

      const existing = await prisma.verificationCheck.findUnique({
        where: { linkId_checkType: { linkId, checkType } },
      });

      if (existing && existing.status === 'RUNNING') {
        res.status(409).json({ error: 'Check is already running' });
        return;
      }

      const fields = await mergedFields(linkId);
      const fieldKey = CHECK_SUBJECT_FIELD[checkType];
      const subjectValue = fieldKey ? (fields[fieldKey] ?? '') : '';

      await prisma.verificationCheck.upsert({
        where: { linkId_checkType: { linkId, checkType } },
        update: {
          status: 'RUNNING',
          ranAt: new Date(),
          subjectValue,
        },
        create: {
          linkId,
          checkType,
          status: 'RUNNING',
          ranAt: new Date(),
          subjectValue,
        },
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
);

buyerRouter.post(
  '/links/:id/checks/:checkId/resolve',
  requireOwnLink('id'),
  validateBody(resolveCheckSchema),
  async (req, res, next) => {
    try {
      const checkId = String(req.params.checkId);
      const { action } = req.body;

      const check = await prisma.verificationCheck.findUnique({
        where: { id: checkId },
      });

      if (!check) {
        res.status(404).json({ error: 'Check not found' });
        return;
      }

      if (check.status !== 'NEEDS_REVIEW') {
        res.status(409).json({ error: 'Check is not in NEEDS_REVIEW status' });
        return;
      }

      const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

      await prisma.verificationCheck.update({
        where: { id: checkId },
        data: { status: newStatus },
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
);

buyerRouter.post(
  '/links/:id/request-changes',
  requireOwnLink('id'),
  validateBody(requestChangesSchema),
  async (req, res, next) => {
    try {
      const linkId = String(req.params.id);
      const { reason, rejectedDocumentIds } = req.body;

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        select: { state: true },
      });

      if (!link) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      let targetState = 'PREQUAL_IN_PROGRESS';
      if (link.state.startsWith('FULL_')) {
        targetState = 'FULL_IN_PROGRESS';
      } else if (link.state === 'CONTRACTS_IN_PROGRESS') {
        targetState = 'FULL_IN_PROGRESS';
      }

      await prisma.$transaction(async (tx) => {
        await (tx as any).submission.updateMany({
          where: { linkId, status: 'SUBMITTED' },
          data: { status: 'IN_PROGRESS' },
        });

        if (rejectedDocumentIds && rejectedDocumentIds.length > 0) {
          await (tx as any).document.updateMany({
            where: { id: { in: rejectedDocumentIds } },
            data: { status: 'REJECTED', rejectionReason: reason },
          });
        }

        await transition(linkId, targetState as any, {
          actorType: 'BUYER',
          actorId: req.user!.userId,
          note: reason,
        }, tx as any);
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof IllegalTransitionError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

buyerRouter.post(
  '/links/:id/review',
  requireOwnLink('id'),
  validateBody(reviewActionSchema),
  async (req, res, next) => {
    try {
      const linkId = String(req.params.id);
      const action = req.body.action;

      if (action === 'reject') {
        const reason = (req.body as any).reason;
        await transition(linkId, 'REJECTED', {
          actorType: 'BUYER',
          actorId: req.user!.userId,
          note: reason,
        });
        res.status(200).json({ ok: true });
        return;
      }

      if (action === 'clear') {
        const score = (req.body as any).score;

        const checks = await prisma.verificationCheck.findMany({
          where: {
            linkId,
            checkType: { in: [...PREQUAL_CHECKS] },
          },
        });

        const allResolved = checks.every(
          (c) => c.status === 'PASSED' || c.status === 'ACCEPTED'
        );

        if (!allResolved) {
          res.status(422).json({ error: 'Not all prequal checks are resolved' });
          return;
        }

        await prisma.$transaction(async (tx) => {
          await (tx as any).vendorBuyerLink.update({
            where: { id: linkId },
            data: { prequalScore: score },
          });

          await transition(linkId, 'PREQUAL_CLEARED', {
            actorType: 'BUYER',
            actorId: req.user!.userId,
          }, tx as any);
        });

        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      if (error instanceof IllegalTransitionError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

buyerRouter.post('/links/:id/award', requireOwnLink('id'), async (req, res, next) => {
  try {
    const linkId = String(req.params.id);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        requestId: true,
        candidate: {
          select: { contactEmail: true, vendorId: true },
        },
        requirement: {
          select: { title: true },
        },
      },
    });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const postAwardStates = [
        'AWARDED',
        'FULL_IN_PROGRESS',
        'FULL_SUBMITTED',
        'FULL_UNDER_REVIEW',
        'CONTRACTS_IN_PROGRESS',
        'APPROVED',
        'ERP_SYNCING',
        'ERP_FAILED',
        'ONBOARDED',
      ];

      const awardedOnRequirement = await (tx as any).vendorBuyerLink.findFirst({
        where: {
          requestId: link.requestId,
          id: { not: linkId },
          state: { in: postAwardStates },
        },
      });

      if (awardedOnRequirement) {
        throw new Error('Another candidate already awarded on this requirement');
      }

      await transition(linkId, 'AWARDED', {
        actorType: 'BUYER',
        actorId: req.user!.userId,
      }, tx as any);

      await (tx as any).vendorBuyerLink.update({
        where: { id: linkId },
        data: { stage: 'FULL', awardedAt: new Date() },
      });

      await (tx as any).submission.create({
        data: {
          linkId,
          stage: 'FULL',
          status: 'IN_PROGRESS',
        },
      });

      for (const contractType of CONTRACT_TYPES) {
        await (tx as any).contract.create({
          data: {
            linkId,
            contractType,
            state: 'DRAFT_PENDING',
          },
        });
      }

      const slaRules = await (tx as any).slaRule.findMany();
      const slaMap = new Map(slaRules.map((r: any) => [r.stage, r.slaDays]));

      const approvalStages = [
        'FINANCIAL_CRIME',
        'COMPLIANCE',
        'LEGAL',
        'IT_INFOSEC',
        'TAX',
        'PROCUREMENT',
        'DATA_PRIVACY',
        'BUSINESS_OWNER',
      ];

      for (const stage of approvalStages) {
        const slaDays = slaMap.get(stage) as number | undefined;
        const slaHours = slaDays != null ? slaDays * 24 : null;

        await (tx as any).reviewTask.create({
          data: {
            linkId,
            stage,
            status: 'PENDING',
            slaHours,
          },
        });
      }

      await listWarmCandidates(tx, link.requestId);
    });

    trackServer('vendor_awarded', {
      distinct_id: req.user!.userId,
      link_id: linkId,
      request_id: link.requestId,
      vendor_id: link.candidate.vendorId,
      buyer_org: req.user!.buyerOrgId!,
    });

    void sendNotifyEmail({
      to: link.candidate.contactEmail ?? '',
      subject: `You've been awarded: ${link.requirement.title}`,
      html: `<p>Congratulations! Your submission for <strong>${link.requirement.title}</strong> has been awarded. Please log in to continue with the full onboarding pack.</p>`,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already awarded')) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

buyerRouter.post(
  '/links/:id/advance-to-contracts',
  requireOwnLink('id'),
  async (req, res, next) => {
    try {
      const linkId = String(req.params.id);

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        select: { state: true },
      });

      if (!link) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      if (link.state !== 'FULL_UNDER_REVIEW') {
        res.status(409).json({ error: 'Link must be in FULL_UNDER_REVIEW state' });
        return;
      }

      const runningChecks = await prisma.verificationCheck.findMany({
        where: {
          linkId,
          checkType: { in: [...DEEP_CHECKS] },
          status: 'RUNNING',
        },
      });

      if (runningChecks.length > 0) {
        res.status(422).json({ error: 'Deep checks are still running' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await transition(linkId, 'CONTRACTS_IN_PROGRESS', {
          actorType: 'BUYER',
          actorId: req.user!.userId,
        }, tx as any);

        await (tx as any).reviewTask.updateMany({
          where: {
            linkId,
            status: 'CHANGES_REQUESTED',
          },
          data: { status: 'PENDING' },
        });
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof IllegalTransitionError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

buyerRouter.post('/links/:id/push-erp', requireOwnLink('id'), async (req, res, next) => {
  try {
    const linkId = String(req.params.id);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { state: true },
    });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    if (link.state !== 'APPROVED') {
      res.status(409).json({ error: 'Link must be in APPROVED state' });
      return;
    }

    await transition(linkId, 'ERP_SYNCING', {
      actorType: 'BUYER',
      actorId: req.user!.userId,
    });

    const simulateFailure = (req.body as any)?.simulateFailure ?? false;
    if (simulateFailure) {
      markErpSyncToFail(linkId);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

buyerRouter.post(
  '/links/:id/retry-erp',
  requireOwnLink('id'),
  async (req, res, next) => {
    try {
      const linkId = String(req.params.id);

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        select: { state: true },
      });

      if (!link) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      if (link.state !== 'ERP_FAILED') {
        res.status(409).json({ error: 'Link must be in ERP_FAILED state' });
        return;
      }

      await transition(linkId, 'ERP_SYNCING', {
        actorType: 'BUYER',
        actorId: req.user!.userId,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof IllegalTransitionError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

buyerRouter.get('/links/:id/erp-pack', requireOwnLink('id'), async (req, res, next) => {
  try {
    const linkId = String(req.params.id);

    const detail = await loadBuyerLinkDetail(linkId);
    if (!detail) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    const erpPack = {
      vendorCode: detail.erpVendorCode,
      legalName: detail.candidate.legalName,
      email: detail.candidate.contactEmail,
      pan: detail.candidate.pan,
      gstin: detail.candidate.gstin,
      fields: detail.fields,
      requirementId: detail.requirement.id,
      requirementTitle: detail.requirement.title,
    };

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="erp-pack-${linkId}.json"`
    );
    res.json(erpPack);
  } catch (error) {
    next(error);
  }
});
