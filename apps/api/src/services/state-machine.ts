import type { RequestStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  DRAFT: ["CANDIDATES_SELECTED", "CANCELLED"],
  CANDIDATES_SELECTED: ["INVITES_DISPATCHED", "CANCELLED"],
  INVITES_DISPATCHED: ["PREQUAL_IN_PROGRESS", "CANCELLED"],
  PREQUAL_IN_PROGRESS: ["PREQUAL_COMPLETE", "CANCELLED"],
  PREQUAL_COMPLETE: ["AWARDED", "CANCELLED"],
  AWARDED: ["FULL_PACK_SUBMITTED", "CANCELLED"],
  FULL_PACK_SUBMITTED: ["DEEP_VERIFICATION"],
  DEEP_VERIFICATION: ["APPROVALS_IN_PROGRESS"],
  APPROVALS_IN_PROGRESS: ["CONTRACT_REVIEW"],
  CONTRACT_REVIEW: ["ERP_PUSH"],
  ERP_PUSH: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(current: RequestStatus, target: RequestStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}

export class TransitionError extends Error {
  readonly current: RequestStatus;
  readonly target: RequestStatus;

  constructor(current: RequestStatus, target: RequestStatus) {
    super(`Invalid transition: ${current} → ${target}`);
    this.name = "TransitionError";
    this.current = current;
    this.target = target;
  }
}

export function assertTransition(current: RequestStatus, target: RequestStatus): void {
  if (!canTransition(current, target)) {
    throw new TransitionError(current, target);
  }
}

export function nextStageAfterCandidates(current: RequestStatus): RequestStatus | null {
  if (current === "DRAFT") return "CANDIDATES_SELECTED";
  return null;
}

export function nextStageAfterInvites(current: RequestStatus): RequestStatus | null {
  if (current === "DRAFT" || current === "CANDIDATES_SELECTED") return "INVITES_DISPATCHED";
  return null;
}
