import { prisma } from "@vendor-management/db";
import { erpProvider } from "../providers/index.js";
import { transition } from "./link-state.js";
import { promoteOnboardedToDirectory } from "./directory-sync.js";
import { trackServer } from "./analytics.js";
import { computeOnboardingDurations } from "./onboarding-metrics.js";

export const ERP_DELAY_MS = 1800;

const failSet = new Set<string>();

export function markErpSyncToFail(linkId: string): void {
  failSet.add(linkId);
}

export async function resolveErpIfDue(linkId: string): Promise<void> {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: {
      state: true,
      currentStateSince: true,
      requestId: true,
      vendorUserId: true,
      vendorOrgId: true,
      candidate: { select: { contactEmail: true } },
    },
  });
  if (!link || link.state !== "ERP_SYNCING") return;

  const elapsed = Date.now() - link.currentStateSince.getTime();
  if (elapsed < ERP_DELAY_MS) return;

  // These transitions are system-driven (no acting user); attribute the events
  // to the vendor's own journey so the funnel stays connected.
  const distinctId = link.vendorUserId;
  const orgProps = link.vendorOrgId ? { vendor_org: link.vendorOrgId } : {};

  if (failSet.has(linkId)) {
    failSet.delete(linkId);
    await transition(linkId, "ERP_FAILED", { actorType: "SYSTEM", note: "ERP sync failed (simulated)" });
    if (distinctId) {
      trackServer("erp_push_failed", { distinct_id: distinctId, link_id: linkId, ...orgProps });
    }
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

  // Fire only after the transaction commits — a rollback must not leave a
  // phantom event in Mixpanel.
  if (distinctId) {
    const { totalDays, stageBreakdown } = await computeOnboardingDurations(linkId);

    trackServer("erp_pushed", {
      distinct_id: distinctId,
      link_id: linkId,
      vendor_code: result.vendorCode,
      total_days: totalDays,
      ...orgProps,
    });

    trackServer("vendor_onboarded", {
      distinct_id: distinctId,
      link_id: linkId,
      vendor_code: result.vendorCode,
      total_days: totalDays,
      stage_breakdown: stageBreakdown,
      ...orgProps,
    });

    if (link.candidate?.contactEmail) {
      trackServer("directory_vendor_promoted", {
        distinct_id: distinctId,
        vendor_email: link.candidate.contactEmail,
        badge_state: "VERIFIED",
        ...orgProps,
      });
    }
  }
}
