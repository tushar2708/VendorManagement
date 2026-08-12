import { Router } from 'express';
import { updateApprovalSchema } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { assertTransition, nextStageAfterGovernance, TransitionError } from '../services/state-machine.js';

export const approvalsRouter = Router();
approvalsRouter.use(requireAuth);

approvalsRouter.get('/', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'PENDING';
    const approvals = await prisma.approval.findMany({
      where: {
        status: status as any,
        OR: [
          { assignedToId: req.user!.userId },
          { request: { createdById: req.user!.userId } },
        ],
      },
      include: {
        vendor: { select: { id: true, name: true, contactEmail: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { enteredStageAt: 'asc' },
    });

    const slaRules = await prisma.slaRule.findMany();
    const slaMap = new Map(slaRules.map((r) => [r.stage, r.slaDays]));

    const now = Date.now();
    res.json({
      approvals: approvals.map((a) => {
        const ageDays = Math.floor((now - a.enteredStageAt.getTime()) / (1000 * 60 * 60 * 24));
        const slaDays = slaMap.get(a.stage) ?? 0;
        return {
          id: a.id,
          stage: a.stage,
          status: a.status,
          slaRisk: a.slaRisk,
          ageDays,
          slaDays,
          enteredStageAt: a.enteredStageAt.toISOString(),
          completedAt: a.completedAt?.toISOString() ?? null,
          notes: a.notes,
          vendorId: a.vendorId,
          vendorName: a.vendor.name,
          vendorEmail: a.vendor.contactEmail,
          assignedToName: a.assignedTo?.name ?? null,
          requestId: a.requestId ?? null,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

approvalsRouter.get('/analytics', async (req, res, next) => {
  try {
    const approvals = await prisma.approval.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { assignedToId: req.user!.userId },
          { request: { createdById: req.user!.userId } },
        ],
      },
      select: { slaRisk: true },
    });

    const distribution: Record<string, number> = { ON_TRACK: 0, AT_RISK: 0, OVERDUE: 0 };
    for (const a of approvals) {
      distribution[a.slaRisk] = (distribution[a.slaRisk] ?? 0) + 1;
    }

    const slaComplianceRate = approvals.length > 0
      ? Math.round((distribution.ON_TRACK / approvals.length) * 100)
      : 100;

    res.json({ distribution, total: approvals.length, slaComplianceRate });
  } catch (error) {
    next(error);
  }
});

approvalsRouter.post('/:id/decide', validateBody(updateApprovalSchema), async (req, res, next) => {
  try {
    const approval = await prisma.approval.findUnique({ where: { id: req.params.id as string } });
    if (!approval) {
      res.status(404).json({ error: 'Approval not found' });
      return;
    }
    const updated = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: req.body.status,
        notes: req.body.notes ?? approval.notes,
        completedAt: new Date(),
      },
    });

    if (req.body.status === 'APPROVED' && approval.requestId) {
      const pendingCount = await prisma.approval.count({
        where: {
          vendorId: approval.vendorId,
          requestId: approval.requestId,
          status: { not: 'APPROVED' },
          id: { not: approval.id },
        },
      });
      if (pendingCount === 0) {
        const requirement = await prisma.vendorRequest.findUnique({
          where: { id: approval.requestId },
        });
        if (requirement) {
          const next = nextStageAfterGovernance(requirement.status);
          if (next) {
            assertTransition(requirement.status, next);
            await prisma.vendorRequest.update({
              where: { id: requirement.id },
              data: { status: next },
            });
          }
        }
      }
    }

    res.json({ approval: { id: updated.id, stage: updated.stage, status: updated.status } });
  } catch (error) {
    if (error instanceof TransitionError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});
