import crypto from 'node:crypto';
import { Router } from 'express';
import {
  createRequirementSchema,
  addCandidatesSchema,
  updateCandidateSchema,
  type CreateRequirementInput,
  type AddCandidatesInput,
  type RequirementSummary,
  type Candidate,
  type RequirementDetail,
  type InviteResult,
} from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendInviteEmail } from '../lib/email.js';
import { generateRequestNumber } from '../services/request-number.js';

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface RequirementRow {
  id: string;
  title: string | null;
  category: string;
  processCategories: string[];
  plantLocation: string | null;
  targetAwardDate: Date | null;
  stage: string;
  createdAt: Date;
  _count: { candidates: number };
}

function toSummary(r: RequirementRow): RequirementSummary {
  return {
    id: r.id,
    title: r.title || r.category,
    partCategory: r.category,
    processCategories: r.processCategories,
    plantLocation: r.plantLocation,
    targetAwardDate: r.targetAwardDate ? r.targetAwardDate.toISOString() : null,
    stage: r.stage as RequirementSummary['stage'],
    createdAt: r.createdAt.toISOString(),
    candidateCount: r._count.candidates,
  };
}

interface CandidateRow {
  id: string;
  requestId: string;
  source: Candidate['source'];
  vendorId: string | null;
  legalName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pan: string | null;
  gstin: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  link?: {
    id: string;
    state: string;
    prequalScore: number | null;
  } | null;
}

function toCandidate(c: any): Candidate {
  return {
    id: c.id,
    source: c.source,
    legalName: c.legalName || '',
    contactEmail: c.contactEmail || '',
    contactPhone: c.contactPhone,
    pan: c.pan,
    gstin: c.gstin,
    city: c.city,
    state: c.state,
    inviteStatus: 'PENDING',
    createdAt: c.createdAt.toISOString(),
    link: c.link
      ? {
          id: c.link.id,
          state: c.link.state as any,
          prequalScore: c.link.prequalScore,
        }
      : null,
  };
}

export const requirementsRouter = Router();

requirementsRouter.use(requireAuth);

