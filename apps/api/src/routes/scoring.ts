import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate.js";
import { z } from "zod";

export const scoringRouter = Router();
scoringRouter.use(requireAuth);

const updateCriteriaSchema = z.object({
  criteria: z.array(z.object({ name: z.string(), weight: z.number().min(0).max(100) })),
});

scoringRouter.get('/:id/scoring', async (req, res) => {
  const id = String(req.params.id);
  const requirement = await prisma.vendorRequest.findFirst({
    where: { id, buyerOrgId: req.user!.buyerOrgId! },
    include: {
      scoringCriteria: { orderBy: { sortOrder: 'asc' } },
      candidates: { include: { link: { select: { id: true, state: true, prequalScore: true } } } },
    },
  });
  if (!requirement) { res.status(404).json({ error: "Requirement not found" }); return; }

  let criteria = requirement.scoringCriteria;
  if (criteria.length === 0) {
    const defaults = [
      { name: "Quality & Certifications", weight: 55, sortOrder: 0 },
      { name: "Commercials & Cost", weight: 35, sortOrder: 1 },
      { name: "Delivery & Logistics", weight: 65, sortOrder: 2 },
      { name: "Compliance & Financial Risk", weight: 55, sortOrder: 3 },
    ];
    await prisma.scoringCriterion.createMany({
      data: defaults.map((d) => ({ ...d, requirementId: id })),
    });
    criteria = await prisma.scoringCriterion.findMany({
      where: { requirementId: id }, orderBy: { sortOrder: "asc" },
    });
  }

  res.json({
    criteria: criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
    candidates: requirement.candidates.map((c) => ({
      id: c.id, legalName: c.legalName, contactEmail: c.contactEmail,
      pan: c.pan, city: c.city, state: c.state,
      linkState: c.link?.state ?? null,
      prequalScore: c.link?.prequalScore ?? null,
    })),
  });
});

scoringRouter.patch('/:id/scoring', validateBody(updateCriteriaSchema), async (req, res) => {
  const id = String(req.params.id);
  const requirement = await prisma.vendorRequest.findFirst({ where: { id, buyerOrgId: req.user!.buyerOrgId! } });
  if (!requirement) { res.status(404).json({ error: "Requirement not found" }); return; }

  const { criteria } = req.body as z.infer<typeof updateCriteriaSchema>;
  for (const c of criteria) {
    await prisma.scoringCriterion.upsert({
      where: { requirementId_name: { requirementId: id, name: c.name } },
      update: { weight: c.weight },
      create: { requirementId: id, name: c.name, weight: c.weight, sortOrder: criteria.indexOf(c) },
    });
  }
  const updated = await prisma.scoringCriterion.findMany({ where: { requirementId: id }, orderBy: { sortOrder: "asc" } });
  res.json({ criteria: updated.map((c) => ({ id: c.id, name: c.name, weight: c.weight })) });
});
