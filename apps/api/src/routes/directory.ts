import { Router } from "express";
import { directoryQuerySchema } from "@vendor-management/shared";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";

export const directoryRouter = Router();
directoryRouter.use(requireAuth);

directoryRouter.get("/filters", async (_req, res) => {
  const vendors = await prisma.directoryVendor.findMany({
    select: { processTags: true, state: true },
  });

  const processes = [...new Set(vendors.flatMap((v) => v.processTags))].sort();
  const states = [...new Set(vendors.map((v) => v.state).filter(Boolean) as string[])].sort();

  res.json({ processes, states });
});

directoryRouter.get("/", async (req, res) => {
  const query = directoryQuerySchema.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: "Invalid query" }); return; }

  const where: any = {};

  if (query.data.search) {
    where.legalName = { contains: query.data.search, mode: "insensitive" };
  }
  if (query.data.process) {
    where.processTags = { has: query.data.process };
  }
  if (query.data.state) {
    where.state = query.data.state;
  }

  if (query.data.requirementId) {
    const existingCandidates = await prisma.requestCandidate.findMany({
      where: { requestId: query.data.requirementId },
      select: { vendorId: true },
    });
    const excludeIds = existingCandidates.map((c) => c.vendorId);
    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }
  }

  const vendors = await prisma.directoryVendor.findMany({
    where,
    orderBy: { legalName: "asc" },
  });

  res.json({
    vendors: vendors.map((v) => ({
      id: v.id,
      legalName: v.legalName,
      pan: v.pan,
      primaryGstin: v.primaryGstin,
      contactEmail: v.contactEmail,
      city: v.city,
      state: v.state,
      processTags: v.processTags,
      certificationTags: v.certificationTags,
      badgeState: v.badgeState,
    })),
  });
});

directoryRouter.get("/:id", async (req, res) => {
  const vendor = await prisma.directoryVendor.findUnique({
    where: { id: req.params.id },
  });
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }

  res.json({
    vendor: {
      ...vendor,
      createdAt: vendor.createdAt.toISOString(),
    },
    verificationChecks: [],
  });
});
