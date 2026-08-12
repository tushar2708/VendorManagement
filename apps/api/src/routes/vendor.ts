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
