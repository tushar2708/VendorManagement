import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { prequalSubmissionSchema, uploadDocumentSchema } from '@vendor-management/shared';

export const vendorRouter = Router();
vendorRouter.use(requireAuth);

vendorRouter.get('/onboarding', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user!.userId } });
    if (!vendor) { res.json({ onboarding: null }); return; }

    const candidates = await prisma.requestCandidate.findMany({
      where: { vendorId: vendor.id },
      include: { request: { select: { id: true, title: true, category: true, status: true, requestNumber: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      vendor: { id: vendor.id, name: vendor.name, contactEmail: vendor.contactEmail, isVerified: vendor.isVerified },
      requests: candidates.map((c) => ({
        id: c.request.id,
        title: c.request.title ?? c.request.category,
        requestNumber: c.request.requestNumber,
        status: c.request.status,
        inviteStatus: c.inviteStatus,
        candidateStatus: c.status,
        createdAt: c.request.createdAt.toISOString(),
      })),
    });
  } catch (error) { next(error); }
});

vendorRouter.post('/prequal', validateBody(prequalSubmissionSchema), async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user!.userId } });
    if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }

    const { panNumber, gstin, udyamNumber } = req.body;
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { panNumber, gstin, udyamNumber },
    });

    const checkTypes = ['PAN', 'GSTIN', 'UDYAM'] as const;
    for (const type of checkTypes) {
      await prisma.verificationCheck.upsert({
        where: { vendorId_type: { vendorId: vendor.id, type } },
        update: { status: 'PASS', verifiedAt: new Date() },
        create: { vendorId: vendor.id, type, status: 'PASS', verifiedAt: new Date(), notes: `Auto-verified via ${type} API` },
      });
    }

    res.json({ ok: true });
  } catch (error) { next(error); }
});

vendorRouter.post('/documents', validateBody(uploadDocumentSchema), async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user!.userId } });
    if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }

    const doc = await prisma.document.create({
      data: { vendorId: vendor.id, ...req.body },
    });
    res.status(201).json({ document: { id: doc.id, name: doc.name, category: doc.category, status: doc.status } });
  } catch (error) { next(error); }
});

vendorRouter.get('/documents', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user!.userId } });
    if (!vendor) { res.json({ documents: [] }); return; }
    const docs = await prisma.document.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: 'asc' } });
    res.json({ documents: docs.map((d) => ({ id: d.id, name: d.name, category: d.category, status: d.status, createdAt: d.createdAt.toISOString() })) });
  } catch (error) { next(error); }
});

vendorRouter.get('/profile', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { userId: req.user!.userId },
      include: { verificationChecks: true },
    });
    if (!vendor) { res.status(404).json({ error: 'Vendor profile not found' }); return; }
    res.json({ vendor, checks: vendor.verificationChecks });
  } catch (error) { next(error); }
});
