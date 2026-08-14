import { prisma } from "@vendor-management/db";

/**
 * Maps each link state to a coarse onboarding stage. Governance overlaps the
 * contracts window in this data model (both live under CONTRACTS_IN_PROGRESS),
 * so it is folded into `contracts` rather than reported separately.
 */
const STAGE_BUCKETS: Record<string, string> = {
  PREQUAL_IN_PROGRESS: "prequal",
  PREQUAL_SUBMITTED: "prequal",
  PREQUAL_UNDER_REVIEW: "prequal",
  PREQUAL_CLEARED: "prequal",
  AWARDED: "award",
  FULL_IN_PROGRESS: "full_pack",
  FULL_SUBMITTED: "full_pack",
  FULL_UNDER_REVIEW: "full_pack",
  CONTRACTS_IN_PROGRESS: "contracts",
  APPROVED: "contracts",
  ERP_SYNCING: "erp",
  ERP_FAILED: "erp",
  ONBOARDED: "erp",
};

const MS_PER_DAY = 86_400_000;

export interface OnboardingDurations {
  /** Whole days from the first tracked transition to the last. */
  totalDays: number;
  /** Whole days spent in each stage bucket. */
  stageBreakdown: Record<string, number>;
}

/**
 * Reconstructs how long a link spent in each onboarding stage from its event
 * log. Used to enrich `vendor_onboarded` so Mixpanel can chart the bottleneck.
 */
export async function computeOnboardingDurations(
  linkId: string,
): Promise<OnboardingDurations> {
  const events = await prisma.linkEvent.findMany({
    where: { linkId },
    orderBy: { occurredAt: "asc" },
    select: { toState: true, occurredAt: true },
  });

  const stageMs: Record<string, number> = {};
  for (let i = 0; i < events.length; i += 1) {
    const bucket = STAGE_BUCKETS[events[i].toState];
    if (!bucket) continue;
    const start = events[i].occurredAt.getTime();
    const end =
      i + 1 < events.length ? events[i + 1].occurredAt.getTime() : Date.now();
    stageMs[bucket] = (stageMs[bucket] ?? 0) + (end - start);
  }

  const stageBreakdown: Record<string, number> = {};
  for (const [bucket, ms] of Object.entries(stageMs)) {
    stageBreakdown[bucket] = Math.max(0, Math.round(ms / MS_PER_DAY));
  }

  const firstAt = events.length > 0 ? events[0].occurredAt.getTime() : Date.now();
  const lastAt =
    events.length > 0 ? events[events.length - 1].occurredAt.getTime() : Date.now();
  const totalDays = Math.max(0, Math.round((lastAt - firstAt) / MS_PER_DAY));

  return { totalDays, stageBreakdown };
}
