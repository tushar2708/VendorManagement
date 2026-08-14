import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import {
  approvalStageSchema,
  controlDecisionSchema,
  controlFunctions,
  gateOpenedAt,
  slaRiskFor,
  vendorControlsResponseSchema,
  waitingOn,
  GATED_CONTROL,
  EDD_STAGE,
  isCleared,
  type ApprovalStage,
  type ApprovalStatus,
  type ReviewTaskStatus,
} from '@vendor-management/shared';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors.js';
import { trackServer } from '../lib/analytics.js';

export const controlsRouter = Router();

function mapToApprovalStatus(status: ReviewTaskStatus): ApprovalStatus {
  // Map ReviewTaskStatus values to ApprovalStatus for shared functions.
  // CHANGES_REQUESTED (not approved) and PENDING (no decision) both map to REJECTED
  // (not cleared by isCleared function).
  if (status === 'PENDING' || status === 'CHANGES_REQUESTED') {
    return 'REJECTED';
  }
  // IN_PROGRESS, INFORMATION_REQUIRED, APPROVED, EDD_COMPLETE match directly
  return status as unknown as ApprovalStatus;
}

function statusesOf(
  tasks: Array<{ stage: ApprovalStage; status: ReviewTaskStatus }>,
): Partial<Record<ApprovalStage, ApprovalStatus>> {
  return Object.fromEntries(
    tasks.map((task) => [task.stage, mapToApprovalStatus(task.status)]),
  );
}

function completionsOf(
  tasks: Array<{ stage: ApprovalStage; status: ReviewTaskStatus }>,
): Partial<Record<ApprovalStage, Date | null>> {
  return Object.fromEntries(
    tasks.map((task) => [
      task.stage,
      isCleared(mapToApprovalStatus(task.status)) ? new Date() : null,
    ]),
  );
}

/**
 * The eight control functions for a link (vendor).
 *
 * ReviewTask rows are created when someone acts on a function. A vendor nobody
 * has reviewed yet has none. This fills gaps with PENDING — the table shows
 * all eight stages, and untouched stages are explicit rather than absent.
 */
controlsRouter.get(
  '/:vendorId/controls',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response, next) => {
    try {
      const linkId = String(request.params.vendorId);

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        include: {
          candidate: { include: { vendor: { select: { legalName: true } } } },
        },
      });

      if (!link) {
        throw new NotFoundError('No link found with that id');
      }

      const [reviewTasks, slaRules] = await Promise.all([
        prisma.reviewTask.findMany({ where: { linkId } }),
        prisma.slaRule.findMany(),
      ]);

      const byStage = new Map(
        reviewTasks.map((task) => [task.stage, task]),
      );
      const slaDaysByStage = new Map(
        slaRules.map((rule) => [rule.stage, rule.slaDays]),
      );

      const statuses = statusesOf(
        reviewTasks,
      );

      const openedAt = gateOpenedAt(completionsOf(
        reviewTasks,
      ));

      const controls = controlFunctions.map((stage) => {
        const task = byStage.get(stage);
        const outstanding = waitingOn(stage, statuses);
        const waitingSince =
          stage === GATED_CONTROL ? openedAt : (task?.createdAt ?? null);

        const mappedStatus = task ? mapToApprovalStatus(task.status) : undefined;
        return {
          stage,
          status: task?.status ?? 'PENDING',
          slaRisk:
            isCleared(mappedStatus) || outstanding.length > 0
              ? 'ON_TRACK'
              : slaRiskFor(waitingSince, slaDaysByStage.get(stage) ?? null),
          notes: null,
          enteredStageAt: waitingSince?.toISOString() ?? null,
          completedAt: isCleared(mappedStatus)
            ? task?.createdAt?.toISOString() ?? null
            : null,
          waitingOn: outstanding,
        };
      });

      const data = vendorControlsResponseSchema.parse({
        vendorId: link.candidate.vendorId,
        vendorName: link.candidate.vendor.legalName,
        controls,
      });

      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

/** Human-readable stage name for activity messages. */
function stageLabel(stage: ApprovalStage): string {
  return stage
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Reviewer records a decision on one control function.
 *
 * ReviewTask may not exist yet — an untouched control is absent rather than
 * stored as PENDING — so this upserts. The decision is written atomically
 * with its activity record.
 */
controlsRouter.patch(
  '/:vendorId/controls/:stage',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response, next) => {
    try {
      const linkId = String(request.params.vendorId);
      const stage = approvalStageSchema.parse(request.params.stage);
      const input = controlDecisionSchema.parse(request.body);
      const user = (request as any).user;

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        include: {
          candidate: { include: { vendor: { select: { legalName: true } } } },
        },
      });

      if (!link) {
        throw new NotFoundError('Link not found');
      }

      // Sign-off cannot be taken early — all seven gates must clear first
      if (stage === GATED_CONTROL) {
        const existing = await prisma.reviewTask.findMany({
          where: { linkId },
        });
        const existingStatuses = statusesOf(existing);
        const outstanding = waitingOn(stage, existingStatuses);

        if (outstanding.length > 0) {
          throw new ConflictError(
            `Sign-off is waiting on ${outstanding.length} control ${
              outstanding.length === 1 ? 'function' : 'functions'
            } to clear first`,
          );
        }
      }

      // EDD_COMPLETE is only for Compliance
      if (input.status === 'EDD_COMPLETE' && stage !== EDD_STAGE) {
        throw new BadRequestError(
          `Enhanced due diligence is recorded by ${EDD_STAGE.toLowerCase()}, not ${stageLabel(
            stage,
          )}.`,
        );
      }

      const mappedInputStatus = mapToApprovalStatus(input.status as any);
      const isResolved = isCleared(mappedInputStatus) || input.status === 'CHANGES_REQUESTED';

      const saved = await prisma.$transaction(async (tx) => {
        const task = await (tx as any).reviewTask.upsert({
          where: { linkId_stage: { linkId, stage } },
          update: {
            status: input.status,
            assignedUserId: user.userId,
          },
          create: {
            linkId,
            stage,
            status: input.status,
            assignedUserId: user.userId,
          },
        });

        await (tx as any).approvalDecision.create({
          data: {
            reviewTaskId: task.id,
            linkId,
            decision: isCleared(mappedInputStatus) ? 'APPROVED' : 'CHANGES_REQUESTED',
            comment: input.notes ?? null,
            decidedById: user.userId,
            decidedAt: new Date(),
          },
        });

        return task;
      });

      trackServer('governance_decided', {
        distinct_id: user.userId,
        link_id: linkId,
        stage,
        decision: input.status,
        ...(link.buyerOrgId ? { buyer_org: link.buyerOrgId } : {}),
      });

      response.json({
        success: true,
        data: {
          stage: saved.stage,
          status: saved.status,
          slaRisk: 'ON_TRACK',
          notes: null,
          enteredStageAt: saved.createdAt.toISOString(),
          completedAt: isResolved ? new Date().toISOString() : null,
          waitingOn: [],
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
