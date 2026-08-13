import type { LinkState, VendorType, RequestProcess } from "@vendor-management/shared";
import { LINK_PROGRESS_RAIL, LINK_STATE_META } from "@vendor-management/shared";

/**
 * The schema tracks 18 fine-grained link states, which is too many to show as a
 * pipeline. The wireframes group them into the five lanes below, so the UI
 * follows the mocks and keeps the detail for the link detail screen.
 */
export const requestPhases = [
  "Intake & invite",
  "Verification",
  "Award & full pack",
  "Governance",
  "Activated",
] as const;

export type RequestPhase = (typeof requestPhases)[number];

const phaseByState: Record<LinkState, RequestPhase | null> = {
  INVITED: "Intake & invite",
  PREQUAL_IN_PROGRESS: "Verification",
  PREQUAL_SUBMITTED: "Verification",
  PREQUAL_UNDER_REVIEW: "Verification",
  PREQUAL_CLEARED: "Award & full pack",
  AWARDED: "Award & full pack",
  FULL_IN_PROGRESS: "Award & full pack",
  FULL_SUBMITTED: "Award & full pack",
  FULL_UNDER_REVIEW: "Award & full pack",
  CONTRACTS_IN_PROGRESS: "Governance",
  APPROVED: "Governance",
  ERP_SYNCING: "Activated",
  ONBOARDED: "Activated",
  REJECTED: null,
  ON_HOLD: null,
  WITHDRAWN: null,
  ERP_FAILED: null,
  EXPIRED: null,
};

export const statusLabels: Record<LinkState, string> = {
  INVITED: "Invited",
  PREQUAL_IN_PROGRESS: "Pre-qual in progress",
  PREQUAL_SUBMITTED: "Pre-qual submitted",
  PREQUAL_UNDER_REVIEW: "Pre-qual under review",
  PREQUAL_CLEARED: "Pre-qual cleared",
  AWARDED: "Awarded",
  FULL_IN_PROGRESS: "Full pack in progress",
  FULL_SUBMITTED: "Full pack submitted",
  FULL_UNDER_REVIEW: "Full pack under review",
  CONTRACTS_IN_PROGRESS: "Contracts in progress",
  APPROVED: "Approved",
  ERP_SYNCING: "ERP syncing",
  ONBOARDED: "Onboarded",
  REJECTED: "Rejected",
  ON_HOLD: "On hold",
  WITHDRAWN: "Withdrawn",
  ERP_FAILED: "ERP failed",
  EXPIRED: "Expired",
};

/**
 * The five clearance states the whole product colours by. "info" is reserved for
 * "information required" — no link state maps to it yet, because chasing a
 * vendor for more detail is tracked per control function, not per link.
 */
export type StatusTone = "cleared" | "review" | "info" | "blocked" | "idle";

const toneByState: Record<LinkState, StatusTone> = {
  INVITED: "idle",
  PREQUAL_IN_PROGRESS: "review",
  PREQUAL_SUBMITTED: "review",
  PREQUAL_UNDER_REVIEW: "review",
  PREQUAL_CLEARED: "review",
  AWARDED: "review",
  FULL_IN_PROGRESS: "review",
  FULL_SUBMITTED: "review",
  FULL_UNDER_REVIEW: "review",
  CONTRACTS_IN_PROGRESS: "review",
  APPROVED: "review",
  ERP_SYNCING: "review",
  ONBOARDED: "cleared",
  REJECTED: "blocked",
  ON_HOLD: "blocked",
  WITHDRAWN: "blocked",
  ERP_FAILED: "blocked",
  EXPIRED: "blocked",
};

export function statusTone(state: LinkState): StatusTone {
  return toneByState[state];
}

/**
 * Whose court the ball is in.
 *
 * A stage says what is happening; a court says who owes the next move. They are
 * not the same question, and the second is the one people open a dashboard to
 * answer — "Pre-qual in progress" does not tell a buyer whether they
 * are waiting on a vendor or holding the work up themselves.
 */
export type Court = "BUYER" | "VENDOR" | "PLATFORM" | "BOTH" | "DONE";

const courtByState: Record<LinkState, Court> = {
  INVITED: "VENDOR",
  PREQUAL_IN_PROGRESS: "VENDOR",
  PREQUAL_SUBMITTED: "BUYER",
  PREQUAL_UNDER_REVIEW: "BUYER",
  PREQUAL_CLEARED: "BUYER",
  AWARDED: "VENDOR",
  FULL_IN_PROGRESS: "VENDOR",
  FULL_SUBMITTED: "BUYER",
  FULL_UNDER_REVIEW: "BUYER",
  CONTRACTS_IN_PROGRESS: "BOTH",
  APPROVED: "BUYER",
  ERP_SYNCING: "PLATFORM",
  ONBOARDED: "DONE",
  REJECTED: "DONE",
  ON_HOLD: "DONE",
  WITHDRAWN: "DONE",
  ERP_FAILED: "PLATFORM",
  EXPIRED: "DONE",
};

export const courtLabels: Record<Court, string> = {
  BUYER: "Buyer",
  VENDOR: "Vendor",
  PLATFORM: "Platform",
  BOTH: "Both",
  DONE: "Done",
};

/** What the court means in practice, for a tooltip. */
export const courtDescriptions: Record<Court, string> = {
  BUYER: "Waiting on your team to act",
  VENDOR: "Waiting on the vendor to respond",
  PLATFORM: "Running automatically — nobody is blocked",
  BOTH: "Buyer and vendor are working on this together",
  DONE: "Nothing further is owed",
};

export function courtOf(state: LinkState): Court {
  return courtByState[state];
}

export const processLabels: Record<RequestProcess, string> = {
  RFQ: "RFQ",
  NOMINATION: "Nomination",
  DIRECT: "Direct award",
};

export const vendorTypeLabels: Record<VendorType, string> = {
  PRODUCTION_PART: "Production part",
  INDIRECT_SERVICES: "Indirect services",
};

export function phaseOf(state: LinkState): RequestPhase | null {
  return phaseByState[state];
}

/** Index of the current phase, or -1 for a terminal state. */
export function phaseIndexOf(state: LinkState): number {
  const phase = phaseOf(state);
  return phase ? requestPhases.indexOf(phase) : -1;
}

export function isActive(state: LinkState): boolean {
  return state !== "ONBOARDED" && state !== "REJECTED" && state !== "WITHDRAWN" && state !== "EXPIRED" && state !== "ON_HOLD";
}

export function daysSince(isoDate: string): number {
  const elapsed = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

// Re-export shared constants for convenience
export { LINK_PROGRESS_RAIL, LINK_STATE_META };
