import { Router } from 'express';

import { prisma } from '@vendor-management/db';
import {
  controlFunctions,
  daysElapsed,
  isCleared,
  vendorTrackerResponseSchema,
  type MilestoneActor,
} from '@vendor-management/shared';

import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { DomainError, NotFoundError } from '../lib/errors.js';

export const trackerRouter = Router();

/**
 * Per-route, not router-level: this shares the /api/vendors prefix with the
 * buyer-facing routers, and a router-level guard would answer for their paths
 * too. See the same note in controls.ts.
 */
interface MilestoneDefinition {
  readonly key: string;
  readonly label: string;
  readonly actor: MilestoneActor;
  /** Any one of these having happened marks the milestone done. */
  readonly states: readonly string[];
}

/**
 * The vendor's view of the journey, which is coarser than the buyer's many
 * statuses. A vendor does not care that a record moved from FULL_UNDER_REVIEW to
 * CONTRACTS_IN_PROGRESS; they care whether anyone is waiting on them.
 */
const MILESTONES: readonly MilestoneDefinition[] = [
  {
    key: 'invite_opened',
    label: 'Invite opened',
    actor: 'YOU',
    states: ['PREQUAL_IN_PROGRESS'],
  },
  {
    key: 'prequal_submitted',
    label: 'Pre-qual submitted',
    actor: 'YOU',
    states: ['PREQUAL_SUBMITTED', 'PREQUAL_UNDER_REVIEW'],
  },
  {
    key: 'buyer_review',
    label: 'Buyer review & scoring',
    actor: 'BUYER',
    states: ['PREQUAL_UNDER_REVIEW'],
  },
  {
    key: 'award',
    label: 'Award decision',
    actor: 'BUYER',
    states: ['AWARDED'],
  },
  {
    key: 'full_onboarding',
    label: 'Full document pack',
    actor: 'YOU',
    states: ['FULL_IN_PROGRESS', 'FULL_SUBMITTED', 'FULL_UNDER_REVIEW'],
  },
  {
    key: 'governance',
    label: 'Governance review',
    actor: 'BUYER',
    states: [],
  },
  {
    key: 'contract_buyer',
    label: 'Contracts signed by buyer',
    actor: 'BUYER',
    states: [],
  },
  {
    key: 'contract_vendor',
    label: 'Contracts signed by you',
    actor: 'YOU',
    states: [],
  },
  {
    key: 'contract',
    label: 'Contract executed',
    actor: 'BUYER',
    states: ['APPROVED'],
  },
  {
    key: 'erp_sync',
    label: 'ERP sync & vendor code issued',
    actor: 'PLATFORM',
    states: ['ERP_SYNCING', 'ONBOARDED'],
  },
  {
    key: 'activated',
    label: 'Vendor activated',
    actor: 'PLATFORM',
    states: ['ONBOARDED'],
  },
] as const;

/**
 * The tracker for one vendor. Shared by the vendor's own view and the buyer's
 * read-only preview so both sides read the same journey — a buyer inspecting
 * progress sees exactly what the vendor sees, not a second interpretation.
 */
