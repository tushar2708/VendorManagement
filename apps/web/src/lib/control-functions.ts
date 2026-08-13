import type {
  ApprovalStage,
  ApprovalStatus,
  ControlDecisionInput,
  ControlFunction,
  SlaRisk,
} from "@vendor-management/shared";
import { isCleared } from "@vendor-management/shared";
import type { StatusTone } from "./request-phases.js";

export const controlFunctionLabels: Record<ApprovalStage, string> = {
  FINANCIAL_CRIME: "Financial Crime",
  COMPLIANCE: "Compliance",
  LEGAL: "Legal",
  IT_INFOSEC: "IT / InfoSec",
  TAX: "Tax",
  PROCUREMENT: "Procurement",
  DATA_PRIVACY: "Data Privacy",
  BUSINESS_OWNER: "Business Owner",
};

/**
 * What each function is actually checking. Shown under its name so a reviewer
 * reading the board knows the remit without opening a policy document.
 */
export const controlFunctionScopes: Record<ApprovalStage, string> = {
  FINANCIAL_CRIME: "AML · sanctions · PEP · adverse media",
  COMPLIANCE: "KYC/KYB policy · EDD completeness",
  LEGAL: "MSA · liability · DPA · governing law",
  IT_INFOSEC: "Security posture · SOC 2 · data access",
  TAX: "Residency · withholding · GST standing",
  PROCUREMENT: "Commercials · category fit · sourcing policy",
  DATA_PRIVACY: "Personal data · transfers · retention",
  BUSINESS_OWNER: "Business need · budget · final sign-off",
};

export const controlStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: "Not started",
  IN_PROGRESS: "In review",
  INFORMATION_REQUIRED: "Information required",
  APPROVED: "Cleared",
  EDD_COMPLETE: "EDD complete",
  REJECTED: "Blocked",
  ESCALATED: "Escalated",
  CHANGES_REQUESTED: "Changes requested",
};

/**
 * An escalated review is still an open review, so it shares the amber of
 * IN_PROGRESS rather than getting a sixth colour of its own.
 */
const toneByControlStatus: Record<ApprovalStatus, StatusTone> = {
  PENDING: "idle",
  IN_PROGRESS: "review",
  INFORMATION_REQUIRED: "info",
  APPROVED: "cleared",
  EDD_COMPLETE: "cleared",
  REJECTED: "blocked",
  ESCALATED: "review",
  CHANGES_REQUESTED: "blocked",
};

export function controlStatusTone(status: ApprovalStatus): StatusTone {
  return toneByControlStatus[status];
}

/** The statuses a reviewer can choose, in the order the decision menu lists them. */
export const decidableStatuses = [
  "IN_PROGRESS",
  "INFORMATION_REQUIRED",
  "APPROVED",
  "CHANGES_REQUESTED",
] as const satisfies readonly ControlDecisionInput["status"][];

/**
 * Queue states worst-first: what is blocked matters more than what nobody has
 * picked up yet, and the counts are read top to bottom.
 */
export const queueStatuses = [
  "CHANGES_REQUESTED",
  "INFORMATION_REQUIRED",
  "IN_PROGRESS",
  "PENDING",
] as const satisfies readonly ApprovalStatus[];

export const slaRiskLabels: Record<SlaRisk, string> = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  OVERDUE: "Overdue",
};

/** On track needs no colour: only a problem earns one. */
export const slaRiskTone: Record<SlaRisk, StatusTone | null> = {
  ON_TRACK: null,
  AT_RISK: "review",
  OVERDUE: "blocked",
};

export interface QueueCount {
  status: ApprovalStatus;
  label: string;
  tone: StatusTone;
  count: number;
}

/** Counts per queue state, dropping states nothing is currently in. */
export function countByStatus(statuses: ApprovalStatus[]): QueueCount[] {
  return queueStatuses
    .map((status) => ({
      status,
      label: controlStatusLabels[status],
      tone: controlStatusTone(status),
      count: statuses.filter((candidate) => candidate === status).length,
    }))
    .filter((entry) => entry.count > 0);
}

export interface ControlSummary {
  tone: StatusTone;
  label: string;
  detail: string;
}

/**
 * The vendor's overall standing, by worst-first precedence: one blocked control
 * blocks the vendor, however many others have cleared. Everything cleared is the
 * only way to reach green.
 */
export function summariseControls(controls: ControlFunction[]): ControlSummary {
  const total = controls.length;
  const cleared = controls.filter((control) => isCleared(control.status)).length;

  // "Outstanding" counts reviews actually under way. A control waiting on the
  // vendor for information, or not yet started, is not an outstanding review —
  // nobody is working it, so counting it as one overstates the queue.
  const inReview = controls.filter(
    (control) => control.status === "IN_PROGRESS",
  ).length;

  const detail =
    inReview === 0
      ? `${cleared} of ${total} controls cleared`
      : `${cleared} of ${total} controls cleared · ${inReview} ${
          inReview === 1 ? "review" : "reviews"
        } outstanding`;

  const has = (status: ApprovalStatus) => controls.some((control) => control.status === status);

  if (has("REJECTED")) return { tone: "blocked", label: "Blocked", detail };
  if (has("INFORMATION_REQUIRED")) {
    return { tone: "info", label: "Information required", detail };
  }
  if (cleared === total) return { tone: "cleared", label: "Cleared", detail };
  if (has("IN_PROGRESS") || has("ESCALATED") || cleared > 0) {
    return { tone: "review", label: "Pending clearance", detail };
  }
  return { tone: "idle", label: "Not started", detail };
}
