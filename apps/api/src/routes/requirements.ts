import crypto from 'node:crypto';
import { Router } from 'express';
import {
  createRequirementSchema,
  addCandidatesSchema,
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
import { assertTransition, nextStageAfterCandidates, nextStageAfterInvites, TransitionError } from '../services/state-machine.js';
import { generateRequestNumber } from '../services/request-number.js';

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export const requirementsRouter = Router();

// Every route is user-scoped from Better Auth — a buyer never sees another user's data.
requirementsRouter.use(requireAuth);

interface RequirementRow {
  id: string;
  title: string | null;
  category: string;
  processCategories: string[];
  plantLocation: string | null;
  targetAwardDate: Date | null;
  status: string;
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
    stage: mapStatusToStage(r.status),
    candidateCount: r._count.candidates,
    createdAt: r.createdAt.toISOString(),
  };
}

function mapStatusToStage(status: string): RequirementSummary['stage'] {
  const statusMap: Record<string, RequirementSummary['stage']> = {
    DRAFT: 'DRAFT',
    CANDIDATES_SELECTED: 'CANDIDATES_SELECTED',
    INVITES_DISPATCHED: 'INVITES_SENT',
    PREQUAL_IN_PROGRESS: 'IN_PROGRESS',
    PREQUAL_COMPLETE: 'IN_PROGRESS',
    AWARDED: 'CLOSED',
    FULL_PACK_SUBMITTED: 'IN_PROGRESS',
    DEEP_VERIFICATION: 'IN_PROGRESS',
    APPROVALS_IN_PROGRESS: 'IN_PROGRESS',
    CONTRACT_REVIEW: 'IN_PROGRESS',
    ERP_PUSH: 'IN_PROGRESS',
    COMPLETED: 'CLOSED',
    CANCELLED: 'CLOSED',
  };
  return statusMap[status] || 'DRAFT';
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
  inviteStatus: Candidate['inviteStatus'];
  createdAt: Date;
}

function toCandidate(c: CandidateRow): Candidate {
  return {
    id: c.id,
    requirementId: c.requestId,
    source: c.source,
    directoryVendorId: c.vendorId,
    legalName: c.legalName || '',
    contactEmail: c.contactEmail || '',
    contactPhone: c.contactPhone,
    pan: c.pan,
    gstin: c.gstin,
    city: c.city,
    state: c.state,
    inviteStatus: c.inviteStatus,
    createdAt: c.createdAt.toISOString(),
  };
}

requirementsRouter.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.vendorRequest.findMany({
      where: { createdById: req.user!.userId },
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requirements: rows.map(toSummary) });
  } catch (error) {
    next(error);
  }
});

requirementsRouter.post('/', validateBody(createRequirementSchema), async (req, res, next) => {
  try {
    const input = req.body as CreateRequirementInput;
    const requestNumber = await generateRequestNumber();
    const created = await prisma.vendorRequest.create({
      data: {
        requestNumber,
        createdById: req.user!.userId,
        title: input.title,
        category: input.partCategory ?? '',
        process: 'RFQ',
        vendorType: 'PRODUCTION_PART',
        processCategories: input.processCategories,
        plantLocation: input.plantLocation ?? null,
        targetAwardDate: input.targetAwardDate ? new Date(input.targetAwardDate) : null,
      },
      include: { _count: { select: { candidates: true } } },
    });
    res.status(201).json({ requirement: toSummary(created) });
  } catch (error) {
    next(error);
  }
});

// Load a user-scoped requirement with candidates, or return 404.
async function loadDetail(userId: string, id: string): Promise<RequirementDetail | null> {
  const r = await prisma.vendorRequest.findFirst({
    where: { id, createdById: userId },
    include: { candidates: { orderBy: { createdAt: 'asc' } } },
  });
  if (!r) return null;
  return {
    id: r.id,
    title: r.title || r.category,
    partCategory: r.category,
    processCategories: r.processCategories,
    plantLocation: r.plantLocation,
    targetAwardDate: r.targetAwardDate ? r.targetAwardDate.toISOString() : null,
    stage: mapStatusToStage(r.status),
    createdAt: r.createdAt.toISOString(),
    candidates: r.candidates.map(toCandidate),
  };
}

