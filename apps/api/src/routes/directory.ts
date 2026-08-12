import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { directoryQuerySchema, type DirectoryVendor } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';

export const directoryRouter = Router();

directoryRouter.use(requireAuth);

directoryRouter.get('/filters', async (_req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { isInDirectory: true },
      select: { processTags: true, state: true },
    });

    const processSet = new Set<string>();
    const stateSet = new Set<string>();

    for (const v of vendors) {
      for (const tag of v.processTags) processSet.add(tag);
      if (v.state) stateSet.add(v.state);
    }

    res.json({
      processes: [...processSet].sort(),
      states: [...stateSet].sort(),
    });
  } catch (error) {
    next(error);
  }
});

directoryRouter.get('/', async (req, res, next) => {
  try {
    const parsed = directoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', issues: parsed.error.flatten() });
      return;
    }
    const { search, process, state, requirementId } = parsed.data;

    const where: Prisma.VendorWhereInput = { isInDirectory: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (process) where.processTags = { has: process };
    if (state) where.state = { equals: state, mode: 'insensitive' };

    // Exclude vendors already added to this requirement (user-scoped).
    if (requirementId) {
      const added = await prisma.requestCandidate.findMany({
        where: { requestId: requirementId },
        select: { vendorId: true },
      });
      const ids = added.map((a) => a.vendorId);
      if (ids.length > 0) where.id = { notIn: ids };
    }

    const rows = await prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });

    const vendors: DirectoryVendor[] = rows.map((v) => ({
      id: v.id,
      legalName: v.name,
      pan: v.panNumber,
      primaryGstin: v.gstin,
      contactEmail: v.contactEmail,
      city: v.city,
      state: v.state,
      processTags: v.processTags,
      certificationTags: v.certifications,
      badgeState: v.isVerified ? 'VERIFIED' : 'LISTED',
    }));

    res.json({ vendors });
  } catch (error) {
    next(error);
  }
});

directoryRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        verificationChecks: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const isStale = vendor.isVerified && vendor.updatedAt < twelveMonthsAgo;

    res.json({
      vendor: {
        id: vendor.id,
        legalName: vendor.name,
        contactEmail: vendor.contactEmail,
        pan: vendor.panNumber,
        primaryGstin: vendor.gstin,
        udyamNumber: vendor.udyamNumber,
        vendorCode: vendor.vendorCode,
        category: vendor.category,
        vendorType: vendor.vendorType,
        city: vendor.city,
        state: vendor.state,
        processTags: vendor.processTags,
        certifications: vendor.certifications,
        prequalScore: vendor.prequalScore,
        isVerified: vendor.isVerified,
        badgeState: isStale ? 'STALE' : vendor.isVerified ? 'VERIFIED' : 'LISTED',
        createdAt: vendor.createdAt.toISOString(),
      },
      verificationChecks: vendor.verificationChecks.map((vc) => ({
        id: vc.id,
        type: vc.type,
        status: vc.status,
        matchScore: vc.matchScore,
        notes: vc.notes,
        verifiedAt: vc.verifiedAt ? vc.verifiedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});
