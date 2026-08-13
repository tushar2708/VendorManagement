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

vendorRouter.get("/analytics", async (req, res, next) => {
  try {
    const links = await prisma.vendorBuyerLink.findMany({
      where: { vendorUserId: req.user!.userId },
      include: {
        documents: { select: { id: true } },
        verificationChecks: { select: { status: true } },
        reviewTasks: { select: { status: true } },
        contracts: { select: { state: true } },
      },
    });

    const activeStates = new Set([
      "INVITED", "PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW",
      "PREQUAL_CLEARED", "AWARDED", "FULL_IN_PROGRESS", "FULL_SUBMITTED",
      "FULL_UNDER_REVIEW", "CONTRACTS_IN_PROGRESS", "APPROVED", "ERP_SYNCING",
    ]);
    const completedStates = new Set(["ONBOARDED"]);

    let activeEngagements = 0;
    let completedEngagements = 0;
    let totalDaysSum = 0;
    let documentsUploaded = 0;
    let documentsOutstanding = 0;
    let checksPassedCount = 0;
    let checksTotalCount = 0;
    let controlsCleared = 0;
    let controlsTotal = 0;
    let contractsExecuted = 0;
    let contractsTotal = 0;
    const stageDistribution: Record<string, number> = {};

    const now = Date.now();

    for (const link of links) {
      if (activeStates.has(link.state)) activeEngagements++;
      if (completedStates.has(link.state)) completedEngagements++;

      totalDaysSum += Math.floor((now - link.createdAt.getTime()) / 86_400_000);

      stageDistribution[link.state] = (stageDistribution[link.state] ?? 0) + 1;

      documentsUploaded += link.documents.length;

      for (const check of link.verificationChecks) {
        checksTotalCount++;
        if (check.status === "PASSED" || check.status === "ACCEPTED") checksPassedCount++;
      }

      for (const task of link.reviewTasks) {
        controlsTotal++;
        if (task.status === "APPROVED" || task.status === "EDD_COMPLETE") controlsCleared++;
      }

      for (const contract of link.contracts) {
        contractsTotal++;
        if (contract.state === "EXECUTED") contractsExecuted++;
      }
    }

    const totalEngagements = links.length;
    const avgDaysPerEngagement = totalEngagements > 0 ? Math.round(totalDaysSum / totalEngagements) : 0;
    const checksPassedRate = checksTotalCount > 0 ? Math.round((checksPassedCount / checksTotalCount) * 100) : 0;

    const awardedLinks = links.filter(l => !["INVITED", "PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW", "PREQUAL_CLEARED"].includes(l.state));
    const expectedDocs = awardedLinks.length * 6;
    documentsOutstanding = Math.max(0, expectedDocs - documentsUploaded);

    res.json({
      totalEngagements,
      activeEngagements,
      completedEngagements,
      avgDaysPerEngagement,
      stageDistribution,
      documentsUploaded,
      documentsOutstanding,
      contractsExecuted,
      contractsTotal,
      checksPassedRate,
      controlsCleared,
      controlsTotal,
    });
  } catch (error) {
    next(error);
  }
});

vendorRouter.get("/dashboard-summary", async (req, res, next) => {
  try {
    const links = await prisma.vendorBuyerLink.findMany({
      where: { vendorUserId: req.user!.userId },
      include: {
        requirement: { select: { title: true, createdById: true } },
        events: { orderBy: { occurredAt: "asc" as const }, select: { occurredAt: true, toState: true } },
        documents: { select: { id: true } },
        verificationChecks: { select: { status: true } },
        candidate: { select: { legalName: true } },
      },
    });

    const { LINK_STATE_META, LINK_PROGRESS_RAIL } = await import("@vendor-management/shared");
    const { computeDualTat } = await import("../lib/tat.js");

    const summaries = await Promise.all(links.map(async (link) => {
      const timeline = link.events.map(e => ({ at: e.occurredAt, state: e.toState }));
      const tat = computeDualTat(timeline);

      const meta = LINK_STATE_META[link.state];
      const court = meta?.court === "done" ? "DONE" : meta?.court === "vendor" ? "VENDOR" : meta?.court === "system" ? "PLATFORM" : "BUYER";

      const reachedStates = new Set(link.events.map(e => e.toState));
      const currentIndex = LINK_PROGRESS_RAIL.indexOf(link.state as any);
      const milestones = LINK_PROGRESS_RAIL.map((state: string, idx: number) => {
        const railMeta = LINK_STATE_META[state];
        let msState: "DONE" | "CURRENT" | "PENDING" = "PENDING";
        if (currentIndex >= 0 && idx < currentIndex) msState = "DONE";
        else if (currentIndex >= 0 && idx === currentIndex) msState = "CURRENT";
        else if (reachedStates.has(state as any)) msState = "DONE";
        return { key: state, label: railMeta?.label ?? state, state: msState };
      });

      let contactName: string | null = null;
      if (link.requirement.createdById) {
        const buyer = await prisma.user.findUnique({
          where: { id: link.requirement.createdById },
          select: { name: true },
        });
        contactName = buyer?.name ?? null;
      }

      let passed = 0;
      for (const c of link.verificationChecks) {
        if (c.status === "PASSED" || c.status === "ACCEPTED") passed++;
      }

      return {
        id: link.id,
        state: link.state,
        stage: link.stage,
        requirementTitle: link.requirement.title ?? "",
        prequalScore: link.prequalScore,
        erpVendorCode: link.erpVendorCode,
        court,
        tat,
        milestones,
        contactName,
        documentsUploaded: link.documents.length,
        documentsTotal: 8,
        checksStatus: { passed, total: link.verificationChecks.length },
      };
    }));

    res.json({ links: summaries });
  } catch (error) {
    next(error);
  }
});
