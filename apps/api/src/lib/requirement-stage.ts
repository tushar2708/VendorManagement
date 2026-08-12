import { LinkState } from "@prisma/client";

const ACTIVE_LINK_STATES: LinkState[] = [
  "PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW",
  "PREQUAL_CLEARED", "AWARDED", "FULL_IN_PROGRESS", "FULL_SUBMITTED",
  "FULL_UNDER_REVIEW", "CONTRACTS_IN_PROGRESS", "APPROVED",
  "ERP_SYNCING", "ERP_FAILED",
];

const PRE_ENGAGEMENT_STAGES = ["DRAFT", "CANDIDATES_SELECTED", "INVITES_SENT"];

export async function syncRequirementStage(db: any, requirementId: string): Promise<void> {
  const links = await db.vendorBuyerLink.findMany({
    where: { requestId: requirementId },
    select: { state: true },
  });

  const requirement = await db.vendorRequest.findUnique({
    where: { id: requirementId },
    select: { stage: true },
  });
  if (!requirement) return;

  const hasOnboarded = links.some((l: { state: LinkState }) => l.state === "ONBOARDED");
  if (hasOnboarded && requirement.stage !== "CLOSED") {
    await db.vendorRequest.update({
      where: { id: requirementId },
      data: { stage: "CLOSED" },
    });
    return;
  }

  const hasActive = links.some((l: { state: LinkState }) =>
    ACTIVE_LINK_STATES.includes(l.state)
  );
  if (hasActive && PRE_ENGAGEMENT_STAGES.includes(requirement.stage)) {
    await db.vendorRequest.update({
      where: { id: requirementId },
      data: { stage: "IN_PROGRESS" },
    });
  }
}
