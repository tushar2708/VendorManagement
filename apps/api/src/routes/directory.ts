import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { directoryQuerySchema, type DirectoryVendor } from '@vendor-management/shared';
import { prisma } from '@vendor-management/db';
import { requireAuth } from '../middleware/require-auth.js';

export const directoryRouter = Router();

directoryRouter.use(requireAuth);

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