requirementsRouter.get('/stats', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;

    const allRequests = await prisma.vendorRequest.findMany({
      where: { buyerOrgId },
      select: { stage: true, createdAt: true },
    });

    const vendorsOnboarded = await prisma.vendorBuyerLink.count({
      where: { buyerOrgId, state: 'ONBOARDED' },
    });

    const now = Date.now();
    const activeStages = new Set([
      'DRAFT',
      'CANDIDATES_SELECTED',
      'INVITES_SENT',
      'IN_PROGRESS',
    ]);
    const completedStages = new Set(['CLOSED']);

    let active = 0;
    let completed = 0;
    let openLongestMs = 0;

    for (const r of allRequests) {
      if (completedStages.has(r.stage)) {
        completed++;
      } else if (activeStages.has(r.stage)) {
        active++;
        const age = now - r.createdAt.getTime();
        if (age > openLongestMs) openLongestMs = age;
      }
    }

    const openLongestDays = Math.floor(openLongestMs / (1000 * 60 * 60 * 24));

    const waitingOnYou = await prisma.vendorBuyerLink.count({
      where: {
        buyerOrgId,
        state: {
          in: [
            'PREQUAL_SUBMITTED', 'PREQUAL_UNDER_REVIEW', 'PREQUAL_CLEARED',
            'FULL_SUBMITTED', 'FULL_UNDER_REVIEW', 'CONTRACTS_IN_PROGRESS', 'APPROVED',
          ],
        },
      },
    });

    res.json({
      active,
      waitingOnYou,
      completed,
      vendorsOnboarded,
      openLongestDays,
    });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.get('/analytics', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;

    const requests = await prisma.vendorRequest.findMany({
      where: { buyerOrgId },
      select: { id: true, stage: true, vendorType: true, createdAt: true, updatedAt: true, title: true, category: true },
    });

    const stageMap: Record<string, string> = {
      DRAFT: 'Intake & invite',
      CANDIDATES_SELECTED: 'Intake & invite',
      INVITES_SENT: 'Intake & invite',
      IN_PROGRESS: 'In progress',
      CLOSED: 'Closed',
    };

    const funnel: Record<string, number> = {
      'Intake & invite': 0,
      'In progress': 0,
      Closed: 0,
    };

    for (const r of requests) {
      const step = stageMap[r.stage] ?? 'Intake & invite';
      funnel[step]++;
    }

    const completed = requests.filter((r) => r.stage === 'CLOSED');
    const now = Date.now();
    const avgDaysToOnboard = completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + Math.floor((now - r.createdAt.getTime()) / 86400000), 0) / completed.length,
        )
      : 0;

    const vendorTypes: Record<string, number> = {};
    for (const r of requests) {
      const vt = (r as any).vendorType ?? 'PRODUCTION_PART';
      vendorTypes[vt] = (vendorTypes[vt] ?? 0) + 1;
    }

    const directoryCount = await prisma.directoryVendor.count();
    const passRate = requests.length > 0
      ? Math.round((completed.length / requests.length) * 100)
      : 0;

    const recentCompletions = completed
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map((r) => ({
        title: r.title ?? '',
        vendorName: '',
        days: Math.floor((r.updatedAt.getTime() - r.createdAt.getTime()) / 86400000),
        completedAt: r.updatedAt.toISOString(),
      }));

    res.json({
      totalRequests: requests.length,
      completedCount: completed.length,
      avgDaysToOnboard,
      passRate,
      directoryCount,
      funnel,
      vendorTypes,
      recentCompletions,
    });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.get('/', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;

    const rows = await prisma.vendorRequest.findMany({
      where: { buyerOrgId },
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      requirements: rows.map((r) => ({
        id: r.id,
        title: r.title || r.category,
        partCategory: r.category,
        processCategories: r.processCategories,
        plantLocation: r.plantLocation,
        targetAwardDate: r.targetAwardDate ? r.targetAwardDate.toISOString() : null,
        stage: r.stage,
        candidateCount: r._count.candidates,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.post('/', validateBody(createRequirementSchema), async (req, res, next) => {
  try {
    const input = req.body as CreateRequirementInput;
    const buyerOrgId = req.user!.buyerOrgId!;

    const requestNumber = await generateRequestNumber();
    const created = await prisma.vendorRequest.create({
      data: {
        requestNumber,
        buyerOrgId,
        createdById: req.user!.userId,
        title: input.title,
        category: input.partCategory ?? '',
        process: input.process ?? 'RFQ',
        vendorType: input.vendorType ?? 'PRODUCTION_PART',
        processCategories: input.processCategories,
        plantLocation: input.plantLocation ?? null,
        targetAwardDate: input.targetAwardDate ? new Date(input.targetAwardDate) : null,
        stage: 'DRAFT',
      },
      include: { _count: { select: { candidates: true } } },
    });

    res.status(201).json({
      requirement: {
        id: created.id,
        title: created.title || created.category,
        partCategory: created.category,
        processCategories: created.processCategories,
        plantLocation: created.plantLocation,
        targetAwardDate: created.targetAwardDate ? created.targetAwardDate.toISOString() : null,
        stage: created.stage,
        candidateCount: created._count.candidates,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

async function loadDetail(buyerOrgId: string, id: string): Promise<RequirementDetail | null> {
  const r = await prisma.vendorRequest.findFirst({
    where: { id, buyerOrgId },
    include: {
      candidates: {
        orderBy: { createdAt: 'asc' },
        include: {
          link: {
            select: { id: true, state: true, prequalScore: true },
          },
        },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    requestNumber: r.requestNumber,
    title: r.title || r.category,
    category: r.category,
    processCategories: r.processCategories,
    plantLocation: r.plantLocation,
    targetAwardDate: r.targetAwardDate ? r.targetAwardDate.toISOString() : null,
    stage: r.stage as any,
    createdAt: r.createdAt.toISOString(),
    candidates: r.candidates.map(toCandidate),
  };
}

requirementsRouter.get('/:id', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;
    const detail = await loadDetail(buyerOrgId, String(req.params.id));

    if (!detail) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    res.json({ requirement: detail });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.post('/:id/candidates', validateBody(addCandidatesSchema), async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;
    const requirementId = String(req.params.id);
    const { candidates } = req.body as AddCandidatesInput;

    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, buyerOrgId },
      include: { candidates: { select: { pan: true, vendorId: true } } },
    });

    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    const existingPans = new Set(requirement.candidates.map((c) => c.pan).filter(Boolean));
    const existingVendorIds = new Set(
      requirement.candidates.map((c) => c.vendorId).filter((v): v is string => Boolean(v)),
    );

    const dataToCreate: Array<{
      requestId: string;
      vendorId: string;
      source: 'MANUAL' | 'DIRECTORY';
      legalName: string;
      contactEmail: string;
      contactPhone: string | null;
      pan: string | null;
      gstin: string | null;
      city: string | null;
      state: string | null;
    }> = [];

    for (const item of candidates) {
      if (item.source === 'directory') {
        if (existingVendorIds.has(item.vendorId)) continue;

        const vendor = await prisma.directoryVendor.findUnique({
          where: { id: item.vendorId },
        });

        if (!vendor) {
          res.status(400).json({ error: 'Directory vendor not found' });
          return;
        }

        if (vendor.pan && existingPans.has(vendor.pan)) continue;

        existingVendorIds.add(vendor.id);
        if (vendor.pan) existingPans.add(vendor.pan);

        dataToCreate.push({
          requestId: requirementId,
          vendorId: vendor.id,
          source: 'DIRECTORY',
          legalName: vendor.legalName,
          contactEmail: vendor.contactEmail,
          contactPhone: null,
          pan: vendor.pan,
          gstin: vendor.primaryGstin,
          city: vendor.city,
          state: vendor.state,
        });
      } else {
        if (item.pan && existingPans.has(item.pan)) continue;
        if (item.pan) existingPans.add(item.pan);

        dataToCreate.push({
          requestId: requirementId,
          vendorId: '',
          source: 'MANUAL',
          legalName: item.legalName,
          contactEmail: item.contactEmail,
          contactPhone: item.contactPhone ?? null,
          pan: item.pan ?? null,
          gstin: item.gstin ?? null,
          city: item.city ?? null,
          state: item.state ?? null,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (dataToCreate.length > 0) {
        for (const data of dataToCreate) {
          if (data.source === 'MANUAL') {
            let vendor = await tx.directoryVendor.findFirst({
              where: { contactEmail: data.contactEmail },
            });

            if (!vendor) {
              vendor = await tx.directoryVendor.create({
                data: {
                  legalName: data.legalName,
                  contactEmail: data.contactEmail,
                  pan: data.pan,
                  primaryGstin: data.gstin,
                  city: data.city,
                  state: data.state,
                },
              });
            }

            data.vendorId = vendor.id;
          }
        }

        for (const data of dataToCreate) {
          await tx.requestCandidate.create({
            data: {
              requestId: data.requestId,
              vendorId: data.vendorId,
              source: data.source,
              legalName: data.legalName,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              pan: data.pan,
              gstin: data.gstin,
              city: data.city,
              state: data.state,
              buyerOrgId,
            },
          });
        }
      }

      if (dataToCreate.length > 0 && requirement.stage === 'DRAFT') {
        await tx.vendorRequest.update({
          where: { id: requirementId },
          data: { stage: 'CANDIDATES_SELECTED' },
        });
      }
    });

    const detail = await loadDetail(buyerOrgId, requirementId);
    res.status(201).json({ requirement: detail, added: dataToCreate.length });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.delete('/:id/candidates/:candidateId', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;
    const candidateId = String(req.params.candidateId);
    const requirementId = String(req.params.id);

    const candidate = await prisma.requestCandidate.findFirst({
      where: {
        id: candidateId,
        requestId: requirementId,
        buyerOrgId,
      },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    await prisma.requestCandidate.delete({ where: { id: candidate.id } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.patch('/:id/candidates/:candidateId', validateBody(updateCandidateSchema), async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;
    const requirementId = String(req.params.id);
    const candidateId = String(req.params.candidateId);

    const candidate = await prisma.requestCandidate.findFirst({
      where: {
        id: candidateId,
        requestId: requirementId,
        buyerOrgId,
      },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const updateData: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(req.body as Record<string, string>)) {
      updateData[key] = value === '' ? null : value;
    }

    await prisma.requestCandidate.update({
      where: { id: candidate.id },
      data: updateData,
    });

    const detail = await loadDetail(buyerOrgId, requirementId);
    res.json({ requirement: detail });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.post('/:id/invites', async (req, res, next) => {
  try {
    const buyerOrgId = req.user!.buyerOrgId!;
    const requirementId = String(req.params.id);
    const { candidateIds } = req.body as { candidateIds?: string[] };

    const where: any = {};
    if (candidateIds && candidateIds.length > 0) {
      where.id = { in: candidateIds };
    }

    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, buyerOrgId },
      include: { candidates: { where, orderBy: { createdAt: 'asc' } } },
    });

    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const orgName = user?.name ?? 'Your buyer';

    const results: InviteResult[] = [];

    for (const candidate of requirement.candidates) {
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const link = `${env.APP_BASE_URL}/invite/${token}`;

      const sent = await sendInviteEmail({
        to: candidate.contactEmail || '',
        orgName,
        requirementTitle: requirement.title || requirement.category,
        link,
      });

      await prisma.$transaction(async (tx) => {
        await tx.vendorInvitation.create({
          data: {
            requestId: requirementId,
            buyerOrgId,
            tokenHash,
            magicTokenPlain: token,
            email: candidate.contactEmail,
            expiresAt: new Date(Date.now() + INVITE_TTL_MS),
            status: 'INVITED',
          },
        });

        await tx.vendorBuyerLink.create({
          data: {
            candidateId: candidate.id,
            requestId: requirementId,
            buyerOrgId,
            state: 'INVITED',
            stage: 'PREQUAL',
          },
        });
      });

      results.push({ candidateId: candidate.id, email: candidate.contactEmail || '', sent, link });
    }

    if (results.length > 0) {
      await prisma.vendorRequest.update({
        where: { id: requirementId },
        data: { stage: 'INVITES_SENT' },
      });
    }

    const detail = await loadDetail(buyerOrgId, requirementId);
    res.json({ results, requirement: detail });
  } catch (error) {
    next(error);
  }
});
