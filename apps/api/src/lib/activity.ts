import { prisma } from "@vendor-management/db";
import { LINK_STATE_META, CONTRACT_TYPE_LABEL, CHECK_META } from "@vendor-management/shared";

export interface ActivityItem {
  id: string;
  at: string;
  side: "vendor" | "buyer" | "system";
  category: "lifecycle" | "approval" | "contract" | "verification";
  vendorName: string | null;
  requirementTitle: string | null;
  description: string;
}

const CONTRACT_KIND_VERB: Record<string, string> = {
  DRAFT: "uploaded draft of",
  REVISED: "uploaded revision of",
  VENDOR_SIGNED: "signed",
  BUYER_SIGNED: "counter-signed",
};

export async function buildActivityFeed(buyerOrgId: string, limit = 60): Promise<ActivityItem[]> {
  const links = await prisma.vendorBuyerLink.findMany({
    where: { buyerOrgId },
    select: {
      id: true,
      candidate: { select: { legalName: true } },
      requirement: { select: { title: true } },
    },
  });

  const linkMap = new Map(links.map((l) => [l.id, {
    vendorName: l.candidate.legalName,
    requirementTitle: l.requirement.title,
  }]));
  const linkIds = links.map((l) => l.id);

  const [events, decisions, versions, checks] = await Promise.all([
    prisma.linkEvent.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { occurredAt: "desc" },
      take: limit,
    }),
    prisma.approvalDecision.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { decidedAt: "desc" },
      take: limit,
      include: { reviewTask: { select: { stage: true } } },
    }),
    prisma.contractVersion.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { contract: { select: { contractType: true } } },
    }),
    prisma.verificationCheck.findMany({
      where: { linkId: { in: linkIds }, status: { not: "RUNNING" } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const e of events) {
    const ctx = linkMap.get(e.linkId);
    const meta = LINK_STATE_META[e.toState];
    items.push({
      id: `evt-${e.id}`,
      at: e.occurredAt.toISOString(),
      side: e.side.toLowerCase() as "vendor" | "buyer" | "system",
      category: "lifecycle",
      vendorName: ctx?.vendorName ?? null,
      requirementTitle: ctx?.requirementTitle ?? null,
      description: e.note ?? meta?.label ?? e.toState,
    });
  }

  for (const d of decisions) {
    const ctx = linkMap.get(d.linkId);
    items.push({
      id: `dec-${d.id}`,
      at: d.decidedAt.toISOString(),
      side: "buyer",
      category: "approval",
      vendorName: ctx?.vendorName ?? null,
      requirementTitle: ctx?.requirementTitle ?? null,
      description: `${d.reviewTask.stage} ${d.decision.toLowerCase().replace("_", " ")}`,
    });
  }

  for (const v of versions) {
    const ctx = linkMap.get(v.linkId);
    const verb = CONTRACT_KIND_VERB[v.kind] ?? "updated";
    const typeLabel = CONTRACT_TYPE_LABEL[v.contract.contractType] ?? v.contract.contractType;
    items.push({
      id: `ver-${v.id}`,
      at: v.createdAt.toISOString(),
      side: v.uploadedBySide.toLowerCase() as "vendor" | "buyer",
      category: "contract",
      vendorName: ctx?.vendorName ?? null,
      requirementTitle: ctx?.requirementTitle ?? null,
      description: `${verb} the ${typeLabel}`,
    });
  }

  for (const c of checks) {
    const ctx = linkMap.get(c.linkId);
    const meta = CHECK_META[c.checkType];
    items.push({
      id: `chk-${c.id}`,
      at: c.createdAt.toISOString(),
      side: "system",
      category: "verification",
      vendorName: ctx?.vendorName ?? null,
      requirementTitle: ctx?.requirementTitle ?? null,
      description: `${meta?.label ?? c.checkType}: ${c.status}`,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}
