import { LinkState, PrismaClient } from "@prisma/client";
import { prisma } from "@vendor-management/db";
import { syncRequirementStage } from "./requirement-stage.js";

export const LINK_TRANSITIONS: Record<LinkState, LinkState[]> = {
  INVITED:                 ["PREQUAL_IN_PROGRESS", "EXPIRED", "WITHDRAWN"],
  PREQUAL_IN_PROGRESS:     ["PREQUAL_SUBMITTED", "WITHDRAWN", "EXPIRED"],
  PREQUAL_SUBMITTED:       ["PREQUAL_UNDER_REVIEW", "PREQUAL_IN_PROGRESS"],
  PREQUAL_UNDER_REVIEW:    ["PREQUAL_CLEARED", "PREQUAL_IN_PROGRESS", "REJECTED", "ON_HOLD"],
  PREQUAL_CLEARED:         ["AWARDED", "ON_HOLD"],
  AWARDED:                 ["FULL_IN_PROGRESS"],
  FULL_IN_PROGRESS:        ["FULL_SUBMITTED", "WITHDRAWN"],
  FULL_SUBMITTED:          ["FULL_UNDER_REVIEW", "FULL_IN_PROGRESS"],
  FULL_UNDER_REVIEW:       ["CONTRACTS_IN_PROGRESS", "FULL_IN_PROGRESS", "REJECTED", "ON_HOLD"],
  CONTRACTS_IN_PROGRESS:   ["APPROVED", "FULL_IN_PROGRESS", "ON_HOLD"],
  APPROVED:                ["ERP_SYNCING"],
  ERP_SYNCING:             ["ONBOARDED", "ERP_FAILED"],
  ERP_FAILED:              ["ERP_SYNCING"],
  ONBOARDED:               [],
  REJECTED:                [],
  ON_HOLD:                 [],
  WITHDRAWN:               [],
  EXPIRED:                 [],
};

export class IllegalTransitionError extends Error {
  constructor(public from: LinkState, public to: LinkState) {
    super(`Illegal transition: ${from} → ${to}`);
  }
}

export class LinkNotFoundError extends Error {
  constructor(public linkId: string) {
    super(`Link not found: ${linkId}`);
  }
}

export function isLegalTransition(from: LinkState, to: LinkState): boolean {
  return (LINK_TRANSITIONS[from] ?? []).includes(to);
}

export interface TransitionActor {
  actorType: "VENDOR" | "BUYER" | "SYSTEM";
  actorId?: string | null;
  side?: "VENDOR" | "BUYER" | "SYSTEM";
  note?: string | null;
}

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function transition(
  linkId: string,
  toState: LinkState,
  actor: TransitionActor,
  existingTx?: TxClient,
): Promise<void> {
  const db = existingTx ?? prisma;

  const link = await (db as any).vendorBuyerLink.findUnique({ where: { id: linkId } });
  if (!link) throw new LinkNotFoundError(linkId);

  if (!isLegalTransition(link.state, toState)) {
    throw new IllegalTransitionError(link.state, toState);
  }

  await (db as any).linkEvent.create({
    data: {
      linkId,
      fromState: link.state,
      toState,
      actorType: actor.actorType,
      actorId: actor.actorId ?? null,
      side: actor.side ?? actor.actorType,
      note: actor.note ?? null,
    },
  });

  await (db as any).vendorBuyerLink.update({
    where: { id: linkId },
    data: { state: toState, currentStateSince: new Date() },
  });

  await syncRequirementStage(db, link.requestId);
}
