import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '@vendor-management/db';
import { verificationCheckTypeSchema, verificationStatusSchema } from '@vendor-management/shared';

import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { toDocumentResponse, toVerificationCheckResponse } from '../lib/serialize.js';
import { recordOverride } from '../lib/verification.js';
import { verificationProvider } from '../providers/index.js';
import { requireAuth, requireRole } from '../middleware/require-auth.js';

export const vendorsRouter = Router();

vendorsRouter.use(requireAuth);

const prequalSubmissionSchema = z.object({
  panNumber: z.string().length(10),
  gstin: z.string().length(15),
  udyamNumber: z.string().optional(),
});
type PrequalSubmissionInput = z.infer<typeof prequalSubmissionSchema>;

const verificationOverrideSchema = z.object({
  status: z.enum(['PASS', 'FAIL']),
  notes: z.string().optional(),
});
type VerificationOverrideInput = z.infer<typeof verificationOverrideSchema>;

const prequalDecisionSchema = z.object({
  score: z.number().int().min(0).max(100),
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});
type PrequalDecisionInput = z.infer<typeof prequalDecisionSchema>;

async function loadLinkForVendor(vendorUserId: string): Promise<string> {
  const link = await prisma.vendorBuyerLink.findFirst({
    where: { vendorUserId },
    select: { id: true },
  });

  if (!link) {
    throw new NotFoundError('No vendor link found for this account');
  }

  return link.id;
}

async function isResolved(status: string): Promise<boolean> {
  return status === 'PASSED' || status === 'ACCEPTED';
}

async function runPrequalChecks(
  linkId: string,
  input: PrequalSubmissionInput,
): Promise<Array<{ id: string; checkType: string; status: string; matchScore: number | null }>> {
  const checkTypes: Array<z.infer<typeof verificationCheckTypeSchema>> = ['PAN', 'GST', 'UDYAM'];
  const results = [];

  for (const checkType of checkTypes) {
    let subjectValue = '';
    if (checkType === 'PAN') subjectValue = input.panNumber;
    if (checkType === 'GST') subjectValue = input.gstin;
    if (checkType === 'UDYAM' && input.udyamNumber) subjectValue = input.udyamNumber;

    if (!subjectValue && checkType === 'UDYAM') {
      continue;
    }

    const outcome = await verificationProvider.check(checkType, { value: subjectValue });

    const check = await prisma.verificationCheck.upsert({
      where: { linkId_checkType: { linkId, checkType } },
      create: {
        linkId,
        checkType,
        subjectValue,
        status: outcome.status,
        matchScore: outcome.matchScore ?? null,
        detail: outcome.rawResponse,
        ranAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      update: {
        status: outcome.status,
        matchScore: outcome.matchScore ?? null,
        detail: outcome.rawResponse,
        ranAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    results.push({
      id: check.id,
      checkType: check.checkType,
      status: check.status,
      matchScore: check.matchScore,
    });
  }

  return results;
}

/**
 * Vendor submits PAN/GSTIN/Udyam. The checks run immediately via the
 * verification provider. The vendor sees a verdict without waiting.
 */
vendorsRouter.post('/me/prequal', requireRole('VENDOR'), async (request, response) => {
  const vendorUserId = request.user!.userId;
  const input = prequalSubmissionSchema.parse(request.body);

  const linkId = await loadLinkForVendor(vendorUserId);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { id: true, candidate: { select: { legalName: true } } },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  const checks = await prisma.$transaction(async (tx) => {
    const results = await runPrequalChecks(linkId, input);

    await tx.vendorBuyerLink.update({
      where: { id: linkId },
      data: { state: 'PREQUAL_SUBMITTED' },
    });

    return results;
  });

  response.status(201).json({ success: true, data: checks });
});

/**
 * Vendor's own verification status and progress.
 */
vendorsRouter.get('/me/status', requireRole('VENDOR'), async (_request, response) => {
  const vendorUserId = _request.user!.userId;
  const linkId = await loadLinkForVendor(vendorUserId);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      candidate: { select: { legalName: true } },
      requirement: { select: { id: true, requestNumber: true, category: true } },
      verificationChecks: { orderBy: { checkType: 'asc' } },
    },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  response.json({
    success: true,
    data: {
      link: {
        id: link.id,
        state: link.state,
        prequalScore: link.prequalScore,
      },
      vendor: {
        name: link.candidate.legalName ?? null,
      },
      checks: link.verificationChecks.map(toVerificationCheckResponse),
      requirement: link.requirement
        ? {
            id: link.requirement.id,
            requestNumber: link.requirement.requestNumber,
            category: link.requirement.category,
          }
        : null,
    },
  });
});

/**
 * Buyer views one vendor's full profile and verification checks.
 * `:id` is the VendorBuyerLink id.
 */
vendorsRouter.get('/:id/profile', requireRole('BUYER', 'ADMIN'), async (request, response) => {
  const linkId = String(request.params.id);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      candidate: {
        select: {
          id: true,
          legalName: true,
          contactEmail: true,
          contactPhone: true,
          pan: true,
          gstin: true,
          city: true,
          state: true,
        },
      },
      requirement: { select: { id: true, requestNumber: true, category: true } },
      verificationChecks: { orderBy: { checkType: 'asc' } },
    },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
    throw new NotFoundError('Vendor link not found');
  }

  response.json({
    success: true,
    data: {
      link: {
        id: link.id,
        state: link.state,
        prequalScore: link.prequalScore,
      },
      vendor: {
        id: link.candidate.id,
        name: link.candidate.legalName,
        email: link.candidate.contactEmail,
        phone: link.candidate.contactPhone,
        pan: link.candidate.pan,
        gstin: link.candidate.gstin,
        city: link.candidate.city,
        state: link.candidate.state,
      },
      requirement: link.requirement
        ? {
            id: link.requirement.id,
            requestNumber: link.requirement.requestNumber,
            category: link.requirement.category,
          }
        : null,
      checks: link.verificationChecks.map(toVerificationCheckResponse),
    },
  });
});

/**
 * Buyer reads verification checks for one vendor.
 * `:id` is the VendorBuyerLink id.
 */
vendorsRouter.get('/:id/verification-checks', requireRole('BUYER', 'ADMIN'), async (request, response) => {
  const linkId = String(request.params.id);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { buyerOrgId: true },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
    throw new NotFoundError('Vendor link not found');
  }

  const checks = await prisma.verificationCheck.findMany({
    where: { linkId },
    orderBy: { checkType: 'asc' },
  });

  response.json({ success: true, data: checks.map(toVerificationCheckResponse) });
});

