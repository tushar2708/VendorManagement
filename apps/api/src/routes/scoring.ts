import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { assertTransition, nextStageAfterAward, TransitionError } from '../services/state-machine.js';
import { z } from 'zod';

export const scoringRouter = Router();
scoringRouter.use(requireAuth);

const updateCriteriaSchema = z.object({
  criteria: z.array(z.object({ name: z.string(), weight: z.number().min(0).max(100) })),
});

const awardSchema = z.object({ candidateId: z.string() });

scoringRouter.get('/:id/scoring', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const requirement = await prisma.vendorRequest.findFirst({
      where: { id, createdById: userId },
      include: {
        scoringCriteria: { orderBy: { sortOrder: 'asc' } },
        candidates: { where: { inviteStatus: { not: 'PENDING' } }, orderBy: { score: 'desc' } },
      },
    });
    if (!requirement) { res.status(404).json({ error: 'Requirement not found' }); return; }

    let criteria = requirement.scoringCriteria;
    if (criteria.length === 0) {
      const defaults = [
        { name: 'Quality & Certifications', weight: 55, sortOrder: 0 },
        { name: 'Commercials & Cost', weight: 35, sortOrder: 1 },
        { name: 'Delivery & Logistics', weight: 65, sortOrder: 2 },
        { name: 'Compliance & Financial Risk', weight: 55, sortOrder: 3 },
      ];
      await prisma.scoringCriterion.createMany({
        data: defaults.map((d) => ({ ...d, requirementId: id })),
      });
      criteria = await prisma.scoringCriterion.findMany({
        where: { requirementId: id }, orderBy: { sortOrder: 'asc' },
      });
    }

    res.json({
      criteria: criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
      candidates: requirement.candidates.map((c) => ({
        id: c.id, legalName: c.legalName, contactEmail: c.contactEmail,
        score: c.score, scoreBreakdown: c.scoreBreakdown, commercials: c.commercials,
        isAwarded: c.isAwarded, pan: c.pan, city: c.city, state: c.state,
      })),
    });
  } catch (error) { next(error); }
});

scoringRouter.patch('/:id/scoring', validateBody(updateCriteriaSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { criteria } = req.body as z.infer<typeof updateCriteriaSchema>;
    for (const c of criteria) {
      await prisma.scoringCriterion.upsert({
        where: { requirementId_name: { requirementId: id, name: c.name } },
        update: { weight: c.weight },
        create: { requirementId: id, name: c.name, weight: c.weight, sortOrder: criteria.indexOf(c) },
      });
    }
    const updated = await prisma.scoringCriterion.findMany({ where: { requirementId: id }, orderBy: { sortOrder: 'asc' } });
    res.json({ criteria: updated.map((c) => ({ id: c.id, name: c.name, weight: c.weight })) });
  } catch (error) { next(error); }
});

scoringRouter.post('/:id/award', validateBody(awardSchema), async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { candidateId } = req.body as z.infer<typeof awardSchema>;
    const requirement = await prisma.vendorRequest.findFirst({ where: { id, createdById: userId } });
    if (!requirement) { res.status(404).json({ error: 'Requirement not found' }); return; }

    const nextStatus = nextStageAfterAward(requirement.status);
    if (!nextStatus) { res.status(409).json({ error: 'Requirement is not in a state that allows awarding' }); return; }
    assertTransition(requirement.status, nextStatus);

    await prisma.$transaction(async (tx) => {
      await tx.requestCandidate.updateMany({ where: { requestId: id }, data: { isAwarded: false } });
      await tx.requestCandidate.update({ where: { id: candidateId }, data: { isAwarded: true } });
      await tx.vendorRequest.update({ where: { id }, data: { status: nextStatus } });
    });

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof TransitionError) { res.status(409).json({ error: error.message }); return; }
    next(error);
  }
});
