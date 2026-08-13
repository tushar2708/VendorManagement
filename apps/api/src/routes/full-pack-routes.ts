import { Router } from 'express';

import { prisma } from '@vendor-management/db';
import {
  fullPackChecklistFor,
  fullPackResponseSchema,
  submitFullPackSchema,
  uploadChecklistFileSchema,
  MAX_DOCUMENT_BYTES,
  type LinkState,
  type VendorType,
} from '@vendor-management/shared';

import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { BadRequestError, ConflictError, DomainError, NotFoundError, PayloadTooLargeError } from '../lib/errors.js';
import { transition } from '../lib/link-state.js';

export const fullPackRouter = Router();

/** States after the pack has been submitted. */
const SUBMITTED_STATES: readonly LinkState[] = [
  'FULL_SUBMITTED',
  'FULL_UNDER_REVIEW',
  'CONTRACTS_IN_PROGRESS',
  'APPROVED',
  'ERP_SYNCING',
  'ONBOARDED',
] as const;

interface VendorLinkData {
  readonly id: string;
  readonly state: LinkState;
  readonly requirement: { readonly id: string; readonly vendorType: VendorType } | null;
  readonly candidate: { readonly legalName: string | null } | null;
}

async function loadVendorLink(vendorUserId: string): Promise<VendorLinkData> {
  const link = await prisma.vendorBuyerLink.findFirst({
    where: { vendorUserId },
    include: {
      requirement: { select: { id: true, vendorType: true } },
      candidate: { select: { legalName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!link) {
    throw new NotFoundError('No onboarding link found for this account');
  }

  return link;
}

/**
 * One vendor's resolved pack. Shared by the vendor's own view and the buyer's
 * clearance panel, so a reviewer sees the same slots — including the empty ones
 * — rather than a list of whatever happens to have been uploaded.
 */
async function buildFullPack(linkId: string): Promise<ReturnType<typeof fullPackResponseSchema.parse>> {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      candidate: { select: { legalName: true } },
      requirement: { select: { vendorType: true } },
    },
  });

  if (!link) {
    throw new NotFoundError('Link not found');
  }

  const items = fullPackChecklistFor(link.requirement?.vendorType ?? null);
  const documents = await prisma.document.findMany({
    where: {
      linkId,
      checklistItemKey: { in: items.map((item) => item.code) },
    },
  });

  const byCode = new Map(documents.map((document) => [document.checklistItemKey, document]));

  const entries = items.map((item) => {
    const document = byCode.get(item.code);
    return {
      code: item.code,
      label: item.label,
      group: item.group,
      category: item.category,
      document: document
        ? {
            id: document.id,
            name: document.fileName,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            status: document.status,
            uploadedAt: document.uploadedAt.toISOString(),
          }
        : null,
    };
  });

  const isOpen = link.state === 'AWARDED' || SUBMITTED_STATES.includes(link.state);
  const submitted = SUBMITTED_STATES.includes(link.state);

  return fullPackResponseSchema.parse({
    vendorId: link.id,
    vendorName: link.candidate?.legalName ?? 'Unknown Vendor',
    isOpen,
    submitted,
    entries,
    outstanding: entries.filter((entry) => !entry.document).map((entry) => entry.code),
  });
}

/** The vendor's own pack. */
fullPackRouter.get(
  '/me/full-pack',
  requireAuth,
  requireRole('VENDOR'),
  async (request, response) => {
    const link = await loadVendorLink(request.user!.userId);
    response.json({ success: true, data: await buildFullPack(link.id) });
  },
);

/** The same pack, read-only, for a buyer reviewing clearances. */
fullPackRouter.get(
  '/:id/full-pack',
  requireAuth,
  requireRole('BUYER', 'ADMIN'),
  async (request, response) => {
    const linkId = String(request.params.id);

    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { buyerOrgId: true },
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    if (link.buyerOrgId !== request.user!.buyerOrgId && request.user!.role !== 'ADMIN') {
      throw new DomainError('Access denied', 403);
    }

    response.json({ success: true, data: await buildFullPack(linkId) });
  },
);

/**
 * Upload or update a single document in the pack.
 * Stores file in FileBlob first, then creates/updates Document.
 */
fullPackRouter.put(
  '/me/full-pack/:code',
  requireAuth,
  requireRole('VENDOR'),
  async (request, response) => {
    const vendorUserId = request.user!.userId;
    const code = String(request.params.code);

    const input = uploadChecklistFileSchema.parse(request.body);

    const link = await loadVendorLink(vendorUserId);

    if (link.state !== 'AWARDED' && !SUBMITTED_STATES.includes(link.state)) {
      throw new ConflictError('The document pack opens once you have been awarded');
    }

    // Resolve the checklist item.
    const checklist = fullPackChecklistFor(link.requirement?.vendorType ?? null);
    const item = checklist.find((candidate) => candidate.code === code);

    if (!item) {
      throw new NotFoundError('That is not a document this pack asks for');
    }

    // Trust the bytes, not the caller's claim: measure what decodes.
    const decodedBytes = Buffer.from(input.data, 'base64').length;

    if (decodedBytes === 0) {
      throw new BadRequestError('That file appears to be empty');
    }

    if (decodedBytes > MAX_DOCUMENT_BYTES) {
      throw new PayloadTooLargeError('Each document must be 1 MB or smaller');
    }

    const saved = await prisma.$transaction(async (tx) => {
      // Store file in FileBlob first.
      const fileBlob = await tx.fileBlob.create({
        data: { data: input.data },
      });

      // Find existing document for this checklist slot, or create one.
      const existing = await tx.document.findFirst({
        where: { linkId: link.id, checklistItemKey: code },
      });

      let document;
      if (existing) {
        document = await tx.document.update({
          where: { id: existing.id },
          data: {
            fileName: input.name,
            mimeType: input.mimeType,
            sizeBytes: decodedBytes,
            fileBlobId: fileBlob.id,
            status: 'ACCEPTED',
            uploadedAt: new Date(),
            rejectionReason: null,
          },
        });
      } else {
        document = await tx.document.create({
          data: {
            linkId: link.id,
            checklistItemKey: code,
            fileName: input.name,
            mimeType: input.mimeType,
            sizeBytes: decodedBytes,
            fileBlobId: fileBlob.id,
            status: 'ACCEPTED',
          },
        });
      }

      return document;
    });

    response.status(201).json({
      success: true,
      data: {
        id: saved.id,
        name: saved.fileName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        status: saved.status,
        uploadedAt: saved.uploadedAt.toISOString(),
      },
    });
  },
);

/**
 * Submit the full pack once all documents are uploaded.
 * Validates checklist completion, then transitions link state.
 */
fullPackRouter.post(
  '/me/full-pack',
  requireAuth,
  requireRole('VENDOR'),
  async (request, response) => {
    const vendorUserId = request.user!.userId;

    submitFullPackSchema.parse(request.body);

    const link = await loadVendorLink(vendorUserId);

    if (link.state !== 'AWARDED' && !SUBMITTED_STATES.includes(link.state)) {
      throw new ConflictError('The document pack opens once you have been awarded');
    }

    const checklist = fullPackChecklistFor(link.requirement?.vendorType ?? null);
    const uploaded = await prisma.document.findMany({
      where: {
        linkId: link.id,
        checklistItemKey: { in: checklist.map((item) => item.code) },
      },
      select: { checklistItemKey: true },
    });

    const have = new Set(uploaded.map((document) => document.checklistItemKey));
    const missing = checklist.filter((item) => !have.has(item.code));

    if (missing.length > 0) {
      throw new ConflictError(
        `Still to upload: ${missing.map((item) => item.label).join(', ')}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      // Transition through the full pack stages.
      await transition(link.id, 'FULL_SUBMITTED', {
        actorType: 'VENDOR',
        actorId: vendorUserId,
      }, tx);

      // Auto-transition to FULL_UNDER_REVIEW.
      await transition(link.id, 'FULL_UNDER_REVIEW', {
        actorType: 'SYSTEM',
      }, tx);

      // Auto-transition to CONTRACTS_IN_PROGRESS once review is notional.
      await transition(link.id, 'CONTRACTS_IN_PROGRESS', {
        actorType: 'SYSTEM',
      }, tx);
    });

    response.json({
      success: true,
      data: { linkId: link.id, status: 'FULL_SUBMITTED', documents: checklist.length },
    });
  },
);
