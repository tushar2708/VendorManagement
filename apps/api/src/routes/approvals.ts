import { Router } from 'express';
import { updateApprovalSchema } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { advanceLinkIfGateOpen } from '../lib/contract-state.js';
import { transition } from '../lib/link-state.js';

export const approvalsRouter = Router();
approvalsRouter.use(requireAuth);

approvalsRouter.get('/', async (req, res) => {
  const statusFilter = (req.query.status as string) || 'PENDING';
  const tasks = await prisma.reviewTask.findMany({
    where: {
      status: statusFilter as any,
      link: { buyerOrgId: req.user!.buyerOrgId! },
    },
    include: {
      link: {
        include: {
          candidate: { select: { legalName: true, contactEmail: true } },
          requirement: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const slaRules = await prisma.slaRule.findMany();
  const slaMap = new Map(slaRules.map((r) => [r.stage, r.slaDays]));

  const now = Date.now();
  const items = tasks.map((t) => {
    const ageDays = Math.floor((now - t.createdAt.getTime()) / 86_400_000);
    const slaDays = slaMap.get(t.stage) ?? 5;
    const slaRisk =
      ageDays > slaDays ? 'OVERDUE' : ageDays > slaDays * 0.7 ? 'AT_RISK' : 'ON_TRACK';
    return {
      id: t.id,
      stage: t.stage,
      status: t.status,
      slaRisk,
      ageDays,
      slaDays,
      vendorName: t.link.candidate.legalName,
      vendorEmail: t.link.candidate.contactEmail,
      assignedToName: null,
      requestId: t.link.requirement.id,
      linkId: t.linkId,
      createdAt: t.createdAt.toISOString(),
    };
  });

  res.json(items);
});

approvalsRouter.get('/analytics', async (req, res) => {
  const tasks = await prisma.reviewTask.findMany({
    where: { link: { buyerOrgId: req.user!.buyerOrgId! }, status: 'PENDING' },
    include: { link: true },
  });

  const slaRules = await prisma.slaRule.findMany();
  const slaMap = new Map(slaRules.map((r) => [r.stage, r.slaDays]));
  const now = Date.now();

  let onTrack = 0;
  let atRisk = 0;
  let overdue = 0;
  for (const t of tasks) {
    const ageDays = Math.floor((now - t.createdAt.getTime()) / 86_400_000);
    const slaDays = slaMap.get(t.stage) ?? 5;
    if (ageDays > slaDays) overdue++;
    else if (ageDays > slaDays * 0.7) atRisk++;
    else onTrack++;
  }

  const total = onTrack + atRisk + overdue;
  res.json({
    distribution: { ON_TRACK: onTrack, AT_RISK: atRisk, OVERDUE: overdue },
    total,
    slaComplianceRate: total > 0 ? Math.round((onTrack / total) * 100) : 100,
  });
});

approvalsRouter.post('/:id/decide', validateBody(updateApprovalSchema), async (req, res) => {
  const task = await prisma.reviewTask.findUnique({
    where: { id: String(req.params.id) },
    include: { link: { select: { id: true, buyerOrgId: true, vendorUserId: true } } },
  });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  if (task.link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (task.status !== 'PENDING') {
    res.status(409).json({ error: 'Already decided' });
    return;
  }

  const decision = req.body.status;

  if (decision === 'APPROVED') {
    await prisma.$transaction(async (tx) => {
      await tx.reviewTask.update({ where: { id: task.id }, data: { status: 'APPROVED' } });
      await tx.approvalDecision.create({
        data: {
          reviewTaskId: task.id,
          linkId: task.linkId,
          decision: 'APPROVED',
          comment: req.body.notes ?? null,
          decidedById: req.user!.userId,
        },
      });
    });
    try {
      await advanceLinkIfGateOpen(task.linkId);
    } catch (err) {
      console.error("Gate check failed after approval:", err);
    }
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.reviewTask.update({ where: { id: task.id }, data: { status: 'CHANGES_REQUESTED' } });
      await tx.approvalDecision.create({
        data: {
          reviewTaskId: task.id,
          linkId: task.linkId,
          decision: 'CHANGES_REQUESTED',
          comment: req.body.notes ?? null,
          decidedById: req.user!.userId,
        },
      });
      await tx.submission.updateMany({
        where: { linkId: task.linkId, stage: 'FULL' },
        data: { status: 'IN_PROGRESS' },
      });
      await transition(task.linkId, 'FULL_IN_PROGRESS', {
        actorType: 'BUYER',
        actorId: req.user!.userId,
        note: 'Changes requested by approver',
      }, tx as any);
    });
  }

  res.json({ ok: true });
});
