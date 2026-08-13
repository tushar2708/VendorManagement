import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { erpProvider } from '../providers/index.js';
import { transition } from '../lib/link-state.js';

export const erpRouter = Router();

/**
 * ERP sync workflow for a link.
 *
 * Guards sit on each route to protect the /api/vendor prefix shared with
 * vendor-facing routes.
 */

function toErpResponse(data: {
  linkId: string;
  erpVendorCode: string | null;
  onboardedAt: Date | null;
}): object {
  return {
    linkId: data.linkId,
    erpVendorCode: data.erpVendorCode,
    onboardedAt: data.onboardedAt?.toISOString() ?? null,
  };
}

erpRouter.get(
  '/:vendorId/erp-push',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response, next) => {
    try {
      const linkId = String(request.params.vendorId);

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        select: { erpVendorCode: true, onboardedAt: true },
      });

      if (!link) {
        throw new NotFoundError('Link not found');
      }

      response.json({ success: true, data: toErpResponse({ linkId, ...link }) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Push vendor to ERP and mark link as ONBOARDED.
 *
 * The push is simulated, but state changes are real. After successful push,
 * the link transitions to ONBOARDED and the vendor is listed in the directory.
 */
erpRouter.post(
  '/:vendorId/erp-push',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response, next) => {
    try {
      const user = (request as any).user;
      const linkId = String(request.params.vendorId);

      const link = await prisma.vendorBuyerLink.findUnique({
        where: { id: linkId },
        include: { candidate: { include: { vendor: true } } },
      });

      if (!link) {
        throw new NotFoundError('Link not found');
      }

      if (link.state === 'ONBOARDED') {
        throw new ConflictError('This vendor is already onboarded');
      }

      if (link.state !== 'APPROVED') {
        throw new ConflictError(
          `Link must be APPROVED before ERP push. Current state: ${link.state}`,
        );
      }

      // Call ERP provider outside transaction to avoid holding it open
      const result = await erpProvider.pushVendor({
        vendorId: link.candidate.vendorId,
        name: link.candidate.vendor.legalName,
      });

      // Update link and directory vendor in transaction
      const updated = await prisma.$transaction(async (tx) => {
        const updatedLink = await (tx as any).vendorBuyerLink.update({
          where: { id: linkId },
          data: {
            erpVendorCode: result.vendorCode,
            onboardedAt: new Date(),
          },
        });

        await (tx as any).directoryVendor.update({
          where: { id: link.candidate.vendorId },
          data: { badgeState: 'VERIFIED' },
        });

        await transition(
          linkId,
          'ONBOARDED',
          {
            actorType: 'BUYER',
            actorId: user.userId,
            note: `ERP push completed with code ${result.vendorCode}`,
          },
          tx as any,
        );

        return updatedLink;
      });

      response.status(201).json({
        success: true,
        data: toErpResponse({
          linkId: updated.id,
          erpVendorCode: updated.erpVendorCode,
          onboardedAt: updated.onboardedAt,
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
