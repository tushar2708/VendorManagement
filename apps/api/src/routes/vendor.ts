import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

export const vendorRouter = Router();
vendorRouter.use(requireAuth);
vendorRouter.use(requireRole("VENDOR"));

vendorRouter.get("/onboarding", async (req, res) => {
  const links = await prisma.vendorBuyerLink.findMany({
    where: { vendorUserId: req.user!.userId },
    include: {
      requirement: { select: { id: true, title: true, requestNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(links.map((l) => ({
    linkId: l.id,
    state: l.state,
    stage: l.stage,
    requirementTitle: l.requirement.title,
    requestNumber: l.requirement.requestNumber,
  })));
});

vendorRouter.get("/profile", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, vendorOrgId: true },
  });

  const links = await prisma.vendorBuyerLink.findMany({
    where: { vendorUserId: req.user!.userId },
    select: { id: true, state: true, erpVendorCode: true, prequalScore: true },
  });

  res.json({ user, links });
});

vendorRouter.get("/prequal", async (req, res) => {
  const linkId = req.query.linkId as string | undefined;
  if (!linkId) {
    res.status(400).json({ error: "linkId is required" });
    return;
  }

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { vendorUserId: true },
  });

  if (!link || link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const checks = await prisma.verificationCheck.findMany({
    where: { linkId },
    select: {
      id: true,
      checkType: true,
      status: true,
      ranAt: true,
      subjectValue: true,
    },
  });

  res.json({ checks });
});

vendorRouter.get("/complete", async (req, res) => {
  const linkId = req.query.linkId as string | undefined;
  if (!linkId) {
    res.status(400).json({ error: "linkId is required" });
    return;
  }

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      candidate: { include: { vendor: { select: { badgeState: true } } } },
    },
  });

  if (!link || link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (link.state !== 'ONBOARDED') {
    res.status(409).json({ error: "Link is not in ONBOARDED state" });
    return;
  }

  const contractCount = await prisma.contract.count({
    where: { linkId },
  });

  const totalDays = link.onboardedAt && link.createdAt
    ? Math.floor((link.onboardedAt.getTime() - link.createdAt.getTime()) / 86_400_000)
    : null;

  res.json({
    erpVendorCode: link.erpVendorCode,
    onboardedAt: link.onboardedAt?.toISOString() ?? null,
    totalDays,
    contractCount,
    directoryBadgeState: link.candidate.vendor?.badgeState ?? null,
  });
});
