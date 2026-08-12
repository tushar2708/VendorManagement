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
import { assertTransition, nextStageAfterCandidates, nextStageAfterInvites, TransitionError } from '../services/state-machine.js';
import { generateRequestNumber } from '../services/request-number.js';

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type PipelineStep = 'INTAKE_AND_INVITE' | 'VERIFICATION' | 'AWARD_AND_FULL_PACK' | 'GOVERNANCE' | 'CONTRACT' | 'ACTIVATED';
type WhoseCourt = 'Buyer' | 'Vendor' | 'Done';

const STATUS_TO_STEP: Record<string, PipelineStep> = {
  DRAFT: 'INTAKE_AND_INVITE',
  CANDIDATES_SELECTED: 'INTAKE_AND_INVITE',
  INVITES_DISPATCHED: 'INTAKE_AND_INVITE',
  PREQUAL_IN_PROGRESS: 'VERIFICATION',
  PREQUAL_COMPLETE: 'VERIFICATION',
  AWARDED: 'AWARD_AND_FULL_PACK',
  FULL_PACK_SUBMITTED: 'AWARD_AND_FULL_PACK',
  DEEP_VERIFICATION: 'GOVERNANCE',
  APPROVALS_IN_PROGRESS: 'GOVERNANCE',
  CONTRACT_REVIEW: 'CONTRACT',
  ERP_PUSH: 'ACTIVATED',
  COMPLETED: 'ACTIVATED',
  CANCELLED: 'ACTIVATED',
};

const VENDOR_STATUSES = new Set(['PREQUAL_IN_PROGRESS', 'FULL_PACK_SUBMITTED', 'CONTRACT_REVIEW']);
const DONE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

function getPipelineStep(status: string): PipelineStep {
  return STATUS_TO_STEP[status] ?? 'INTAKE_AND_INVITE';
}

function getWhoseCourt(status: string): WhoseCourt {
  if (DONE_STATUSES.has(status)) return 'Done';
  if (VENDOR_STATUSES.has(status)) return 'Vendor';
  return 'Buyer';
}

function getOpenDays(createdAt: Date): number {
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
}

async function logActivity(requestId: string, userId: string, action: string, message: string): Promise<void> {
  await prisma.activityLog.create({
    data: { action: action as any, message, requestId, userId },
  });
}

export const requirementsRouter = Router();

// Every route is user-scoped from Better Auth — a buyer never sees another user's data.
requirementsRouter.use(requireAuth);

