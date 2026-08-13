import { prisma } from "@vendor-management/db";
import { computeDualTat } from "./tat.js";
import { mapContract, CONTRACT_INCLUDE } from "./contract-dto.js";

export async function ensureSubmission(linkId: string, stage: string): Promise<any> {
  const existing = await prisma.submission.findUnique({
    where: { linkId_stage: { linkId, stage: stage as any } },
  });
  if (existing) return existing;
  return prisma.submission.create({
    data: { linkId, stage: stage as any },
  });
}

export async function loadVendorLinkDTO(linkId: string) {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: {
      requirement: { select: { title: true, processCategories: true } },
      buyerOrg: { select: { legalName: true } },
      candidate: { select: { contactEmail: true } },
      events: { orderBy: { occurredAt: "asc" as const }, select: { occurredAt: true, toState: true } },
      submissions: {
        include: {
          fieldValues: true,
          documents: true,
        },
      },
      contracts: { include: CONTRACT_INCLUDE },
    },
  });
  if (!link) return null;

  const currentStage = (link as any).stage ?? 'PREQUAL';
  const subs = (link as any).submissions ?? [];
  const currentSub = subs.find((s: any) => s.stage === currentStage);

  const fields: Record<string, string | null> = {};
  for (const sub of subs) {
    for (const fv of sub.fieldValues) {
      fields[fv.fieldKey] = fv.value;
    }
  }

  const documents = currentSub?.documents.map((d: any) => ({
    id: d.id,
    checklistItemKey: d.checklistItemKey,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    fileBlobId: d.fileBlobId,
    status: d.status,
    uploadedAt: d.uploadedAt.toISOString(),
  })) ?? [];

  const events = (link as any).events ?? [];
  const timeline = events.map((e: any) => ({ at: e.occurredAt, state: e.toState }));
  const tat = computeDualTat(timeline);

  const ownerUser = await prisma.user.findFirst({
    where: { buyerOrgId: link.buyerOrgId, buyerRole: 'OWNER' },
    select: { name: true, email: true },
  });

  return {
    id: link.id,
    state: link.state,
    stage: link.stage,
    requirementTitle: (link as any).requirement?.title ?? '',
    processCategories: (link as any).requirement?.processCategories ?? [],
    buyerOrgName: (link as any).buyerOrg?.legalName ?? '',
    buyerContact: {
      name: ownerUser?.name ?? null,
      email: ownerUser?.email ?? '',
    },
    fields,
    documents,
    contracts: ((link as any).contracts ?? []).map(mapContract),
    prequalScore: link.prequalScore,
    erpVendorCode: link.erpVendorCode,
    tat,
    createdAt: link.createdAt.toISOString(),
  };
}
