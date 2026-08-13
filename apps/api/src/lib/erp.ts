import { prisma } from "@vendor-management/db";
import { erpProvider } from "../providers/index.js";
import { transition } from "./link-state.js";
import { promoteOnboardedToDirectory } from "./directory-sync.js";

export const ERP_DELAY_MS = 1800;

const failSet = new Set<string>();

export function markErpSyncToFail(linkId: string): void {
  failSet.add(linkId);
}

export async function resolveErpIfDue(linkId: string): Promise<void> {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { state: true, currentStateSince: true, requestId: true },
  });
  if (!link || link.state !== "ERP_SYNCING") return;

  const elapsed = Date.now() - link.currentStateSince.getTime();
  if (elapsed < ERP_DELAY_MS) return;

  if (failSet.has(linkId)) {
    failSet.delete(linkId);
    await transition(linkId, "ERP_FAILED", { actorType: "SYSTEM", note: "ERP sync failed (simulated)" });
    return;
  }

  const result = await erpProvider.pushVendor({ vendorId: linkId, name: "" });

  await prisma.$transaction(async (tx) => {
    await tx.vendorBuyerLink.update({
      where: { id: linkId },
      data: { erpVendorCode: result.vendorCode, onboardedAt: new Date() },
    });

    await transition(linkId, "ONBOARDED", { actorType: "SYSTEM", note: "ERP sync complete" }, tx as any);

    await promoteOnboardedToDirectory(tx as any, linkId);
  });
}
