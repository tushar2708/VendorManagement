import { Router } from 'express';

import { prisma } from '@vendor-management/db';
import {
  attachDocumentSchema,
  checklistFor,
  saveFieldsSchema,
} from '@vendor-management/shared';

import { loadVendorLinkDTO, ensureSubmission } from '../lib/link-dto.js';
import { transition } from '../lib/link-state.js';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';

export const linksRouter = Router();

linksRouter.use(requireAuth);
linksRouter.use(requireRole('VENDOR'));

// GET / - List all links for the vendor
linksRouter.get('/', async (req, res): Promise<void> => {
  const vendorUserId = req.user!.userId;

  const links = await prisma.vendorBuyerLink.findMany({
    where: { vendorUserId },
    include: { requirement: { select: { title: true } } },
  });

  const response = links.map((link) => ({
    id: link.id,
    state: link.state,
    stage: link.stage,
    requirementTitle: link.requirement.title,
  }));

  res.json(response);
});

// GET /:id - Get a specific link with auto-transition logic
linksRouter.get('/:id', async (req, res): Promise<void> => {
  const vendorUserId = req.user!.userId;
  const id = String(req.params.id);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id },
    include: { requirement: { select: { processCategories: true } } },
  });

  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  if (link.vendorUserId !== vendorUserId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Auto-transition logic: if state is AWARDED and stage is null
  if (link.state === 'AWARDED' && link.stage === null) {
    try {
      // Transition to FULL_IN_PROGRESS
      await transition(id, 'FULL_IN_PROGRESS', {
        actorType: 'VENDOR',
        actorId: vendorUserId,
      });

      // Update stage to FULL
      await prisma.vendorBuyerLink.update({
        where: { id },
        data: { stage: 'FULL' },
      });

      // Ensure FULL submission
      await ensureSubmission(id, 'FULL');
    } catch (err) {
      // Log error but continue to return the DTO
      console.error('Auto-transition failed:', err);
    }
  }

  const dto = await loadVendorLinkDTO(id);

  if (!dto) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  res.json(dto);
});

// PUT /:id/fields - Save fields for a link
linksRouter.put(
  '/:id/fields',
  validateBody(saveFieldsSchema),
  async (req, res): Promise<void> => {
    const vendorUserId = req.user!.userId;
    const id = String(req.params.id);
    const { fields } = req.body;

    const link = await prisma.vendorBuyerLink.findUnique({ where: { id } });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    if (link.vendorUserId !== vendorUserId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only allow when state is PREQUAL_IN_PROGRESS or FULL_IN_PROGRESS
    if (
      link.state !== 'PREQUAL_IN_PROGRESS' &&
      link.state !== 'FULL_IN_PROGRESS'
    ) {
      res.status(409).json({ error: 'Link is not in an editable state' });
      return;
    }

    // Ensure submission for current stage
    const submission = await ensureSubmission(id, link.stage ?? "PREQUAL");

    // Upsert each field value
    for (const field of fields) {
      await prisma.fieldValue.upsert({
        where: {
          submissionId_fieldKey: {
            submissionId: submission.id,
            fieldKey: field.fieldKey,
          },
        },
        create: {
          submissionId: submission.id,
          linkId: id,
          fieldKey: field.fieldKey,
          value: field.value,
        },
        update: {
          value: field.value,
        },
      });
    }

    res.status(200).json({ success: true });
  }
);

// POST /:id/documents - Attach a document to a link
linksRouter.post(
  '/:id/documents',
  validateBody(attachDocumentSchema),
  async (req, res): Promise<void> => {
    const vendorUserId = req.user!.userId;
    const id = String(req.params.id);
    const { checklistItemKey, fileBlobId, fileName, mimeType, sizeBytes } = req.body as any;

    const link = await prisma.vendorBuyerLink.findUnique({ where: { id } });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    if (link.vendorUserId !== vendorUserId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only allow in editable states
    if (
      link.state !== 'PREQUAL_IN_PROGRESS' &&
      link.state !== 'FULL_IN_PROGRESS'
    ) {
      res.status(409).json({ error: 'Link is not in an editable state' });
      return;
    }

    // Ensure submission
    const submission = await ensureSubmission(id, link.stage ?? 'PREQUAL');

    // Check if document with same checklistItemKey exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        submissionId: submission.id,
        checklistItemKey,
      },
    });

    if (existingDoc) {
      // Update existing document
      await prisma.document.update({
        where: { id: existingDoc.id },
        data: { fileBlobId, fileName, mimeType, sizeBytes },
      });
    } else {
      // Create new document
      await prisma.document.create({
        data: {
          submissionId: submission.id,
          linkId: id,
          checklistItemKey,
          fileBlobId,
          fileName,
          mimeType,
          sizeBytes,
        },
      });
    }

    res.status(200).json({ success: true });
  }
);

