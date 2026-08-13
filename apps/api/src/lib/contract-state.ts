import { ContractState } from "@prisma/client";
import { prisma } from "@vendor-management/db";
import { checkJoinGate } from "./join-gate.js";
import { transition } from "./link-state.js";

export const CONTRACT_TRANSITIONS: Record<ContractState, ContractState[]> = {
  DRAFT_PENDING:        ["DRAFT_UPLOADED"],
  DRAFT_UPLOADED:       ["VENDOR_REVIEW", "CHANGES_REQUESTED", "AGREED"],
  VENDOR_REVIEW:        ["CHANGES_REQUESTED", "AGREED"],
  CHANGES_REQUESTED:    ["REVISED"],
  REVISED:              ["VENDOR_REVIEW", "CHANGES_REQUESTED", "AGREED"],
  AGREED:               ["AWAITING_SIGNATURES"],
  AWAITING_SIGNATURES:  ["PARTIALLY_EXECUTED", "EXECUTED"],
  PARTIALLY_EXECUTED:   ["EXECUTED"],
  EXECUTED:             [],
};

export class IllegalContractTransitionError extends Error {
  constructor(public from: ContractState, public to: ContractState) {
    super(`Illegal contract transition: ${from} → ${to}`);
  }
}

export function assertContractTransition(from: ContractState, to: ContractState): void {
  if (!(CONTRACT_TRANSITIONS[from] ?? []).includes(to)) {
    throw new IllegalContractTransitionError(from, to);
  }
}

export async function nextVersionNo(tx: any, contractId: string): Promise<number> {
  const last = await tx.contractVersion.findFirst({
    where: { contractId },
    orderBy: { versionNo: "desc" },
    select: { versionNo: true },
  });
  return (last?.versionNo ?? 0) + 1;
}

export async function recomputeExecution(tx: any, contractId: string): Promise<ContractState> {
  const versions = await tx.contractVersion.findMany({
    where: { contractId },
    select: { kind: true },
  });

  const hasBuyer = versions.some((v: { kind: string }) => v.kind === "BUYER_SIGNED");
  const hasVendor = versions.some((v: { kind: string }) => v.kind === "VENDOR_SIGNED");

  let newState: ContractState;
  if (hasBuyer && hasVendor) {
    newState = "EXECUTED";
  } else if (hasBuyer || hasVendor) {
    newState = "PARTIALLY_EXECUTED";
  } else {
    newState = "AWAITING_SIGNATURES";
  }

  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    select: { state: true },
  });
  if (!contract) return newState;

  assertContractTransition(contract.state, newState);

  const updateData: Record<string, unknown> = { state: newState };
  if (newState === "EXECUTED") {
    updateData.executedAt = new Date();
  }

  await tx.contract.update({
    where: { id: contractId },
    data: updateData,
  });

  return newState;
}

export async function advanceLinkIfGateOpen(linkId: string): Promise<void> {
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { state: true },
  });
  if (!link || link.state !== "CONTRACTS_IN_PROGRESS") return;

  const gateOpen = await checkJoinGate(linkId);
  if (gateOpen) {
    await transition(linkId, "APPROVED", { actorType: "SYSTEM", note: "Join gate passed" });
  }
}