export async function buildVendorTracker(
  linkId: string,
): Promise<ReturnType<typeof vendorTrackerResponseSchema.parse>> {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      requirement: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          createdBy: { select: { name: true, buyerRole: true } },
        },
      },
      candidate: { select: { legalName: true } },
      events: {
        orderBy: { occurredAt: 'asc' },
        select: { toState: true, occurredAt: true },
      },
      verificationChecks: {
        select: { status: true },
      },
      reviewTasks: {
        select: { status: true, createdAt: true },
      },
      contracts: {
        include: {
          versions: {
            select: { uploadedBySide: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!link) {
    throw new NotFoundError('Link not found');
  }

  const firstStateAt = (states: readonly string[]): Date | null => {
    const event = link.events.find((e) => states.includes(e.toState));
    return event?.occurredAt ?? null;
  };

  const awardedAt = firstStateAt(['AWARDED']);
  const submittedAt = firstStateAt(['PREQUAL_SUBMITTED']);
  const fullPackSubmittedAt = firstStateAt(['FULL_SUBMITTED']);

  // Governance is done when all control function tasks exist and have cleared.
  const clearedReviews = link.reviewTasks.filter((task) => isCleared(task.status as never));
  const governanceAt =
    clearedReviews.length === controlFunctions.length
      ? clearedReviews.reduce<Date | null>((latest, task) => {
          const at = task.createdAt;
          return !latest || at > latest ? at : latest;
        }, null)
      : null;

  // Contract signatures: buyer and vendor sides.
  const buyerSignedVersions = link.contracts
    .flatMap((c) => c.versions.filter((v) => v.uploadedBySide === 'BUYER'))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const vendorSignedVersions = link.contracts
    .flatMap((c) => c.versions.filter((v) => v.uploadedBySide === 'VENDOR'))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const buyerSignedAt = buyerSignedVersions.length > 0 ? buyerSignedVersions[0].createdAt : null;
  const vendorSignedAt = vendorSignedVersions.length > 0 ? vendorSignedVersions[0].createdAt : null;

  // First milestone with nothing recorded is the one in flight.
  let currentAssigned = false;
  const milestones = MILESTONES.map((definition) => {
    let at: Date | null = null;

    if (definition.key === 'governance') {
      at = governanceAt;
    } else if (definition.key === 'contract_buyer') {
      at = buyerSignedAt;
    } else if (definition.key === 'contract_vendor') {
      at = vendorSignedAt;
    } else {
      at = firstStateAt(definition.states);
    }

    let state: 'DONE' | 'CURRENT' | 'PENDING';

    if (at) {
      state = 'DONE';
    } else if (!currentAssigned) {
      state = 'CURRENT';
      currentAssigned = true;
    } else {
      state = 'PENDING';
    }

    const detail =
      definition.key !== 'activated'
        ? null
        : state === 'DONE'
          ? link.erpVendorCode
            ? `Vendor code ${link.erpVendorCode} issued`
            : 'Onboarded successfully'
          : 'Awaiting ERP sync';

    return {
      key: definition.key,
      label: definition.label,
      state,
      actor: definition.actor,
      at: at?.toISOString() ?? null,
      detail,
    };
  });

  // Turnaround split by side: how long vendor took to submit, and how long
  // buyer has held it since. Anchored on real events, not on the clock.
  const openedAt = awardedAt ?? link.createdAt;
  const youWaitedDays = submittedAt ? daysElapsed(openedAt, submittedAt) : daysElapsed(openedAt);
  const buyerPendingDays = fullPackSubmittedAt
    ? daysElapsed(fullPackSubmittedAt)
    : submittedAt
      ? daysElapsed(submittedAt)
      : 0;

  const data = vendorTrackerResponseSchema.parse({
    requestId: link.requirement.id,
    requestNumber: link.requirement.id.slice(0, 8),
    category: link.requirement.title ?? 'Requirement',
    status: link.state,
    contactName: link.requirement.createdBy?.name ?? null,
    contactRole:
      link.requirement.createdBy?.buyerRole === 'OWNER'
        ? 'Sourcing Owner'
        : link.requirement.createdBy?.buyerRole ?? null,
    youWaitedDays,
    buyerPendingDays,
    milestones,
    controlsCleared: clearedReviews.length,
    controlsTotal: controlFunctions.length,
  });

  return data;
}

/** The signed-in vendor's own tracker. */
trackerRouter.get(
  '/me/tracker',
  requireAuth,
  requireRole('VENDOR'),
  async (request, response) => {
    const vendorUserId = request.user!.userId;

    const link = await prisma.vendorBuyerLink.findFirst({
      where: { vendorUserId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!link) {
      throw new NotFoundError('No onboarding link found for this account');
    }

    response.json({ success: true, data: await buildVendorTracker(link.id) });
  },
);

/**
 * The same tracker, read-only, for a buyer inspecting a vendor's progress
 * without leaving the buyer view.
 */
trackerRouter.get(
  '/:id/tracker',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response) => {
    const linkId = String(request.params.id);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { id: true, buyerOrgId: true },
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    if (link.buyerOrgId !== request.user!.buyerOrgId && request.user!.role !== 'ADMIN') {
      throw new DomainError('Access denied', 403);
    }

    response.json({ success: true, data: await buildVendorTracker(linkId) });
  },
);
