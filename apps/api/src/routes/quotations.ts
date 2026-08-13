import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import {
  landedCostOf,
  scoreCandidates,
  scoringResponseSchema,
  upsertQuotationSchema,
  type ScoringInput,
} from '@vendor-management/shared';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { NotFoundError } from '../lib/errors.js';

export const quotationsRouter = Router();

quotationsRouter.use(requireAuth);
quotationsRouter.use(requireRole('BUYER', 'ADMIN'));

/** Verification statuses that count as cleanly resolved. */
const CLEAN_STATUSES = new Set(['PASSED', 'ACCEPTED']);

/**
 * All candidates on a request with their quotations and derived scores.
 *
 * Cost and delivery are scored relative to other quotes on the same request.
 * A single quote cannot be scored in isolation.
 */
quotationsRouter.get('/:id/scoring', async (request, response, next) => {
  try {
    const requestId = String(request.params.id);

    const record = await prisma.vendorRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundError('No request found with that id');
    }

    const [candidates, quotations, checks, links] = await Promise.all([
      prisma.requestCandidate.findMany({
        where: { requestId },
        include: {
          vendor: {
            select: {
              id: true,
              legalName: true,
              badgeState: true,
              certificationTags: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.quotation.findMany({ where: { requestId } }),
      prisma.verificationCheck.findMany({
        select: { linkId: true, status: true },
      }),
      prisma.vendorBuyerLink.findMany({
        select: { id: true, candidate: { select: { vendorId: true } } },
      }),
    ]);

    const quoteByVendor = new Map(
      quotations.map((quotation) => [quotation.vendorId, quotation]),
    );

    const linkByVendorId = new Map(
      links.map((link) => [link.candidate.vendorId, link.id]),
    );
    const linkIdMap = new Map(
      links.map((link) => [link.id, link.candidate.vendorId]),
    );

    const checksByVendor = new Map<string, { run: number; passed: number }>();
    for (const check of checks) {
      const vendorId = linkIdMap.get(check.linkId);
      if (!vendorId) continue;

      const tally = checksByVendor.get(vendorId) ?? { run: 0, passed: 0 };
      tally.run += 1;
      if (CLEAN_STATUSES.has(check.status)) {
        tally.passed += 1;
      }
      checksByVendor.set(vendorId, tally);
    }

    const inputs: ScoringInput[] = candidates.map((candidate) => {
      const quotation = quoteByVendor.get(candidate.vendorId);
      const tally = checksByVendor.get(candidate.vendorId) ?? {
        run: 0,
        passed: 0,
      };

      return {
        vendorId: candidate.vendorId,
        prequalScore: null, // Not available in this schema
        landedCost: quotation ? landedCostOf(quotation) : null,
        leadTimeDays: quotation?.leadTimeDays ?? null,
        checksRun: tally.run,
        checksPassed: tally.passed,
      };
    });

    const scores = scoreCandidates(inputs);

    const data = scoringResponseSchema.parse({
      requestId,
      candidates: candidates.map((candidate) => {
        const quotation = quoteByVendor.get(candidate.vendorId);

        return {
          candidateId: candidate.id,
          vendorId: candidate.vendorId,
          vendorName: candidate.vendor.legalName,
          status: candidate.vendor.badgeState,
          isVerified: candidate.vendor.badgeState === 'VERIFIED',
          certifications: candidate.vendor.certificationTags,
          prequalScore: null,
          unitPrice: quotation?.unitPrice ?? null,
          toolingPerUnit: quotation?.toolingPerUnit ?? null,
          freightPerUnit: quotation?.freightPerUnit ?? null,
          landedCost: quotation ? landedCostOf(quotation) : null,
          leadTimeDays: quotation?.leadTimeDays ?? null,
          location: quotation?.location ?? null,
          capacityNote: quotation?.capacityNote ?? null,
          scores: scores[candidate.vendorId],
        };
      }),
    });

    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * Record a quotation from a vendor for a request.
 *
 * Replaces any earlier quotation for that vendor on this request.
 */
quotationsRouter.put('/:id/quotations/:vendorId', async (request, response, next) => {
  try {
    const user = (request as any).user;
    const requestId = String(request.params.id);
    const vendorId = String(request.params.vendorId);
    const input = upsertQuotationSchema.parse(request.body);

    const candidate = await prisma.requestCandidate.findUnique({
      where: { requestId_vendorId: { requestId, vendorId } },
      include: { vendor: { select: { legalName: true } } },
    });

    if (!candidate) {
      throw new NotFoundError(
        'That vendor is not a candidate on this request',
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      return await (tx as any).quotation.upsert({
        where: { requestId_vendorId: { requestId, vendorId } },
        update: { ...input, capturedById: user.userId },
        create: { ...input, requestId, vendorId, capturedById: user.userId },
      });
    });

    response.json({
      success: true,
      data: {
        vendorId,
        unitPrice: saved.unitPrice,
        landedCost: landedCostOf(saved),
        leadTimeDays: saved.leadTimeDays,
      },
    });
  } catch (error) {
    next(error);
  }
});