/**
 * Buyer overrides a verification check that could not be settled automatically.
 * `:id` is the VendorBuyerLink id, `:checkId` is the VerificationCheck id.
 */
vendorsRouter.post(
  '/:id/verification-checks/:checkId/override',
  requireRole('BUYER', 'ADMIN'),
  async (request, response) => {
    const linkId = String(request.params.id);
    const checkId = String(request.params.checkId);
    const input = verificationOverrideSchema.parse(request.body);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { buyerOrgId: true },
    });

    if (!link) {
      throw new NotFoundError('Vendor link not found');
    }

    if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
      throw new NotFoundError('Vendor link not found');
    }

    const check = await prisma.verificationCheck.findUnique({
      where: { id: checkId },
      select: { linkId: true, status: true },
    });

    if (!check || check.linkId !== linkId) {
      throw new NotFoundError('Verification check not found');
    }

    if (check.status === 'PASSED' || check.status === 'ACCEPTED') {
      throw new BadRequestError('This check has already cleared and needs no override');
    }

    const updated = await prisma.verificationCheck.update({
      where: { id: checkId },
      data: {
        status: input.status === 'PASS' ? 'ACCEPTED' : 'REJECTED',
        updatedAt: new Date(),
      },
    });

    response.json({ success: true, data: toVerificationCheckResponse(updated) });
  },
);

/**
 * Buyer views metadata for documents vendor uploaded.
 * Metadata only: the base64 payload runs to megabytes, so each
 * file is fetched on demand by the endpoint below.
 * `:id` is the VendorBuyerLink id.
 */
vendorsRouter.get('/:id/documents', requireRole('BUYER', 'ADMIN'), async (request, response) => {
  const linkId = String(request.params.id);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { buyerOrgId: true },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
    throw new NotFoundError('Vendor link not found');
  }

  const documents = await prisma.document.findMany({
    where: { linkId },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      uploadedAt: true,
      linkId: true,
    },
    orderBy: { uploadedAt: 'asc' },
  });

  response.json({
    success: true,
    data: documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      status: doc.status,
      uploadedAt: doc.uploadedAt.toISOString(),
      linkId: doc.linkId,
    })),
  });
});

/**
 * Buyer downloads one document, decoded back to original bytes.
 * Sent inline so reviewer can preview PDF in browser.
 * `:id` is the VendorBuyerLink id, `:documentId` is the Document id.
 */
vendorsRouter.get('/:id/documents/:documentId', requireRole('BUYER', 'ADMIN'), async (request, response) => {
  const linkId = String(request.params.id);
  const documentId = String(request.params.documentId);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { buyerOrgId: true },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
    throw new NotFoundError('Vendor link not found');
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, linkId },
    include: { fileBlob: { select: { data: true } } },
  });

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const body = Buffer.from(document.fileBlob.data, 'base64');
  response.setHeader('Content-Type', document.mimeType);
  response.setHeader('Content-Length', String(body.byteLength));
  response.setHeader(
    'Content-Disposition',
    `inline; filename="${document.fileName.replace(/"/g, '')}"`,
  );
  response.send(body);
});

/**
 * Buyer scores vendor and makes prequal decision (approve/reject).
 * `:id` is the VendorBuyerLink id.
 */
vendorsRouter.post('/:id/prequal-decision', requireRole('BUYER', 'ADMIN'), async (request, response) => {
  const linkId = String(request.params.id);
  const input = prequalDecisionSchema.parse(request.body);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { buyerOrgId: true, state: true },
  });

  if (!link) {
    throw new NotFoundError('Vendor link not found');
  }

  if (request.user!.role === 'BUYER' && link.buyerOrgId !== request.user!.buyerOrgId) {
    throw new NotFoundError('Vendor link not found');
  }

  if (link.state !== 'PREQUAL_UNDER_REVIEW' && link.state !== 'PREQUAL_SUBMITTED') {
    throw new BadRequestError('This vendor is not ready for prequal decision');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const newState = input.decision === 'APPROVED' ? 'PREQUAL_CLEARED' : 'REJECTED';

    const result = await tx.vendorBuyerLink.update({
      where: { id: linkId },
      data: {
        prequalScore: input.score,
        state: newState,
      },
    });

    return result;
  });

  response.json({
    success: true,
    data: {
      id: updated.id,
      state: updated.state,
      prequalScore: updated.prequalScore,
    },
  });
});
