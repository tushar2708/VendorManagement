import { Router } from 'express';
import { updateSlaRuleSchema } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';

export const slaRulesRouter = Router();
slaRulesRouter.use(requireAuth);

slaRulesRouter.get('/', async (_req, res, next) => {
  try {
    const rules = await prisma.slaRule.findMany({ orderBy: { stage: 'asc' } });
    res.json({
      rules: rules.map((r) => ({
        id: r.id,
        stage: r.stage,
        slaDays: r.slaDays,
        escalateAfterBreach: r.escalateAfterBreach,
      })),
    });
  } catch (error) {
    next(error);
  }
});

slaRulesRouter.patch('/:id', validateBody(updateSlaRuleSchema), async (req, res, next) => {
  try {
    const rule = await prisma.slaRule.findUnique({ where: { id: req.params.id as string } });
    if (!rule) {
      res.status(404).json({ error: 'SLA rule not found' });
      return;
    }
    const updated = await prisma.slaRule.update({
      where: { id: rule.id },
      data: req.body,
    });
    res.json({
      rule: { id: updated.id, stage: updated.stage, slaDays: updated.slaDays, escalateAfterBreach: updated.escalateAfterBreach },
    });
  } catch (error) {
    next(error);
  }
});