// DELETE /:id/documents/:docId - Delete a document
linksRouter.delete('/:id/documents/:docId', async (req, res): Promise<void> => {
  const vendorUserId = req.user!.userId;
  const id = String(req.params.id);
  const docId = String(req.params.docId);

  const link = await prisma.vendorBuyerLink.findUnique({ where: { id } });

  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  if (link.vendorUserId !== vendorUserId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Only allow in editable states
  if (
    link.state !== 'PREQUAL_IN_PROGRESS' &&
    link.state !== 'FULL_IN_PROGRESS'
  ) {
    res.status(409).json({ error: 'Link is not in an editable state' });
    return;
  }

  // Get the document and verify it belongs to this link
  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: { submission: { select: { linkId: true } } },
  });

  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  if (!document.submission || document.submission.linkId !== id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Delete the document
  await prisma.document.delete({ where: { id: docId } });

  res.status(200).json({ success: true });
});

// POST /:id/submit - Submit a link
linksRouter.post('/:id/submit', async (req, res): Promise<void> => {
  const vendorUserId = req.user!.userId;
  const id = String(req.params.id);

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id },
    include: { requirement: { select: { processCategories: true } } },
  });

  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  if (link.vendorUserId !== vendorUserId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Determine stage from link.stage
  const stage = link.stage ?? 'PREQUAL';

  // Get checklist for this stage
  const checklist = checklistFor(stage as any, link.requirement.processCategories);

  // Get current submission
  const submission = await prisma.submission.findFirst({
    where: {
      linkId: id,
      stage: stage as any,
    },
    include: {
      fieldValues: true,
      documents: true,
    },
  });

  if (!submission) {
    res.status(422).json({
      error: 'No submission found for this stage',
      errors: [],
    });
    return;
  }

  // Validate: all required fields non-empty
  const errors: Array<{
    type: 'field' | 'document';
    key: string;
    message: string;
  }> = [];

  for (const item of (checklist as any)) {
    if (item.required && item.type === 'field') {
      const fieldValue = submission.fieldValues.find(
        (fv) => fv.fieldKey === item.key
      );

      if (!fieldValue || !fieldValue.value) {
        errors.push({
          type: 'field',
          key: item.key,
          message: `Required field "${item.key}" is empty`,
        });
      }
    }

    if (item.required && item.type === 'document') {
      const document = submission.documents.find(
        (doc) => doc.checklistItemKey === item.key
      );

      if (!document) {
        errors.push({
          type: 'document',
          key: item.key,
          message: `Required document "${item.key}" is missing`,
        });
      }
    }
  }

  if (errors.length > 0) {
    res.status(422).json({
      error: 'Validation failed',
      errors,
    });
    return;
  }

  // Mark submission as SUBMITTED with submittedAt timestamp
  const submittedAt = new Date();
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: 'SUBMITTED', submittedAt },
  });

  // Determine next state based on current state
  let nextState: 'PREQUAL_SUBMITTED' | 'FULL_SUBMITTED';

  if (link.state === 'PREQUAL_IN_PROGRESS') {
    nextState = 'PREQUAL_SUBMITTED';
  } else if (link.state === 'FULL_IN_PROGRESS') {
    nextState = 'FULL_SUBMITTED';
  } else {
    res.status(409).json({ error: 'Link is not in a submittable state' });
    return;
  }

  // Transition the link
  await transition(id, nextState, {
    actorType: 'VENDOR',
    actorId: vendorUserId,
  });

  res.status(200).json({ success: true });
});