requirementsRouter.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const [allRequests, candidatesWithInvites] = await Promise.all([
      prisma.vendorRequest.findMany({
        where: { createdById: userId },
        select: { status: true, createdAt: true },
      }),
      prisma.requestCandidate.findMany({
        where: { request: { createdById: userId }, inviteStatus: { in: ['OPENED', 'REGISTERED'] } },
        select: { vendorId: true },
      }),
    ]);

    const now = Date.now();
    const activeStatuses = new Set([
      'DRAFT', 'CANDIDATES_SELECTED', 'INVITES_DISPATCHED',
      'PREQUAL_IN_PROGRESS', 'PREQUAL_COMPLETE', 'AWARDED',
      'FULL_PACK_SUBMITTED', 'DEEP_VERIFICATION', 'APPROVALS_IN_PROGRESS',
      'CONTRACT_REVIEW', 'ERP_PUSH',
    ]);
    const buyerStatuses = new Set([
      'DRAFT', 'CANDIDATES_SELECTED', 'PREQUAL_COMPLETE',
      'AWARDED', 'DEEP_VERIFICATION', 'APPROVALS_IN_PROGRESS', 'ERP_PUSH',
    ]);

    let active = 0;
    let waitingOnYou = 0;
    let completed = 0;
    let openLongestMs = 0;

    for (const r of allRequests) {
      if (r.status === 'COMPLETED') {
        completed++;
      } else if (activeStatuses.has(r.status)) {
        active++;
        const age = now - r.createdAt.getTime();
        if (age > openLongestMs) openLongestMs = age;
        if (buyerStatuses.has(r.status)) waitingOnYou++;
      }
    }

    const vendorsOnboarded = new Set(candidatesWithInvites.map((c) => c.vendorId)).size;
    const openLongestDays = Math.floor(openLongestMs / (1000 * 60 * 60 * 24));

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
    const userId = req.user!.userId;

    const requests = await prisma.vendorRequest.findMany({
      where: { createdById: userId },
      select: { id: true, status: true, createdAt: true, updatedAt: true, vendorType: true, title: true, category: true },
    });

    // Pipeline funnel counts
    const stepMap: Record<string, string> = {
      DRAFT: 'Intake & invite', CANDIDATES_SELECTED: 'Intake & invite', INVITES_DISPATCHED: 'Intake & invite',
      PREQUAL_IN_PROGRESS: 'Verification', PREQUAL_COMPLETE: 'Verification',
      AWARDED: 'Award & full pack', FULL_PACK_SUBMITTED: 'Award & full pack',
      DEEP_VERIFICATION: 'Governance', APPROVALS_IN_PROGRESS: 'Governance',
      CONTRACT_REVIEW: 'Contract',
      ERP_PUSH: 'Activated', COMPLETED: 'Activated', CANCELLED: 'Activated',
    };
    const funnel: Record<string, number> = {};
    for (const step of ['Intake & invite', 'Verification', 'Award & full pack', 'Governance', 'Contract', 'Activated']) {
      funnel[step] = 0;
    }
    for (const r of requests) {
      const step = stepMap[r.status] ?? 'Intake & invite';
      funnel[step]++;
    }

    // Vendor type breakdown
    const vendorTypes: Record<string, number> = { PRODUCTION_PART: 0, INDIRECT_SERVICES: 0 };
    for (const r of requests) {
      if (r.vendorType === 'PRODUCTION_PART') vendorTypes.PRODUCTION_PART++;
      else vendorTypes.INDIRECT_SERVICES++;
    }

    // Avg time to complete
    const completed = requests.filter(r => r.status === 'COMPLETED');
    const now = Date.now();
    const avgDaysToOnboard = completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + Math.floor((now - r.createdAt.getTime()) / 86400000), 0) / completed.length)
      : 0;

    // Pass rate
    const passedStatuses = new Set(['PREQUAL_COMPLETE', 'AWARDED', 'FULL_PACK_SUBMITTED', 'DEEP_VERIFICATION', 'APPROVALS_IN_PROGRESS', 'CONTRACT_REVIEW', 'ERP_PUSH', 'COMPLETED']);
    const passed = requests.filter(r => passedStatuses.has(r.status)).length;
    const passRate = requests.length > 0 ? Math.round((passed / requests.length) * 100) : 0;

    // Vendor directory count
    const directoryCount = await prisma.vendor.count({ where: { isInDirectory: true } });

    // Recent completions (last 5)
    const recentCompleted = await prisma.vendorRequest.findMany({
      where: { createdById: userId, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { candidates: { where: { isAwarded: true }, include: { vendor: { select: { name: true } } } } },
    });
    const recentCompletions = recentCompleted.map(r => ({
      title: r.title ?? r.category,
      vendorName: r.candidates[0]?.vendor?.name ?? '—',
      days: Math.floor((now - r.createdAt.getTime()) / 86400000),
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
    status: r.status as RequirementSummary['status'],
    pipelineStep: getPipelineStep(r.status),
    whoseCourt: getWhoseCourt(r.status),
    openDays: getOpenDays(r.createdAt),
    candidateCount: r._count.candidates,
    createdAt: r.createdAt.toISOString(),
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
        process: input.process ?? 'RFQ',
        vendorType: input.vendorType ?? 'PRODUCTION_PART',
        processCategories: input.processCategories,
        plantLocation: input.plantLocation ?? null,
        targetAwardDate: input.targetAwardDate ? new Date(input.targetAwardDate) : null,
      },
      include: { _count: { select: { candidates: true } } },
    });
    await logActivity(created.id, req.user!.userId, 'REQUEST_CREATED', 'Requirement created');
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
    status: r.status as any,
    pipelineStep: getPipelineStep(r.status),
    whoseCourt: getWhoseCourt(r.status),
    openDays: getOpenDays(r.createdAt),
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

requirementsRouter.get('/:id/activity', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const requirementId = req.params.id as string;
    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, createdById: userId },
      select: { id: true },
    });
    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }
    const activities = await prisma.activityLog.findMany({
      where: { requestId: requirementId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, action: true, message: true, metadata: true, createdAt: true },
    });
    res.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        message: a.message,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
    });
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

    await logActivity(requirementId, userId, 'CANDIDATES_SELECTED', `${dataToCreate.length} candidate(s) added`);
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

requirementsRouter.patch('/:id/candidates/:candidateId', validateBody(updateCandidateSchema), async (req, res, next) => {
  try {
    const requirementId = req.params.id as string;
    const candidateId = req.params.candidateId as string;
    const candidate = await prisma.requestCandidate.findFirst({
      where: { id: candidateId, requestId: requirementId, request: { createdById: req.user!.userId } },
    });
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    if (candidate.inviteStatus !== 'PENDING') {
      res.status(409).json({ error: 'Cannot edit an invited candidate' });
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
    const detail = await loadDetail(req.user!.userId, requirementId);
    res.json({ requirement: detail });
  } catch (error) {
    next(error);
  }
});

// Dispatch magic-link invites to every not-yet-invited candidate.
requirementsRouter.post('/:id/invites', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const requirementId = req.params.id as string;
    const { candidateIds } = req.body as { candidateIds?: string[] };

    const candidateWhere: any = { inviteStatus: 'PENDING' };
    if (candidateIds && candidateIds.length > 0) {
      candidateWhere.id = { in: candidateIds };
    }

    const requirement = await prisma.vendorRequest.findFirst({
      where: { id: requirementId, createdById: userId },
      include: { candidates: { where: candidateWhere, orderBy: { createdAt: 'asc' } } },
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

    await logActivity(requirementId, userId, 'INVITES_DISPATCHED', `${results.length} invite(s) sent`);
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