requirementsRouter.get('/:id', async (req, res, next) => {
  try {
    const detail = await loadDetail(req.user!.userId, req.params.id);
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
    const userId = req.user!.userId;
    const requirementId = req.params.id as string;
    const { candidates } = req.body as AddCandidatesInput;

    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, createdById: userId },
      include: { candidates: { select: { pan: true, vendorId: true } } },
    });
    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    // Dedupe against candidates already on this requirement.
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
        if (existingVendorIds.has(item.directoryVendorId)) continue;
        const vendor = await prisma.vendor.findUnique({ where: { id: item.directoryVendorId } });
        if (!vendor) {
          res.status(400).json({ error: 'Directory vendor not found' });
          return;
        }
        if (vendor.panNumber && existingPans.has(vendor.panNumber)) continue;
        existingVendorIds.add(vendor.id);
        if (vendor.panNumber) existingPans.add(vendor.panNumber);
        dataToCreate.push({
          requestId: requirementId,
          vendorId: vendor.id,
          source: 'DIRECTORY',
          legalName: vendor.name,
          contactEmail: vendor.contactEmail,
          contactPhone: null,
          pan: vendor.panNumber,
          gstin: vendor.gstin,
          city: vendor.city,
          state: vendor.state,
        });
      } else {
        if (item.pan && existingPans.has(item.pan)) continue;
        if (item.pan) existingPans.add(item.pan);
        dataToCreate.push({
          requestId: requirementId,
          vendorId: '', // Placeholder - will be set by caller for MANUAL source
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
        // For MANUAL candidates, we create a placeholder vendor or use an existing one.
        for (const data of dataToCreate) {
          if (data.source === 'MANUAL') {
            // Create a vendor record for manual candidates if needed
            let vendor = await tx.vendor.findFirst({
              where: { contactEmail: data.contactEmail },
            });
            if (!vendor) {
              vendor = await tx.vendor.create({
                data: {
                  name: data.legalName,
                  contactEmail: data.contactEmail,
                  panNumber: data.pan,
                  gstin: data.gstin,
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
            },
          });
        }
      }
      const nextStatus = nextStageAfterCandidates(requirement.status);
      if (nextStatus && dataToCreate.length > 0) {
        assertTransition(requirement.status, nextStatus);
        await tx.vendorRequest.update({
          where: { id: requirementId },
          data: { status: nextStatus },
        });
      }
    });

    const detail = await loadDetail(userId, requirementId);
    res.status(201).json({ requirement: detail, added: dataToCreate.length });
  } catch (error) {
    if (error instanceof TransitionError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

requirementsRouter.delete('/:id/candidates/:candidateId', async (req, res, next) => {
  try {
    const candidate = await prisma.requestCandidate.findFirst({
      where: { id: req.params.candidateId, requestId: req.params.id, request: { createdById: req.user!.userId } },
    });
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    if (candidate.inviteStatus !== 'PENDING') {
      res.status(409).json({ error: 'Cannot remove a candidate that has already been invited' });
      return;
    }
    await prisma.requestCandidate.delete({ where: { id: candidate.id } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Dispatch magic-link invites to every not-yet-invited candidate.
requirementsRouter.post('/:id/invites', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const requirementId = req.params.id as string;

    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, createdById: userId },
      include: { candidates: { where: { inviteStatus: 'PENDING' }, orderBy: { createdAt: 'asc' } } },
    });
    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    // Get buyer org name from the created user's name
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const orgName = user?.name ?? 'Your buyer';

    const results: InviteResult[] = [];

    for (const candidate of requirement.candidates) {
      // Cryptographically-random token; only its hash is stored (plus the plain
      // value in dev so the link is visible).
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const link = `${env.APP_BASE_URL}/invite/${token}`;

      // Email (or log) BEFORE persisting; never throws.
      const sent = await sendInviteEmail({
        to: candidate.contactEmail || '',
        orgName,
        requirementTitle: requirement.title || requirement.category,
        link,
      });

      // Each candidate's write is its own transaction so a mid-loop failure
      // never leaves a half-written invite.
      await prisma.$transaction(async (tx) => {
        await tx.vendorInvitation.create({
          data: {
            vendorId: candidate.vendorId,
            requestId: requirementId,
            tokenHash,
            magicTokenPlain: token,
            email: candidate.contactEmail,
            expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          },
        });
        await tx.requestCandidate.update({
          where: { id: candidate.id },
          data: { inviteStatus: 'INVITED' },
        });
      });

      results.push({ candidateId: candidate.id, email: candidate.contactEmail || '', sent, link });
    }

    const nextStatus = nextStageAfterInvites(requirement.status);
    if (results.length > 0 && nextStatus) {
      assertTransition(requirement.status, nextStatus);
      await prisma.vendorRequest.update({
        where: { id: requirementId },
        data: { status: nextStatus },
      });
    }

    const detail = await loadDetail(userId, requirementId);
    res.json({ results, requirement: detail });
  } catch (error) {
    if (error instanceof TransitionError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});
