import { prisma } from "@vendor-management/db";
import { checkJoinGate } from "./join-gate.js";
import { mapContract, CONTRACT_INCLUDE } from "./contract-dto.js";

export async function mergedFields(linkId: string): Promise<Record<string, string | null>> {
  const submissions = await prisma.submission.findMany({
    where: { linkId },
    include: { fieldValues: true },
    orderBy: { createdAt: "asc" },
  });

  const fields: Record<string, string | null> = {};
  for (const sub of submissions) {
    for (const fv of sub.fieldValues) {
      fields[fv.fieldKey] = fv.value;
    }
  }
  return fields;
}

export async function loadBuyerLinkDetail(linkId: string) {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      candidate: { select: { id: true, legalName: true, contactEmail: true, pan: true, gstin: true } },
      requirement: { select: { id: true, title: true, processCategories: true } },
      submissions: { include: { fieldValues: true, documents: true } },
      verificationChecks: { orderBy: { createdAt: "asc" } },
      reviewTasks: {
        orderBy: { createdAt: "asc" },
        include: { decisions: { orderBy: { decidedAt: "desc" }, take: 1 } },
      },
      contracts: { include: CONTRACT_INCLUDE },
    },
  });
  if (!link) return null;

  const fields: Record<string, string | null> = {};
  for (const sub of link.submissions) {
    for (const fv of sub.fieldValues) {
      fields[fv.fieldKey] = fv.value;
    }
  }

  const documents = link.submissions.flatMap((s) =>
    s.documents.map((d) => ({
      id: d.id,
      checklistItemKey: d.checklistItemKey,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      fileBlobId: d.fileBlobId,
      status: d.status,
      rejectionReason: d.rejectionReason,
      uploadedAt: d.uploadedAt.toISOString(),
    }))
  );

  const checks = link.verificationChecks.map((c) => ({
    id: c.id,
    checkType: c.checkType,
    status: c.status,
    matchScore: c.matchScore,
    detail: c.detail,
    ranAt: c.ranAt?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
  }));

  const reviewTasks = link.reviewTasks.map((t) => ({
    id: t.id,
    stage: t.stage,
    status: t.status,
    slaHours: t.slaHours,
    assignedUserId: t.assignedUserId,
    lastDecision: t.decisions[0]
      ? {
          decision: t.decisions[0].decision,
          comment: t.decisions[0].comment,
          decidedAt: t.decisions[0].decidedAt.toISOString(),
        }
      : null,
  }));

  const joinGateOpen = await checkJoinGate(linkId);

  return {
    id: link.id,
    state: link.state,
    stage: link.stage,
    prequalScore: link.prequalScore,
    erpVendorCode: link.erpVendorCode,
    candidate: link.candidate,
    requirement: link.requirement,
    fields,
    documents,
    checks,
    reviewTasks,
    contracts: link.contracts.map(mapContract),
    joinGateOpen,
  };
}
